import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/settings/phone-verification
 * Returns whether phone verification is enabled
 */
export async function GET() {
  try {
    const setting = await db.shopSettings.findUnique({
      where: { key: "phone_verification_enabled" }
    })

    // Default to true (enabled) if not explicitly set to "false"
    const enabled = setting?.value !== "false"

    return NextResponse.json({ enabled })
  } catch (error) {
    // On error, default to enabled
    return NextResponse.json({ enabled: true })
  }
}