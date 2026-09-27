import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "publisher@noverailepublishing.com";
  const password = "Publisher2026!";
  const passwordHash = await bcrypt.hash(password, 10);

  const publisher = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Book Publishing Editor",
      role: "EDITOR",
      passwordHash,
      isEmailVerified: true,
      status: "ACTIVE",
    },
    create: {
      email,
      name: "Book Publishing Editor",
      role: "EDITOR",
      passwordHash,
      isEmailVerified: true,
      status: "ACTIVE",
    },
  });

  console.log("✅ Successfully provisioned Dedicated Book Publishing Admin:");
  console.log(`Email: ${publisher.email}`);
  console.log(`Name: ${publisher.name}`);
  console.log(`Role: ${publisher.role}`);
  console.log(`Status: ${publisher.status}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error("Error creating publishing admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
