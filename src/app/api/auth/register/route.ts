import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";

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

    // Rate Limiting: max 5 registrations per hour per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!checkRateLimit(`register_ip_${ip}`, 5, 60 * 60 * 1000)) {
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

    // Check existing
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Create user strictly as CUSTOMER with isEmailVerified = false
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: "CUSTOMER",
        isEmailVerified: false,
      },
    });

    // Generate secure 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      await prisma.verificationCode.create({
        data: {
          email: cleanEmail,
          code: verificationCode,
          type: "EMAIL_VERIFICATION",
          expiresAt,
        },
      });

      // Dispatch verification email in background
      const { sendVerificationEmail } = await import("@/lib/email");
      await sendVerificationEmail(cleanEmail, user.name, verificationCode);
    } catch (codeErr) {
      console.error("Failed to generate or send verification code:", codeErr);
    }

    const hasEmailProvider = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== "");

    const response = NextResponse.json({
      success: true,
      requiresVerification: true,
      demoCode: hasEmailProvider ? undefined : verificationCode,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    await setSessionCookie(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      response
    );

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An error occurred during account creation." }, { status: 500 });
  }
}
