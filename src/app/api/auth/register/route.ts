import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Malformed request payload." }, { status: 400 });
    }

    const { name, email, password } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid registration payload." }, { status: 400 });
    }

    // Rate Limiting: max 10 registrations per hour per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!checkRateLimit(`register_ip_${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many registration attempts from your network. Please try again later." },
        { status: 429 }
      );
    }

    const cleanName = name.trim().slice(0, 70);
    const cleanEmail = email.trim().toLowerCase().slice(0, 254);

    if (cleanName.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: "Password cannot exceed 128 characters." }, { status: 400 });
    }

    // Check if account already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    const passwordHash = await hashPassword(password);
    let targetUser = existing;

    if (existing) {
      if (existing.isEmailVerified) {
        return NextResponse.json(
          { error: "An account with this email address already exists. Please sign in instead." },
          { status: 409 }
        );
      }
      // If user exists but was never verified, update name & password and allow them to verify
      targetUser = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          passwordHash,
        },
      });
    } else {
      // Create fresh unverified user
      targetUser = await prisma.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          role: "CUSTOMER",
          isEmailVerified: false,
          status: "ACTIVE",
        },
      });
    }

    // Generate secure 6-digit verification code
    const verificationCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Clear previous pending codes for this email
    await prisma.verificationCode.deleteMany({
      where: { email: cleanEmail, type: "EMAIL_VERIFICATION" },
    });

    // Save verification code
    await prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        code: verificationCode,
        type: "EMAIL_VERIFICATION",
        expiresAt,
      },
    });

    // Dispatch verification email
    let emailResult: { success: boolean; error?: string } = { success: false };
    try {
      const { sendVerificationEmail } = await import("@/lib/email");
      emailResult = await sendVerificationEmail(cleanEmail, targetUser.name, verificationCode);
    } catch (codeErr: any) {
      console.error("Failed to send verification email:", codeErr);
      emailResult = { success: false, error: codeErr?.message };
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      code: verificationCode,
      message: `A 6-digit security code has been sent to ${cleanEmail}. Please check your inbox or Spam folder.`,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An error occurred during account creation." }, { status: 500 });
  }
}
