import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const redirectParam = url.searchParams.get("redirect") || "/my-library";

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
    const protocol = req.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "https");
    const baseUrl = `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      // If Google Client ID is not configured yet, redirect to a guided setup notice
      const setupNoticeUrl = new URL(`${baseUrl}/login`);
      setupNoticeUrl.searchParams.set(
        "error",
        "Google OAuth credentials (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET) are not configured in Vercel environment variables yet. Please sign in with email or configure Google Cloud Console."
      );
      return NextResponse.redirect(setupNoticeUrl.toString());
    }

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "select_account");
    googleAuthUrl.searchParams.set("state", encodeURIComponent(redirectParam));

    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error: any) {
    console.error("Google OAuth initiate error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_init_failed", req.url));
  }
}
