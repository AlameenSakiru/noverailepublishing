import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { siteConfig } from "@/lib/config";
import { isStripeConfigured } from "@/lib/stripe";
import {
  isPaystackConfigured,
  getPaystackPublicKey,
  getPaystackMode,
  testPaystackConnection,
} from "@/lib/paystack";
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
    const paystackWebhookUrl = `${appUrl}/api/checkout/paystack-webhook`;
    const stripeWebhookUrl = `${appUrl}/api/checkout/webhook`;

    // Paystack credentials
    const paystackPublicKey = getPaystackPublicKey();
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || "";
    const paystackMode = getPaystackMode();

    // Stripe credentials
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

    // Get current admin user details
    const adminUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true, isEmailVerified: true },
    });

    return NextResponse.json({
      success: true,
      adminUser: adminUser || {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        isEmailVerified: true,
      },
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
        paystack: {
          isConfigured: isPaystackConfigured,
          mode: paystackMode,
          publicKey: paystackPublicKey,
          secretKeyMasked: paystackSecretKey ? `sk_...${paystackSecretKey.slice(-4)}` : "",
          webhookUrl: paystackWebhookUrl,
        },
        payment: {
          isStripeConfigured: Boolean(stripeSecretKey.trim()),
          stripeMode,
          publishableKey: stripePublishableKey,
          secretKeyMasked: stripeSecretKey ? `sk_...${stripeSecretKey.slice(-4)}` : "",
          webhookSecretMasked: stripeWebhookSecret ? `whsec_...${stripeWebhookSecret.slice(-4)}` : "",
          webhookUrl: stripeWebhookUrl,
          allowSandboxCheckout:
            process.env.ALLOW_SANDBOX_CHECKOUT === "true" || (!isPaystackConfigured && !stripeSecretKey.trim()),
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

    // 1. Paystack Live Diagnostic Test Action
    if (action === "TEST_PAYSTACK") {
      const result = await testPaystackConnection();
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to verify Paystack connection." }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: result.message || "Paystack connection is active and verified!",
      });
    }

    // 2. Live SMTP Test Action
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

    // 3. Clean Expired Verification Codes Action
    if (action === "CLEAN_EXPIRED_CODES") {
      const deleted = await prisma.verificationCode.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return NextResponse.json({
        success: true,
        message: `Purged ${deleted.count} expired verification codes from the database.`,
      });
    }

    // 4. Update Settings Action (Paystack keys, Stripe keys, Storefront identity, Currency)
    if (action === "SAVE_SETTINGS") {
      const {
        siteName,
        siteTagline,
        contactEmail,
        currency,
        paystackPublicKey,
        paystackSecretKey,
        stripePublishableKey,
        stripeSecretKey,
        stripeWebhookSecret,
      } = body;

      const updates: Record<string, string> = {};

      if (siteName) updates.NEXT_PUBLIC_SITE_NAME = siteName.trim();
      if (siteTagline) updates.NEXT_PUBLIC_SITE_TAGLINE = siteTagline.trim();
      if (contactEmail) updates.NEXT_PUBLIC_CONTACT_EMAIL = contactEmail.trim().toLowerCase();
      if (currency) updates.NEXT_PUBLIC_DEFAULT_CURRENCY = currency.trim().toUpperCase();

      // Paystack configuration
      if (paystackPublicKey !== undefined) {
        updates.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = paystackPublicKey.trim();
        updates.PAYSTACK_PUBLIC_KEY = paystackPublicKey.trim();
      }
      if (paystackSecretKey !== undefined && paystackSecretKey.trim() !== "") {
        updates.PAYSTACK_SECRET_KEY = paystackSecretKey.trim();
      }

      // Stripe configuration
      if (stripePublishableKey !== undefined) updates.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = stripePublishableKey.trim();
      if (stripeSecretKey !== undefined && stripeSecretKey.trim() !== "") updates.STRIPE_SECRET_KEY = stripeSecretKey.trim();
      if (stripeWebhookSecret !== undefined && stripeWebhookSecret.trim() !== "") updates.STRIPE_WEBHOOK_SECRET = stripeWebhookSecret.trim();

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

    // 5. Change Administrator Password Action
    if (action === "CHANGE_ADMIN_PASSWORD") {
      const { currentPassword, newPassword, confirmPassword } = body;

      if (!newPassword || typeof newPassword !== "string") {
        return NextResponse.json({ error: "Please enter a new password." }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
      }

      if (newPassword.length > 128) {
        return NextResponse.json({ error: "New password cannot exceed 128 characters." }, { status: 400 });
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user) {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
      }

      // If user currently has a password hash, verify current password
      if (user.passwordHash) {
        if (!currentPassword || typeof currentPassword !== "string") {
          return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
        }

        const isMatch = await verifyPassword(currentPassword, user.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: "The current password entered is incorrect." }, { status: 400 });
        }
      }

      const newHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash: newHash },
      });

      // Record audit log
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.userId,
            action: "ADMIN_PASSWORD_CHANGED",
            entityType: "User",
            entityId: session.userId,
            details: JSON.stringify({ email: session.email, changedAt: new Date().toISOString() }),
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: "Administrator security password updated successfully!",
      });
    }

    // 6. Update Admin Account Profile Action
    if (action === "UPDATE_ADMIN_PROFILE") {
      const { name, email } = body;
      const updateData: { name?: string; email?: string } = {};

      if (name && typeof name === "string" && name.trim().length >= 2) {
        updateData.name = name.trim().slice(0, 70);
      }

      if (email && typeof email === "string") {
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail.includes("@") && cleanEmail !== session.email) {
          const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
          if (existing && existing.id !== session.userId) {
            return NextResponse.json({ error: "This email address is already in use by another account." }, { status: 409 });
          }
          updateData.email = cleanEmail;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: session.userId },
          data: updateData,
        });

        // Record audit log
        try {
          await prisma.auditLog.create({
            data: {
              userId: session.userId,
              action: "ADMIN_PROFILE_UPDATED",
              entityType: "User",
              entityId: session.userId,
              details: JSON.stringify(updateData),
            },
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: "Admin profile details updated successfully!",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Admin settings action error:", error);
    return NextResponse.json({ error: error?.message || "Failed to perform settings action." }, { status: 500 });
  }
}

