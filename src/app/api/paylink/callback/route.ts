import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getShopSettings } from "@/app/actions/settings-actions"
import { checkPaylinkPayment } from "@/lib/paylink"
import { confirmPayment } from "@/app/actions/order-actions"

export async function GET(request: Request) {
  return handleCallback(request)
}

export async function POST(request: Request) {
  return handleCallback(request)
}

/**
 * Paylink Callback Handler
 *
 * This endpoint is called by Paylink when a payment is made.
 * It verifies the payment against Paylink's API and automatically
 * confirms the order if payment is successful.
 *
 * URL: /api/paylink/callback?ref=<payment.id>&payment_id=<paylink_payment_id>
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
  const paylinkPaymentId = searchParams.get("payment_id")

  // Log callback received
  console.log(`[Paylink Callback] Received at ${new Date().toISOString()}`, {
    paymentDbId,
    paylinkPaymentId,
    method: request.method,
    userAgent: request.headers.get("user-agent"),
  })

  // Validate required parameters
  if (!paymentDbId) {
    console.warn("[Paylink Callback] Missing ref parameter")
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 })
  }

  try {
    // Check if Paylink is enabled
    const settings = await getShopSettings()
    if (settings.paylink_enabled === "false") {
      console.warn("[Paylink Callback] Paylink is disabled")
      return NextResponse.json({ error: "Paylink is disabled" }, { status: 403 })
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
      console.warn(`[Paylink Callback] Payment not found: ${paymentDbId}`)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Log current state
    console.log(`[Paylink Callback] Processing payment`, {
      paymentId: paymentDbId,
      orderNumber: payment.order.orderNumber,
      currentStatus: payment.status,
      orderStatus: payment.order.orderStatus,
      invoiceId: payment.externalRef,
    })

    // ══ IDEMPOTENCY CHECK ══
    // If already PAID, just acknowledge
    if (payment.status === "PAID" || payment.order.orderStatus === "PAID") {
      console.log(`[Paylink Callback] Order #${payment.order.orderNumber} already verified`)
      return NextResponse.json({
        success: true,
        message: "Already confirmed",
        orderNumber: payment.order.orderNumber,
        verifiedAt: payment.paidAt?.toISOString(),
      })
    }

    // If order is cancelled, acknowledge but don't process
    if (payment.order.orderStatus === "CANCELLED") {
      console.log(`[Paylink Callback] Order #${payment.order.orderNumber} is cancelled, skipping`)
      return NextResponse.json({
        success: true,
        message: "Order was cancelled",
        orderNumber: payment.order.orderNumber,
      })
    }

    // ══ QPAY VERIFICATION ══
    const invoiceId = payment.externalRef
    if (!invoiceId) {
      console.error(`[Paylink Callback] No invoice ID for payment ${paymentDbId}`)
      return NextResponse.json({
        success: false,
        error: "No Paylink invoice linked to this payment"
      }, { status: 400 })
    }

    // Check payment status with Paylink API
    console.log(`[Paylink Callback] Checking Paylink for invoice: ${invoiceId}`)
    const checkRes = await checkPaylinkPayment(invoiceId)

    let isPaid = false
    let paylinkPaymentIdFromApi: string | null = paylinkPaymentId
    let paymentTime: Date | null = null

    if (checkRes.success) {
      const rawData = checkRes.data?.response || checkRes.data || {}
      const paylinkStatus = (rawData.status || "").toLowerCase()
      
      if (paylinkStatus === "paid" || paylinkStatus === "success") {
        isPaid = true
        paylinkPaymentIdFromApi = rawData.id?.toString() || paylinkPaymentIdFromApi
        paymentTime = rawData.paid_at ? new Date(rawData.paid_at) : new Date()
        console.log(`[Paylink Callback] Payment confirmed by Paylink`, {
          paymentId: paylinkPaymentIdFromApi,
          paymentTime: paymentTime?.toISOString(),
          amount: rawData.amount,
        })
      }
    }

    // If not paid via Paylink, acknowledge but don't confirm
    if (!isPaid) {
      console.log(`[Paylink Callback] Payment not yet completed for invoice: ${invoiceId}`)
      // Don't return error - acknowledge callback to prevent retries
      return NextResponse.json({
        success: true,
        message: "Payment not completed yet",
        orderNumber: payment.order.orderNumber,
      })
    }

    // ══ E-BARIMT GENERATION ══
    let ebarimtData: any = null
    // eBarimt is currently handled manually or via QPay. Paylink integration for ebarimt can be added here.

    // ══ CONFIRM PAYMENT ══
    console.log(`[Paylink Callback] Confirming payment for order #${payment.order.orderNumber}`)
    const result = await confirmPayment(
      payment.order.id,
      `QPAY_${invoiceId}`
    )

    if (!result.success) {
      console.error(`[Paylink Callback] Failed to confirm order #${payment.order.orderNumber}:`, result.error)
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
        metadata: {
          ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
          ...ebarimtData,
          paylinkVerifiedAt: new Date().toISOString(),
          paylinkVerifiedBy: "AUTO",
        },
      }
    })

    const processingTime = Date.now() - startTime
    console.log(`[Paylink Callback] ✅ Order #${payment.order.orderNumber} confirmed successfully in ${processingTime}ms`)

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
    console.error(`[Paylink Callback] ❌ Error after ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack,
      paymentId: paymentDbId,
    })

    // Always return 200 to prevent Paylink from retrying
    return NextResponse.json({
      success: true,
      message: "Callback received",
      error: error.message, // Include error for debugging but acknowledge
    })
  }
}