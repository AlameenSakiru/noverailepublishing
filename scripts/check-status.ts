import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  const books = await prisma.book.findMany({
    select: { id: true, title: true, slug: true, status: true, author: { select: { name: true } } },
  });
  const orders = await prisma.order.count();
  const reviews = await prisma.review.count();

  console.log("=== CURRENT USERS ===");
  console.log(JSON.stringify(users, null, 2));

  console.log("\n=== CURRENT BOOKS ===");
  console.log(JSON.stringify(books, null, 2));

  console.log(`\nOrders count: ${orders}, Reviews count: ${reviews}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
