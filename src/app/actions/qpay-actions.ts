"use server"

import { db } from "@/lib/db"
import { createQPayInvoice, checkQPayPayment } from "@/lib/qpay"
import { confirmPayment } from "./order-actions"
import { getShopSettings } from "./settings-actions"

/**
 * QPay Invoice үүсгэх
 * Checkout → Order + Payment үүссэний дараа дуудагдана
 *
 * @param orderId - Order ID
 * @param paymentId - Payment ID (callback ref болно)
 * @returns QPay invoice data (qr_image, urls, invoice_id)
 */
export async function createQPayInvoiceForOrder(orderId: string, paymentId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, totalAmount: true, customerName: true }
    })

    if (!order) return { success: false, error: "Захиалга олдсонгүй" }

    const amount = Number(order.totalAmount)
    if (amount <= 0) return { success: false, error: "Төлбөрийн дүн буруу байна" }

    // QPay Invoice үүсгэх
    const result = await createQPayInvoice({
      transactionRef: paymentId,
      amount,
      description: `Store #${order.orderNumber} - ${order.customerName}`,
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error || "QPay invoice үүсгэхэд алдаа гарлаа" }
    }

    const invoiceId = result.data.invoice_id

    // Payment.externalRef-д QPay invoice_id хадгалах
    await db.payment.update({
      where: { id: paymentId },
      data: {
        externalRef: invoiceId,
        method: "QPAY",
        metadata: {
          qr_image: result.data.qr_image,
          qr_text: result.data.qr_text,
          urls: result.data.urls,
          invoice_id: invoiceId,
          createdAt: new Date().toISOString(),
        } as any,
      }
    })

    return {
      success: true,
      invoiceId,
      qrImage: result.data.qr_image,
      qrText: result.data.qr_text,
      urls: result.data.urls || [],
    }
  } catch (error: any) {
    console.error("[QPay Action] Create invoice error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * QPay төлбөр шалгах (Client polling болон админ шалгалтанд зориулсан)
 *
 * @param paymentId - Payment ID (манай DB)
 * @returns status, paid, orderNumber, verifiedAt, verifiedBy
 */
export async function checkQPayPaymentStatus(paymentId: string): Promise<{
  success: boolean
  paid: boolean
  status: "PENDING" | "VERIFIED" | "FAILED"
  orderNumber?: number
  verifiedAt?: string
  verifiedBy?: string
  error?: string
}> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: { id: true, orderStatus: true, orderNumber: true }
        }
      }
    })

    if (!payment) {
      return { success: false, paid: false, status: "FAILED", error: "Төлбөр олдсонгүй" }
    }

    // Аль хэдийн баталгаажсан бол
    if (payment.status === "PAID" || payment.order.orderStatus === "PAID") {
      return {
        success: true,
        paid: true,
        status: "VERIFIED",
        orderNumber: payment.order.orderNumber,
        verifiedAt: payment.paidAt?.toISOString(),
        verifiedBy: payment.qpayVerifiedBy || "UNKNOWN",
      }
    }

    // QPay invoice_id байхгүй бол
    const invoiceId = payment.externalRef
    if (!invoiceId) {
      return { success: true, paid: false, status: "FAILED", error: "Invoice ID байхгүй" }
    }

    // QPay идэвхтэй эсэхийг шалгах
    const settings = await getShopSettings()
    if (settings.qpay_enabled !== "true") {
      return { success: true, paid: false, status: "PENDING" }
    }

    // Rate limiting - сүүлд шалгасан хугацаанаас 10 секунд өнгөрөөгүй бол дахин шалгахгүй
    if (payment.lastQpayCheckAt) {
      const secondsSinceLastCheck = (Date.now() - new Date(payment.lastQpayCheckAt).getTime()) / 1000
      if (secondsSinceLastCheck < 10) {
        return { success: true, paid: false, status: "PENDING" }
      }
    }

    // QPay-ээс шалгах
    const checkRes = await checkQPayPayment(invoiceId)

    // lastQpayCheckAt шинэчлэх
    await db.payment.update({
      where: { id: paymentId },
      data: { lastQpayCheckAt: new Date() }
    })

    if (checkRes.success && checkRes.data?.rows?.length > 0) {
      const paidRow = checkRes.data.rows.find((r: any) => r.payment_status === "PAID")
      if (paidRow) {
        const paymentTime = paidRow.payment_time ? new Date(paidRow.payment_time) : new Date()

        // Төлбөр баталгаажуулах
        const confirmRes = await confirmPayment(payment.order.id, `QPAY_${invoiceId}`)

        if (confirmRes.success) {
          // Verification metadata шинэчлэх
          await db.payment.update({
            where: { id: paymentId },
            data: {
              status: "PAID",
              paidAt: paymentTime,
              qpayVerifiedAt: paymentTime,
              qpayVerifiedBy: "CLIENT", // Client polling-оор баталгаажлаа
            }
          })

          console.log(`[QPay Action] Order #${payment.order.orderNumber} verified via client poll`)

          return {
            success: true,
            paid: true,
            status: "VERIFIED",
            orderNumber: payment.order.orderNumber,
            verifiedAt: paymentTime.toISOString(),
            verifiedBy: "CLIENT",
          }
        } else {
          return {
            success: false,
            paid: false,
            status: "FAILED",
            error: confirmRes.error || "Баталгаажуулахад алдаа",
          }
        }
      }
    }

    return { success: true, paid: false, status: "PENDING" }
  } catch (error: any) {
    console.error("[QPay Action] Check payment error:", error)
    return { success: false, paid: false, status: "FAILED", error: error.message }
  }
}
