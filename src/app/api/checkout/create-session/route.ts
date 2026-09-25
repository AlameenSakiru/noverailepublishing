import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword, setSessionCookie } from "@/lib/auth";
import { isStripeConfigured, createCheckoutSession, CheckoutItem } from "@/lib/stripe";
import { siteConfig } from "@/lib/config";
import { checkRateLimit, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`checkout_ip_${ip}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many checkout requests from your network. Please wait a few minutes." },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Malformed checkout payload." }, { status: 400 });
    }

    const { items, couponCode, email: guestEmail } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (items.length > 50) {
      return NextResponse.json({ error: "Cart exceeds maximum allowable items." }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    const customerEmail = currentUser?.email || guestEmail;

    if (!customerEmail || typeof customerEmail !== "string") {
      return NextResponse.json({ error: "Customer email is required for digital delivery." }, { status: 400 });
    }

    const cleanEmail = customerEmail.toLowerCase().trim().slice(0, 254);
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Fetch verified book records from DB to ensure prices cannot be tampered with
    const bookIds = items
      .map((i: any) => (i && typeof i.bookId === "string" ? i.bookId.trim() : ""))
      .filter(Boolean);

    if (bookIds.length === 0) {
      return NextResponse.json({ error: "Invalid item data in cart." }, { status: 400 });
    }

    const dbBooks = await prisma.book.findMany({
      where: { id: { in: bookIds } },
    });

    if (dbBooks.length !== bookIds.length) {
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

    if (couponCode && typeof couponCode === "string") {
      const cleanCouponCode = couponCode.trim().toUpperCase().slice(0, 30);
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCouponCode },
      });

      if (coupon && coupon.isActive) {
        const now = new Date();
        const isDateValid =
          (!coupon.startDate || coupon.startDate <= now) &&
          (!coupon.endDate || coupon.endDate >= now);

        const isUsageValid = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
        const isMinOrderValid = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;

        if (isDateValid && isUsageValid && isMinOrderValid) {
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (subtotal * coupon.discountValue) / 100;
          } else {
            discountAmount = Math.min(coupon.discountValue, subtotal);
          }
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Direct / Sandbox Instant Checkout (when Stripe key is not configured)
    if (!isStripeConfigured) {
      let user = currentUser ? await prisma.user.findUnique({ where: { id: currentUser.userId } }) : null;
      let isNewlyCreatedUser = false;

      if (!user) {
        const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existingUser) {
          // Strict Guard: Never allow administrative accounts to be referenced via unauthenticated guest checkout
          if (existingUser.role === "ADMIN" || existingUser.role === "EDITOR") {
            return NextResponse.json(
              { error: "Administrative accounts cannot check out as guest. Please sign in first." },
              { status: 403 }
            );
          }
          user = existingUser;
          // Note: Since this is an unauthenticated guest checkout for an existing account,
          // we do NOT auto-issue a session cookie to prevent account takeover without password.
        } else {
          // Create new customer account with cryptographically random password
          const fastHash = await hashPassword(crypto.randomBytes(16).toString("hex") + "N1!");
          user = await prisma.user.create({
            data: {
              email: cleanEmail,
              name: cleanEmail.split("@")[0].slice(0, 50),
              passwordHash: fastHash,
              role: "CUSTOMER",
              isEmailVerified: true,
            },
          });
          isNewlyCreatedUser = true;
        }
      }

      // Strong cryptographic order identifier
      const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
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

      // Issue session cookie ONLY if the user was already authenticated OR if they newly created their account in this request
      if (currentUser || isNewlyCreatedUser) {
        await setSessionCookie(
          {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          response
        );
      }

      return response;
    }

    // Stripe Checkout Flow
    const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
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

    const successUrl = `${siteConfig.url}/checkout/success?orderNumber=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`;
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
