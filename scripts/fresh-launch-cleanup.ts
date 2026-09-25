import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== EXECUTING FRESH LAUNCH DATABASE RESET ===");

  // 1. Delete all financial and order records
  const deletedPayments = await prisma.payment.deleteMany();
  console.log(`Deleted ${deletedPayments.count} payment transactions.`);

  const deletedOrderItems = await prisma.orderItem.deleteMany();
  console.log(`Deleted ${deletedOrderItems.count} order line items.`);

  const deletedOrders = await prisma.order.deleteMany();
  console.log(`Deleted ${deletedOrders.count} order records.`);

  const deletedCouponUses = await prisma.couponUse.deleteMany();
  console.log(`Deleted ${deletedCouponUses.count} coupon uses.`);

  // 2. Identify the user's real uploaded book
  const userBook = await prisma.book.findFirst({
    where: {
      slug: "the-retired-dragon-slayer-teaches-pottery",
    },
    include: {
      author: true,
    },
  });

  if (!userBook) {
    throw new Error("Could not find 'the-retired-dragon-slayer-teaches-pottery' book! Aborting cleanup to protect data.");
  }

  console.log(`Preserving real book: "${userBook.title}" (ID: ${userBook.id})`);

  // 3. Delete all demo books except the real uploaded book
  const demoBooks = await prisma.book.findMany({
    where: {
      id: { not: userBook.id },
    },
    select: { id: true, title: true, slug: true },
  });

  console.log(`Found ${demoBooks.length} demo book(s) to remove:`, demoBooks.map((b) => b.title));

  const demoBookIds = demoBooks.map((b) => b.id);

  // Delete associated assets for demo books
  await prisma.examMetadata.deleteMany({
    where: { bookId: { in: demoBookIds } },
  });
  await prisma.bookPageAsset.deleteMany({
    where: { bookId: { in: demoBookIds } },
  });
  await prisma.review.deleteMany({
    where: { bookId: { in: demoBookIds } },
  });
  await prisma.entitlement.deleteMany({
    where: { bookId: { in: demoBookIds } },
  });
  await prisma.readingProgress.deleteMany({
    where: { bookId: { in: demoBookIds } },
  });
  await prisma.bookmark.deleteMany({
    where: { bookId: { in: demoBookIds } },
  });

  const deletedBooks = await prisma.book.deleteMany({
    where: { id: { in: demoBookIds } },
  });
  console.log(`Deleted ${deletedBooks.count} demo books.`);

  // Clean demo authors if not attached to any book
  const unusedAuthors = await prisma.author.findMany({
    where: {
      books: { none: {} },
    },
  });
  for (const a of unusedAuthors) {
    await prisma.author.delete({ where: { id: a.id } });
  }
  console.log(`Cleaned up ${unusedAuthors.length} unused demo author records.`);

  // 4. Delete demo customer users
  const demoEmails = [
    "reader@example.com",
    "sarah.jenkins@example.com",
    "marcus.vance@example.com",
    "claire.thornton@example.com",
    "david.okafor@example.com",
  ];

  await prisma.readingProgress.deleteMany({
    where: { user: { email: { in: demoEmails } } },
  });
  await prisma.entitlement.deleteMany({
    where: { user: { email: { in: demoEmails } } },
  });
  await prisma.bookmark.deleteMany({
    where: { user: { email: { in: demoEmails } } },
  });
  await prisma.review.deleteMany({
    where: { user: { email: { in: demoEmails } } },
  });
  await prisma.session.deleteMany({
    where: { user: { email: { in: demoEmails } } },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { in: demoEmails } },
  });
  console.log(`Deleted ${deletedUsers.count} demo customer accounts.`);

  // 5. Ensure Editorial / Admin accounts exist
  const hashedPassword = await bcrypt.hash("AdminPass2026!", 10);

  // admin@noveraile.com
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@noveraile.com" },
    create: {
      email: "admin@noveraile.com",
      passwordHash: hashedPassword,
      name: "Editorial Director",
      role: "ADMIN",
      isEmailVerified: true,
      status: "ACTIVE",
    },
    update: {
      name: "Editorial Director",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`Verified Admin account: admin@noveraile.com (ID: ${adminUser.id})`);

  // editorial@noveraile.com
  const editorialUser = await prisma.user.upsert({
    where: { email: "editorial@noveraile.com" },
    create: {
      email: "editorial@noveraile.com",
      passwordHash: hashedPassword,
      name: "Editorial Team",
      role: "ADMIN",
      isEmailVerified: true,
      status: "ACTIVE",
    },
    update: {
      name: "Editorial Team",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`Verified Editorial account: editorial@noveraile.com (ID: ${editorialUser.id})`);

  // 6. Grant Entitlement for the user's book to admin & editorial accounts
  for (const user of [adminUser, editorialUser]) {
    await prisma.entitlement.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: userBook.id,
        },
      },
      create: {
        userId: user.id,
        bookId: userBook.id,
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE",
      },
    });

    await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: userBook.id,
        },
      },
      create: {
        userId: user.id,
        bookId: userBook.id,
        currentPage: 1,
        totalPages: 115,
        progressPercent: 0,
      },
      update: {
        totalPages: 115,
      },
    });
  }
  console.log("Granted full editorial library access to the book for both accounts.");

  // 7. Ensure user book has PUBLISHED status and is featured
  await prisma.book.update({
    where: { id: userBook.id },
    data: {
      status: "PUBLISHED",
      isFeatured: true,
      pageCount: 115,
      coverImage: "/covers/glazed_1790278360434.jpg",
    },
  });

  // Final summary verification
  const remainingBooks = await prisma.book.findMany({ select: { title: true, slug: true, status: true } });
  const remainingUsers = await prisma.user.findMany({ select: { email: true, name: true, role: true } });
  const orderCount = await prisma.order.count();
  const reviewCount = await prisma.review.count();

  console.log("\n===========================================");
  console.log("FRESH WEBSITE RESET COMPLETE!");
  console.log("===========================================");
  console.log("Catalog Books (Active):", remainingBooks);
  console.log("Remaining Users:", remainingUsers);
  console.log(`Orders in System: ${orderCount}`);
  console.log(`Reviews in System: ${reviewCount}`);
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
