import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSessionCookie, hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const protocol = req.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "https");
  const baseUrl = `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const destination = state ? decodeURIComponent(state) : "/my-library";

  if (errorParam || !code) {
    console.warn("Google OAuth callback error or cancelled:", errorParam);
    return NextResponse.redirect(`${baseUrl}/login?error=Google+sign-in+was+cancelled`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${baseUrl}/login?error=Missing+Google+OAuth+credentials+on+server`
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Failed to exchange code with Google:", tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=Failed+to+authenticate+with+Google`);
    }

    // Fetch user profile from Google UserInfo endpoint
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();

    if (!userRes.ok || !userData.email) {
      console.error("Failed to fetch Google userinfo:", userData);
      return NextResponse.redirect(`${baseUrl}/login?error=Could+not+retrieve+Google+profile`);
    }

    const email = userData.email.toLowerCase().trim();
    const name = userData.name || userData.given_name || email.split("@")[0];
    const avatarUrl = userData.picture || null;

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const randomSecret = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomSecret);

      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          avatarUrl,
          isEmailVerified: true,
          status: "ACTIVE",
          role: "CUSTOMER",
        },
      });
    } else {
      if (!user.avatarUrl && avatarUrl) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl, isEmailVerified: true },
        });
      }
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.redirect(`${baseUrl}/login?error=Account+is+suspended`);
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const targetUrl = destination.startsWith("http") ? destination : `${baseUrl}${destination.startsWith("/") ? destination : `/${destination}`}`;
    const response = NextResponse.redirect(targetUrl);

    await setSessionCookie(sessionPayload, response);

    return response;
  } catch (err: any) {
    console.error("Google OAuth callback exception:", err);
    return NextResponse.redirect(`${baseUrl}/login?error=Google+login+failed`);
  }
}
