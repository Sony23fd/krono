"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// ═══════════════════════════════════════════════════
// ТӨЛБӨР БАТАЛГААЖУУЛАЛТ
// ═══════════════════════════════════════════════════

/**
 * Төлбөр амжилттай болсон үед дуудагдана (QPay callback / Админ).
 * reservedStock хасаж, stockQuantity бууруулна = бараа бодитоор зарагдлаа.
 */
export async function confirmPayment(orderId: string, externalRef?: string) {
  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true }
      })

      if (!order) throw new Error("Захиалга олдсонгүй")
      if (order.orderStatus !== "PENDING") {
        throw new Error("Захиалга аль хэдийн боловсруулагдсан байна")
      }

      // Бараа бүрийн бодит нөөцийг хасах
      for (const item of order.items) {
        await tx.$queryRaw`
          UPDATE "Product"
          SET "stockQuantity" = "stockQuantity" - ${item.quantity},
              "reservedStock" = GREATEST("reservedStock" - ${item.quantity}, 0)
          WHERE id = ${item.productId}
        `

        // Автомат OUT_OF_STOCK
        await tx.$queryRaw`
          UPDATE "Product"
          SET status = 'OUT_OF_STOCK'
          WHERE id = ${item.productId}
            AND "stockQuantity" <= 0
            AND status = 'ACTIVE'
        `
      }

      // Order → PAID
      await tx.order.update({
        where: { id: orderId },
        data: { orderStatus: "PAID" }
      })

      // Payment → PAID
      const payment = order.payments[0]
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            externalRef: externalRef || undefined,
          }
        })
      }
    })

    revalidatePath("/admin/orders")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("[ConfirmPayment] Error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Админ гараар баталгаажуулах (банкны шилжүүлэг)
 */
export async function adminConfirmPayment(orderId: string) {
  const { getCurrentAdmin } = await import("@/lib/auth")
  const admin = await getCurrentAdmin()
  if (!admin) return { success: false, error: "Хандах эрхгүй" }

  const result = await confirmPayment(orderId, `MANUAL_${admin.id}`)

  if (result.success) {
    // Activity log
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, customerName: true, totalAmount: true }
    })
    await db.activityLog.create({
      data: {
        userId: admin.id,
        userName: admin.name || "Админ",
        userRole: admin.role,
        action: "Төлбөр баталгаажуулав",
        target: "Захиалга",
        detail: `#${order?.orderNumber} захиалгын төлбөрийг гараар баталгаажуулав. Дүн: ₮${order?.totalAmount}, Харилцагч: ${order?.customerName}`,
      }
    })
  }

  return result
}

// ═══════════════════════════════════════════════════
// ЗАХИАЛГА ЦУЦЛАХ
// ═══════════════════════════════════════════════════

export async function cancelOrder(orderId: string, reason?: string) {
  const { getCurrentAdmin } = await import("@/lib/auth")
  const admin = await getCurrentAdmin()
  if (!admin) return { success: false, error: "Хандах эрхгүй" }

  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      })

      if (!order) throw new Error("Захиалга олдсонгүй")
      if (order.orderStatus === "CANCELLED") throw new Error("Аль хэдийн цуцлагдсан")
      if (order.orderStatus === "DELIVERED") throw new Error("Хүргэгдсэн захиалгыг цуцлах боломжгүй")

      for (const item of order.items) {
        if (order.orderStatus === "PENDING") {
          // Зөвхөн reserve буцаах
          await tx.$queryRaw`
            UPDATE "Product"
            SET "reservedStock" = GREATEST("reservedStock" - ${item.quantity}, 0)
            WHERE id = ${item.productId}
          `
        } else if (order.orderStatus === "PAID" || order.orderStatus === "PROCESSING") {
          // Бодит нөөц буцаах
          await tx.$queryRaw`
            UPDATE "Product"
            SET "stockQuantity" = "stockQuantity" + ${item.quantity}
            WHERE id = ${item.productId}
          `
        }

        // Variant stock буцаах
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } }
          })
        }

        // OUT_OF_STOCK → ACTIVE автомат
        await tx.$queryRaw`
          UPDATE "Product"
          SET status = 'ACTIVE'
          WHERE id = ${item.productId}
            AND status = 'OUT_OF_STOCK'
            AND ("stockQuantity" - "reservedStock") > 0
        `
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "CANCELLED",
          stockReleasedAt: new Date(),
          cancellationReason: reason || "Админ цуцалсан",
        }
      })
    })

    // Activity log
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, customerName: true }
    })
    await db.activityLog.create({
      data: {
        userId: admin.id,
        userName: admin.name || "Админ",
        userRole: admin.role,
        action: "Захиалга цуцлав",
        target: "Захиалга",
        detail: `#${order?.orderNumber} захиалгыг цуцлав. Шалтгаан: ${reason || "Тодорхойгүй"}, Харилцагч: ${order?.customerName}`,
      }
    })

    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    console.error("[CancelOrder] Error:", error)
    return { success: false, error: error.message }
  }
}

// ═══════════════════════════════════════════════════
// ЗАХИАЛГЫН СТАТУС ШИНЭЧЛЭХ
// ═══════════════════════════════════════════════════

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const { getCurrentAdmin } = await import("@/lib/auth")
  const admin = await getCurrentAdmin()
  if (!admin) return { success: false, error: "Хандах эрхгүй" }

  try {
    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) return { success: false, error: "Захиалга олдсонгүй" }

    // Цуцлах бол cancelOrder ашиглах
    if (newStatus === "CANCELLED") {
      return cancelOrder(orderId, "Статус өөрчлөлтөөр цуцлав")
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ["PAID", "CANCELLED"],
      PAID: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: ["REFUNDED"],
      CANCELLED: [],
      REFUNDED: [],
    }

    const allowed = validTransitions[order.orderStatus] || []
    if (!allowed.includes(newStatus)) {
      return { success: false, error: `"${order.orderStatus}" → "${newStatus}" шилжүүлэг зөвшөөрөгдөхгүй` }
    }

    await db.order.update({
      where: { id: orderId },
      data: { orderStatus: newStatus as any }
    })

    await db.activityLog.create({
      data: {
        userId: admin.id,
        userName: admin.name || "Админ",
        userRole: admin.role,
        action: "Статус шинэчлэв",
        target: "Захиалга",
        detail: `#${order.orderNumber}: ${order.orderStatus} → ${newStatus}`,
      }
    })

    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ═══════════════════════════════════════════════════
// ЗАХИАЛГУУД АВАХ
// ═══════════════════════════════════════════════════

export async function getOrders(filters?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  try {
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const where: any = {}

    if (filters?.status && filters.status !== "ALL") {
      where.orderStatus = filters.status
    }

    if (filters?.search) {
      const q = filters.search.trim()
      const isNum = !isNaN(Number(q))
      where.OR = [
        { customerPhone: { contains: q } },
        { customerName: { contains: q, mode: "insensitive" } },
        { accountNumber: { contains: q } },
        ...(isNum ? [{ orderNumber: Number(q) }] : []),
        { items: { some: { productName: { contains: q, mode: "insensitive" } } } },
        { items: { some: { sku: { contains: q, mode: "insensitive" } } } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: true,
          payments: { select: { id: true, method: true, status: true, amount: true, paidAt: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    return {
      success: true,
      orders: JSON.parse(JSON.stringify(orders)),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error: any) {
    console.error("[GetOrders] Error:", error)
    return { success: false, error: error.message, orders: [], total: 0, totalPages: 0, currentPage: 1 }
  }
}

export async function getOrderById(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { imageUrl: true } } } },
        payments: true,
      }
    })
    if (!order) return { success: false, error: "Олдсонгүй" }
    return { success: true, order: JSON.parse(JSON.stringify(order)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ═══════════════════════════════════════════════════
// МЭДЭГДЛҮҮД АВАХ
// ═══════════════════════════════════════════════════

export async function getRecentNotifications() {
  try {
    const recentOrders = await db.order.findMany({
      where: {
        orderStatus: { in: ["PENDING", "PAID"] },
        createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } // last 3 days
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    const notifications = recentOrders.map(order => {
      if (order.orderStatus === "PENDING") {
        return {
          type: "new-order",
          transactionRef: order.idempotencyKey,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          items: order.items.map(item => ({
            orderId: item.orderId,
            productName: item.productName,
            quantity: item.quantity,
            totalAmount: Number(item.totalPrice),
            batchId: item.id
          })),
          totalAmount: Number(order.totalAmount),
          wantsDelivery: order.wantsDelivery,
          createdAt: order.createdAt.toISOString()
        }
      } else {
        return {
          type: "order-confirmed",
          transactionRef: order.idempotencyKey,
          name: order.customerName,
          phone: order.customerPhone,
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt.toISOString()
        }
      }
    })

    return { success: true, notifications }
  } catch (error: any) {
    return { success: false, notifications: [] }
  }
}
