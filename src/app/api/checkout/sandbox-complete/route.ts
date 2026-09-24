import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { siteConfig } from "@/lib/config";

export async function GET(req: Request) {
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

  // If already paid, redirect straight to success
  if (order.paymentStatus === "PAID") {
    return NextResponse.redirect(new URL(`/checkout/success?orderNumber=${order.orderNumber}`, siteConfig.url));
  }

  try {
    // 1. Ensure user account exists for customerEmail and issue session cookie
    let user = null;
    if (order.userId) {
      user = await prisma.user.findUnique({ where: { id: order.userId } });
    }
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: order.customerEmail } });
    }
    if (!user) {
      // Auto-create customer account with random initial password
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

    const userId = user.id;

    if (order.userId !== userId) {
      // Link user to order
      await prisma.order.update({
        where: { id: order.id },
        data: { userId },
      });
    }

    // Auto sign in user session cookie so they have instant access
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // 2. Mark order as PAID
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

    // 3. Create digital Entitlements for all books in the order
    for (const item of order.items) {
      // Check if entitlement already exists
      const existing = await prisma.entitlement.findUnique({
        where: {
          userId_bookId: {
            userId: userId!,
            bookId: item.bookId,
          },
        },
      });

      if (!existing) {
        await prisma.entitlement.create({
          data: {
            userId: userId!,
            bookId: item.bookId,
            orderId: order.id,
            status: "ACTIVE",
          },
        });
      }

      // Initialize reading progress at page 1 if not exists
      const existingProgress = await prisma.readingProgress.findUnique({
        where: {
          userId_bookId: {
            userId: userId!,
            bookId: item.bookId,
          },
        },
      });

      if (!existingProgress) {
        const book = await prisma.book.findUnique({
          where: { id: item.bookId },
          select: { pageCount: true },
        });

        await prisma.readingProgress.create({
          data: {
            userId: userId!,
            bookId: item.bookId,
            currentPage: 1,
            totalPages: book?.pageCount || 1,
            progressPercent: 0,
          },
        });
      }
    }

    return NextResponse.redirect(new URL(`/checkout/success?orderNumber=${order.orderNumber}`, siteConfig.url));
  } catch (error) {
    console.error("Sandbox completion error:", error);
    return NextResponse.redirect(new URL("/cart?error=payment_failed", siteConfig.url));
  }
}
