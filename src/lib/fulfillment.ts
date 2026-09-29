import prisma from "./prisma";
import { hashPassword } from "./auth";
import { sendGiftDeliveryEmail, sendOrderConfirmationEmail } from "./email";

export interface FulfillOrderOptions {
  orderId?: string;
  orderNumber?: string;
  reference?: string;
  provider: "PAYSTACK" | "NOWPAYMENTS" | "STRIPE" | "FREE_CLAIM";
  transactionId?: string;
  amountPaid?: number;
  currencyPaid?: string;
}

export async function fulfillOrder(opts: FulfillOrderOptions): Promise<{
  success: boolean;
  order?: any;
  alreadyFulfilled?: boolean;
  error?: string;
}> {
  try {
    const {
      orderId,
      orderNumber,
      reference,
      provider,
      transactionId,
      amountPaid,
      currencyPaid,
    } = opts;

    let order = null;

    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { book: { include: { author: true } } } },
          user: true,
          payment: true,
          entitlements: true,
        },
      });
    }

    if (!order && orderNumber) {
      order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: { include: { book: { include: { author: true } } } },
          user: true,
          payment: true,
          entitlements: true,
        },
      });
    }

    if (!order && reference) {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: reference },
            { stripeSessionId: reference },
            { cryptoPaymentId: reference },
          ],
        },
        include: {
          items: { include: { book: { include: { author: true } } } },
          user: true,
          payment: true,
          entitlements: true,
        },
      });
    }

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Idempotency check: if order is already PAID with payment record and active entitlements, don't resend
    if (order.paymentStatus === "PAID" && order.payment && order.entitlements.length > 0) {
      return { success: true, order, alreadyFulfilled: true };
    }

    // 1. Resolve or create user account for customer
    let userId = order.userId;
    const cleanEmail = order.customerEmail.toLowerCase().trim();

    if (!userId) {
      let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        const randomPass = Math.random().toString(36).slice(-10) + "A1!";
        const passwordHash = await hashPassword(randomPass);
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: cleanEmail.split("@")[0].slice(0, 50),
            passwordHash,
            role: "CUSTOMER",
            isEmailVerified: true,
          },
        });
      }
      userId = user.id;
    }

    // 2. Mark order as PAID
    order = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        userId: userId || undefined,
        stripeSessionId: reference || order.stripeSessionId,
      },
      include: {
        items: { include: { book: { include: { author: true } } } },
        user: true,
        payment: true,
        entitlements: true,
      },
    });

    // 3. Upsert Payment Record
    const finalAmount = typeof amountPaid === "number" ? amountPaid : order.totalAmount;
    const finalCurrency = currencyPaid || order.currency;
    const finalTxnId = transactionId || reference || order.stripeSessionId || `txn_${order.orderNumber}`;

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        status: "SUCCEEDED",
        amount: finalAmount,
        currency: finalCurrency,
        provider,
        transactionId: finalTxnId,
      },
      create: {
        orderId: order.id,
        provider,
        transactionId: finalTxnId,
        amount: finalAmount,
        currency: finalCurrency,
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
          sendGiftDeliveryEmail({
            recipientEmail: order.recipientEmail,
            recipientName: order.recipientName || order.recipientEmail.split("@")[0],
            senderName: order.user?.name || order.customerEmail.split("@")[0],
            senderEmail: order.customerEmail,
            giftMessage: order.giftMessage || undefined,
            bookTitle: item.book?.title || item.bookTitle || "Your Gift Book",
            bookAuthor: item.book?.author?.name || undefined,
            bookCoverUrl: item.book?.coverImage || undefined,
          }).catch((err) => console.error("Fulfillment gift email error:", err));
        }
      }

      // Dispatch Order Confirmation & Receipt Email to the customer
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
        paymentProvider: provider,
        isGift,
        recipientName: order.recipientName || undefined,
        recipientEmail: order.recipientEmail || undefined,
        giftMessage: order.giftMessage || undefined,
      }).catch((err) => console.error("Fulfillment order confirmation email error:", err));
    }

    console.log(`✅ [ORDER FULFILLED] Order ${order.orderNumber} fulfilled via ${provider} and email dispatched!`);
    return { success: true, order, alreadyFulfilled: false };
  } catch (error: any) {
    console.error("Order fulfillment error:", error);
    return { success: false, error: error?.message || "Fulfillment failed" };
  }
}
