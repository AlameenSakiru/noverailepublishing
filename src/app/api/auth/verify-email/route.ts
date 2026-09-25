import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body || {};

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "Email and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().replace(/\s+/g, "");

    // Find valid verification code
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
        { success: false, error: "Invalid or expired verification code. Please request a new code." },
        { status: 400 }
      );
    }

    // Mark user as verified
    const user = await prisma.user.update({
      where: { email: cleanEmail },
      data: { isEmailVerified: true },
    });

    // Delete used verification codes for this email
    await prisma.verificationCode.deleteMany({
      where: { email: cleanEmail, type: "EMAIL_VERIFICATION" },
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "EMAIL_VERIFIED",
          entityType: "User",
          entityId: user.id,
          details: JSON.stringify({ email: cleanEmail }),
        },
      });
    } catch {}

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true,
      message: "Email address verified successfully!",
      user: sessionPayload,
    });

    await setSessionCookie(sessionPayload, response);

    return response;
  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
