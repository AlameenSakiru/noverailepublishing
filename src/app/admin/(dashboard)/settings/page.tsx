import React from "react";
import prisma from "@/lib/prisma";
import { siteConfig } from "@/lib/config";
import { isStripeConfigured } from "@/lib/stripe";
import { getResolvedPaystackCredentials } from "@/lib/paystack";
import { getResolvedNowPaymentsCredentials } from "@/lib/nowpayments";
import { getAllPlatformSettings } from "@/lib/settings";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings & Integrations | Noveraile Admin",
  description: "Platform payment gateways, Paystack, email SMTP delivery, and configuration diagnostics.",
};

export default async function AdminSettingsPage() {
  const dbSettings = await getAllPlatformSettings();

  const appUrl =
    dbSettings.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://noverailepublishing-tsukifi.vercel.app";

  const paystackWebhookUrl = `${appUrl}/api/checkout/paystack-webhook`;
  const nowpaymentsWebhookUrl = `${appUrl}/api/checkout/nowpayments-webhook`;
  const stripeWebhookUrl = `${appUrl}/api/checkout/webhook`;

  // Paystack credentials
  const paystackCreds = await getResolvedPaystackCredentials();

  // NOWPayments credentials
  const nowpaymentsCreds = await getResolvedNowPaymentsCredentials();

  // Stripe credentials
  const stripePublishableKey =
    dbSettings.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "";
  const stripeSecretKey =
    dbSettings.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    "";
  const stripeWebhookSecret =
    dbSettings.STRIPE_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    "";

  const stripeMode: "LIVE" | "TEST" | "SANDBOX" = Boolean(stripeSecretKey.trim())
    ? stripePublishableKey.startsWith("pk_live_")
      ? "LIVE"
      : "TEST"
    : "SANDBOX";

  const startDb = Date.now();
  const [userCount, bookCount, orderCount, reviewCount, activeCodesCount] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.order.count(),
    prisma.review.count(),
    prisma.verificationCode.count(),
  ]);
  const dbLatencyMs = Date.now() - startDb;

  const initialSettings = {
    site: {
      name: dbSettings.NEXT_PUBLIC_SITE_NAME || process.env.NEXT_PUBLIC_SITE_NAME || siteConfig.name,
      url: appUrl,
      tagline: dbSettings.NEXT_PUBLIC_SITE_TAGLINE || process.env.NEXT_PUBLIC_SITE_TAGLINE || siteConfig.tagline,
      contactEmail: dbSettings.NEXT_PUBLIC_CONTACT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "noverailepublishing@gmail.com",
      currency: dbSettings.NEXT_PUBLIC_DEFAULT_CURRENCY || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || siteConfig.defaultCurrency,
      storageDriver: process.env.STORAGE_DRIVER || "local",
      jwtSessionExpiryDays: Number(process.env.SESSION_EXPIRY_DAYS) || 30,
    },
    paystack: {
      isConfigured: paystackCreds.isConfigured,
      mode: paystackCreds.mode,
      publicKey: paystackCreds.publicKey,
      secretKeyMasked: paystackCreds.secretKey ? `sk_...${paystackCreds.secretKey.slice(-4)}` : "",
      webhookUrl: paystackWebhookUrl,
    },
    nowpayments: {
      isConfigured: nowpaymentsCreds.isConfigured,
      mode: nowpaymentsCreds.mode,
      apiKeyMasked: nowpaymentsCreds.apiKey ? `np_...${nowpaymentsCreds.apiKey.slice(-4)}` : "",
      ipnSecretMasked: nowpaymentsCreds.ipnSecret ? `ipn_...${nowpaymentsCreds.ipnSecret.slice(-4)}` : "",
      webhookUrl: nowpaymentsWebhookUrl,
    },
    payment: {
      isStripeConfigured: Boolean(stripeSecretKey.trim()),
      stripeMode,
      publishableKey: stripePublishableKey,
      secretKeyMasked: stripeSecretKey ? `sk_...${stripeSecretKey.slice(-4)}` : "",
      webhookSecretMasked: stripeWebhookSecret ? `whsec_...${stripeWebhookSecret.slice(-4)}` : "",
      webhookUrl: stripeWebhookUrl,
      allowSandboxCheckout:
        process.env.ALLOW_SANDBOX_CHECKOUT === "true" || (!paystackCreds.isConfigured && !stripeSecretKey.trim() && !nowpaymentsCreds.isConfigured),
    },
    email: {
      smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
      smtpPort: Number(process.env.SMTP_PORT) || 465,
      smtpUser: process.env.SMTP_USER || "noverailepublishing@gmail.com",
      emailFrom: process.env.EMAIL_FROM || "Noveraile Publishing <noverailepublishing@gmail.com>",
      isSmtpConfigured: Boolean(process.env.SMTP_PASS),
      twoFactorAuthEnabled: true,
    },
    stats: {
      userCount,
      bookCount,
      orderCount,
      reviewCount,
      activeCodesCount,
      dbLatencyMs,
    },
  };

  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true, role: true, isEmailVerified: true },
  });

  return (
    <SettingsClient
      initialSettings={initialSettings}
      initialAdminUser={
        adminUser || {
          id: "admin-1",
          name: "Company Administrator",
          email: "noverailepublishing@gmail.com",
          role: "ADMIN",
          isEmailVerified: true,
        }
      }
    />
  );
}
