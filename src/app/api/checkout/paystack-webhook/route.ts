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
          include: { items: { include: { book: { include: { author: true } } } }, user: true },
        });
      }
      if (!order && orderNumber) {
        order = await prisma.order.findUnique({
          where: { orderNumber },
          include: { items: { include: { book: { include: { author: true } } } }, user: true },
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
          include: { items: { include: { book: { include: { author: true } } } }, user: true },
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

        // 4. Grant Digital Entitlements (Gift vs Self Purchase)
        const isGift = Boolean(order.isGift && order.recipientEmail);
        let entitlementUserId = userId;

        if (isGift && order.recipientEmail) {
          const recipientClean = order.recipientEmail.toLowerCase().trim();
          let recipientUser = await prisma.user.findUnique({ where: { email: recipientClean } });
          if (!recipientUser) {
            const randomPass = Math.random().toString(36).slice(-10) + "A1!";
            const passwordHash = await hashPassword(randomPass);
            recipientUser = await prisma.user.create({
              data: {
                email: recipientClean,
                name: order.recipientName || recipientClean.split("@")[0],
                passwordHash,
                role: "CUSTOMER",
                isEmailVerified: true,
              },
            });
          }
          entitlementUserId = recipientUser.id;
        }

        if (entitlementUserId) {
          for (const item of order.items) {
            await prisma.entitlement.upsert({
              where: {
                userId_bookId: { userId: entitlementUserId, bookId: item.bookId },
              },
              update: {
                status: "ACTIVE",
                orderId: order.id,
                isGift,
                giftSenderName: isGift ? order.user?.name || order.customerEmail : null,
                giftSenderEmail: isGift ? order.customerEmail : null,
                giftMessage: isGift ? order.giftMessage : null,
              },
              create: {
                userId: entitlementUserId,
                bookId: item.bookId,
                orderId: order.id,
                status: "ACTIVE",
                isGift,
                giftSenderName: isGift ? order.user?.name || order.customerEmail : null,
                giftSenderEmail: isGift ? order.customerEmail : null,
                giftMessage: isGift ? order.giftMessage : null,
              },
            }).catch(() => {});

            await prisma.readingProgress.upsert({
              where: {
                userId_bookId: { userId: entitlementUserId, bookId: item.bookId },
              },
              update: {},
              create: {
                userId: entitlementUserId,
                bookId: item.bookId,
                currentPage: 1,
                totalPages: item.book?.pageCount > 0 ? item.book.pageCount : 1,
                progressPercent: 0,
              },
            }).catch(() => {});

            // Dispatch gift delivery email to recipient
            if (isGift && order.recipientEmail) {
              const { sendGiftDeliveryEmail } = await import("@/lib/email");
              sendGiftDeliveryEmail({
                recipientEmail: order.recipientEmail,
                recipientName: order.recipientName || order.recipientEmail.split("@")[0],
                senderName: order.user?.name || order.customerEmail.split("@")[0],
                senderEmail: order.customerEmail,
                giftMessage: order.giftMessage || undefined,
                bookTitle: item.book?.title || item.bookTitle || "Your Gift Book",
                bookAuthor: item.book?.author?.name || undefined,
                bookCoverUrl: item.book?.coverImage || undefined,
              }).catch((err) => console.error("Paystack webhook gift email error:", err));
            }
          }

          // Dispatch Order Confirmation Email to the customer
          const { sendOrderConfirmationEmail } = await import("@/lib/email");
          sendOrderConfirmationEmail({
            customerEmail: order.customerEmail,
            customerName: order.user?.name || order.customerEmail.split("@")[0],
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            items: order.items.map((i) => ({
              title: i.book?.title || i.bookTitle || "Digital Book",
              author: i.book?.author?.name || undefined,
              price: i.price,
              coverImage: i.book?.coverImage || undefined,
              slug: i.book?.slug || undefined,
            })),
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            totalAmount: order.totalAmount,
            currency: order.currency,
            paymentProvider: "PAYSTACK",
            isGift,
            recipientName: order.recipientName || undefined,
            recipientEmail: order.recipientEmail || undefined,
            giftMessage: order.giftMessage || undefined,
          }).catch((err) => console.error("Paystack order confirmation email error:", err));
        }

        console.log(`✅ [PAYSTACK WEBHOOK] Order ${order.orderNumber} successfully processed and marked as PAID!`);
      }
    } catch (dbErr) {
      console.error("Paystack webhook DB processing error:", dbErr);
    }
  }

  return NextResponse.json({ received: true });
}

