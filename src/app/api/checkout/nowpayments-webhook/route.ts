import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { verifyNowPaymentsIpnSignature } from "@/lib/nowpayments";
import { sendGiftDeliveryEmail, sendOrderConfirmationEmail } from "@/lib/email";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBodyText = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const signature = req.headers.get("x-nowpayments-sig");

    // Verify cryptographic IPN signature from NOWPayments
    const isValidSignature = verifyNowPaymentsIpnSignature(body, signature);
    if (!isValidSignature && process.env.NODE_ENV === "production") {
      console.error("❌ Invalid NOWPayments webhook signature received.");
      return NextResponse.json({ error: "Invalid IPN signature." }, { status: 401 });
    }

    const {
      payment_id,
      invoice_id,
      payment_status,
      pay_address,
      price_amount,
      price_currency,
      pay_amount,
      actually_paid,
      pay_currency,
      order_id,
    } = body || {};

    if (!order_id && !payment_id) {
      return NextResponse.json({ error: "Missing order_id or payment_id." }, { status: 400 });
    }

    // Locate the matching order in database
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: String(order_id).trim() },
          { cryptoPaymentId: String(payment_id || invoice_id).trim() },
        ],
      },
      include: {
        items: {
          include: {
            book: {
              include: { author: true },
            },
          },
        },
        user: true,
      },
    });

    if (!order) {
      console.warn(`⚠️ NOWPayments IPN: Order not found for order_id: ${order_id}, payment_id: ${payment_id}`);
      return NextResponse.json({ received: true, warning: "Order not found." });
    }

    console.log(`🪙 NOWPayments IPN Update: Order ${order.orderNumber} -> Status: ${payment_status}`);

    // Check payment status from NOWPayments
    const isCompleted = payment_status === "finished" || payment_status === "confirmed";
    const isFailed = payment_status === "failed" || payment_status === "expired";

    if (isCompleted) {
      // If already processed as PAID, return early to prevent duplicates
      if (order.paymentStatus === "PAID") {
        return NextResponse.json({ received: true, message: "Order already fulfilled." });
      }

      const cryptoCurrencyName = String(pay_currency || "USDT").toUpperCase();
      const cryptoAmountNum = Number(actually_paid || pay_amount || 0);
      const paymentTxId = String(payment_id || invoice_id || `np_${Date.now()}`);

      // 1. Update Order record
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          cryptoPaymentId: String(payment_id || invoice_id || ""),
          cryptoCurrency: cryptoCurrencyName,
          cryptoAmount: cryptoAmountNum,
        },
      });

      // 2. Upsert Payment transaction record
      await prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          provider: "NOWPAYMENTS",
          transactionId: paymentTxId,
          status: "SUCCEEDED",
          amount: Number(price_amount || order.totalAmount),
          currency: String(price_currency || order.currency || "USD").toUpperCase(),
          cryptoCurrency: cryptoCurrencyName,
          cryptoAmount: cryptoAmountNum,
          cryptoPaymentId: String(payment_id || ""),
        },
        create: {
          orderId: order.id,
          provider: "NOWPAYMENTS",
          transactionId: paymentTxId,
          status: "SUCCEEDED",
          amount: Number(price_amount || order.totalAmount),
          currency: String(price_currency || order.currency || "USD").toUpperCase(),
          cryptoCurrency: cryptoCurrencyName,
          cryptoAmount: cryptoAmountNum,
          cryptoPaymentId: String(payment_id || ""),
        },
      });

      // 3. Determine entitlement recipient (Gift recipient or Customer)
      let targetUserId = order.userId;

      if (order.isGift && order.recipientEmail) {
        let recipientUser = await prisma.user.findUnique({
          where: { email: order.recipientEmail.toLowerCase().trim() },
        });

        if (!recipientUser) {
          const fastHash = await hashPassword(crypto.randomBytes(16).toString("hex") + "N1!");
          recipientUser = await prisma.user.create({
            data: {
              email: order.recipientEmail.toLowerCase().trim(),
              name: order.recipientName || order.recipientEmail.split("@")[0],
              passwordHash: fastHash,
              role: "CUSTOMER",
              isEmailVerified: true,
            },
          });
        }
        targetUserId = recipientUser.id;
      } else if (!targetUserId) {
        let buyerUser = await prisma.user.findUnique({
          where: { email: order.customerEmail.toLowerCase().trim() },
        });

        if (!buyerUser) {
          const fastHash = await hashPassword(crypto.randomBytes(16).toString("hex") + "N1!");
          buyerUser = await prisma.user.create({
            data: {
              email: order.customerEmail.toLowerCase().trim(),
              name: order.customerEmail.split("@")[0].slice(0, 50),
              passwordHash: fastHash,
              role: "CUSTOMER",
              isEmailVerified: true,
            },
          });
        }
        targetUserId = buyerUser.id;
      }

      // 4. Provision digital reading entitlements for all purchased titles
      if (targetUserId) {
        await Promise.all(
          order.items.map(async (item) => {
            await prisma.entitlement.upsert({
              where: {
                userId_bookId: { userId: targetUserId!, bookId: item.bookId },
              },
              update: {
                status: "ACTIVE",
                orderId: order.id,
                isGift: order.isGift,
                giftSenderName: order.isGift ? (order.user?.name || order.customerEmail.split("@")[0]) : null,
                giftSenderEmail: order.isGift ? order.customerEmail : null,
                giftMessage: order.isGift ? order.giftMessage : null,
              },
              create: {
                userId: targetUserId!,
                bookId: item.bookId,
                orderId: order.id,
                status: "ACTIVE",
                isGift: order.isGift,
                giftSenderName: order.isGift ? (order.user?.name || order.customerEmail.split("@")[0]) : null,
                giftSenderEmail: order.isGift ? order.customerEmail : null,
                giftMessage: order.isGift ? order.giftMessage : null,
              },
            }).catch((err) => console.error("Entitlement creation error:", err));

            const bookPageCount = item.book?.pageCount || 1;
            await prisma.readingProgress.upsert({
              where: {
                userId_bookId: { userId: targetUserId!, bookId: item.bookId },
              },
              update: {},
              create: {
                userId: targetUserId!,
                bookId: item.bookId,
                currentPage: 1,
                totalPages: bookPageCount > 0 ? bookPageCount : 1,
                progressPercent: 0,
              },
            }).catch((err) => console.error("Reading progress creation error:", err));

            // If it is a gift purchase, dispatch the gift delivery announcement email
            if (order.isGift && order.recipientEmail) {
              sendGiftDeliveryEmail({
                recipientEmail: order.recipientEmail,
                recipientName: order.recipientName || order.recipientEmail.split("@")[0],
                senderName: order.user?.name || order.customerEmail.split("@")[0],
                senderEmail: order.customerEmail,
                giftMessage: order.giftMessage || undefined,
                bookTitle: item.bookTitle || item.book?.title || "Digital Book",
                bookAuthor: item.book?.author?.name || undefined,
                bookCoverUrl: item.book?.coverImage || undefined,
              }).catch((err) => console.error("Gift email delivery error:", err));
            }
          })
        );

        // Dispatch Order Confirmation Email to the customer
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
          paymentProvider: "NOWPAYMENTS",
          cryptoCurrency: cryptoCurrencyName,
          cryptoAmount: cryptoAmountNum,
          isGift: order.isGift,
          recipientName: order.recipientName || undefined,
          recipientEmail: order.recipientEmail || undefined,
          giftMessage: order.giftMessage || undefined,
        }).catch((err) => console.error("NOWPayments order confirmation email error:", err));
      }

      console.log(`✅ NOWPayments order ${order.orderNumber} successfully fulfilled & entitlements granted.`);
    } else if (isFailed) {
      if (order.paymentStatus === "PENDING") {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "CANCELLED" },
        });
        console.log(`⏱️ NOWPayments order ${order.orderNumber} automatically marked as CANCELLED (${payment_status}).`);
      }
    }

    return NextResponse.json({ received: true, status: payment_status });
  } catch (error: any) {
    console.error("❌ NOWPayments webhook handler error:", error);
    return NextResponse.json({ error: "Internal webhook error." }, { status: 500 });
  }
}
