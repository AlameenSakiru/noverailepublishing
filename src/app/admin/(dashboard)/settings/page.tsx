import React from "react";
import prisma from "@/lib/prisma";
import { siteConfig } from "@/lib/config";
import { isStripeConfigured } from "@/lib/stripe";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings & Integrations | Noveraile Admin",
  description: "Platform payment gateways, email SMTP delivery, and configuration diagnostics.",
};

export default async function AdminSettingsPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/checkout/webhook`;

  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  const stripeMode: "LIVE" | "TEST" | "SANDBOX" = isStripeConfigured
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
      name: process.env.NEXT_PUBLIC_SITE_NAME || siteConfig.name,
      url: appUrl,
      tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || siteConfig.tagline,
      contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "noverailepublishing@gmail.com",
      currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || siteConfig.defaultCurrency,
      storageDriver: process.env.STORAGE_DRIVER || "local",
      jwtSessionExpiryDays: Number(process.env.SESSION_EXPIRY_DAYS) || 30,
    },
    payment: {
      isStripeConfigured: Boolean(stripeSecretKey.trim()),
      stripeMode,
      publishableKey: stripePublishableKey,
      secretKeyMasked: stripeSecretKey ? `sk_...${stripeSecretKey.slice(-4)}` : "",
      webhookSecretMasked: stripeWebhookSecret ? `whsec_...${stripeWebhookSecret.slice(-4)}` : "",
      webhookUrl,
      allowSandboxCheckout: process.env.ALLOW_SANDBOX_CHECKOUT === "true" || !stripeSecretKey.trim(),
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

  return <SettingsClient initialSettings={initialSettings} />;
}
