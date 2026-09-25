import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request payload." }, { status: 400 });
  }

  try {
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid credential format." }, { status: 400 });
    }

    // Protect against bcrypt DoS
    if (password.length > 128) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.length > 254 || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Rate Limiting: 15 attempts per 15 mins
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const ipRateLimitKey = `login_ip_${ip}`;
    const emailRateLimitKey = `login_email_${cleanEmail}`;

    if (!checkRateLimit(ipRateLimitKey, 15, 15 * 60 * 1000) || !checkRateLimit(emailRateLimitKey, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // Query user
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
      // Execute dummy bcrypt compare to prevent timing-based user enumeration attacks
      await verifyPassword(
        password,
        "$2a$10$e7eG1fWq1K8m1hN0B2uQ3uWb7GfCqO8kH2f0l1y7K2iW0x5f9j3O6"
      );
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This account has been suspended or deactivated. Please contact support." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // If user has not verified their email yet, require verification
    if (!user.isEmailVerified && user.role === "CUSTOMER") {
      const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Clean older unused codes
      await prisma.verificationCode.deleteMany({
        where: { email: cleanEmail, type: "EMAIL_VERIFICATION" },
      });

      // Save code
      await prisma.verificationCode.create({
        data: {
          email: cleanEmail,
          code,
          type: "EMAIL_VERIFICATION",
          expiresAt,
        },
      });

      // Send verification email
      try {
        const { sendVerificationEmail } = await import("@/lib/email");
        await sendVerificationEmail(cleanEmail, user.name, code);
      } catch (err) {
        console.error("Verification email dispatch failed:", err);
      }

      return NextResponse.json(
        {
          error: "Your email address is not verified yet. Please enter the 6-digit verification code sent to your inbox.",
          requiresVerification: true,
          email: cleanEmail,
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });

    await setSessionCookie(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      response
    );

    return response;
  } catch (error: any) {
    console.error("Login error:", error);

    const msg = error?.message || "";
    const isConnErr =
      msg.includes("Can't reach database") ||
      msg.includes("ConnectionReset") ||
      msg.includes("connection closed") ||
      msg.includes("ETIMEDOUT") ||
      error?.code === "P1001";

    if (isConnErr) {
      return NextResponse.json(
        { error: "Database connection initializing. Please retry in a few seconds." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred during sign in. Please try again." },
      { status: 500 }
    );
  }
}
