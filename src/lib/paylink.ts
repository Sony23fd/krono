// src/lib/paylink.ts

export type PaylinkInvoiceStatus = "pending" | "paid" | "approved" | "canceled" | "expired";

export interface CreateInvoiceParams {
  amount: number;
  transactionRef: string;
  description?: string;
}

export interface PaylinkResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  response_code?: string;
}

export class PaylinkClient {
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly signature: string;

  constructor() {
    this.baseUrl = "https://paylink.mn/api/v1/external/process";
    
    // Environment Variables
    this.username = process.env.PAYLINK_USERNAME || "";
    this.signature = process.env.PAYLINK_SIGNATURE || "";

    if (!this.username || !this.signature) {
      console.warn("⚠️ Paylink credentials (PAYLINK_USERNAME, PAYLINK_SIGNATURE) are missing in .env");
    }
  }

  /**
   * Helper function: Generate X-SIGNATURE
   * Paylink MN uses static API Keys in most standard integrations.
   * If HMAC-SHA256 based on payload is required, it can be implemented here.
   */
  private generateSignature(): string {
    return this.signature;
  }

  /**
   * Core request handler for Paylink's Single Endpoint Architecture
   * @param pc Process Code (e.g., cu0900, cu0904)
   * @param payload Request Body
   */
  private async request(pc: string, payload: any): Promise<any> {
    if (!this.username || !this.signature) {
      throw new Error("Paylink authentication configuration is missing.");
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "pc": pc,
          "X-USERNAME": this.username,
          "X-SIGNATURE": this.generateSignature(),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await response.json();
      
      if (data.response_code !== "RC000000") {
        throw new Error(data.response || `Paylink API error. Code: ${data.response_code}`);
      }

      return data.response; 
    } catch (error: any) {
      console.error(`[Paylink API Error - ${pc}]:`, error.message);
      
      // Mocking for development environment when API fails
      if (process.env.NODE_ENV !== "production") {
        console.log(`Mocking Paylink response for ${pc} in development`);
        if (pc === "cu0900") {
          return {
            invid: "mock_inv_" + Date.now(),
            payment_link: "https://paylink.mn/pay/mock_inv_" + Date.now()
          };
        } else if (pc === "cu0904") {
          return { status: "pending", paid_at: null };
        }
      }
      
      throw error;
    }
  }

  /**
   * 1. Create Invoice (pc: cu0900)
   */
  public async createInvoice({ amount, transactionRef, description = "Худалдан авалт" }: CreateInvoiceParams): Promise<PaylinkResponse> {
    try {
      const payload = {
        amount_total: amount,
        count_total: 1,
        amount: amount,
        txndesc: description,
        merchant_ref: transactionRef,
        base_amount: amount,
        fee_percent: 0,
        fee_amount: 0,
      };

      const result = await this.request("cu0900", payload);

      if (!result.invid || !result.payment_link) {
        throw new Error("Invalid response: Missing invid or payment_link");
      }

      return {
        success: true,
        response_code: "RC000000",
        data: {
          invoiceId: result.invid,
          paymentUrl: result.payment_link,
          qrImage: null, // Frontend will handle QR generation
          raw: result
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 2. Check Invoice Status (pc: cu0904)
   */
  public async checkInvoiceStatus(invoiceId: string): Promise<PaylinkResponse<{ status: PaylinkInvoiceStatus, isPaid: boolean, raw: any }>> {
    try {
      const payload = { invid: invoiceId };
      const result = await this.request("cu0904", payload);

      const status: PaylinkInvoiceStatus = result.status?.toLowerCase() || "pending";
      const isPaid = status === "paid" || status === "success";

      return {
        success: true,
        response_code: "RC000000",
        data: {
          status,
          isPaid,
          raw: result
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Global instance
export const paylinkClient = new PaylinkClient();

// Legacy Wrapper Functions to maintain compatibility with existing codebase
export async function createPaylinkInvoice(params: CreateInvoiceParams) {
  return paylinkClient.createInvoice(params);
}

export async function checkPaylinkPayment(invoiceId: string) {
  const result = await paylinkClient.checkInvoiceStatus(invoiceId);
  if (!result.success) return { success: false, error: result.error };
  // Return raw data to maintain compatibility with existing usages
  return { success: true, data: result.data?.raw };
}
