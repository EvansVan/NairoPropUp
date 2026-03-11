// Dynamic import for axios to handle optional dependency
let axios: any;
try {
  axios = require("axios");
} catch (e) {
  console.warn("axios package not installed. Install with: npm install axios");
}
import type { Order } from "@shared/schema";
import type {
  PaymentProvider,
  PaymentInitResult,
} from "./PaymentProvider";

interface MpesaAccessToken {
  access_token: string;
  expires_in: number;
}

interface MpesaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class MpesaProvider implements PaymentProvider {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private shortcode: string;
  private passkey: string;
  private callbackUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    if (!axios) {
      throw new Error("axios package not installed. Run: npm install axios");
    }
    // Use sandbox for development, production URL for production
    this.baseUrl =
      process.env.MPESA_BASE_URL ||
      "https://sandbox.safaricom.co.ke";
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || "";
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
    this.shortcode = process.env.MPESA_SHORTCODE || "";
    this.passkey = process.env.MPESA_PASSKEY || "";
    this.callbackUrl = process.env.MPESA_CALLBACK_URL || "";

    if (!this.consumerKey || !this.consumerSecret || !this.shortcode || !this.passkey) {
      console.warn("M-Pesa credentials not fully configured. M-Pesa payments will fail.");
    }
  }

  /**
   * Get OAuth access token from M-Pesa
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(
        `${this.consumerKey}:${this.consumerSecret}`
      ).toString("base64");

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      const token = response.data.access_token;
      if (!token) {
        throw new Error("No access token received from M-Pesa");
      }
      this.accessToken = token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return token;
    } catch (error) {
      console.error("M-Pesa access token error:", error);
      throw new Error("Failed to get M-Pesa access token");
    }
  }

  /**
   * Build password for STK Push (Base64 encoded: Shortcode + Passkey + Timestamp)
   */
  private buildPassword(timestamp: string): string {
    const raw = `${this.shortcode}${this.passkey}${timestamp}`;
    return Buffer.from(raw).toString("base64");
  }

  async initiatePayment(
    order: Order,
    options?: Record<string, any>
  ): Promise<PaymentInitResult> {
    try {
      const phoneNumber = options?.phoneNumber;
      if (!phoneNumber) {
        throw new Error("Phone number is required for M-Pesa payment");
      }

      // Format phone number (remove + and ensure it starts with 254 for Kenya)
      const formattedPhone = phoneNumber.replace(/^\+/, "").replace(/^0/, "254");

      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, "")
        .slice(0, 14);
      const password = this.buildPassword(timestamp);

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(parseFloat(order.total)), // M-Pesa uses whole numbers
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: order.orderNumber,
        TransactionDesc: `Order ${order.orderNumber}`,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.ResponseCode !== "0") {
        throw new Error(
          response.data.ResponseDescription || "M-Pesa STK Push failed"
        );
      }

      return {
        provider: "MPESA",
        providerPaymentId: response.data.CheckoutRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        requiresAction: true,
      };
    } catch (error: any) {
      console.error("M-Pesa payment initiation error:", error);
      throw new Error(
        error.response?.data?.errorMessage ||
          error.message ||
          "Failed to initiate M-Pesa payment"
      );
    }
  }

  async handleWebhook(
    payload: any,
    headers?: Record<string, string>
  ): Promise<{ success: boolean; orderId?: string; paymentId?: string }> {
    try {
      // M-Pesa callback structure
      const callback = payload.Body?.stkCallback;
      if (!callback) {
        console.error("Invalid M-Pesa callback structure");
        return { success: false };
      }

      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
      } = callback;

      // ResultCode 0 means success
      if (ResultCode === "0") {
        const callbackMetadata = callback.CallbackMetadata?.Item || [];
        const metadata: Record<string, any> = {};

        callbackMetadata.forEach((item: { Name: string; Value: any }) => {
          metadata[item.Name] = item.Value;
        });

        // Extract order number from AccountReference (we'll need to look it up)
        // For now, we'll return the CheckoutRequestID which should be stored as providerPaymentId
        return {
          success: true,
          paymentId: CheckoutRequestID,
        };
      } else {
        // Payment failed
        return {
          success: false,
          paymentId: CheckoutRequestID,
        };
      }
    } catch (error) {
      console.error("M-Pesa webhook error:", error);
      return { success: false };
    }
  }
}
