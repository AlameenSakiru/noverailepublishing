import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding realistic aligned orders and transactions...");

  const books = await prisma.book.findMany({
    include: { imprint: true },
  });

  const ptcb = books.find((b) => b.slug.includes("ptcb"));
  const nclex = books.find((b) => b.slug.includes("nclex"));
  const sec = books.find((b) => b.slug.includes("security"));
  const travel = books.find((b) => b.slug.includes("campervan"));
  const biz = books.find((b) => b.slug.includes("leadership"));
  const fiction = books.find((b) => b.slug.includes("venice"));

  if (!ptcb || !nclex || !sec || !travel || !biz || !fiction) {
    console.error("Missing books in database.");
    return;
  }

  // Create reader users if not existing
  const readerEmails = [
    { email: "sarah.jenkins@hospitalnet.org", name: "Sarah Jenkins, BSN" },
    { email: "marcus.chen@rxclinical.com", name: "Marcus Chen, CPhT" },
    { email: "david.korzen@cloudinfra.io", name: "David Korzen, CISSP" },
    { email: "elena.rossi@strategicadvisors.com", name: "Elena Rossi" },
    { email: "soren.lindqvist@arcticroutes.no", name: "Soren Lindqvist" },
    { email: "clara.morales@literarycircle.org", name: "Clara Morales" },
    { email: "alex.turner@pharmahealth.com", name: "Alex Turner" },
    { email: "priya.patel@clinicalreview.edu", name: "Dr. Priya Patel" },
    { email: "nathan.brooks@enterprisesec.net", name: "Nathan Brooks" },
    { email: "hannah.m@highlandsexpeditions.co.uk", name: "Hannah MacLeod" },
  ];

  const userMap = new Map<string, string>();
  for (const r of readerEmails) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        name: r.name,
        passwordHash: "$2a$10$w82z4Zg3vQ1Z5uQk6l6FkeqH11zWq2N6F5N3fKz7Yk4wE8k9.1xS2",
        role: "CUSTOMER",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    });
    userMap.set(r.email, user.id);
  }

  // Define realistic orders spread across days and months of 2026
  // Current date anchor: Sep 24, 2026
  const ordersData = [
    // Today: Sep 24, 2026 (Wednesday) - 4 orders
    { book: ptcb, email: "sarah.jenkins@hospitalnet.org", daysAgo: 0, orderNum: "NOV-2026-98124" },
    { book: nclex, email: "marcus.chen@rxclinical.com", daysAgo: 0, orderNum: "NOV-2026-98125" },
    { book: sec, email: "david.korzen@cloudinfra.io", daysAgo: 0, orderNum: "NOV-2026-98126" },
    { book: travel, email: "soren.lindqvist@arcticroutes.no", daysAgo: 0, orderNum: "NOV-2026-98127" },

    // Sep 23, 2026 (Tuesday) - 5 orders
    { book: nclex, email: "priya.patel@clinicalreview.edu", daysAgo: 1, orderNum: "NOV-2026-98011" },
    { book: ptcb, email: "alex.turner@pharmahealth.com", daysAgo: 1, orderNum: "NOV-2026-98012" },
    { book: biz, email: "elena.rossi@strategicadvisors.com", daysAgo: 1, orderNum: "NOV-2026-98013" },
    { book: sec, email: "nathan.brooks@enterprisesec.net", daysAgo: 1, orderNum: "NOV-2026-98014" },
    { book: nclex, email: "sarah.jenkins@hospitalnet.org", daysAgo: 1, orderNum: "NOV-2026-98015" },

    // Sep 22, 2026 (Monday) - 4 orders
    { book: ptcb, email: "marcus.chen@rxclinical.com", daysAgo: 2, orderNum: "NOV-2026-97841" },
    { book: travel, email: "hannah.m@highlandsexpeditions.co.uk", daysAgo: 2, orderNum: "NOV-2026-97842" },
    { book: fiction, email: "clara.morales@literarycircle.org", daysAgo: 2, orderNum: "NOV-2026-97843" },
    { book: sec, email: "david.korzen@cloudinfra.io", daysAgo: 2, orderNum: "NOV-2026-97844" },

    // Sep 21, 2026 (Sunday) - 3 orders
    { book: nclex, email: "priya.patel@clinicalreview.edu", daysAgo: 3, orderNum: "NOV-2026-97619" },
    { book: ptcb, email: "alex.turner@pharmahealth.com", daysAgo: 3, orderNum: "NOV-2026-97620" },
    { book: biz, email: "elena.rossi@strategicadvisors.com", daysAgo: 3, orderNum: "NOV-2026-97621" },

    // Sep 20, 2026 (Saturday) - 4 orders
    { book: travel, email: "soren.lindqvist@arcticroutes.no", daysAgo: 4, orderNum: "NOV-2026-97450" },
    { book: ptcb, email: "sarah.jenkins@hospitalnet.org", daysAgo: 4, orderNum: "NOV-2026-97451" },
    { book: nclex, email: "marcus.chen@rxclinical.com", daysAgo: 4, orderNum: "NOV-2026-97452" },
    { book: sec, email: "nathan.brooks@enterprisesec.net", daysAgo: 4, orderNum: "NOV-2026-97453" },

    // Sep 19, 2026 (Friday) - 6 orders (Peak sales day)
    { book: ptcb, email: "alex.turner@pharmahealth.com", daysAgo: 5, orderNum: "NOV-2026-97201" },
    { book: nclex, email: "priya.patel@clinicalreview.edu", daysAgo: 5, orderNum: "NOV-2026-97202" },
    { book: sec, email: "david.korzen@cloudinfra.io", daysAgo: 5, orderNum: "NOV-2026-97203" },
    { book: biz, email: "elena.rossi@strategicadvisors.com", daysAgo: 5, orderNum: "NOV-2026-97204" },
    { book: travel, email: "hannah.m@highlandsexpeditions.co.uk", daysAgo: 5, orderNum: "NOV-2026-97205" },
    { book: fiction, email: "clara.morales@literarycircle.org", daysAgo: 5, orderNum: "NOV-2026-97206" },

    // Sep 18, 2026 (Thursday) - 4 orders
    { book: ptcb, email: "marcus.chen@rxclinical.com", daysAgo: 6, orderNum: "NOV-2026-96980" },
    { book: nclex, email: "sarah.jenkins@hospitalnet.org", daysAgo: 6, orderNum: "NOV-2026-96981" },
    { book: sec, email: "nathan.brooks@enterprisesec.net", daysAgo: 6, orderNum: "NOV-2026-96982" },
    { book: travel, email: "soren.lindqvist@arcticroutes.no", daysAgo: 6, orderNum: "NOV-2026-96983" },

    // Earlier in September (Sep 12 - Sep 17) - 6 orders
    { book: ptcb, email: "alex.turner@pharmahealth.com", daysAgo: 8, orderNum: "NOV-2026-96310" },
    { book: nclex, email: "priya.patel@clinicalreview.edu", daysAgo: 9, orderNum: "NOV-2026-96102" },
    { book: sec, email: "david.korzen@cloudinfra.io", daysAgo: 10, orderNum: "NOV-2026-95890" },
    { book: biz, email: "elena.rossi@strategicadvisors.com", daysAgo: 11, orderNum: "NOV-2026-95620" },
    { book: travel, email: "hannah.m@highlandsexpeditions.co.uk", daysAgo: 12, orderNum: "NOV-2026-95310" },
    { book: ptcb, email: "sarah.jenkins@hospitalnet.org", daysAgo: 13, orderNum: "NOV-2026-95004" },

    // August 2026 - 4 orders
    { book: nclex, email: "marcus.chen@rxclinical.com", daysAgo: 35, orderNum: "NOV-2026-91200" },
    { book: ptcb, email: "alex.turner@pharmahealth.com", daysAgo: 38, orderNum: "NOV-2026-90800" },
    { book: sec, email: "nathan.brooks@enterprisesec.net", daysAgo: 42, orderNum: "NOV-2026-90100" },
    { book: fiction, email: "clara.morales@literarycircle.org", daysAgo: 45, orderNum: "NOV-2026-89700" },

    // July 2026 - 3 orders
    { book: ptcb, email: "sarah.jenkins@hospitalnet.org", daysAgo: 65, orderNum: "NOV-2026-85400" },
    { book: nclex, email: "priya.patel@clinicalreview.edu", daysAgo: 70, orderNum: "NOV-2026-84800" },
    { book: travel, email: "soren.lindqvist@arcticroutes.no", daysAgo: 75, orderNum: "NOV-2026-84100" },

    // June 2026 - 3 orders
    { book: biz, email: "elena.rossi@strategicadvisors.com", daysAgo: 95, orderNum: "NOV-2026-78900" },
    { book: sec, email: "david.korzen@cloudinfra.io", daysAgo: 100, orderNum: "NOV-2026-78200" },
    { book: ptcb, email: "marcus.chen@rxclinical.com", daysAgo: 105, orderNum: "NOV-2026-77500" },
  ];

  let createdCount = 0;
  for (const item of ordersData) {
    const price = item.book.salePrice || item.book.price;
    const orderDate = new Date("2026-09-24T08:00:00.000Z");
    orderDate.setDate(orderDate.getDate() - item.daysAgo);

    const userId = userMap.get(item.email) || null;

    // Check if order number already exists
    const existing = await prisma.order.findUnique({
      where: { orderNumber: item.orderNum },
    });

    if (existing) continue;

    const order = await prisma.order.create({
      data: {
        orderNumber: item.orderNum,
        userId: userId,
        customerEmail: item.email,
        totalAmount: price,
        subtotal: price,
        discountAmount: 0.0,
        currency: "USD",
        paymentStatus: "PAID",
        stripeSessionId: `sess_${item.orderNum.toLowerCase()}`,
        stripePaymentIntentId: `pi_${item.orderNum.toLowerCase()}`,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: {
            bookId: item.book.id,
            price: price,
            bookTitle: item.book.title,
          },
        },
        payment: {
          create: {
            provider: "STRIPE",
            transactionId: `ch_${item.orderNum.toLowerCase()}`,
            status: "SUCCEEDED",
            amount: price,
            currency: "USD",
            createdAt: orderDate,
          },
        },
      },
    });

    // Grant reading entitlement
    if (userId) {
      await prisma.entitlement.upsert({
        where: {
          userId_bookId: {
            userId: userId,
            bookId: item.book.id,
          },
        },
        update: {
          status: "ACTIVE",
        },
        create: {
          userId: userId,
          bookId: item.book.id,
          orderId: order.id,
          status: "ACTIVE",
          grantedAt: orderDate,
        },
      });
    }

    createdCount++;
  }

  console.log(`Successfully seeded ${createdCount} realistic orders aligned across all periods!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
