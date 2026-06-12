"use server"

import { db } from "@/lib/db"
import { checkPaylinkPayment } from "@/lib/paylink"
import { confirmPayment } from "./order-actions"

export async function checkPaylinkPaymentStatus(paymentId: string) {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { order: true }
    })

    if (!payment) return { success: false, error: "Төлбөр олдсонгүй" }

    if (payment.status === "PAID") {
      return { 
        success: true, 
        status: "VERIFIED", 
        paid: true,
        verifiedAt: payment.paidAt?.toISOString(),
        verifiedBy: "UNKNOWN",
        orderNumber: payment.order.orderNumber
      }
    }

    if (!payment.externalRef) {
      return { success: false, error: "Төлбөрийн нэхэмжлэх үүсээгүй байна" }
    }

    // Call Paylink API to check
    const result = await checkPaylinkPayment(payment.externalRef)
    
    if (!result.success) {
      return { success: false, error: result.error || "Шалгахад алдаа гарлаа" }
    }

    // Assuming result.data.response.status is something like 'paid', 'pending', 'failed'
    const rawData = result.data?.response || result.data || {}
    const paylinkStatus = (rawData.status || "PENDING").toUpperCase()
    
    if (paylinkStatus === "PAID" || paylinkStatus === "SUCCESS") {
      // Payment successful
      const confirmRes = await confirmPayment(payment.orderId, payment.externalRef)

      if (confirmRes.success) {
        return { 
          success: true, 
          status: "VERIFIED", 
          paid: true,
          verifiedAt: new Date().toISOString(),
          verifiedBy: "AUTO_CHECK",
          orderNumber: payment.order.orderNumber
        }
      } else {
        return { success: false, error: confirmRes.error || "Баталгаажуулахад алдаа гарлаа" }
      }
    }

    return { success: true, status: "PENDING" }

  } catch (error: any) {
    console.error("checkPaylinkPaymentStatus Error:", error)
    return { success: false, error: "Серверийн алдаа гарлаа" }
  }
}
