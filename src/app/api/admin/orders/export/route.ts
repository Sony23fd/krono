import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"

/**
 * GET /api/admin/orders/export
 * Захиалгуудыг CSV файлаар татаж авах.
 */
export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "CARGO_ADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = {}
    if (status && status !== "ALL") {
      where.orderStatus = status
    }

    const orders = await db.order.findMany({
      where,
      include: {
        items: true,
        payments: { select: { method: true, status: true, paidAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    })

    // CSV header
    const headers = [
      "Дугаар",
      "Огноо",
      "Нэр",
      "Утас",
      "Данс",
      "Барааны нэр",
      "SKU",
      "Тоо ширхэг",
      "Нэгж үнэ",
      "Нийт үнэ",
      "Хүргэлтийн төлбөр",
      "Нийт дүн",
      "Статус",
      "Төлбөрийн хэлбэр",
      "Төлбөрийн статус",
      "Хүргэлт хүсэв",
      "Хаяг",
      "Тэмдэглэл",
    ]

    const rows: string[][] = []

    for (const order of orders) {
      if (order.items.length === 0) {
        rows.push([
          `#${order.orderNumber}`,
          new Date(order.createdAt).toLocaleDateString("mn-MN"),
          order.customerName,
          order.customerPhone,
          order.accountNumber || "",
          "",
          "",
          "",
          "",
          "",
          String(Number(order.deliveryFee)),
          String(Number(order.totalAmount)),
          order.orderStatus,
          order.payments[0]?.method || "",
          order.payments[0]?.status || "",
          order.wantsDelivery ? "Тийм" : "Үгүй",
          order.deliveryAddress || "",
          order.note || "",
        ])
      } else {
        for (const item of order.items) {
          rows.push([
            `#${order.orderNumber}`,
            new Date(order.createdAt).toLocaleDateString("mn-MN"),
            order.customerName,
            order.customerPhone,
            order.accountNumber || "",
            item.productName,
            item.sku,
            String(item.quantity),
            String(Number(item.unitPrice)),
            String(Number(item.totalPrice)),
            String(Number(order.deliveryFee)),
            String(Number(order.totalAmount)),
            order.orderStatus,
            order.payments[0]?.method || "",
            order.payments[0]?.status || "",
            order.wantsDelivery ? "Тийм" : "Үгүй",
            order.deliveryAddress || "",
            order.note || "",
          ])
        }
      }
    }

    // BOM + CSV
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("[OrderExport] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
