import type { PaymentProvider } from "./PaymentProvider";
import { StripeProvider } from "./StripeProvider";
import { MpesaProvider } from "./MpesaProvider";

export function getPaymentProvider(provider: "STRIPE" | "MPESA"): PaymentProvider {
  switch (provider) {
    case "STRIPE":
      return new StripeProvider();
    case "MPESA":
      return new MpesaProvider();
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}

export * from "./PaymentProvider";
export { StripeProvider } from "./StripeProvider";
export { MpesaProvider } from "./MpesaProvider";
