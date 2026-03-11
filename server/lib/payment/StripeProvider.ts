import type { Order } from "@shared/schema";
import type {
  PaymentProvider,
  PaymentInitResult,
} from "./PaymentProvider";

// Dynamic import for Stripe to handle optional dependency
let Stripe: any;
try {
  Stripe = require("stripe").default;
} catch (e) {
  console.warn("Stripe package not installed. Install with: npm install stripe");
}

export class StripeProvider implements PaymentProvider {
  private stripe: any;
  private webhookSecret: string;

  constructor() {
    if (!Stripe) {
      throw new Error("Stripe package not installed. Run: npm install stripe");
    }
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2024-12-18.acacia",
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  }

  async initiatePayment(
    order: Order,
    options?: Record<string, any>
  ): Promise<PaymentInitResult> {
    try {
      // Convert KES to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(parseFloat(order.total) * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: order.currency.toLowerCase(),
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
        description: `Order ${order.orderNumber}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        provider: "STRIPE",
        providerPaymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        requiresAction: paymentIntent.status === "requires_action",
      };
    } catch (error) {
      console.error("Stripe payment initiation error:", error);
      throw new Error("Failed to initiate Stripe payment");
    }
  }

  async handleWebhook(
    payload: any,
    headers?: Record<string, string>
  ): Promise<{ success: boolean; orderId?: string; paymentId?: string }> {
    try {
      const signature = headers?.["stripe-signature"];
      if (!signature || !this.webhookSecret) {
        console.error("Missing Stripe webhook signature or secret");
        return { success: false };
      }

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        typeof payload === "string" ? payload : JSON.stringify(payload),
        signature,
        this.webhookSecret
      );

      // Handle different event types
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata?.orderId;

        if (!orderId) {
          console.error("Order ID not found in payment intent metadata");
          return { success: false };
        }

        return {
          success: true,
          orderId,
          paymentId: paymentIntent.id,
        };
      }

      if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata?.orderId;

        return {
          success: false,
          orderId,
          paymentId: paymentIntent.id,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Stripe webhook error:", error);
      return { success: false };
    }
  }
}
