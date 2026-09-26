import { siteConfig } from "./config";

export const isPaystackConfigured = Boolean(
  process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY.trim() !== ""
);

export const getPaystackPublicKey = (): string => {
  return (
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() ||
    process.env.PAYSTACK_PUBLIC_KEY?.trim() ||
    ""
  );
};

export const getPaystackMode = (): "LIVE" | "TEST" | "UNCONFIGURED" => {
  const pub = getPaystackPublicKey();
  const sec = process.env.PAYSTACK_SECRET_KEY?.trim() || "";
  if (!sec && !pub) return "UNCONFIGURED";
  if (pub.startsWith("pk_live_") || sec.startsWith("sk_live_")) return "LIVE";
  return "TEST";
};

export interface InitializePaystackOptions {
  email: string;
  amount: number; // in standard currency units (e.g., USD or NGN)
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
  currency?: string;
  channels?: string[];
}

export async function initializePaystackTransaction(opts: InitializePaystackOptions): Promise<{
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  error?: string;
}> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    return {
      success: false,
      error: "Paystack secret key is not configured in .env (PAYSTACK_SECRET_KEY)",
    };
  }

  try {
    // Paystack expects amount in lowest denomination (e.g., Kobo for NGN, Cents for USD)
    const amountInSubunits = Math.round(opts.amount * 100);
    const currency = (opts.currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "USD").toUpperCase();

    const payload: Record<string, any> = {
      email: opts.email,
      amount: amountInSubunits,
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      currency,
      channels: opts.channels || [
        "card",
        "bank",
        "ussd",
        "qr",
        "mobile_money",
        "bank_transfer",
        "apple_pay",
        "eft",
      ],
      metadata: {
        ...opts.metadata,
        custom_fields: [
          {
            display_name: "Platform",
            variable_name: "platform",
            value: siteConfig.name,
          },
          {
            display_name: "Order Number",
            variable_name: "order_number",
            value: opts.reference,
          },
        ],
      },
    };

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      console.error("❌ Paystack initialize error:", data);
      return {
        success: false,
        error: data.message || "Failed to initialize Paystack checkout session.",
      };
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (err: any) {
    console.error("❌ Paystack network/request exception:", err);
    return {
      success: false,
      error: err?.message || "Unable to establish connection to Paystack payment servers.",
    };
  }
}

export async function verifyPaystackTransaction(reference: string): Promise<{
  success: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  channel?: string;
  paidAt?: string;
  metadata?: any;
  error?: string;
}> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    return { success: false, error: "Paystack secret key is not configured." };
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference.trim())}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok || !data.status) {
      return {
        success: false,
        error: data.message || "Failed to verify transaction with Paystack.",
      };
    }

    const tx = data.data;
    const isPaid = tx.status === "success";

    return {
      success: isPaid,
      status: tx.status,
      amount: tx.amount ? tx.amount / 100 : 0,
      currency: tx.currency,
      customerEmail: tx.customer?.email,
      channel: tx.channel,
      paidAt: tx.paid_at,
      metadata: tx.metadata,
    };
  } catch (err: any) {
    console.error("Paystack verification error:", err);
    return {
      success: false,
      error: err?.message || "Verification request failed.",
    };
  }
}

export async function testPaystackConnection(): Promise<{
  success: boolean;
  mode?: "LIVE" | "TEST";
  message?: string;
  error?: string;
}> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    return {
      success: false,
      error: "PAYSTACK_SECRET_KEY is empty or missing in environment variables.",
    };
  }

  try {
    const res = await fetch("https://api.paystack.co/transaction/totals", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      return {
        success: false,
        error: data.message || "Invalid Paystack secret key credentials.",
      };
    }

    const mode = secretKey.startsWith("sk_live_") ? "LIVE" : "TEST";

    return {
      success: true,
      mode,
      message: `Paystack API connected successfully in ${mode} mode!`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to connect to Paystack API.",
    };
  }
}

