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

          // Create entitlements if userId is linked
          if (order.userId) {
            for (const item of order.items) {
              await prisma.entitlement.upsert({
                where: {
                  userId_bookId: {
                    userId: order.userId,
                    bookId: item.bookId,
                  },
                },
                update: { status: "ACTIVE" },
                create: {
                  userId: order.userId,
                  bookId: item.bookId,
                  orderId: order.id,
                  status: "ACTIVE",
                },
              });

              // Ensure initial reading progress
              await prisma.readingProgress.upsert({
                where: {
                  userId_bookId: {
                    userId: order.userId,
                    bookId: item.bookId,
                  },
                },
                update: {},
                create: {
                  userId: order.userId,
                  bookId: item.bookId,
                  currentPage: 1,
                  totalPages: 1,
                  progressPercent: 0,
                },
              });
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
