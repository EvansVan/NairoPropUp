import type { Order } from "@shared/schema";

export type PaymentProviderType = "STRIPE" | "MPESA";

export interface PaymentInitResult {
  provider: PaymentProviderType;
  providerPaymentId: string;
  clientSecret?: string; // For Stripe
  checkoutRequestId?: string; // For M-Pesa
  requiresAction?: boolean;
  redirectUrl?: string;
}

export interface PaymentWebhookPayload {
  provider: PaymentProviderType;
  payload: any;
  headers?: Record<string, string>;
}

export interface PaymentProvider {
  /**
   * Initiate a payment for an order
   */
  initiatePayment(
    order: Order,
    options?: Record<string, any>
  ): Promise<PaymentInitResult>;

  /**
   * Handle webhook/callback from payment provider
   */
  handleWebhook(
    payload: any,
    headers?: Record<string, string>
  ): Promise<{ success: boolean; orderId?: string; paymentId?: string }>;
}
