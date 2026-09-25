import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword, setSessionCookie } from "@/lib/auth";
import { isStripeConfigured, createCheckoutSession, CheckoutItem } from "@/lib/stripe";
import { siteConfig } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const { items, couponCode, email: guestEmail } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    const customerEmail = currentUser?.email || guestEmail;

    if (!customerEmail) {
      return NextResponse.json({ error: "Customer email is required for digital delivery." }, { status: 400 });
    }

    // Fetch verified book records from DB to ensure prices cannot be tampered with
    const bookIds = items.map((i: any) => i.bookId);
    const dbBooks = await prisma.book.findMany({
      where: { id: { in: bookIds } },
    });

    if (dbBooks.length !== items.length) {
      return NextResponse.json({ error: "One or more books in cart are no longer available." }, { status: 400 });
    }

    // Calculate subtotal from DB verified prices
    let subtotal = 0;
    const checkoutItems: CheckoutItem[] = [];

    for (const book of dbBooks) {
      const activePrice = book.salePrice != null && book.salePrice > 0 ? book.salePrice : book.price;
      subtotal += activePrice;
      checkoutItems.push({
        bookId: book.id,
        title: book.title,
        price: activePrice,
        quantity: 1,
      });
    }

    // Apply coupon if valid
    let discountAmount = 0;
    let validCouponId: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (coupon && coupon.isActive) {
        validCouponId = coupon.id;
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = (subtotal * coupon.discountValue) / 100;
        } else {
          discountAmount = Math.min(coupon.discountValue, subtotal);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const cleanEmail = customerEmail.toLowerCase().trim();

    // Direct / Sandbox Instant Checkout (when Stripe key is not set)
    if (!isStripeConfigured) {
      let user = currentUser ? await prisma.user.findUnique({ where: { id: currentUser.userId } }) : null;
      if (!user) {
        user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      }
      if (!user) {
        const fastHash = await hashPassword(Math.random().toString(36).slice(-8) + "N1!");
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: cleanEmail.split("@")[0],
            passwordHash: fastHash,
            role: "CUSTOMER",
            isEmailVerified: true,
          },
        });
      }

      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const orderNumber = `NOV-2026-${randomSuffix}`;

      // Create Order + Payment in a single atomic database query
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: user.id,
          customerEmail: cleanEmail,
          totalAmount,
          subtotal,
          discountAmount,
          currency: siteConfig.defaultCurrency,
          paymentStatus: "PAID",
          payment: {
            create: {
              provider: "SANDBOX",
              transactionId: `txn_instant_${Date.now()}`,
              status: "SUCCEEDED",
              amount: totalAmount,
              currency: siteConfig.defaultCurrency,
            },
          },
          items: {
            create: checkoutItems.map((item) => ({
              bookId: item.bookId,
              price: item.price,
              bookTitle: item.title,
            })),
          },
        },
      });

      // Concurrently create digital entitlements and reading progress records
      await Promise.all(
        dbBooks.map(async (book) => {
          await prisma.entitlement.upsert({
            where: {
              userId_bookId: { userId: user!.id, bookId: book.id },
            },
            update: { status: "ACTIVE", orderId: order.id },
            create: { userId: user!.id, bookId: book.id, orderId: order.id, status: "ACTIVE" },
          }).catch(() => {});

          await prisma.readingProgress.upsert({
            where: {
              userId_bookId: { userId: user!.id, bookId: book.id },
            },
            update: {},
            create: {
              userId: user!.id,
              bookId: book.id,
              currentPage: 1,
              totalPages: book.pageCount > 0 ? book.pageCount : 1,
              progressPercent: 0,
            },
          }).catch(() => {});
        })
      );

      const response = NextResponse.json({
        checkoutUrl: `/checkout/success?orderNumber=${order.orderNumber}`,
        provider: "DIRECT",
        orderNumber: order.orderNumber,
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
    }

    // Stripe Checkout Flow
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `NOV-2026-${randomSuffix}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: currentUser?.userId || null,
        customerEmail: cleanEmail,
        totalAmount,
        subtotal,
        discountAmount,
        currency: siteConfig.defaultCurrency,
        paymentStatus: "PENDING",
        items: {
          create: checkoutItems.map((item) => ({
            bookId: item.bookId,
            price: item.price,
            bookTitle: item.title,
          })),
        },
      },
    });

    const successUrl = `${siteConfig.url}/checkout/success?orderNumber=${order.orderNumber}`;
    const cancelUrl = `${siteConfig.url}/cart`;

    const session = await createCheckoutSession({
      orderId: order.id,
      customerEmail: cleanEmail,
      items: checkoutItems,
      successUrl,
      cancelUrl,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.sessionId },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      provider: session.provider,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error("Create checkout session error:", error);
    return NextResponse.json({ error: "Unable to initiate checkout." }, { status: 500 });
  }
}
