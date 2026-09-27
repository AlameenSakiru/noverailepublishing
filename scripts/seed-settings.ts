import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const seedSettings = [
    { key: "NOWPAYMENTS_API_KEY", value: "J3QQ9RV-R1P48DN-N4GPDTX-TEYTJVK" },
    { key: "NOWPAYMENTS_IPN_SECRET", value: "MpmWpV2v86ECJONO0KbM5mEsNZfeAMab" },
    { key: "NOWPAYMENTS_SANDBOX", value: "false" },
    { key: "NEXT_PUBLIC_APP_URL", value: "https://noverailepublishing-tsukifi.vercel.app" },
    { key: "NEXT_PUBLIC_SITE_NAME", value: "Noveraile Publishing" },
    { key: "NEXT_PUBLIC_SITE_DOMAIN", value: "noverailepublishing.com" },
    { key: "NEXT_PUBLIC_DEFAULT_CURRENCY", value: "USD" },
  ];

  for (const s of seedSettings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
    console.log(`✅ Seeded setting: ${s.key}`);
  }

  console.log("🎉 All settings successfully persisted to Neon PostgreSQL DB!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
