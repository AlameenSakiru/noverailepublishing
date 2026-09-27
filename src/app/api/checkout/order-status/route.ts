import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getResolvedNowPaymentsCredentials } from "@/lib/nowpayments";
import { getResolvedPaystackCredentials, verifyPaystackTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    let order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            book: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 1. Check 12-Minute Expiration Window
    const EXPIRATION_WINDOW_MS = 12 * 60 * 1000; // 12 minutes
    const orderCreatedAt = new Date(order.createdAt).getTime();
    const orderAgeMs = Date.now() - orderCreatedAt;
    const isExpired = orderAgeMs > EXPIRATION_WINDOW_MS;
    const remainingSeconds = Math.max(0, Math.floor((EXPIRATION_WINDOW_MS - orderAgeMs) / 1000));

    if (order.paymentStatus === "PENDING" && isExpired) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "CANCELLED" },
        include: {
          items: { include: { book: true } },
          payment: true,
        },
      });
    }

    // 2. If order is still PENDING and it was Paystack, attempt instant verification check
    if (order.paymentStatus === "PENDING" && order.stripeSessionId) {
      const paystackCreds = await getResolvedPaystackCredentials();
      if (paystackCreds.isConfigured) {
        const verifyRes = await verifyPaystackTransaction(order.stripeSessionId);
        if (verifyRes.success) {
          order = await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: "PAID" },
            include: {
              items: { include: { book: true } },
              payment: true,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        currency: order.currency,
        isGift: order.isGift,
        recipientEmail: order.recipientEmail,
        recipientName: order.recipientName,
        customerEmail: order.customerEmail,
        giftMessage: order.giftMessage,
        cryptoInvoiceUrl: order.cryptoInvoiceUrl,
        cryptoCurrency: order.cryptoCurrency,
        cryptoAmount: order.cryptoAmount,
        createdAt: order.createdAt,
        expiresInSeconds: remainingSeconds,
        isExpired,
        items: order.items.map((i) => ({
          id: i.id,
          bookId: i.bookId,
          bookTitle: i.bookTitle,
          price: i.price,
          book: i.book ? {
            id: i.book.id,
            title: i.book.title,
            slug: i.book.slug,
            coverImage: i.book.coverImage,
          } : null,
        })),
      },
    });
  } catch (error: any) {
    console.error("Order status check error:", error);
    return NextResponse.json({ error: "Failed to retrieve order status" }, { status: 500 });
  }
}
