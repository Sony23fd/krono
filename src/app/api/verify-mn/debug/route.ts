import { NextResponse } from "next/server"
import { sessionStore, markPhoneVerified } from "@/lib/verify-mn"

/**
 * GET /api/verify-mn/debug
 *
 * Development-only endpoint to view all verification sessions
 * and manually mark them as verified.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development mode" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")
  const verify = searchParams.get("verify")

  // If sessionId provided, show/verify that session
  if (sessionId) {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    if (verify === "true") {
      session.status = "VERIFIED"
      markPhoneVerified(session.phone)
      try {
        const { db } = await import("@/lib/db")
        await db.verifiedPhone.upsert({
          where: { phone: session.phone },
          update: { verifiedAt: new Date() },
          create: { phone: session.phone }
        })
      } catch (e) {
        console.error("Failed to save verified phone:", e)
      }
      return NextResponse.json({
        success: true,
        message: "Session manually verified",
        session
      })
    }

    return NextResponse.json({ session })
  }

  // Otherwise, list all sessions
  const sessions = Array.from(sessionStore.entries()).map(([id, session]) => ({
    sessionId: id,
    phone: session.phone,
    status: session.status,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    isExpired: Date.now() > new Date(session.expiresAt).getTime()
  }))

  return NextResponse.json({
    count: sessions.length,
    sessions,
    instructions: "Use ?sessionId=X&verify=true to manually verify a session in development"
  })
}