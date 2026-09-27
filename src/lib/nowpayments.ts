import crypto from "crypto";
import { siteConfig } from "./config";

export const isNowPaymentsConfigured = Boolean(
  process.env.NOWPAYMENTS_API_KEY && process.env.NOWPAYMENTS_API_KEY.trim() !== ""
);

export const getNowPaymentsApiKey = (): string => {
  return process.env.NOWPAYMENTS_API_KEY?.trim() || "";
};

export const getNowPaymentsIpnSecret = (): string => {
  return process.env.NOWPAYMENTS_IPN_SECRET?.trim() || "";
};

export const getNowPaymentsMode = (): "LIVE" | "SANDBOX" | "UNCONFIGURED" => {
  const key = getNowPaymentsApiKey();
  if (!key) return "UNCONFIGURED";
  if (process.env.NOWPAYMENTS_SANDBOX === "true" || process.env.NEXT_PUBLIC_NOWPAYMENTS_SANDBOX === "true") {
    return "SANDBOX";
  }
  return "LIVE";
};

export const getNowPaymentsBaseUrl = (): string => {
  const mode = getNowPaymentsMode();
  return mode === "SANDBOX"
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";
};

export interface CreateInvoiceOptions {
  priceAmount: number; // in USD or target fiat
  priceCurrency?: string; // default "usd"
  payCurrency?: string; // optional preselected coin, e.g. "usdttrc20"
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateInvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceUrl?: string;
  orderId?: string;
  error?: string;
}

/**
 * Creates a hosted multi-coin crypto payment invoice on NOWPayments.
 * Supports 300+ cryptocurrencies (USDT TRC20, Bitcoin, Ethereum, Solana, BNB, etc.)
 */
export async function createNowPaymentsInvoice(
  opts: CreateInvoiceOptions
): Promise<CreateInvoiceResult> {
  const apiKey = getNowPaymentsApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "NOWPayments API key is not configured in environment variables.",
    };
  }

  const baseUrl = getNowPaymentsBaseUrl();

  const payload: Record<string, any> = {
    price_amount: Number(opts.priceAmount.toFixed(2)),
    price_currency: (opts.priceCurrency || "usd").toLowerCase(),
    order_id: opts.orderId,
    order_description: opts.orderDescription.slice(0, 200),
    ipn_callback_url: opts.ipnCallbackUrl,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  };

  if (opts.payCurrency) {
    payload.pay_currency = opts.payCurrency.toLowerCase();
  }

  try {
    const res = await fetch(`${baseUrl}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.invoice_url) {
      console.error("❌ NOWPayments create invoice error:", data);
      return {
        success: false,
        error: data.message || data.error || "Unable to create NOWPayments crypto invoice.",
      };
    }

    return {
      success: true,
      invoiceId: String(data.id || data.invoice_id),
      invoiceUrl: data.invoice_url,
      orderId: data.order_id,
    };
  } catch (error: any) {
    console.error("❌ NOWPayments network error:", error);
    return {
      success: false,
      error: error.message || "Failed to communicate with NOWPayments API.",
    };
  }
}

/**
 * Recursively sorts keys of an object alphabetically as required by NOWPayments IPN verification
 */
function sortObjectKeys(obj: any): any {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, any>, key: string) => {
      result[key] = sortObjectKeys(obj[key]);
      return result;
    }, {});
}

/**
 * Verifies NOWPayments Instant Payment Notification (IPN) signature (HMAC-SHA512)
 */
export function verifyNowPaymentsIpnSignature(
  rawPayload: any,
  receivedSignature: string | null
): boolean {
  const ipnSecret = getNowPaymentsIpnSecret();

  // If no secret key is set yet, log warning and allow for sandbox testing if explicitly permitted
  if (!ipnSecret) {
    console.warn("⚠️ NOWPAYMENTS_IPN_SECRET is not configured. Webhook signature verification bypassed.");
    return process.env.NODE_ENV !== "production";
  }

  if (!receivedSignature) {
    return false;
  }

  try {
    const sorted = sortObjectKeys(rawPayload);
    const serializedPayload = JSON.stringify(sorted);
    const expectedSignature = crypto
      .createHmac("sha512", ipnSecret)
      .update(serializedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature.toLowerCase(), "utf8"),
      Buffer.from(expectedSignature.toLowerCase(), "utf8")
    );
  } catch (err) {
    console.error("❌ NOWPayments signature check error:", err);
    return false;
  }
}
