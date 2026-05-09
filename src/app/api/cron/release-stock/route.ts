import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * CRON: Хугацаа хэтэрсэн захиалгуудын түгжигдсэн нөөцийг чөлөөлнө.
 * 30 минутаас дээш хугацаанд төлбөр төлөгдөөгүй PENDING захиалгуудыг цуцална.
 * 
 * Дуудах: GET /api/cron/release-stock
 * Vercel cron эсвэл external cron service ашиглана.
 */
export async function GET() {
  const TIMEOUT_MINUTES = 30

  try {
    const cutoff = new Date()
    cutoff.setMinutes(cutoff.getMinutes() - TIMEOUT_MINUTES)

    // Хугацаа хэтэрсэн захиалгууд
    const expired = await db.order.findMany({
      where: {
        orderStatus: "PENDING",
        stockReservedAt: { lt: cutoff, not: null },
        stockReleasedAt: null,
        creationSource: { not: "ADMIN" },
      },
      include: { items: true },
    })

    if (expired.length === 0) {
      return NextResponse.json({
        success: true,
        released: 0,
        message: "Чөлөөлөх захиалга олдсонгүй",
        timestamp: new Date().toISOString(),
      })
    }

    let released = 0
    const errors: string[] = []

    for (const order of expired) {
      try {
        await db.$transaction(async (tx) => {
          // Давхар шалгалт (race condition хамгаалалт)
          const fresh = await tx.order.findUnique({
            where: { id: order.id },
            select: { orderStatus: true, stockReleasedAt: true },
          })

          if (!fresh || fresh.orderStatus !== "PENDING" || fresh.stockReleasedAt) {
            return // Аль хэдийн шийдэгдсэн
          }

          // Нөөц буцаах
          for (const item of order.items) {
            await tx.$queryRaw`
              UPDATE "Product"
              SET "reservedStock" = GREATEST("reservedStock" - ${item.quantity}, 0)
              WHERE id = ${item.productId}
            `

            // Variant stock буцаах
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stockQuantity: { increment: item.quantity } },
              })
            }

            // OUT_OF_STOCK → ACTIVE автомат
            await tx.$queryRaw`
              UPDATE "Product"
              SET status = 'ACTIVE'
              WHERE id = ${item.productId}
                AND status = 'OUT_OF_STOCK'
                AND ("stockQuantity" - "reservedStock" + ${item.quantity}) > 0
            `
          }

          // Захиалга цуцлах
          await tx.order.update({
            where: { id: order.id },
            data: {
              orderStatus: "CANCELLED",
              stockReleasedAt: new Date(),
              cancellationReason: `Төлбөр ${TIMEOUT_MINUTES} минутын дотор төлөгдөөгүй (автомат)`,
            },
          })
        })

        released++
      } catch (err: any) {
        console.error(`[CRON] Release failed for order ${order.id}:`, err.message)
        errors.push(`Order ${order.orderNumber}: ${err.message}`)
      }
    }

    console.log(`[CRON] Stock release: ${released}/${expired.length} orders released`)

    return NextResponse.json({
      success: true,
      released,
      total: expired.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[CRON] Fatal error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
