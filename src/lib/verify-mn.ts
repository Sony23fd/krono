/**
 * verify.mn — Mobile-Originated SMS phone verification for Mongolia
 * 
 * Flow:
 * 1. createSession(phone) → creates a verify.mn session, returns smsUri + instructions
 * 2. User sends SMS to shortcode 144773
 * 3. verify.mn hits our callback → we re-check via getSessionStatus()
 * 4. Client polls /api/verify-mn/status/{sessionId} until VERIFIED or EXPIRED
 */

const VERIFY_MN_BASE_URL = "https://api.verify.mn"

// ─── In-memory session store (5-min TTL, safe for single-instance VPS) ───

export interface VerifySession {
  sessionId: string
  phone: string
  status: "PENDING" | "VERIFIED" | "EXPIRED"
  expiresAt: string
  smsUri: string
  displayInstruction: string
  createdAt: number
}

export const sessionStore = new Map<string, VerifySession>()

// Cleanup expired sessions every 60s
setInterval(() => {
  const now = Date.now()
  for (const [key, session] of sessionStore) {
    if (now > new Date(session.expiresAt).getTime()) {
      sessionStore.delete(key)
    }
  }
}, 60_000)

// ─── Helpers ───

function getApiKey(): string {
  const key = process.env.VERIFY_MN_API_KEY
  if (!key) {
    throw new Error("VERIFY_MN_API_KEY is not set in environment variables. Cannot use phone verification.")
  }
  return key
}

function getCallbackUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${appUrl}/api/verify-mn/callback`
}

/** Generate a random 4-digit nonce for SMS text */
function generateSmsText(): string {
  const nonce = Math.floor(1000 + Math.random() * 9000)
  return `${nonce}`
}

// ─── API Functions ───

/**
 * Create a new verification session with verify.mn
 */
export async function createVerifySession(phone: string): Promise<{
  success: boolean
  session?: VerifySession
  error?: string
}> {
  try {
    const apiKey = getApiKey()
    const text = generateSmsText()
    const callback = getCallbackUrl()

    const response = await fetch(`${VERIFY_MN_BASE_URL}/sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        text,
        callback,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`verify.mn session creation failed (${response.status}):`, errorBody)

      if (response.status === 401) {
        return { success: false, error: "Баталгаажуулалтын API түлхүүр буруу байна" }
      }
      if (response.status === 400) {
        return { success: false, error: "Утасны дугаар формат буруу байна" }
      }
      return { success: false, error: "Баталгаажуулалтын сервер алдаа гарлаа. Дахин оролдоно уу." }
    }

    const data = await response.json()

    const session: VerifySession = {
      sessionId: data.sessionId,
      phone: data.phone,
      status: data.sessionStatus || "PENDING",
      expiresAt: data.expiresAt,
      smsUri: data.smsUri || `sms:144773?body=${encodeURIComponent(text)}`,
      displayInstruction: data.displayInstruction || `144773 дугаарт "${text}" гэж SMS илгээнэ үү.`,
      createdAt: Date.now(),
    }

    // Store in memory
    sessionStore.set(data.sessionId, session)

    return { success: true, session }
  } catch (error: any) {
    console.error("verify.mn createSession error:", error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Check session status from verify.mn API (no auth required)
 */
export async function getSessionStatus(sessionId: string): Promise<{
  success: boolean
  status?: "PENDING" | "VERIFIED" | "EXPIRED"
  verifiedAt?: string
  error?: string
}> {
  try {
    const apiKey = process.env.VERIFY_MN_API_KEY
    if (!apiKey) return { success: false, error: "API key is missing" }

    const response = await fetch(`${VERIFY_MN_BASE_URL}/sessions/${sessionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      // No caching — always fresh
      cache: "no-store",
    })

    if (!response.ok) {
      return { success: false, error: `Status check failed: ${response.status}` }
    }

    const data = await response.json()
    const status = data.sessionStatus as "PENDING" | "VERIFIED" | "EXPIRED"

    // Update in-memory store
    const stored = sessionStore.get(sessionId)
    if (stored) {
      stored.status = status
      sessionStore.set(sessionId, stored)
    }

    return {
      success: true,
      status,
      verifiedAt: data.verifiedAt,
    }
  } catch (error: any) {
    console.error("verify.mn getSessionStatus error:", error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Get a stored session by ID
 */
export function getStoredSession(sessionId: string): VerifySession | undefined {
  return sessionStore.get(sessionId)
}

/**
 * Find active session by phone number
 */
export function findSessionByPhone(phone: string): VerifySession | undefined {
  for (const session of sessionStore.values()) {
    if (session.phone === phone && session.status === "VERIFIED") {
      return session
    }
  }
  return undefined
}

// ─── Persistent verified phones (survives session TTL expiry) ───

/** Phones verified during this server process lifetime. Map<digits, verifiedAt> */
const verifiedPhones = new Map<string, number>()

/** 24-hour expiry for verified phone cache */
const VERIFIED_PHONE_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Mark a phone as verified (called after VERIFIED status confirmed)
 */
export function markPhoneVerified(phone: string): void {
  const digits = phone.replace(/\D/g, "")
  if (digits) {
    verifiedPhones.set(digits, Date.now())
  }
}

/**
 * High-level: Check if a phone number has been verified
 * Checks both: active sessions AND persistent verified phones cache
 */
export function isPhoneVerified(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return false

  // Check persistent cache (with 24h TTL)
  const verifiedAt = verifiedPhones.get(digits)
  if (verifiedAt && (Date.now() - verifiedAt) < VERIFIED_PHONE_TTL_MS) {
    return true
  }

  // Clean up expired entry
  if (verifiedAt) {
    verifiedPhones.delete(digits)
  }

  // Check active sessions
  for (const session of sessionStore.values()) {
    const sessionDigits = session.phone.replace(/\D/g, "")
    if (sessionDigits === digits && session.status === "VERIFIED") {
      // Also add to persistent cache
      verifiedPhones.set(digits, Date.now())
      return true
    }
  }
  return false
}
