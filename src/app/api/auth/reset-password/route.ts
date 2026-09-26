import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Malformed request payload." }, { status: 400 });
    }

    const { email, code, newPassword, confirmPassword } = body || {};

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email, 6-digit security code, and new password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim().replace(/\D/g, "");
    const cleanPass = String(newPassword).trim();

    if (cleanCode.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Security code must be exactly 6 digits." },
        { status: 400 }
      );
    }

    if (cleanPass.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (cleanPass.length > 128) {
      return NextResponse.json(
        { success: false, error: "New password cannot exceed 128 characters." },
        { status: 400 }
      );
    }

    if (confirmPassword && cleanPass !== String(confirmPassword).trim()) {
      return NextResponse.json(
        { success: false, error: "New passwords do not match." },
        { status: 400 }
      );
    }

    // Rate Limiting: max 10 reset attempts per 15 mins per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!checkRateLimit(`reset_pass_ip_${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many password reset attempts. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // Check user exists
    let user = null;
    let dbAttempts = 0;
    while (dbAttempts < 3) {
      try {
        user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        break;
      } catch (dbErr: any) {
        dbAttempts++;
        console.warn(`Prisma findUnique attempt ${dbAttempts} failed:`, dbErr?.message || dbErr);
        if (dbAttempts >= 3) throw dbErr;
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with this email address." },
        { status: 404 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This account has been suspended or deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Validate 6-digit reset code
    const resetRecord = await prisma.verificationCode.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode,
        type: "PASSWORD_RESET",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired 6-digit security code. Please request a new password reset code.",
        },
        { status: 400 }
      );
    }

    // Hash new password and update user record
    const passwordHash = await hashPassword(cleanPass);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isEmailVerified: true, // Resetting via email proves email ownership
      },
    });

    // Delete used password reset codes
    await prisma.verificationCode.deleteMany({
      where: { email: cleanEmail, type: "PASSWORD_RESET" },
    });

    // Terminate existing sessions to force re-authentication with new password
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "User",
          entityId: user.id,
          details: JSON.stringify({ email: cleanEmail, timestamp: new Date().toISOString() }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully updated! You can now sign in with your new password.",
      redirectUrl: user.role === "ADMIN" || user.role === "EDITOR" ? "/admin/login" : "/login",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while resetting your password. Please try again." },
      { status: 500 }
    );
  }
}
