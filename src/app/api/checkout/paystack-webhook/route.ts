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
      // Find order by orderId, orderNumber, or reference
      let order = null;
      if (orderId) {
        order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: { include: { book: true } }, user: true },
        });
      }
      if (!order && orderNumber) {
        order = await prisma.order.findUnique({
          where: { orderNumber },
          include: { items: { include: { book: true } }, user: true },
        });
      }
      if (!order && reference) {
        order = await prisma.order.findFirst({
          where: {
            OR: [
              { orderNumber: reference },
              { stripeSessionId: reference },
            ],
          },
          include: { items: { include: { book: true } }, user: true },
        });
      }

      if (order && order.paymentStatus !== "PAID") {
        // 1. Resolve or create user if needed
        let userId = order.userId;
        if (!userId && (customerEmail || order.customerEmail)) {
          const targetEmail = customerEmail || order.customerEmail;
          let user = await prisma.user.findUnique({ where: { email: targetEmail } });
          if (!user) {
            const randomPass = Math.random().toString(36).slice(-10) + "A1!";
            const passwordHash = await hashPassword(randomPass);
            user = await prisma.user.create({
              data: {
                email: targetEmail,
                name: targetEmail.split("@")[0].slice(0, 50),
                passwordHash,
                role: "CUSTOMER",
                isEmailVerified: true,
              },
            });
          }
          userId = user.id;
        }

        // 2. Update Order Status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            userId: userId || undefined,
            stripeSessionId: reference,
          },
        });

        // 3. Record Payment Entry with Upsert
        await prisma.payment.upsert({
          where: { orderId: order.id },
          update: {
            status: "SUCCEEDED",
            amount: data.amount ? data.amount / 100 : order.totalAmount,
            currency: data.currency || order.currency,
          },
          create: {
            orderId: order.id,
            provider: "PAYSTACK",
            transactionId: reference,
            amount: data.amount ? data.amount / 100 : order.totalAmount,
            currency: data.currency || order.currency,
            status: "SUCCEEDED",
          },
        });

        // 4. Grant Digital Entitlements
        if (userId) {
          for (const item of order.items) {
            await prisma.entitlement.upsert({
              where: {
                userId_bookId: { userId, bookId: item.bookId },
              },
              update: { status: "ACTIVE", orderId: order.id },
              create: {
                userId,
                bookId: item.bookId,
                orderId: order.id,
                status: "ACTIVE",
              },
            }).catch(() => {});

            await prisma.readingProgress.upsert({
              where: {
                userId_bookId: { userId, bookId: item.bookId },
              },
              update: {},
              create: {
                userId,
                bookId: item.bookId,
                currentPage: 1,
                totalPages: item.book?.pageCount > 0 ? item.book.pageCount : 1,
                progressPercent: 0,
              },
            }).catch(() => {});
          }
        }

        console.log(`✅ [PAYSTACK WEBHOOK] Order ${order.orderNumber} successfully processed and marked as PAID!`);
      }
    } catch (dbErr) {
      console.error("Paystack webhook DB processing error:", dbErr);
    }
  }

  return NextResponse.json({ received: true });
}

