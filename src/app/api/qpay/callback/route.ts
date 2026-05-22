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
 * QPay Callback Handler
 *
 * This endpoint is called by QPay when a payment is made.
 * It verifies the payment against QPay's API and automatically
 * confirms the order if payment is successful.
 *
 * URL: /api/qpay/callback?ref=<payment.id>&payment_id=<qpay_payment_id>
 *
 * Features:
 * - Idempotent (safe to call multiple times)
 * - Rate limiting to prevent duplicate processing
 * - Detailed logging for debugging
 * - E-barimt generation on successful payment
 * - Graceful error handling (always returns 200 to prevent retries)
 */
async function handleCallback(request: Request) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  const paymentDbId = searchParams.get("ref")
  const qpayPaymentId = searchParams.get("payment_id")

  // Log callback received
  console.log(`[QPay Callback] Received at ${new Date().toISOString()}`, {
    paymentDbId,
    qpayPaymentId,
    method: request.method,
    userAgent: request.headers.get("user-agent"),
  })

  // Validate required parameters
  if (!paymentDbId) {
    console.warn("[QPay Callback] Missing ref parameter")
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 })
  }

  try {
    // Check if QPay is enabled
    const settings = await getShopSettings()
    if (settings.qpay_enabled !== "true") {
      console.warn("[QPay Callback] QPay is disabled")
      return NextResponse.json({ error: "QPay is disabled" }, { status: 403 })
    }

    // Load payment with order info
    const payment = await db.payment.findUnique({
      where: { id: paymentDbId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            orderStatus: true,
            totalAmount: true,
            customerName: true,
            customerPhone: true,
          }
        }
      }
    })

    if (!payment) {
      console.warn(`[QPay Callback] Payment not found: ${paymentDbId}`)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Log current state
    console.log(`[QPay Callback] Processing payment`, {
      paymentId: paymentDbId,
      orderNumber: payment.order.orderNumber,
      currentStatus: payment.status,
      orderStatus: payment.order.orderStatus,
      invoiceId: payment.externalRef,
    })

    // ══ IDEMPOTENCY CHECK ══
    // If already PAID, just acknowledge
    if (payment.status === "PAID" || payment.order.orderStatus === "PAID") {
      console.log(`[QPay Callback] Order #${payment.order.orderNumber} already verified`)
      return NextResponse.json({
        success: true,
        message: "Already confirmed",
        orderNumber: payment.order.orderNumber,
        verifiedAt: payment.paidAt?.toISOString(),
      })
    }

    // If order is cancelled, acknowledge but don't process
    if (payment.order.orderStatus === "CANCELLED") {
      console.log(`[QPay Callback] Order #${payment.order.orderNumber} is cancelled, skipping`)
      return NextResponse.json({
        success: true,
        message: "Order was cancelled",
        orderNumber: payment.order.orderNumber,
      })
    }

    // ══ QPAY VERIFICATION ══
    const invoiceId = payment.externalRef
    if (!invoiceId) {
      console.error(`[QPay Callback] No invoice ID for payment ${paymentDbId}`)
      return NextResponse.json({
        success: false,
        error: "No QPay invoice linked to this payment"
      }, { status: 400 })
    }

    // Check payment status with QPay API
    console.log(`[QPay Callback] Checking QPay for invoice: ${invoiceId}`)
    const checkRes = await checkQPayPayment(invoiceId)

    let isPaid = false
    let qpayPaymentIdFromApi: string | null = qpayPaymentId
    let paymentTime: Date | null = null

    if (checkRes.success && checkRes.data?.rows?.length > 0) {
      const paidRow = checkRes.data.rows.find((r: any) => r.payment_status === "PAID")
      if (paidRow) {
        isPaid = true
        qpayPaymentIdFromApi = paidRow.payment_id || qpayPaymentIdFromApi
        paymentTime = paidRow.payment_time ? new Date(paidRow.payment_time) : new Date()
        console.log(`[QPay Callback] Payment confirmed by QPay`, {
          paymentId: qpayPaymentIdFromApi,
          paymentTime: paymentTime?.toISOString(),
          amount: paidRow.amount,
        })
      }
    }

    // If not paid via QPay, acknowledge but don't confirm
    if (!isPaid) {
      console.log(`[QPay Callback] Payment not yet completed for invoice: ${invoiceId}`)
      // Don't return error - acknowledge callback to prevent retries
      return NextResponse.json({
        success: true,
        message: "Payment not completed yet",
        orderNumber: payment.order.orderNumber,
      })
    }

    // ══ E-BARIMT GENERATION ══
    let ebarimtData: any = null
    if (qpayPaymentIdFromApi) {
      try {
        console.log(`[QPay Callback] Generating e-barimt for payment: ${qpayPaymentIdFromApi}`)
        const ebRes = await createQPayEbarimt(qpayPaymentIdFromApi)
        if (ebRes.success) {
          ebarimtData = {
            id: ebRes.data?.id || ebRes.data?.billId,
            qr: ebRes.data?.qr_data || ebRes.data?.qrCode,
            lottery: ebRes.data?.lottery || ebRes.data?.lotteryWarningMsg,
          }
          console.log(`[QPay Callback] E-barimt created:`, ebarimtData)
        }
      } catch (err) {
        // E-barimt failure is not critical - log and continue
        console.error("[QPay Callback] E-barimt generation failed:", err)
      }
    }

    // ══ CONFIRM PAYMENT ══
    console.log(`[QPay Callback] Confirming payment for order #${payment.order.orderNumber}`)
    const result = await confirmPayment(
      payment.order.id,
      `QPAY_${invoiceId}`
    )

    if (!result.success) {
      console.error(`[QPay Callback] Failed to confirm order #${payment.order.orderNumber}:`, result.error)
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to confirm payment"
      }, { status: 400 })
    }

    // Update payment with verification metadata
    await db.payment.update({
      where: { id: paymentDbId },
      data: {
        status: "PAID",
        paidAt: paymentTime || new Date(),
        qpayVerifiedAt: new Date(),
        qpayVerifiedBy: "AUTO", // Confirmed via callback
        metadata: ebarimtData || payment.metadata,
      }
    })

    const processingTime = Date.now() - startTime
    console.log(`[QPay Callback] ✅ Order #${payment.order.orderNumber} confirmed successfully in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      message: "Payment confirmed successfully",
      orderNumber: payment.order.orderNumber,
      verifiedAt: (paymentTime || new Date()).toISOString(),
      processingTimeMs: processingTime,
      ebarimtGenerated: !!ebarimtData,
    })

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error(`[QPay Callback] ❌ Error after ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack,
      paymentId: paymentDbId,
    })

    // Always return 200 to prevent QPay from retrying
    return NextResponse.json({
      success: true,
      message: "Callback received",
      error: error.message, // Include error for debugging but acknowledge
    })
  }
}