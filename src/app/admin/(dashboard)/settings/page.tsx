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
  const stripeMode = isStripeConfigured
    ? stripePublishableKey.startsWith("pk_live_")
      ? "LIVE (Production)"
      : "TEST (Stripe Sandbox)"
    : "BUILT-IN SANDBOX (Simulated Instant 1-Click)";

  const [userCount, bookCount, orderCount, reviewCount] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.order.count(),
    prisma.review.count(),
  ]);

  const initialSettings = {
    site: {
      name: siteConfig.name,
      url: appUrl,
      contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "noverailepublishing@gmail.com",
      currency: siteConfig.defaultCurrency,
      storageDriver: process.env.STORAGE_DRIVER || "local",
      jwtSessionExpiryDays: Number(process.env.SESSION_EXPIRY_DAYS) || 30,
    },
    payment: {
      isStripeConfigured,
      stripeMode,
      publishableKeyPreview: stripePublishableKey
        ? `${stripePublishableKey.substring(0, 8)}...${stripePublishableKey.slice(-4)}`
        : "Not Configured",
      isWebhookSecretSet: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      webhookUrl,
      allowSandboxCheckout: process.env.ALLOW_SANDBOX_CHECKOUT === "true" || !isStripeConfigured,
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
    },
  };

  return <SettingsClient initialSettings={initialSettings} />;
}
