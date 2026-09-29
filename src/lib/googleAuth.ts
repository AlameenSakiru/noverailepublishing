import prisma from "./prisma";

/**
 * Resolves Google OAuth credentials with priority:
 * 1. Persistent PostgreSQL Database (PlatformSetting table)
 * 2. Process Environment Variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
 */
export async function getResolvedGoogleCredentials() {
  let clientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    "";
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";

  try {
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["GOOGLE_CLIENT_ID", "NEXT_PUBLIC_GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
        },
      },
    });

    for (const s of settings) {
      if ((s.key === "GOOGLE_CLIENT_ID" || s.key === "NEXT_PUBLIC_GOOGLE_CLIENT_ID") && s.value) {
        const val = s.value.trim();
        if (val.includes(".apps.googleusercontent.com") && !val.includes("@")) {
          clientId = val;
        }
      }
      if (s.key === "GOOGLE_CLIENT_SECRET" && s.value) {
        const val = s.value.trim();
        if (!val.includes("@")) {
          clientSecret = val;
        }
      }
    }
  } catch (err) {
    console.warn("Could not query platform settings for Google credentials:", err);
  }

  const isValidClientId = Boolean(
    clientId &&
    clientId.includes(".apps.googleusercontent.com") &&
    !clientId.includes("@")
  );
  const isValidClientSecret = Boolean(
    clientSecret &&
    !clientSecret.includes("@") &&
    clientSecret.length >= 10
  );
  const isConfigured = Boolean(isValidClientId && isValidClientSecret);

  const secretKeyMasked = clientSecret && isValidClientSecret
    ? `••••••••••••••••${clientSecret.slice(-4)}`
    : "";

  return {
    isConfigured,
    clientId: isValidClientId ? clientId : "",
    clientSecret: isValidClientSecret ? clientSecret : "",
    secretKeyMasked,
  };
}

/**
 * Derives the canonical OAuth callback URL matching the Google Cloud Console registration.
 */
export function getGoogleOAuthRedirectUri(req: Request, fallbackAppUrl?: string): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const protocol = req.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "https");

  if (host) {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const proto = isLocal ? "http" : (protocol || "https");
    return `${proto}://${host}/api/auth/google/callback`;
  }

  const rawBase = fallbackAppUrl?.trim() || `${protocol}://${host}`;
  const normalizedBase = rawBase.replace(/\/+$/, "");
  return `${normalizedBase}/api/auth/google/callback`;
}
