import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Malformed request payload." }, { status: 400 });
    }

    const { email } = body || {};

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.includes("@") || cleanEmail.length > 254) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Rate Limiting: max 5 forgot password requests per 15 mins per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!checkRateLimit(`forgot_pass_ip_${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many password reset requests. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // Lookup user with DB retry handling
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
      // Return ambiguous success for security if user does not exist to prevent account enumeration
      return NextResponse.json({
        success: true,
        message: `If an account exists for ${cleanEmail}, a 6-digit password reset code has been sent. Check your inbox and Spam folder.`,
      });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This account has been suspended or deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Generate secure 6-digit numeric PIN
    const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Clear old pending reset codes for this email
    await prisma.verificationCode.deleteMany({
      where: { email: cleanEmail, type: "PASSWORD_RESET" },
    });

    // Save reset code
    await prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        code,
        type: "PASSWORD_RESET",
        expiresAt,
      },
    });

    // Dispatch email
    const { sendPasswordResetEmail } = await import("@/lib/email");
    const emailResult = await sendPasswordResetEmail(cleanEmail, user.name, code);

    if (!emailResult.success) {
      console.error("Password reset email failure:", emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: `Email delivery failed: ${emailResult.error || "Please check server connection."}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit password reset code has been dispatched to ${cleanEmail}. Check your inbox and Spam folder.`,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while processing your request. Please try again." },
      { status: 500 }
    );
  }
}
