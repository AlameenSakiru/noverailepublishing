import prisma from "../src/lib/prisma";

async function main() {
  console.log("Removing all orders, entitlements, bookmarks, and reading progress from all accounts...");

  const entitlements = await prisma.entitlement.deleteMany();
  const progress = await prisma.readingProgress.deleteMany();
  const bookmarks = await prisma.bookmark.deleteMany();
  const orderItems = await prisma.orderItem.deleteMany();
  const payments = await prisma.payment.deleteMany();
  const orders = await prisma.order.deleteMany();

  console.log("Deleted records:");
  console.log(`- Entitlements: ${entitlements.count}`);
  console.log(`- Reading Progress: ${progress.count}`);
  console.log(`- Bookmarks: ${bookmarks.count}`);
  console.log(`- Order Items: ${orderItems.count}`);
  console.log(`- Payments: ${payments.count}`);
  console.log(`- Orders: ${orders.count}`);

  const remainingEntitlements = await prisma.entitlement.count();
  const remainingOrders = await prisma.order.count();

  console.log(`\nRemaining Entitlements across all users: ${remainingEntitlements}`);
  console.log(`Remaining Orders across all users: ${remainingOrders}`);
  console.log("Library is now 100% empty for admin and all accounts!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
