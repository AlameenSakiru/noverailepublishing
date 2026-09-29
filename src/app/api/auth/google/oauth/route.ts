import { NextResponse } from "next/server";
import { getResolvedGoogleCredentials, getGoogleOAuthRedirectUri } from "@/lib/googleAuth";
import { getSettingValue } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const redirectParam = url.searchParams.get("redirect") || "/my-library";

    const configuredAppUrl = await getSettingValue("NEXT_PUBLIC_APP_URL");
    const redirectUri = getGoogleOAuthRedirectUri(req, configuredAppUrl);

    const { clientId, isConfigured } = await getResolvedGoogleCredentials();

    if (!clientId || !isConfigured) {
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
      const protocol = req.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "https");
      const baseUrl = `${protocol}://${host}`;

      const referer = req.headers.get("referer") || "";
      const isRegister = referer.includes("/register") || url.searchParams.get("from") === "register";
      const targetPath = isRegister ? "/register" : "/login";

      const setupNoticeUrl = new URL(`${baseUrl}${targetPath}`);
      setupNoticeUrl.searchParams.set(
        "error",
        "Google Sign-In is not configured yet. Please sign up or sign in using your email and password below."
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
