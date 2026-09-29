import prisma from "./prisma";

export const CURRENCY_MAP: Record<string, { label: string; symbol: string }> = {
  USD: { label: "USD ($) — US Dollar", symbol: "$" },
  NGN: { label: "NGN (₦) — Nigerian Naira", symbol: "₦" },
  EUR: { label: "EUR (€) — Euro", symbol: "€" },
  GBP: { label: "GBP (£) — British Pound", symbol: "£" },
  CAD: { label: "CAD (CA$) — Canadian Dollar", symbol: "CA$" },
  AUD: { label: "AUD (AU$) — Australian Dollar", symbol: "AU$" },
  GHS: { label: "GHS (GH₵) — Ghanaian Cedi", symbol: "GH₵" },
  ZAR: { label: "ZAR (R) — South African Rand", symbol: "R" },
  KES: { label: "KES (KSh) — Kenyan Shilling", symbol: "KSh" },
};

export interface StorefrontData {
  siteName: string;
  siteTagline: string;
  siteSubTagline: string;
  contactEmail: string;
  currency: string;
  currencySymbol: string;
  announcementBanner: string;
  announcementEnabled: boolean;
  logoStyle: "IMAGE" | "TEXT";
  usdToNgnRate: number;
}

/**
 * Retrieves a platform configuration setting with priority:
 * 1. Persistent Neon PostgreSQL database (PlatformSetting table)
 * 2. Process Environment Variable (process.env)
 * 3. Default fallback value
 */
export async function getSettingValue(key: string, defaultValue = ""): Promise<string> {
  try {
    const record = await prisma.platformSetting.findUnique({
      where: { key },
    });
    if (record && record.value !== undefined && record.value !== "") {
      return record.value;
    }
  } catch (err) {
    // Database transient error fallback
  }
  return process.env[key] || defaultValue;
}

/**
 * Loads all platform settings stored in the database as a key-value dictionary.
 */
export async function getAllPlatformSettings(): Promise<Record<string, string>> {
  const settingsMap: Record<string, string> = {};
  try {
    const records = await prisma.platformSetting.findMany();
    for (const r of records) {
      settingsMap[r.key] = r.value;
    }
  } catch (err) {
    // Database transient error fallback
  }
  return settingsMap;
}

/**
 * Saves platform settings into the persistent database and updates in-memory environment.
 */
export async function savePlatformSettings(updates: Record<string, string>): Promise<boolean> {
  let anyFailed = false;
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    try {
      await prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
      process.env[key] = String(value);
    } catch (err) {
      console.error(`❌ Failed to save setting [${key}] to database:`, err);
      anyFailed = true;
    }
  }
  return !anyFailed;
}

/**
 * Assembles dynamic storefront branding, typography, and localization tokens.
 */
export async function getStorefrontSettings(): Promise<StorefrontData> {
  const dbSettings = await getAllPlatformSettings();
  const currency = (
    dbSettings.NEXT_PUBLIC_DEFAULT_CURRENCY ||
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ||
    "USD"
  ).toUpperCase();
  const currencySymbol =
    dbSettings.NEXT_PUBLIC_CURRENCY_SYMBOL ||
    CURRENCY_MAP[currency]?.symbol ||
    "$";

  return {
    siteName:
      dbSettings.NEXT_PUBLIC_SITE_NAME ||
      process.env.NEXT_PUBLIC_SITE_NAME ||
      "Noveraile Publishing",
    siteTagline:
      dbSettings.NEXT_PUBLIC_SITE_TAGLINE ||
      process.env.NEXT_PUBLIC_SITE_TAGLINE ||
      "Books built for where you're going next.",
    siteSubTagline:
      dbSettings.NEXT_PUBLIC_SITE_SUBTAGLINE ||
      process.env.NEXT_PUBLIC_SITE_SUBTAGLINE ||
      "Authoritative publications across professional certification prep, literature, travel, and strategic leadership. Read instantly in your browser on any device — zero apps or downloads required.",
    contactEmail:
      dbSettings.NEXT_PUBLIC_CONTACT_EMAIL ||
      process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
      "noverailepublishing@gmail.com",
    currency,
    currencySymbol,
    announcementBanner: dbSettings.NEXT_PUBLIC_ANNOUNCEMENT_BANNER || "",
    announcementEnabled: dbSettings.NEXT_PUBLIC_ANNOUNCEMENT_ENABLED === "true",
    logoStyle: (dbSettings.NEXT_PUBLIC_LOGO_STYLE as any) || "IMAGE",
    usdToNgnRate: Number(dbSettings.USD_TO_NGN_RATE || process.env.USD_TO_NGN_RATE) || 1600,
  };
}

/**
 * Gets the current USD to NGN exchange rate for Paystack checkout.
 * Defaults to 1600 if not set.
 */
export async function getUsdToNgnRate(): Promise<number> {
  const rateVal = await getSettingValue("USD_TO_NGN_RATE", process.env.USD_TO_NGN_RATE || "1600");
  const num = Number(rateVal);
  return Number.isFinite(num) && num > 0 ? num : 1600;
}
