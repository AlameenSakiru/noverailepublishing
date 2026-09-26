import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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

    // Verify user exists with DB retry handling
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
        { success: false, error: "No account found with this email." },
        { status: 404 }
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

    // Dispatch email
    const { sendVerificationEmail } = await import("@/lib/email");
    const emailResult = await sendVerificationEmail(cleanEmail, user.name, code);

    if (!emailResult.success) {
      console.error("Resend verification email failure:", emailResult.error);
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
      message: `A fresh 6-digit verification code has been dispatched to ${cleanEmail}. Check your inbox and Spam folder.`,
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend code. Please try again." },
      { status: 500 }
    );
  }
}
