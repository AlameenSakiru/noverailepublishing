import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Missing webhook secret or signature" }, { status: 400 });
  }

  let event: any;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId || session.client_reference_id;

    if (orderId) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (order && order.paymentStatus !== "PAID") {
          // Update order
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "PAID",
              stripePaymentIntentId: session.payment_intent as string,
              payment: {
                create: {
                  provider: "STRIPE",
                  transactionId: session.payment_intent as string || session.id,
                  status: "SUCCEEDED",
                  amount: order.totalAmount,
                  currency: order.currency,
                  receiptUrl: session.customer_details?.email ? `https://pay.stripe.com/receipts/${session.id}` : null,
                },
              },
            },
          });

          // Create entitlements (Gift vs Self Purchase)
          const isGift = Boolean(order.isGift && order.recipientEmail);
          let entitlementUserId = order.userId;

          if (isGift && order.recipientEmail) {
            const recipientClean = order.recipientEmail.toLowerCase().trim();
            let recipientUser = await prisma.user.findUnique({ where: { email: recipientClean } });
            if (!recipientUser) {
              const { hashPassword } = await import("@/lib/auth");
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
                  userId_bookId: {
                    userId: entitlementUserId,
                    bookId: item.bookId,
                  },
                },
                update: {
                  status: "ACTIVE",
                  orderId: order.id,
                  isGift,
                  giftSenderName: isGift ? order.customerEmail.split("@")[0] : null,
                  giftSenderEmail: isGift ? order.customerEmail : null,
                  giftMessage: isGift ? order.giftMessage : null,
                },
                create: {
                  userId: entitlementUserId,
                  bookId: item.bookId,
                  orderId: order.id,
                  status: "ACTIVE",
                  isGift,
                  giftSenderName: isGift ? order.customerEmail.split("@")[0] : null,
                  giftSenderEmail: isGift ? order.customerEmail : null,
                  giftMessage: isGift ? order.giftMessage : null,
                },
              });

              // Ensure initial reading progress
              await prisma.readingProgress.upsert({
                where: {
                  userId_bookId: {
                    userId: entitlementUserId,
                    bookId: item.bookId,
                  },
                },
                update: {},
                create: {
                  userId: entitlementUserId,
                  bookId: item.bookId,
                  currentPage: 1,
                  totalPages: 1,
                  progressPercent: 0,
                },
              });

              // Dispatch gift delivery email
              if (isGift && order.recipientEmail) {
                const { sendGiftDeliveryEmail } = await import("@/lib/email");
                const book = await prisma.book.findUnique({
                  where: { id: item.bookId },
                  include: { author: true },
                });
                sendGiftDeliveryEmail({
                  recipientEmail: order.recipientEmail,
                  recipientName: order.recipientName || order.recipientEmail.split("@")[0],
                  senderName: order.customerEmail.split("@")[0],
                  senderEmail: order.customerEmail,
                  giftMessage: order.giftMessage || undefined,
                  bookTitle: book?.title || item.bookTitle || "Your Gift Publication",
                  bookAuthor: book?.author?.name || undefined,
                  bookCoverUrl: book?.coverImage || undefined,
                }).catch((err) => console.error("Stripe webhook gift email error:", err));
              }
            }
          }
        }
      } catch (e) {
        console.error("Error processing checkout.session.completed:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
