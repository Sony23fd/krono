import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getShopSettings } from "@/app/actions/settings-actions"
import { checkQPayPayment, createQPayEbarimt } from "@/lib/qpay"
import { confirmPayment } from "@/app/actions/order-actions"

export async function GET(request: Request) {
  return handleCallback(request)
}

export async function POST(request: Request) {
  return handleCallback(request)
}

/**
 * QPay callback handler.
 * 
 * Шинэ schema дээр:
 * - Order.idempotencyKey → QPay invoice бүтэхэд ашигласан key
 * - Payment.externalRef → QPay invoice_id хадгалагдана
 * - Payment.metadata → QPay-аас ирсэн нэмэлт мэдээлэл (e-barimt г.м.)
 * 
 * Дуудагдах URL: /api/qpay/callback?ref=<payment.id>&payment_id=<qpay_payment_id>
 */
async function handleCallback(request: Request) {
  const { searchParams } = new URL(request.url)
  const paymentDbId = searchParams.get("ref") // Манай Payment.id
  const qpayPaymentId = searchParams.get("payment_id")

  if (!paymentDbId) {
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 })
  }

  try {
    // 1. QPay идэвхтэй эсэхийг шалгах
    const settings = await getShopSettings()
    if (settings.qpay_enabled !== "true") {
      console.warn("[QPay Callback] QPay is disabled")
      return NextResponse.json({ error: "QPay is currently disabled" }, { status: 403 })
    }

    // 2. Payment бичлэг хайх
    const payment = await db.payment.findUnique({
      where: { id: paymentDbId },
      include: { order: { select: { id: true, orderStatus: true, orderNumber: true } } }
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Аль хэдийн баталгаажсан бол
    if (payment.status === "PAID") {
      return NextResponse.json({ success: true, message: "Already confirmed" })
    }

    // 3. QPay-аас төлбөр төлөгдсөн эсэхийг давхар шалгах
    const invoiceId = payment.externalRef
    if (!invoiceId) {
      return NextResponse.json({ error: "No QPay invoice linked to this payment" }, { status: 400 })
    }

    let isPaid = false
    let finalPaymentId = qpayPaymentId

    const checkRes = await checkQPayPayment(invoiceId)
    if (checkRes.success && checkRes.data.count > 0) {
      const paidRow = checkRes.data.rows?.find((r: any) => r.payment_status === "PAID")
      if (paidRow) {
        isPaid = true
        finalPaymentId = paidRow.payment_id || finalPaymentId
      }
    }

    if (!isPaid) {
      return NextResponse.json({ error: "Payment not verified by QPay" }, { status: 400 })
    }

    // 4. E-barimt үүсгэх (алдаа гарвал ч захиалга баталгаажна)
    let ebarimtData: any = null
    if (finalPaymentId) {
      try {
        const ebRes = await createQPayEbarimt(finalPaymentId)
        if (ebRes.success) {
          ebarimtData = {
            id: ebRes.data.id || ebRes.data.billId,
            qr: ebRes.data.qr_data || ebRes.data.qrCode,
            lottery: ebRes.data.lottery || ebRes.data.lotteryWarningMsg,
          }
        }
      } catch (err) {
        console.error("[QPay Callback] E-barimt failed:", err)
      }
    }

    // 5. Төлбөр баталгаажуулах (stock adjustment + status update)
    const result = await confirmPayment(
      payment.order.id,
      `QPAY_${invoiceId}`
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // 6. Payment metadata шинэчлэх (e-barimt мэдээлэл)
    if (ebarimtData) {
      await db.payment.update({
        where: { id: paymentDbId },
        data: {
          metadata: ebarimtData as any,
        }
      })
    }

    console.log(`[QPay Callback] Order #${payment.order.orderNumber} confirmed via QPay`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("[QPay Callback] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
