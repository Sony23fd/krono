
export const PAYLINK_BASE_URL = "https://paylink.mn/api/v1"

// Paylink Credentials (from .env)
function getCredentials() {
  const username = process.env.PAYLINK_USERNAME
  const signature = process.env.PAYLINK_SIGNATURE
  
  if (!username || !signature) {
    console.warn("⚠️ Paylink credentials (X-USERNAME, X-SIGNATURE) are not fully configured in .env")
  }

  return { username, signature }
}

async function callPaylinkApi(pc: string, payload: any) {
  const { username, signature } = getCredentials()
  if (!username || !signature) {
    throw new Error("Authentication configuration missing")
  }

  const res = await fetch(`${PAYLINK_BASE_URL}/external/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "pc": pc,
      "X-USERNAME": username,
      "X-SIGNATURE": signature
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  })

  const data = await res.json()
  
  if (!res.ok || data.status === "error") {
    throw new Error(data.message || `Paylink API error (${pc})`)
  }
  
  return data
}

/**
 * 1. Create invoice (cu0900)
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
  try {
    const payload = {
      amount_total: amount,
      count_total: 1,
      amount: amount,
      txndesc: description,
      merchant_ref: transactionRef,
      fee_percent: 0
    }

    const data = await callPaylinkApi("cu0900", payload)
    
    // The response should contain an `invid` to construct the payment URL
    const invid = data.invid || data.id // fallback if id is used
    if (!invid) {
      throw new Error("Invalid response from Paylink: missing invid")
    }

    return { 
      success: true, 
      data: {
        invoiceId: invid,
        paymentUrl: `https://www.paylink.mn/pay/${invid}`,
        // We do not have a direct QR image from cu0900 based on standard Paylink proxy, 
        // but frontend handles redirection. We can pass a dummy base64 or let frontend handle the link.
        qrImage: null, 
        raw: data
      } 
    }
  } catch (error: any) {
    console.error("Paylink Invoice Error:", error)
    // Return mock data for testing if API fails in dev
    if (process.env.NODE_ENV !== "production") {
      console.log("Mocking Paylink response for development")
      return {
        success: true,
        data: {
          invoiceId: "mock_invoice_" + transactionRef,
          paymentUrl: "https://www.paylink.mn/pay/mock_" + transactionRef,
          qrImage: null
        }
      }
    }
    return { success: false, error: error.message }
  }
}

/**
 * 2. Check payment status (cu0904)
 */
export async function checkPaylinkPayment(invoiceId: string) {
  try {
    const data = await callPaylinkApi("cu0904", { invid: invoiceId })
    
    return { success: true, data }
  } catch (error: any) {
    console.error("Paylink Check Payment Error:", error)
    return { success: false, error: error.message }
  }
}
