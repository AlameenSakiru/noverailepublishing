import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const companyEmail = "noverailepublishing@gmail.com";
  const defaultPassword = "AdminPass2026!";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  console.log(`Setting up Admin user for ${companyEmail}...`);

  const user = await prisma.user.upsert({
    where: { email: companyEmail },
    update: {
      role: "ADMIN",
      name: "Editorial Director",
      isEmailVerified: true,
      status: "ACTIVE",
      passwordHash,
    },
    create: {
      email: companyEmail,
      name: "Editorial Director",
      passwordHash,
      role: "ADMIN",
      isEmailVerified: true,
      status: "ACTIVE",
    },
  });

  console.log(`✅ Admin user successfully configured:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Password: ${defaultPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
