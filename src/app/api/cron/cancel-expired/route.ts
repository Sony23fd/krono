import { db } from "@/lib/db"
import { NextResponse } from "next/server"

/**
 * CRON: PENDING захиалгуудыг 1 өдрийн дараа автоматаар цуцлах
 * 
 * Энэ endpoint-ийг cron job-оор дуудна:
 * - Vercel: vercel.json cron тохиргоо
 * - VPS: системийн crontab (curl http://localhost:3000/api/cron/cancel-expired)
 * 
 * Жишээ crontab: 0 * * * * curl -s http://localhost:3000/api/cron/cancel-expired?key=SECRET
 */

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  // Нууц түлхүүрээр хамгаалах (optional)
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  const expectedKey = process.env.CRON_SECRET || "store-cron-2026"
  
  if (key && key !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 өдрийн өмнө

    // 1 өдрөөс хэтэрсэн PENDING захиалгуудыг олох
    const expiredOrders = await db.order.findMany({
      where: {
        orderStatus: "PENDING",
        createdAt: { lt: expiryDate },
      },
      include: { items: true },
      take: 100, // Нэг удаад 100 хүртэл
    })

    if (expiredOrders.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Цуцлах захиалга байхгүй",
        cancelled: 0 
      })
    }

    let cancelledCount = 0

    for (const order of expiredOrders) {
      try {
        await db.$transaction(async (tx) => {
          // Reserved stock буцаах
          for (const item of order.items) {
            await tx.$queryRaw`
              UPDATE "Product"
              SET "reservedStock" = GREATEST("reservedStock" - ${item.quantity}, 0)
              WHERE id = ${item.productId}
            `
            // OUT_OF_STOCK → ACTIVE (нөөц чөлөөлөгдвөл)
            await tx.$queryRaw`
              UPDATE "Product"
              SET status = 'ACTIVE'
              WHERE id = ${item.productId}
                AND status = 'OUT_OF_STOCK'
                AND ("stockQuantity" - GREATEST("reservedStock" - ${item.quantity}, 0)) > 0
            `
          }

          // Захиалгыг цуцлах
          await tx.order.update({
            where: { id: order.id },
            data: {
              orderStatus: "CANCELLED",
              stockReleasedAt: new Date(),
              cancellationReason: "Төлбөр хугацаандаа төлөгдөөгүй (24 цаг)",
            }
          })

          // Payment статус шинэчлэх
          await tx.payment.updateMany({
            where: { orderId: order.id, status: "PENDING" },
            data: { status: "FAILED" }
          })
        })

        cancelledCount++
      } catch (err) {
        console.error(`[Cron] Failed to cancel order #${order.orderNumber}:`, err)
      }
    }

    console.log(`[Cron] Cancelled ${cancelledCount} expired PENDING orders`)

    return NextResponse.json({
      success: true,
      message: `${cancelledCount} захиалга цуцлагдлаа`,
      cancelled: cancelledCount,
      checked: expiredOrders.length,
    })
  } catch (error: any) {
    console.error("[Cron] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
