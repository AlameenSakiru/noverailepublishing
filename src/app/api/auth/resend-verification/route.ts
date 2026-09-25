import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

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

    // Verify that user exists
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

    // Rate limiting: check if a code was created in the last 60 seconds
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email: cleanEmail,
        type: "EMAIL_VERIFICATION",
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCode) {
      return NextResponse.json(
        { success: false, error: "Please wait 60 seconds before requesting another code." },
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
      message: `A new 6-digit verification code has been sent to ${cleanEmail}.`,
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend code. Please try again." },
      { status: 500 }
    );
  }
}
