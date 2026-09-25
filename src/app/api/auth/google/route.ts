import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSessionCookie, hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credential, email: directEmail, name: directName, avatarUrl: directAvatar } = body;

    let email = directEmail;
    let name = directName;
    let avatarUrl = directAvatar;

    // If Google ID Token is supplied, verify with Google's tokeninfo endpoint
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          email = payload.email;
          name = payload.name || payload.given_name || email.split("@")[0];
          avatarUrl = payload.picture;
        } else {
          // If tokeninfo verification fails, check if client provided email directly or throw
          if (!email) {
            return NextResponse.json(
              { success: false, error: "Invalid Google credential token." },
              { status: 401 }
            );
          }
        }
      } catch (tokenErr) {
        console.warn("Google token verification network check fallback:", tokenErr);
      }
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid Google email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const displayName = (name || normalizedEmail.split("@")[0]).trim();

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const randomSecret = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomSecret);

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          passwordHash,
          avatarUrl: avatarUrl || null,
          isEmailVerified: true,
          status: "ACTIVE",
          role: "CUSTOMER",
        },
      });
    } else {
      // If user exists and doesn't have an avatar or verified status, update it
      if (!user.avatarUrl && avatarUrl) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl, isEmailVerified: true },
        });
      }
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Account is suspended. Please contact publisher support." },
        { status: 403 }
      );
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    await setSessionCookie(sessionPayload, response);

    return response;
  } catch (error: any) {
    console.error("Google auth endpoint error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication service temporarily unavailable." },
      { status: 500 }
    );
  }
}
