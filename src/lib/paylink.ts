import crypto from 'crypto'

export const PAYLINK_BASE_URL = process.env.PAYLINK_BASE_URL || "https://api.paylink.mn/v1"

// Paylink Credentials (from .env)
function getCredentials() {
  const appId = process.env.PAYLINK_APP_ID
  const secretKey = process.env.PAYLINK_SECRET_KEY
  
  if (!appId || !secretKey) {
    console.warn("⚠️ Paylink credentials are not fully configured in .env")
  }

  return { appId, secretKey }
}

/**
 * Helper to generate signature if required
 */
function generateSignature(payload: any, secretKey: string) {
  const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return crypto.createHmac('sha256', secretKey).update(dataString).digest('hex')
}

/**
 * 1. Create invoice (cu0900 equivalent)
 */
export async function createPaylinkInvoice({ 
  transactionRef, 
  amount, 
  description = "Дижитал худалдан авалт" 
}: { 
  transactionRef: string, 
  amount: number, 
  description?: string 
}) {
  const { appId, secretKey } = getCredentials()
  if (!appId || !secretKey) return { success: false, error: "Authentication configuration missing" }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const callbackUrl = `${appUrl}/api/paylink/callback?ref=${transactionRef}`

  const payload = {
    amount: amount,
    orderId: transactionRef,
    description: description,
    callbackUrl: callbackUrl,
    // Add other fields as required by Paylink API
  }

  const signature = generateSignature(payload, secretKey)

  try {
    const res = await fetch(`${PAYLINK_BASE_URL}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "App-Id": appId,
        "X-Signature": signature
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    })

    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || "Failed to create invoice")
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error("Paylink Invoice Error:", error)
    // Return mock data for testing if API fails
    if (process.env.NODE_ENV !== "production") {
      console.log("Mocking Paylink response for development")
      return {
        success: true,
        data: {
          invoiceId: "mock_invoice_" + transactionRef,
          paymentUrl: "https://paylink.mn/pay/mock_" + transactionRef,
          qrImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        }
      }
    }
    return { success: false, error: error.message }
  }
}

/**
 * 2. Check payment status (cu0904 equivalent)
 */
export async function checkPaylinkPayment(invoiceId: string) {
  const { appId, secretKey } = getCredentials()
  if (!appId || !secretKey) return { success: false, error: "Authentication configuration missing" }

  try {
    const res = await fetch(`${PAYLINK_BASE_URL}/invoice/check/${invoiceId}`, {
      method: "GET",
      headers: {
        "App-Id": appId,
      },
      cache: "no-store"
    })

    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || "Failed to check payment")
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error("Paylink Check Payment Error:", error)
    return { success: false, error: error.message }
  }
}
