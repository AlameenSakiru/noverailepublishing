import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Paystack secret key is not configured" }, { status: 400 });
  }

  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing x-paystack-signature header" }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Malformed payload body" }, { status: 400 });
  }

  // Verify HMAC SHA512 signature
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  if (hash !== signature) {
    console.error("❌ Paystack webhook signature mismatch!");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let eventData: any;
  try {
    eventData = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = eventData.event;
  const data = eventData.data;

  if (event === "charge.success") {
    const reference = data.reference;
    const orderId = data.metadata?.orderId;
    const orderNumber = data.metadata?.orderNumber;
    const customerEmail = (data.customer?.email || data.metadata?.customerEmail)?.toLowerCase().trim();

    try {
      const { fulfillOrder } = await import("@/lib/fulfillment");
      const fulfillResult = await fulfillOrder({
        orderId,
        orderNumber,
        reference,
        provider: "PAYSTACK",
        transactionId: reference,
        amountPaid: data.amount ? data.amount / 100 : undefined,
        currencyPaid: data.currency,
      });

      if (!fulfillResult.success) {
        console.error("Paystack webhook fulfillment failed:", fulfillResult.error);
      }
    } catch (dbErr) {
      console.error("Paystack webhook DB processing error:", dbErr);
    }
  }

  return NextResponse.json({ received: true });
}

