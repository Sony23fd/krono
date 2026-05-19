"use server"

import { db } from "@/lib/db"
import { createQPayInvoice, checkQPayPayment } from "@/lib/qpay"
import { confirmPayment } from "./order-actions"

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
      description: `Bileg #${order.orderNumber} - ${order.customerName}`,
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
 * QPay төлбөр шалгах (Client polling-д зориулсан)
 * 
 * @param paymentId - Payment ID (манай DB)
 * @returns { paid: boolean }
 */
export async function checkQPayPaymentStatus(paymentId: string) {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { id: true, orderStatus: true, orderNumber: true } } }
    })

    if (!payment) return { success: false, error: "Төлбөр олдсонгүй" }

    // Аль хэдийн баталгаажсан бол
    if (payment.status === "PAID") {
      return { success: true, paid: true, orderNumber: payment.order.orderNumber }
    }

    // QPay invoice_id байхгүй бол
    const invoiceId = payment.externalRef
    if (!invoiceId) return { success: true, paid: false }

    // QPay-ээс шалгах
    const checkRes = await checkQPayPayment(invoiceId)
    if (checkRes.success && checkRes.data?.count > 0) {
      const paidRow = checkRes.data.rows?.find((r: any) => r.payment_status === "PAID")
      if (paidRow) {
        // Төлбөр баталгаажуулах
        const confirmRes = await confirmPayment(payment.order.id, `QPAY_${invoiceId}`)
        if (confirmRes.success) {
          return { success: true, paid: true, orderNumber: payment.order.orderNumber }
        }
      }
    }

    return { success: true, paid: false }
  } catch (error: any) {
    console.error("[QPay Action] Check payment error:", error)
    return { success: false, error: error.message, paid: false }
  }
}
