import Stripe from "stripe";
import { siteConfig } from "./config";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-10-28.acacia" as any,
    })
  : null;

export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

export interface CheckoutItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
}

/**
 * Generates either a real Stripe Checkout session URL or a sandbox verification URL
 */
export async function createCheckoutSession({
  orderId,
  customerEmail,
  items,
  successUrl,
  cancelUrl,
}: {
  orderId: string;
  customerEmail: string;
  items: CheckoutItem[];
  successUrl: string;
  cancelUrl: string;
}) {
  if (stripe) {
    const lineItems = items.map((item) => ({
      price_data: {
        currency: siteConfig.defaultCurrency.toLowerCase(),
        product_data: {
          name: item.title,
          description: `Digital Publication Access • ${siteConfig.name}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: orderId,
      metadata: {
        orderId,
      },
    });

    return { url: session.url, sessionId: session.id, provider: "STRIPE" };
  }

  // Sandbox Test Checkout Mode
  // If Stripe keys are not yet provided in .env, seamlessly redirect to sandbox completion endpoint
  const sandboxUrl = `${siteConfig.url}/api/checkout/sandbox-complete?orderId=${orderId}`;
  return {
    url: sandboxUrl,
    sessionId: `sandbox_sess_${Date.now()}`,
    provider: "SANDBOX",
  };
}
