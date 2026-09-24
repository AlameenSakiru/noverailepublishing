import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing fake transactions and test data while preserving catalog and admin...");

  // 1. Delete all order items, payments, and orders
  const deletedOrderItems = await prisma.orderItem.deleteMany();
  console.log(`Deleted ${deletedOrderItems.count} order items.`);

  const deletedPayments = await prisma.payment.deleteMany();
  console.log(`Deleted ${deletedPayments.count} payments.`);

  const deletedOrders = await prisma.order.deleteMany();
  console.log(`Deleted ${deletedOrders.count} orders.`);

  // 2. Delete all entitlements, reading progress, bookmarks, and reviews
  const deletedEntitlements = await prisma.entitlement.deleteMany();
  console.log(`Deleted ${deletedEntitlements.count} entitlements.`);

  const deletedProgress = await prisma.readingProgress.deleteMany();
  console.log(`Deleted ${deletedProgress.count} reading progress records.`);

  const deletedBookmarks = await prisma.bookmark.deleteMany();
  console.log(`Deleted ${deletedBookmarks.count} bookmarks.`);

  const deletedReviews = await prisma.review.deleteMany();
  console.log(`Deleted ${deletedReviews.count} reviews.`);

  // 3. Delete coupon usages and coupons
  const deletedCouponUses = await prisma.couponUse.deleteMany();
  console.log(`Deleted ${deletedCouponUses.count} coupon uses.`);

  const deletedCoupons = await prisma.coupon.deleteMany();
  console.log(`Deleted ${deletedCoupons.count} coupons.`);

  // 4. Delete the 10 fake seeded customer accounts
  const fakeCustomerEmails = [
    "sarah.jenkins@hospitalnet.org",
    "marcus.chen@rxclinical.com",
    "david.korzen@cloudinfra.io",
    "elena.rossi@strategicadvisors.com",
    "soren.lindqvist@arcticroutes.no",
    "clara.morales@literarycircle.org",
    "alex.turner@pharmahealth.com",
    "priya.patel@clinicalreview.edu",
    "nathan.brooks@enterprisesec.net",
    "hannah.m@highlandsexpeditions.co.uk",
  ];

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: { in: fakeCustomerEmails },
    },
  });
  console.log(`Deleted ${deletedUsers.count} fake customer accounts.`);

  // Verify remaining data
  const remainingUsers = await prisma.user.findMany({ select: { email: true, role: true } });
  const remainingBooks = await prisma.book.count();
  const remainingOrders = await prisma.order.count();

  console.log("\n=== DATABASE CLEANUP SUMMARY ===");
  console.log(`Remaining Books in Catalog: ${remainingBooks}`);
  console.log(`Remaining Orders: ${remainingOrders}`);
  console.log(`Remaining Users: ${remainingUsers.length} (${remainingUsers.map((u) => `${u.email} [${u.role}]`).join(", ")})`);
  console.log("Database is clean and ready for real testing data!");
}

main()
  .catch((e) => {
    console.error("Error clearing fake data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
