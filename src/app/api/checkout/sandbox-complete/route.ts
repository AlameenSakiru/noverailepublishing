import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { siteConfig } from "@/lib/config";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Sandbox complete endpoint
 * Strictly disabled in production or whenever live Stripe billing is configured.
 */
export async function GET(req: Request) {
  // If Stripe is configured or in production without test flag, block this endpoint
  if (isStripeConfigured || (process.env.NODE_ENV === "production" && process.env.ALLOW_SANDBOX_CHECKOUT !== "true")) {
    return NextResponse.redirect(new URL("/cart?error=sandbox_disabled", siteConfig.url));
  }

  const currentUser = await getCurrentUser();
  // Require authentication to access sandbox completion
  if (!currentUser) {
    return NextResponse.redirect(new URL("/login?error=auth_required", siteConfig.url));
  }

  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.redirect(new URL("/cart?error=missing_order", siteConfig.url));
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.redirect(new URL("/cart?error=order_not_found", siteConfig.url));
  }

  // Verify ownership: order must belong to the current authenticated user or staff
  const isStaff = currentUser.role === "ADMIN" || currentUser.role === "EDITOR";
  if (order.userId !== currentUser.userId && order.customerEmail !== currentUser.email && !isStaff) {
    return NextResponse.redirect(new URL("/cart?error=unauthorized_order", siteConfig.url));
  }

  // If already paid, redirect straight to success
  if (order.paymentStatus === "PAID") {
    return NextResponse.redirect(new URL(`/checkout/success?orderNumber=${order.orderNumber}`, siteConfig.url));
  }

  try {
    const userId = currentUser.userId;

    // Mark order as PAID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        payment: {
          create: {
            provider: "SANDBOX",
            transactionId: `txn_sandbox_${Date.now()}`,
            status: "SUCCEEDED",
            amount: order.totalAmount,
            currency: order.currency,
          },
        },
      },
    });

    // Create digital Entitlements for all books in the order
    for (const item of order.items) {
      await prisma.entitlement.upsert({
        where: {
          userId_bookId: {
            userId,
            bookId: item.bookId,
          },
        },
        update: { status: "ACTIVE", orderId: order.id },
        create: {
          userId,
          bookId: item.bookId,
          orderId: order.id,
          status: "ACTIVE",
        },
      });

      const book = await prisma.book.findUnique({
        where: { id: item.bookId },
        select: { pageCount: true },
      });

      await prisma.readingProgress.upsert({
        where: {
          userId_bookId: {
            userId,
            bookId: item.bookId,
          },
        },
        update: {},
        create: {
          userId,
          bookId: item.bookId,
          currentPage: 1,
          totalPages: book?.pageCount || 1,
          progressPercent: 0,
        },
      });
    }

    return NextResponse.redirect(new URL(`/checkout/success?orderNumber=${order.orderNumber}`, siteConfig.url));
  } catch (error) {
    console.error("Sandbox completion error:", error);
    return NextResponse.redirect(new URL("/cart?error=payment_failed", siteConfig.url));
  }
}
