import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Malformed request payload." }, { status: 400 });
    }

    const { email, code } = body || {};

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "Email address and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim().replace(/\D/g, "");

    if (cleanCode.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Verification code must be exactly 6 digits." },
        { status: 400 }
      );
    }

    // Verify user account exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with this email address. Please register first." },
        { status: 404 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This account has been suspended or deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Find valid, non-expired verification code in database
    const record = await prisma.verificationCode.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode,
        type: "EMAIL_VERIFICATION",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired 6-digit verification code. Please request a fresh code below.",
        },
        { status: 400 }
      );
    }

    // Mark user email as verified
    const updatedUser = await prisma.user.update({
      where: { email: cleanEmail },
      data: { isEmailVerified: true },
    });

    // Delete all used verification codes for this email
    await prisma.verificationCode.deleteMany({
      where: { email: cleanEmail, type: "EMAIL_VERIFICATION" },
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: updatedUser.id,
          action: "EMAIL_VERIFIED",
          entityType: "User",
          entityId: updatedUser.id,
          details: JSON.stringify({ email: cleanEmail }),
        },
      });
    } catch {}

    const sessionPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isEmailVerified: true,
    };

    const response = NextResponse.json({
      success: true,
      message: "Email address verified successfully!",
      user: sessionPayload,
    });

    // Grant active session cookie upon successful verification
    await setSessionCookie(sessionPayload, response);

    return response;
  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please check your network and try again." },
      { status: 500 }
    );
  }
}
