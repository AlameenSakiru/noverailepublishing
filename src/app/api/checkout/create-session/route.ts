import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword, setSessionCookie } from "@/lib/auth";
import { isStripeConfigured, createCheckoutSession, CheckoutItem } from "@/lib/stripe";
import { isPaystackConfigured, initializePaystackTransaction, getResolvedPaystackCredentials } from "@/lib/paystack";
import { isNowPaymentsConfigured, createNowPaymentsInvoice, getResolvedNowPaymentsCredentials } from "@/lib/nowpayments";
import { siteConfig } from "@/lib/config";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { sendGiftDeliveryEmail, sendOrderConfirmationEmail } from "@/lib/email";

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

    const {
      items,
      couponCode,
      email: guestEmail,
      preferredGateway,
      isGift,
      recipientName,
      recipientEmail,
      giftMessage,
      senderName,
    } = body || {};

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

    // Process Gift Fields
    const cleanIsGift = Boolean(isGift);
    let cleanRecipientEmail: string | null = null;
    let cleanRecipientName: string | null = null;
    let cleanGiftMessage: string | null = null;
    let cleanSenderName: string = senderName
      ? String(senderName).trim().slice(0, 100)
      : currentUser?.name || cleanEmail.split("@")[0];

    if (cleanIsGift) {
      if (!recipientEmail || typeof recipientEmail !== "string") {
        return NextResponse.json({ error: "Recipient email is required for gift orders." }, { status: 400 });
      }
      cleanRecipientEmail = recipientEmail.toLowerCase().trim().slice(0, 254);
      if (!EMAIL_REGEX.test(cleanRecipientEmail)) {
        return NextResponse.json({ error: "Please enter a valid recipient email address." }, { status: 400 });
      }
      cleanRecipientName = recipientName
        ? String(recipientName).trim().slice(0, 100)
        : cleanRecipientEmail.split("@")[0];
      cleanGiftMessage = giftMessage ? String(giftMessage).trim().slice(0, 500) : null;
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
      include: { author: true },
    });

    if (dbBooks.length !== bookIds.length) {
      return NextResponse.json({ error: "One or more books in cart are no longer available." }, { status: 400 });
    }

    // Prevent duplicate purchases if user already owns any of the books (unless purchasing as a gift)
    if (!cleanIsGift) {
      const [existingEntitlements, existingPaidOrders] = await Promise.all([
        prisma.entitlement.findMany({
          where: {
            bookId: { in: bookIds },
            status: "ACTIVE",
            OR: [
              ...(currentUser ? [{ userId: currentUser.userId }] : []),
              { user: { email: cleanEmail } },
            ],
          },
          include: {
            book: { select: { title: true } },
          },
        }),
        prisma.orderItem.findMany({
          where: {
            bookId: { in: bookIds },
            order: {
              paymentStatus: "PAID",
              isGift: false,
              OR: [
                ...(currentUser ? [{ userId: currentUser.userId }] : []),
                { customerEmail: cleanEmail },
              ],
            },
          },
          include: {
            book: { select: { title: true } },
          },
        }),
      ]);

      const ownedBookTitles = Array.from(
        new Set([
          ...existingEntitlements.map((e) => e.book.title),
          ...existingPaidOrders.map((o) => o.book.title),
        ])
      );

      if (ownedBookTitles.length > 0) {
        const titleList = ownedBookTitles.map((t) => `"${t}"`).join(", ");
        return NextResponse.json(
          {
            error: `You already own ${titleList} in your library! To prevent duplicate charges, please remove it from your cart or check "Send as a Gift" to send it to someone else.`,
          },
          { status: 400 }
        );
      }
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
    let verifiedCoupon: any = null;

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
          verifiedCoupon = coupon;
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (subtotal * coupon.discountValue) / 100;
          } else {
            discountAmount = Math.min(coupon.discountValue, subtotal);
          }
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const defaultCurrency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || siteConfig.defaultCurrency || "USD";

    // =========================================================================
    // 0. FREE PUBLICATION / $0.00 CLAIM FLOW (NO PAYMENT GATEWAY NEEDED)
    // =========================================================================
    if (totalAmount <= 0.001) {
      const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
      const orderNumber = `NOV-2026-${randomSuffix}`;

      // Resolve user account for customer
      let user = currentUser ? await prisma.user.findUnique({ where: { id: currentUser.userId } }) : null;
      if (!user) {
        user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      }

      if (!user) {
        const randomPass = Math.random().toString(36).slice(-10) + "A1!";
        const passwordHash = await hashPassword(randomPass);
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: cleanSenderName || cleanEmail.split("@")[0],
            passwordHash,
            role: "CUSTOMER",
            isEmailVerified: true,
          },
        });
      }

      // Create PAID order immediately in DB
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: user.id,
          customerEmail: cleanEmail,
          totalAmount: 0,
          subtotal,
          discountAmount,
          currency: defaultCurrency,
          paymentStatus: "PAID",
          isGift: cleanIsGift,
          recipientName: cleanRecipientName,
          recipientEmail: cleanRecipientEmail,
          giftMessage: cleanGiftMessage,
          items: {
            create: checkoutItems.map((item) => ({
              bookId: item.bookId,
              price: item.price,
              bookTitle: item.title,
            })),
          },
        },
        include: {
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

      // Record free payment record
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "FREE_CLAIM",
          transactionId: `FREE-${order.orderNumber}`,
          status: "SUCCEEDED",
          amount: 0,
          currency: defaultCurrency,
        },
      });

      // If coupon used, record usage and increment count
      if (verifiedCoupon) {
        await prisma.couponUse.create({
          data: {
            couponId: verifiedCoupon.id,
            userId: user.id,
            orderId: order.id,
          },
        }).catch(() => {});

        await prisma.coupon.update({
          where: { id: verifiedCoupon.id },
          data: { usedCount: { increment: 1 } },
        }).catch(() => {});
      }

      // Digital entitlements activation (Recipient if gift, else buyer)
      let entitlementUserId = user.id;
      if (cleanIsGift && cleanRecipientEmail) {
        let recipientUser = await prisma.user.findUnique({ where: { email: cleanRecipientEmail } });
        if (!recipientUser) {
          const randomPass = Math.random().toString(36).slice(-10) + "A1!";
          const passwordHash = await hashPassword(randomPass);
          recipientUser = await prisma.user.create({
            data: {
              email: cleanRecipientEmail,
              name: cleanRecipientName || cleanRecipientEmail.split("@")[0],
              passwordHash,
              role: "CUSTOMER",
              isEmailVerified: true,
            },
          });
        }
        entitlementUserId = recipientUser.id;
      }

      for (const item of order.items) {
        await prisma.entitlement.upsert({
          where: {
            userId_bookId: { userId: entitlementUserId, bookId: item.bookId },
          },
          update: {
            status: "ACTIVE",
            orderId: order.id,
            isGift: cleanIsGift,
            giftSenderName: cleanIsGift ? cleanSenderName : null,
            giftSenderEmail: cleanIsGift ? cleanEmail : null,
            giftMessage: cleanIsGift ? cleanGiftMessage : null,
          },
          create: {
            userId: entitlementUserId,
            bookId: item.bookId,
            orderId: order.id,
            status: "ACTIVE",
            isGift: cleanIsGift,
            giftSenderName: cleanIsGift ? cleanSenderName : null,
            giftSenderEmail: cleanIsGift ? cleanEmail : null,
            giftMessage: cleanGiftMessage,
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

        // Dispatch gift email if gift
        if (cleanIsGift && cleanRecipientEmail) {
          sendGiftDeliveryEmail({
            recipientEmail: cleanRecipientEmail,
            recipientName: cleanRecipientName || cleanRecipientEmail.split("@")[0],
            senderName: cleanSenderName,
            senderEmail: cleanEmail,
            giftMessage: cleanGiftMessage || undefined,
            bookTitle: item.book?.title || item.bookTitle,
            bookAuthor: item.book?.author?.name || undefined,
            bookCoverUrl: item.book?.coverImage || undefined,
          }).catch((err) => console.error("Free gift email dispatch error:", err));
        }
      }

      // Dispatch Order Confirmation Email to the customer
      sendOrderConfirmationEmail({
        customerEmail: cleanEmail,
        customerName: cleanSenderName || cleanEmail.split("@")[0],
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        items: order.items.map((i) => ({
          title: i.book?.title || i.bookTitle || "Digital Publication",
          author: i.book?.author?.name || undefined,
          price: i.price,
          coverImage: i.book?.coverImage || undefined,
          slug: i.book?.slug || undefined,
        })),
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        currency: defaultCurrency,
        paymentProvider: "FREE_CLAIM",
        isGift: cleanIsGift,
        recipientName: cleanRecipientName || undefined,
        recipientEmail: cleanRecipientEmail || undefined,
        giftMessage: cleanGiftMessage || undefined,
      }).catch((err) => console.error("Free order confirmation email error:", err));

      const response = NextResponse.json({
        checkoutUrl: `/checkout/success?orderNumber=${order.orderNumber}&provider=free`,
        provider: "FREE",
        orderNumber: order.orderNumber,
      });

      // Set cookie if guest claimed
      if (!currentUser && user) {
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

    // Resolve active base URL dynamically (supports Vercel, custom domain, or local dev)
    const origin = req.headers.get("origin") || req.headers.get("referer");
    let detectedOrigin = "";
    if (origin) {
      try {
        detectedOrigin = new URL(origin).origin;
      } catch {}
    }
    const appBaseUrl =
      (detectedOrigin && !detectedOrigin.includes("localhost"))
        ? detectedOrigin
        : (process.env.NEXT_PUBLIC_APP_URL || "https://noverailepublishing.com");

    // Determine target payment provider
    const nowpaymentsCreds = await getResolvedNowPaymentsCredentials();
    const paystackCreds = await getResolvedPaystackCredentials();
    const isCryptoRequested = preferredGateway === "NOWPAYMENTS" || preferredGateway === "CRYPTO";

    if (isCryptoRequested && !nowpaymentsCreds.isConfigured) {
      return NextResponse.json(
        {
          error:
            "NOWPayments crypto gateway is not configured yet. Please enter your NOWPAYMENTS_API_KEY in Admin Settings or .env.",
        },
        { status: 400 }
      );
    }

    const useNowPayments = nowpaymentsCreds.isConfigured && (isCryptoRequested || (!paystackCreds.isConfigured && !isStripeConfigured));
    const usePaystack = !isCryptoRequested && paystackCreds.isConfigured && (!preferredGateway || preferredGateway === "PAYSTACK");
    const useStripe = !isCryptoRequested && !usePaystack && isStripeConfigured && (!preferredGateway || preferredGateway === "STRIPE");

    // =========================================================================
    // 1. NOWPAYMENTS MULTI-COIN CRYPTO CHECKOUT FLOW
    // =========================================================================
    if (useNowPayments) {
      const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
      const orderNumber = `NOV-2026-${randomSuffix}`;

      // Look up existing user if guest
      let userId = currentUser?.userId || null;
      if (!userId) {
        const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existingUser) {
          userId = existingUser.id;
        }
      }

      // Create PENDING order in DB with gift metadata
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          customerEmail: cleanEmail,
          totalAmount,
          subtotal,
          discountAmount,
          currency: defaultCurrency,
          paymentStatus: "PENDING",
          isGift: cleanIsGift,
          recipientName: cleanRecipientName,
          recipientEmail: cleanRecipientEmail,
          giftMessage: cleanGiftMessage,
          items: {
            create: checkoutItems.map((item) => ({
              bookId: item.bookId,
              price: item.price,
              bookTitle: item.title,
            })),
          },
        },
      });

      const ipnCallbackUrl = `${appBaseUrl}/api/checkout/nowpayments-webhook`;
      const successUrl = `${appBaseUrl}/checkout/success?orderNumber=${order.orderNumber}&provider=nowpayments`;
      const cancelUrl = `${appBaseUrl}/checkout/success?orderNumber=${order.orderNumber}&status=cancelled&provider=nowpayments`;

      const invoiceRes = await createNowPaymentsInvoice({
        priceAmount: totalAmount,
        priceCurrency: "usd",
        orderId: order.orderNumber,
        orderDescription: `Noveraile Publishing Order #${order.orderNumber}`,
        ipnCallbackUrl,
        successUrl,
        cancelUrl,
      });

      if (!invoiceRes.success || !invoiceRes.invoiceUrl) {
        console.error("❌ NOWPayments invoice creation failed:", invoiceRes.error);
        return NextResponse.json(
          {
            error:
              invoiceRes.error ||
              "Unable to create NOWPayments crypto invoice. Please verify your API key.",
          },
          { status: 400 }
        );
      }

      // Update order with crypto invoice details
      await prisma.order.update({
        where: { id: order.id },
        data: {
          cryptoPaymentId: invoiceRes.invoiceId || null,
          cryptoInvoiceUrl: invoiceRes.invoiceUrl,
        },
      });

      return NextResponse.json({
        checkoutUrl: invoiceRes.invoiceUrl,
        provider: "NOWPAYMENTS",
        orderNumber: order.orderNumber,
      });
    }

    // =========================================================================
    // 2. PAYSTACK CHECKOUT FLOW
    // =========================================================================
    if (usePaystack) {
      const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
      const orderNumber = `NOV-2026-${randomSuffix}`;

      // Look up existing user if guest
      let userId = currentUser?.userId || null;
      if (!userId) {
        const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existingUser) {
          userId = existingUser.id;
        }
      }

      // Create PENDING order in DB with gift metadata
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          customerEmail: cleanEmail,
          totalAmount,
          subtotal,
          discountAmount,
          currency: defaultCurrency,
          paymentStatus: "PENDING",
          isGift: cleanIsGift,
          recipientName: cleanRecipientName,
          recipientEmail: cleanRecipientEmail,
          giftMessage: cleanGiftMessage,
          items: {
            create: checkoutItems.map((item) => ({
              bookId: item.bookId,
              price: item.price,
              bookTitle: item.title,
            })),
          },
        },
      });

      const callbackUrl = `${appBaseUrl}/checkout/success?orderNumber=${order.orderNumber}&reference=${order.orderNumber}&provider=paystack`;

      const paystackRes = await initializePaystackTransaction({
        email: cleanEmail,
        amount: totalAmount,
        reference: order.orderNumber,
        callbackUrl,
        currency: defaultCurrency,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerEmail: cleanEmail,
          itemsCount: checkoutItems.length,
          itemTitles: checkoutItems.map((i) => i.title).join(", "),
          isGift: cleanIsGift ? "true" : "false",
          recipientName: cleanRecipientName || "",
          recipientEmail: cleanRecipientEmail || "",
          giftMessage: cleanGiftMessage || "",
          senderName: cleanSenderName || "",
        },
      });

      if (!paystackRes.success || !paystackRes.authorizationUrl) {
        console.error("❌ Paystack initialization failed:", paystackRes.error);
        return NextResponse.json(
          {
            error:
              paystackRes.error ||
              "Unable to initialize Paystack checkout. Please check your Paystack API keys in Admin Settings.",
          },
          { status: 400 }
        );
      }

      // Store reference / access code in order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          stripeSessionId: paystackRes.reference || order.orderNumber,
        },
      });

      return NextResponse.json({
        checkoutUrl: paystackRes.authorizationUrl,
        provider: "PAYSTACK",
        orderNumber: order.orderNumber,
      });
    }

    // =========================================================================
    // 2. STRIPE CHECKOUT FLOW
    // =========================================================================
    if (useStripe) {
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
          currency: defaultCurrency,
          paymentStatus: "PENDING",
          isGift: cleanIsGift,
          recipientName: cleanRecipientName,
          recipientEmail: cleanRecipientEmail,
          giftMessage: cleanGiftMessage,
          items: {
            create: checkoutItems.map((item) => ({
              bookId: item.bookId,
              price: item.price,
              bookTitle: item.title,
            })),
          },
        },
      });

      const successUrl = `${siteConfig.url}/checkout/success?orderNumber=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}&provider=stripe`;
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
    }

    // =========================================================================
    // 3. DIRECT / SANDBOX INSTANT CHECKOUT (When neither gateway is configured)
    // =========================================================================
    let user = currentUser ? await prisma.user.findUnique({ where: { id: currentUser.userId } }) : null;
    let isNewlyCreatedUser = false;

    if (!user) {
      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existingUser) {
        if (existingUser.role === "ADMIN" || existingUser.role === "EDITOR") {
          return NextResponse.json(
            { error: "Administrative accounts cannot check out as guest. Please sign in first." },
            { status: 403 }
          );
        }
        user = existingUser;
      } else {
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
        currency: defaultCurrency,
        paymentStatus: "PAID",
        isGift: cleanIsGift,
        recipientName: cleanRecipientName,
        recipientEmail: cleanRecipientEmail,
        giftMessage: cleanGiftMessage,
        payment: {
          create: {
            provider: "SANDBOX",
            transactionId: `txn_instant_${Date.now()}`,
            status: "SUCCEEDED",
            amount: totalAmount,
            currency: defaultCurrency,
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

    // Determine entitlement recipient (either gift recipient or buyer)
    let entitlementUserId = user.id;
    if (cleanIsGift && cleanRecipientEmail) {
      let recipientUser = await prisma.user.findUnique({ where: { email: cleanRecipientEmail } });
      if (!recipientUser) {
        const fastHash = await hashPassword(crypto.randomBytes(16).toString("hex") + "N1!");
        recipientUser = await prisma.user.create({
          data: {
            email: cleanRecipientEmail,
            name: cleanRecipientName || cleanRecipientEmail.split("@")[0],
            passwordHash: fastHash,
            role: "CUSTOMER",
            isEmailVerified: true,
          },
        });
      }
      entitlementUserId = recipientUser.id;
    }

    // Concurrently create digital entitlements and reading progress records
    await Promise.all(
      dbBooks.map(async (book) => {
        await prisma.entitlement.upsert({
          where: {
            userId_bookId: { userId: entitlementUserId, bookId: book.id },
          },
          update: {
            status: "ACTIVE",
            orderId: order.id,
            isGift: cleanIsGift,
            giftSenderName: cleanIsGift ? cleanSenderName : null,
            giftSenderEmail: cleanIsGift ? cleanEmail : null,
            giftMessage: cleanIsGift ? cleanGiftMessage : null,
          },
          create: {
            userId: entitlementUserId,
            bookId: book.id,
            orderId: order.id,
            status: "ACTIVE",
            isGift: cleanIsGift,
            giftSenderName: cleanIsGift ? cleanSenderName : null,
            giftSenderEmail: cleanIsGift ? cleanEmail : null,
            giftMessage: cleanIsGift ? cleanGiftMessage : null,
          },
        }).catch(() => {});

        await prisma.readingProgress.upsert({
          where: {
            userId_bookId: { userId: entitlementUserId, bookId: book.id },
          },
          update: {},
          create: {
            userId: entitlementUserId,
            bookId: book.id,
            currentPage: 1,
            totalPages: book.pageCount > 0 ? book.pageCount : 1,
            progressPercent: 0,
          },
        }).catch(() => {});

        // If Gift order, dispatch branded gift delivery announcement email
        if (cleanIsGift && cleanRecipientEmail) {
          sendGiftDeliveryEmail({
            recipientEmail: cleanRecipientEmail,
            recipientName: cleanRecipientName || cleanRecipientEmail.split("@")[0],
            senderName: cleanSenderName,
            senderEmail: cleanEmail,
            giftMessage: cleanGiftMessage || undefined,
            bookTitle: book.title,
            bookAuthor: book.author?.name || undefined,
            bookCoverUrl: book.coverImage || undefined,
          }).catch((err) => console.error("Gift email delivery error:", err));
        }
      })
    );

    // Dispatch Order Confirmation Email to the customer
    sendOrderConfirmationEmail({
      customerEmail: cleanEmail,
      customerName: user.name || cleanSenderName || cleanEmail.split("@")[0],
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      items: dbBooks.map((b) => ({
        title: b.title,
        author: b.author?.name || undefined,
        price: b.salePrice != null && b.salePrice > 0 ? b.salePrice : b.price,
        coverImage: b.coverImage || undefined,
        slug: b.slug,
      })),
      subtotal,
      discountAmount,
      totalAmount,
      currency: defaultCurrency,
      paymentProvider: "SANDBOX",
      isGift: cleanIsGift,
      recipientName: cleanRecipientName || undefined,
      recipientEmail: cleanRecipientEmail || undefined,
      giftMessage: cleanGiftMessage || undefined,
    }).catch((err) => console.error("Sandbox order confirmation email error:", err));

    const response = NextResponse.json({
      checkoutUrl: `/checkout/success?orderNumber=${order.orderNumber}`,
      provider: "SANDBOX",
      orderNumber: order.orderNumber,
    });

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
  } catch (error: any) {
    console.error("Create checkout session error:", error);
    return NextResponse.json({ error: "Unable to initiate checkout." }, { status: 500 });
  }
}

