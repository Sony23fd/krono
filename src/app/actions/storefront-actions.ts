"use server"

import { db } from "@/lib/db"

export async function getRecentOrdersForSocialProof() {
  try {
    const orders = await db.order.findMany({
      where: {
        orderStatus: "PAID",
      },
      include: {
        items: {
          select: {
            productName: true,
          },
          take: 1,
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    })

    const maskedOrders = orders.map((order) => {
      const name = order.customerName || "Хэрэглэгч"
      const maskedName = name.length > 2 
        ? name.substring(0, 2) + "***" 
        : name + "***"
      
      return {
        id: order.id,
        customerName: maskedName,
        productName: order.items[0]?.productName || "Бараа",
        createdAt: order.createdAt
      }
    })

    return { success: true, orders: JSON.parse(JSON.stringify(maskedOrders)) }
  } catch (error) {
    console.error("Social proof fetch error:", error)
    return { success: false, orders: [] }
  }
}
