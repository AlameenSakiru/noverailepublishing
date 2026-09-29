import prisma from "../src/lib/prisma";

async function main() {
  console.log("Updating admin user names in Neon PostgreSQL database...");

  const updateResult = await prisma.user.updateMany({
    where: {
      OR: [
        { name: "Editorial Director" },
        { name: "Company Administrator" },
        { email: "admin@noveraile.com" },
        { email: "noverailepublishing@gmail.com", role: "ADMIN" },
      ],
    },
    data: {
      name: "Noveraile Publishing Director",
    },
  });

  console.log(`✅ Updated ${updateResult.count} admin user record(s) to 'Noveraile Publishing Director'.`);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log("Current admin users in DB:", JSON.stringify(admins, null, 2));
}

main()
  .catch((e) => {
    console.error("Error updating admin name:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
