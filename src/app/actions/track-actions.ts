"use server"

import { db } from "@/lib/db"

/**
 * Утас эсвэл дансны дугаараар захиалга хайх
 */
export async function getOrdersByQuery(query: string) {
  try {
    if (!query || query.trim().length < 3) {
      return { success: false, orders: [] }
    }

    const q = query.trim()
    const isNum = !isNaN(Number(q))

    const orders = await db.order.findMany({
      where: {
        OR: [
          { customerPhone: { contains: q } },
          { accountNumber: { contains: q } },
          ...(isNum ? [{ orderNumber: Number(q) }] : []),
        ],
      },
      include: {
        items: true,
        payments: { select: { status: true, method: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return {
      success: true,
      orders: JSON.parse(JSON.stringify(orders)),
    }
  } catch (error: any) {
    console.error("[getOrdersByQuery]", error)
    return { success: false, orders: [], error: error.message }
  }
}
