import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CLEARING ALL ORDER AND TRANSACTION DATA ===");

  const ordersCount = await prisma.order.count();
  console.log(`Current orders in database: ${ordersCount}`);

  // 1. Delete RefundRecords
  const deletedRefunds = await prisma.refundRecord.deleteMany();
  console.log(`Deleted ${deletedRefunds.count} refund records.`);

  // 2. Delete Payments
  const deletedPayments = await prisma.payment.deleteMany();
  console.log(`Deleted ${deletedPayments.count} payment transactions.`);

  // 3. Delete OrderItems
  const deletedOrderItems = await prisma.orderItem.deleteMany();
  console.log(`Deleted ${deletedOrderItems.count} order items.`);

  // 4. Delete CouponUses tied to orders
  const deletedCouponUses = await prisma.couponUse.deleteMany();
  console.log(`Deleted ${deletedCouponUses.count} coupon uses.`);

  // 5. Delete Orders
  const deletedOrders = await prisma.order.deleteMany();
  console.log(`Deleted ${deletedOrders.count} orders.`);

  // 6. Reset entitlements and reading progress from test orders (optional: keeping or removing test entitlements)
  // Let's delete entitlements that were generated from orders
  const deletedEntitlements = await prisma.entitlement.deleteMany({
    where: {
      orderId: { not: null },
    },
  });
  console.log(`Cleared ${deletedEntitlements.count} test purchase entitlements.`);

  console.log("=== ALL ORDER DATA SUCCESSFULLY CLEARED ===");
}

main()
  .catch((e) => {
    console.error("Error clearing orders:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
