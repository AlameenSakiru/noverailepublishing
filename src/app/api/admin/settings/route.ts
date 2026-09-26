import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { siteConfig } from "@/lib/config";
import { isStripeConfigured } from "@/lib/stripe";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/checkout/webhook`;

    // Stripe config summary
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

    return NextResponse.json({
      success: true,
      settings: {
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
      return NextResponse.json({ error: "Only full Administrators can trigger diagnostics." }, { status: 403 });
    }

    const body = await req.json();
    const { action, testEmail } = body || {};

    if (action === "TEST_SMTP") {
      const targetEmail = testEmail?.trim() || session.email;
      const smtpUser = process.env.SMTP_USER || "noverailepublishing@gmail.com";
      const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Noveraile Publishing" <${smtpUser}>`,
        to: targetEmail,
        replyTo: smtpUser,
        subject: "Noveraile Publishing — Admin Diagnostic Test",
        html: `
          <div style="font-family: sans-serif; padding: 24px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; margin-top: 0;">SMTP Diagnostic Succeeded ✅</h2>
            <p style="color: #475569; font-size: 14px;">Your Gmail SMTP delivery system is operational and authenticated with Google servers.</p>
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #334155;">
              Sender: ${smtpUser}<br>
              Recipient: ${targetEmail}<br>
              Timestamp: ${new Date().toISOString()}
            </div>
          </div>
        `,
        text: `SMTP Diagnostic Succeeded! Sender: ${smtpUser}, Recipient: ${targetEmail}`,
      });

      return NextResponse.json({
        success: true,
        message: `Diagnostic email dispatched successfully to ${targetEmail} (Message ID: ${info.messageId})`,
      });
    }

    return NextResponse.json({ error: "Invalid diagnostic action." }, { status: 400 });
  } catch (error: any) {
    console.error("Admin settings action error:", error);
    return NextResponse.json({ error: error?.message || "Diagnostic test failed." }, { status: 500 });
  }
}
