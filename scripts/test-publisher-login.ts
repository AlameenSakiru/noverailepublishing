import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const email = "publisher@noverailepublishing.com";
  const rawPassword = "Publisher2026!";

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error("❌ User not found in DB!");
    return;
  }

  const isMatch = await bcrypt.compare(rawPassword, user.passwordHash);
  console.log(`Password match check: ${isMatch ? "✅ MATCHED" : "❌ FAILED"}`);
  console.log(`User role: ${user.role} (Should be EDITOR)`);
  console.log(`User status: ${user.status} (Should be ACTIVE)`);

  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };

  const token = signToken(payload);
  const verified = verifyToken(token);
  console.log(`JWT Token generation & verification: ${verified?.email === email ? "✅ VALID" : "❌ FAILED"}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
