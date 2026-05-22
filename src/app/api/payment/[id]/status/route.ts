import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkQPayPayment, getQPayPayment } from "@/lib/qpay"
import { confirmPayment } from "@/app/actions/order-actions"
import { createQPayEbarimt } from "@/lib/qpay"
import { getShopSettings } from "@/app/actions/settings-actions"

/**
 * GET /api/payment/[id]/status
 *
 * Check payment status and automatically verify if paid via QPay.
 * This endpoint is polled by the client to check if QPay payment has been confirmed.
 * It automatically verifies the order when payment is confirmed.
 *
 * Returns:
 * - status: "PENDING" | "PAID" | "VERIFIED" | "FAILED"
 * - message: Human-readable status message
 * - verifiedAt: When payment was verified (if applicable)
 * - pollInterval: Recommended polling interval in seconds
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paymentId } = await params
  const startTime = Date.now()

  try {
    // 1. Load payment with order info
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            orderStatus: true,
            totalAmount: true,
            customerName: true,
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({
        status: "FAILED",
        message: "Төлбөрийн мэдээлэл олдсонгүй",
        pollInterval: 0,
      }, { status: 404 })
    }

    // 2. Already verified (PAID status)
    if (payment.status === "PAID" || payment.order.orderStatus === "PAID") {
      return NextResponse.json({
        status: "VERIFIED",
        message: "Төлбөр баталгаажсан",
        verifiedAt: payment.paidAt?.toISOString(),
        orderNumber: payment.order.orderNumber,
        pollInterval: 0, // Stop polling
      })
    }

    // 3. FAILED or CANCELLED order
    if (payment.status === "FAILED" || payment.order.orderStatus === "CANCELLED") {
      return NextResponse.json({
        status: "FAILED",
        message: "Төлбөр амжилтгүй болсон",
        pollInterval: 0,
      })
    }

    // 4. Check if QPay payment
    if (payment.method !== "QPAY" || !payment.externalRef) {
      // Non-QPay payments - just return current status
      return NextResponse.json({
        status: payment.status === "PENDING" ? "PENDING" : "FAILED",
        message: payment.status === "PENDING"
          ? "Төлбөр хүлээгдэж байна"
          : "Төлбөрийн төлөв тодорхойгүй",
        pollInterval: 30, // Check again in 30s
      })
    }

    // 5. Rate limiting - don't check QPay more than once every 10 seconds per payment
    if (payment.lastQpayCheckAt) {
      const secondsSinceLastCheck = (Date.now() - new Date(payment.lastQpayCheckAt).getTime()) / 1000
      if (secondsSinceLastCheck < 10) {
        return NextResponse.json({
          status: "PENDING",
          message: "Шалгаж байна...",
          pollInterval: Math.max(5, Math.ceil(10 - secondsSinceLastCheck)),
        })
      }
    }

    // 6. Check QPay API
    const settings = await getShopSettings()
    if (settings.qpay_enabled !== "true") {
      return NextResponse.json({
        status: "PENDING",
        message: "Төлбөр хүлээгдэж байна",
        pollInterval: 30,
      })
    }

    const invoiceId = payment.externalRef
    let isPaid = false
    let qpayPaymentId: string | null = null
    let qpayVerifiedAt: Date | null = null

    // Check payment status with QPay
    const checkRes = await checkQPayPayment(invoiceId)

    if (checkRes.success && checkRes.data?.rows?.length > 0) {
      const paidRow = checkRes.data.rows.find((r: any) => r.payment_status === "PAID")
      if (paidRow) {
        isPaid = true
        qpayPaymentId = paidRow.payment_id || null
        qpayVerifiedAt = paidRow.payment_time ? new Date(paidRow.payment_time) : new Date()
      }
    }

    // Update last check timestamp
    await db.payment.update({
      where: { id: paymentId },
      data: { lastQpayCheckAt: new Date() }
    })

    if (isPaid) {
      // 7. Automatically verify the order
      try {
        // Get detailed payment info if available
        let ebarimtData: any = null
        if (qpayPaymentId) {
          try {
            const ebRes = await createQPayEbarimt(qpayPaymentId)
            if (ebRes.success) {
              ebarimtData = {
                id: ebRes.data?.id || ebRes.data?.billId,
                qr: ebRes.data?.qr_data || ebRes.data?.qrCode,
                lottery: ebRes.data?.lottery || ebRes.data?.lotteryWarningMsg,
                verifiedVia: "CLIENT_POLL",
                verifiedAt: qpayVerifiedAt?.toISOString(),
              }
            }
          } catch (e) {
            console.error("[Payment Status] E-barimt failed:", e)
          }
        }

        // Verify payment
        const result = await confirmPayment(
          payment.order.id,
          `QPAY_${invoiceId}`
        )

        if (result.success) {
          // Update payment with verification info
          await db.payment.update({
            where: { id: paymentId },
            data: {
              status: "PAID",
              paidAt: qpayVerifiedAt || new Date(),
              qpayVerifiedAt: qpayVerifiedAt || new Date(),
              qpayVerifiedBy: "CLIENT",
              metadata: ebarimtData || payment.metadata,
            }
          })

          console.log(`[Payment Status] Order #${payment.order.orderNumber} auto-verified via client poll`)

          const processingTime = Date.now() - startTime
          console.log(`[Payment Status] Verification completed in ${processingTime}ms for payment ${paymentId}`)

          return NextResponse.json({
            status: "VERIFIED",
            message: "Төлбөр баталгаажлаа! Захиалга амжилттай.",
            verifiedAt: (qpayVerifiedAt || new Date()).toISOString(),
            orderNumber: payment.order.orderNumber,
            pollInterval: 0,
          })
        } else {
          console.error(`[Payment Status] Verification failed for order ${payment.order.orderNumber}: ${result.error}`)
          return NextResponse.json({
            status: "FAILED",
            message: "Баталгаажуулалт амжилтгүй: " + (result.error || "Алдаа гарлаа"),
            pollInterval: 10,
          })
        }
      } catch (e: any) {
        console.error("[Payment Status] Verification error:", e)
        return NextResponse.json({
          status: "FAILED",
          message: "Баталгаажуулалт хийхэд алдаа гарлаа",
          pollInterval: 10,
        })
      }
    }

    // Not paid yet
    return NextResponse.json({
      status: "PENDING",
      message: "Төлбөр хүлээгдэж байна. QPay апп-аар төлбөр хийнэ үү.",
      pollInterval: 5, // Check again in 5 seconds
    })

  } catch (error: any) {
    console.error("[Payment Status] Error:", error)
    return NextResponse.json({
      status: "FAILED",
      message: "Серверийн алдаа: " + (error.message || "Алдаа гарлаа"),
      pollInterval: 30,
    }, { status: 500 })
  }
}