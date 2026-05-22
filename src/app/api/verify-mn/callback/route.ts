import { NextRequest, NextResponse } from "next/server"
import { getSessionStatus, getStoredSession, sessionStore, markPhoneVerified } from "@/lib/verify-mn"

/**
 * GET /api/verify-mn/callback
 *
 * verify.mn hits this endpoint when the user sends the SMS.
 * This is a wake-up signal only — we must re-check via GET /sessions/{sessionId}.
 * Must return 200 quickly. verify.mn retries up to 5x on non-200.
 *
 * Note: No body, no HMAC signature. We never trust the callback alone.
 */
export async function GET(req: NextRequest) {
  try {
    // verify.mn doesn't send sessionId in callback params by default,
    // so we check all pending sessions. This is fine for a small store.
    // In a high-volume app, you'd encode sessionId in the callback URL.

    // Check all pending sessions and update their status
    const pendingSessions = Array.from(sessionStore.entries()).filter(
      ([_, session]) => session.status === "PENDING"
    )

    for (const [sessionId, session] of pendingSessions) {
      const result = await getSessionStatus(sessionId)
      if (result.success && result.status === "VERIFIED") {
        // Mark phone as verified in cache
        markPhoneVerified(session.phone)

        // Also save to database
        try {
          const { db } = await import("@/lib/db")
          await db.verifiedPhone.upsert({
            where: { phone: session.phone },
            update: { verifiedAt: new Date() },
            create: { phone: session.phone }
          })
        } catch (e) {
          console.error("Failed to save verified phone to DB:", e)
        }
      }
    }

    return NextResponse.json({ ok: true, processed: pendingSessions.length }, { status: 200 })
  } catch (error) {
    console.error("verify.mn callback error:", error)
    // Still return 200 to prevent retries
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
