import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body || {};

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with this email." },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        message: "Email is already verified. You can log in directly.",
        alreadyVerified: true,
      });
    }

    const hasEmailProvider = Boolean(
      (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== "") ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    );

    // Check recent code
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email: cleanEmail,
        type: "EMAIL_VERIFICATION",
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCode && hasEmailProvider) {
      return NextResponse.json(
        { success: false, error: "A code was recently sent. Please check your inbox or wait 60 seconds to resend." },
        { status: 429 }
      );
    }

    // Generate secure 6-digit numeric PIN
    const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete existing unused codes
    await prisma.verificationCode.deleteMany({
      where: { email: cleanEmail, type: "EMAIL_VERIFICATION" },
    });

    // Save new code
    await prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        code,
        type: "EMAIL_VERIFICATION",
        expiresAt,
      },
    });

    // Send email
    await sendVerificationEmail(cleanEmail, user.name, code);

    return NextResponse.json({
      success: true,
      message: hasEmailProvider
        ? `A new 6-digit verification code has been sent to ${cleanEmail}.`
        : `New 6-digit test code generated: ${code}`,
      demoCode: hasEmailProvider ? undefined : code,
      hasEmailProvider,
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend code. Please try again." },
      { status: 500 }
    );
  }
}
