export const QPAY_BASE_URL = process.env.QPAY_BASE_URL || "https://merchant.qpay.mn/v2"

// QPay Credentials (from .env)
function getCredentials() {
  const clientId = process.env.QPAY_CLIENT_ID
  const clientSecret = process.env.QPAY_CLIENT_SECRET
  const invoiceCode = process.env.QPAY_INVOICE_CODE
  
  if (!clientId || !clientSecret || !invoiceCode) {
    console.warn("⚠️ QPay credentials are not fully configured in .env")
  }

  return { clientId, clientSecret, invoiceCode }
}

// Global cache for QPay token to avoid requesting it on every call 
// (QPay requires tokens to be reused until expiration)
const globalForQPay = global as unknown as { 
  qpayToken?: string, 
  qpayTokenExpiresAt?: number 
}

/**
 * 1. Fetch access token
 */
export async function getQPayToken() {
  // Return cached token if still valid (with 1 minute buffer)
  if (
    globalForQPay.qpayToken && 
    globalForQPay.qpayTokenExpiresAt && 
    Date.now() < globalForQPay.qpayTokenExpiresAt
  ) {
    return globalForQPay.qpayToken
  }

  const { clientId, clientSecret } = getCredentials()
  if (!clientId || !clientSecret) return null

  const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`

  try {
    const res = await fetch(`${QPAY_BASE_URL}/auth/token`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      cache: "no-store",
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to fetch QPay token: ${res.status} ${errorText}`)
    }
    
    const data = await res.json()
    
    // Cache the token
    // data.expires_in is usually in seconds (e.g. 3600)
    globalForQPay.qpayToken = data.access_token
    globalForQPay.qpayTokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000 // 1 min buffer
    
    return data.access_token
  } catch (error) {
    console.error("QPay Token Error:", error)
    return null
  }
}

/**
 * 2. Create invoice
 */
export async function createQPayInvoice({ 
  transactionRef, 
  amount, 
  description = "Bileg Supermarket" 
}: { 
  transactionRef: string, 
  amount: number, 
  description?: string 
}) {
  const token = await getQPayToken()
  if (!token) return { success: false, error: "Authentication failed" }

  const { invoiceCode } = getCredentials()
  
  // Create callback URL based on app host
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const callbackUrl = `${appUrl}/api/qpay/callback?ref=${transactionRef}`

  try {
    const res = await fetch(`${QPAY_BASE_URL}/invoice`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        invoice_code: invoiceCode,
        sender_invoice_no: transactionRef,
        invoice_receiver_code: "terminal", // or customer register if needed
        invoice_description: description,
        sender_branch_code: "SALBAR1",
        amount: amount,
        callback_url: callbackUrl
      }),
      cache: "no-store"
    })

    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || "Failed to create invoice")
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error("QPay Invoice Error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * 3. Check payment status
 */
export async function checkQPayPayment(invoiceId: string) {
  const token = await getQPayToken()
  if (!token) return { success: false, error: "Authentication failed" }

  try {
    const res = await fetch(`${QPAY_BASE_URL}/payment/check`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        object_type: "INVOICE",
        object_id: invoiceId,
        offset: {
          page_number: 1,
          page_limit: 100
        }
      }),
      cache: "no-store"
    })

    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || "Failed to check payment")
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error("QPay Check Payment Error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * 4. Get Payment Details
 */
export async function getQPayPayment(paymentId: string) {
  const token = await getQPayToken()
  if (!token) return { success: false, error: "Authentication failed" }

  try {
    const res = await fetch(`${QPAY_BASE_URL}/payment/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store"
    })

    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || "Failed to get payment details")
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error("QPay Get Payment Error:", error)
    return { success: false, error: error.message }
  }
}


/**
 * 5. Create E-barimt after payment
 */
export async function createQPayEbarimt(paymentId: string, receiverType: "CITIZEN" | "ENTITY" = "CITIZEN", register?: string) {
  const token = await getQPayToken()
  if (!token) return { success: false, error: "Authentication failed" }

  try {
    const payload: any = {
      payment_id: paymentId,
      ebarimt_receiver_type: receiverType
    }
    if (receiverType === "ENTITY" && register) {
      payload.ebarimt_receiver_code = register
    }

    const res = await fetch(`${QPAY_BASE_URL}/ebarimt/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    })

    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || "Failed to create ebarimt")
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error("QPay Ebarimt Error:", error)
    return { success: false, error: error.message }
  }
}
