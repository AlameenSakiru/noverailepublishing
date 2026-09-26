import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { siteConfig } from "@/lib/config";
import { isStripeConfigured } from "@/lib/stripe";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  let content = fs.readFileSync(envPath, "utf-8");

  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value;
    const regex = new RegExp(`^${key}=.*$`, "m");
    const sanitizedValue = value.replace(/"/g, '\\"');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${sanitizedValue}"`);
    } else {
      content += `\n${key}="${sanitizedValue}"`;
    }
  }

  fs.writeFileSync(envPath, content, "utf-8");
}

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/checkout/webhook`;

    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    const stripeMode = isStripeConfigured
      ? stripePublishableKey.startsWith("pk_live_")
        ? "LIVE"
        : "TEST"
      : "SANDBOX";

    // Test DB latency
    const startDb = Date.now();
    const [userCount, bookCount, orderCount, reviewCount, activeCodesCount] = await Promise.all([
      prisma.user.count(),
      prisma.book.count(),
      prisma.order.count(),
      prisma.review.count(),
      prisma.verificationCode.count(),
    ]);
    const dbLatencyMs = Date.now() - startDb;

    return NextResponse.json({
      success: true,
      settings: {
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
      },
    });
  } catch (error: any) {
    console.error("Admin settings fetch error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can modify system settings." }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body || {};

    // 1. Live SMTP Test Action
    if (action === "TEST_SMTP") {
      const { testEmail } = body;
      const targetEmail = testEmail?.trim() || session.email;
      const { sendEmail } = await import("@/lib/email");

      const result = await sendEmail({
        to: targetEmail,
        subject: "Noveraile Publishing — Admin SMTP Diagnostic Test",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; max-width: 520px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">NOVERAILE</div>
            <div style="font-size: 10px; letter-spacing: 0.3em; color: #64748b; text-transform: uppercase; margin-bottom: 24px;">PUBLISHING</div>
            <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 12px 0;">SMTP Diagnostic Succeeded ✅</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Your Gmail SMTP integration is fully operational and authenticated with Google servers. All verification OTPs and customer broadcasts are dispatching successfully.
            </p>
            <div style="background: #f8fafc; padding: 14px; border-radius: 10px; font-family: monospace; font-size: 12px; color: #334155; border: 1px solid #e2e8f0;">
              Sender: ${process.env.SMTP_USER || "noverailepublishing@gmail.com"}<br>
              Recipient: ${targetEmail}<br>
              Timestamp: ${new Date().toISOString()}
            </div>
          </div>
        `,
        text: `SMTP Diagnostic Succeeded! Recipient: ${targetEmail}`,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to dispatch test email." }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Diagnostic test email successfully delivered to ${targetEmail}!`,
      });
    }

    // 2. Clean Expired Verification Codes Action
    if (action === "CLEAN_EXPIRED_CODES") {
      const deleted = await prisma.verificationCode.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return NextResponse.json({
        success: true,
        message: `Purged ${deleted.count} expired verification codes from the database.`,
      });
    }

    // 3. Update Settings Action (Stripe keys, Storefront identity, Currency)
    if (action === "SAVE_SETTINGS") {
      const { siteName, siteTagline, contactEmail, currency, stripePublishableKey, stripeSecretKey, stripeWebhookSecret } = body;

      const updates: Record<string, string> = {};

      if (siteName) updates.NEXT_PUBLIC_SITE_NAME = siteName.trim();
      if (siteTagline) updates.NEXT_PUBLIC_SITE_TAGLINE = siteTagline.trim();
      if (contactEmail) updates.NEXT_PUBLIC_CONTACT_EMAIL = contactEmail.trim().toLowerCase();
      if (currency) updates.NEXT_PUBLIC_DEFAULT_CURRENCY = currency.trim().toUpperCase();

      if (stripePublishableKey !== undefined) updates.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = stripePublishableKey.trim();
      if (stripeSecretKey !== undefined) updates.STRIPE_SECRET_KEY = stripeSecretKey.trim();
      if (stripeWebhookSecret !== undefined) updates.STRIPE_WEBHOOK_SECRET = stripeWebhookSecret.trim();

      updateEnvFile(updates);

      // Record audit log
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "SETTINGS_UPDATED",
          entityType: "PlatformSettings",
          details: JSON.stringify({
            updatedKeys: Object.keys(updates),
            updatedBy: session.name,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Settings saved and applied successfully!",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Admin settings action error:", error);
    return NextResponse.json({ error: error?.message || "Failed to perform settings action." }, { status: 500 });
  }
}
