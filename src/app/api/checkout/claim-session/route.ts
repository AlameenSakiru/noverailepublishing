import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, setSessionCookie, hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";
import { isPaystackConfigured, verifyPaystackTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!checkRateLimit(`claim_sess_${ip}`, 15, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many claim attempts. Please sign in directly." }, { status: 429 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { orderNumber, sessionId, reference } = body || {};

    if (!orderNumber || typeof orderNumber !== "string") {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    let order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim() },
      include: {
        user: true,
        items: {
          include: {
            book: {
              include: {
                author: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // =========================================================================
    // 1. IF ORDER IS STILL PENDING: ATTEMPT INSTANT PAYSTACK VERIFICATION
    // =========================================================================
    const paystackRef = reference || order.stripeSessionId || order.orderNumber;
    if (order.paymentStatus === "PENDING" && isPaystackConfigured && paystackRef) {
      const verifyRes = await verifyPaystackTransaction(paystackRef);
      if (verifyRes.success) {
        const { fulfillOrder } = await import("@/lib/fulfillment");
        await fulfillOrder({
          orderId: order.id,
          provider: "PAYSTACK",
          transactionId: paystackRef,
          amountPaid: verifyRes.amount,
          currencyPaid: verifyRes.currency,
        });
        order = (await prisma.order.findUnique({
          where: { id: order.id },
          include: {
            user: true,
            items: {
              include: {
                book: {
                  include: {
                    author: true,
                  },
                },
              },
            },
          },
        })) || order;
      }
    }

    // Ensure order is fully fulfilled (entitlements granted & confirmation email sent)
    if (order.paymentStatus === "PAID") {
      const { fulfillOrder } = await import("@/lib/fulfillment");
      await fulfillOrder({
        orderId: order.id,
        provider: "PAYSTACK",
        transactionId: paystackRef,
      });
      order = (await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          user: true,
          items: {
            include: {
              book: {
                include: {
                  author: true,
                },
              },
            },
          },
        },
      })) || order;
    }

    // Check if payment is still not confirmed
    if (order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Payment is still processing or has not been confirmed yet. Please refresh shortly." },
        { status: 402 }
      );
    }

    // =========================================================================
    // 2. CHECK CURRENT USER SESSION & PREVENT PRIVILEGE ESCALATION
    // =========================================================================
    const currentUser = await getCurrentUser();
    if (currentUser && (currentUser.userId === order.userId || currentUser.email === order.customerEmail)) {
      return NextResponse.json({ success: true, user: currentUser });
    }

    // Critical Security Guard: NEVER allow claiming an order tied to an ADMIN or EDITOR role!
    if (order.user && (order.user.role === "ADMIN" || order.user.role === "EDITOR")) {
      return NextResponse.json(
        { error: "Staff orders require direct credential sign-in and cannot be claimed via order tokens." },
        { status: 403 }
      );
    }

    // Resolve user account for this order
    let user = order.user;
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: order.customerEmail },
      });
    }

    if (!user) {
      const randomPass = Math.random().toString(36).slice(-10) + "A1!";
      const passwordHash = await hashPassword(randomPass);
      user = await prisma.user.create({
        data: {
          email: order.customerEmail,
          name: order.customerEmail.split("@")[0],
          passwordHash,
          role: "CUSTOMER",
          isEmailVerified: true,
        },
      });
    }

    if (order.userId !== user.id) {
      await prisma.order.update({
        where: { id: order.id },
        data: { userId: user.id },
      });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    await setSessionCookie(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      response
    );

    return response;
  } catch (error) {
    console.error("Error claiming order session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

