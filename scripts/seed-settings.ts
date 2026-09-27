import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Load .env manually for standalone scripts
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.trim().match(/^([A-Za-z0-9_]+)=["']?(.*?)["']?$/);
    if (match && match[1] && match[2]) {
      process.env[match[1]] = match[2];
    }
  }
} catch {}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const seedSettings: [string, string][] = [
    ["NOWPAYMENTS_API_KEY", "J3QQ9RV-R1P48DN-N4GPDTX-TEYTJVK"],
    ["NOWPAYMENTS_IPN_SECRET", "MpmWpV2v86ECJONO0KbM5mEsNZfeAMab"],
    ["NOWPAYMENTS_SANDBOX", "false"],
    ["NEXT_PUBLIC_APP_URL", "https://noverailepublishing-tsukifi.vercel.app"],
    ["NEXT_PUBLIC_SITE_NAME", "Noveraile Publishing"],
    ["NEXT_PUBLIC_SITE_DOMAIN", "noverailepublishing.com"],
    ["NEXT_PUBLIC_DEFAULT_CURRENCY", "USD"],
    ["SMTP_HOST", "smtp.gmail.com"],
    ["SMTP_PORT", "465"],
    ["SMTP_SECURE", "true"],
    ["SMTP_USER", "noverailepublishing@gmail.com"],
    ["SMTP_PASS", "mgmjwrldkpfnyagg"],
    ["EMAIL_FROM", "Noveraile Publishing <noverailepublishing@gmail.com>"],
  ];

  const valuesSql = seedSettings
    .map(([k, v]) => `('${k}', '${v.replace(/'/g, "''")}', NOW())`)
    .join(", ");

  const query = `
    INSERT INTO "PlatformSetting" ("key", "value", "updatedAt")
    VALUES ${valuesSql}
    ON CONFLICT ("key") DO UPDATE
    SET "value" = EXCLUDED."value", "updatedAt" = NOW();
  `;

  await prisma.$executeRawUnsafe(query);
  console.log("🎉 Successfully saved all platform and SMTP settings to Neon PostgreSQL database in 1 query!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
