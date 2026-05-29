"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin } from "@/lib/auth"

const DEFAULT_SETTINGS: Record<string, string> = {
  bank_name: "Хаан Банк",
  bank_account: "",
  bank_holder: "",
  bank_note: "Shop",
  terms_of_service: "Захиалгаа баталгаажуулсны дараа цуцлах боломжгүй.",
  delivery_terms: "Хүргэлт нь Улаанбаатар хот дотор үйлчилнэ.",
  qpay_enabled: "true",
  delivery_fee: "6000",
  delivery_schedule_days: "3,6",
  phone_verification_enabled: "false",
  loyalty_enabled: "true",
}

export async function getShopSettings(): Promise<Record<string, string>> {
  try {
    const rows = await db.shopSettings.findMany()
    const map: Record<string, string> = { ...DEFAULT_SETTINGS }
    rows.forEach((r) => { map[r.key] = r.value })
    return map
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveShopSetting(key: string, value: string) {
  try {
    await db.shopSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    revalidatePath("/admin/settings")
    revalidatePath("/cart")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ═══════════════════════════════════════════════════
// PENDING ORDERS (Шинэ schema)
// ═══════════════════════════════════════════════════

export async function getPendingOrders() {
  try {
    const orders = await db.order.findMany({
      where: { orderStatus: "PENDING" },
      include: {
        items: true,
        payments: { select: { id: true, method: true, status: true, amount: true } },
      },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error: any) {
    return { success: false, error: error.message, orders: [] }
  }
}

export async function confirmOrderPayment(orderId: string) {
  const { adminConfirmPayment } = await import("./order-actions")
  return adminConfirmPayment(orderId)
}

export async function rejectOrderPayment(orderId: string, reason?: string) {
  const { cancelOrder } = await import("./order-actions")
  return cancelOrder(orderId, reason || "Төлбөр баталгаажуулагдаагүй")
}

export async function confirmGroupPayment(orderIds: string[]) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Нэвтрэнэ үү" }

    const results = []
    for (const id of orderIds) {
      const res = await confirmOrderPayment(id)
      results.push(res)
    }

    const failed = results.find(r => !r.success)
    if (failed) return failed

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function rejectGroupPayment(orderIds: string[], reason?: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Нэвтрэнэ үү" }

    for (const id of orderIds) {
      await rejectOrderPayment(id, reason)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getOrderForPayment(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true }
    })
    if (!order) return { success: false, error: "Захиалга олдсонгүй" }
    return { success: true, order: JSON.parse(JSON.stringify(order)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
