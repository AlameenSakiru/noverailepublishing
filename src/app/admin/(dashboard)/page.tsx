import React from "react";
import prisma from "@/lib/prisma";
import { AdminOverviewClient, ChartDataPoint, BookDataset } from "./AdminOverviewClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard | Noveraile Publishing",
  description: "Overview of sales, orders, and catalog management.",
};

function buildGranularDatasets(
  orders: {
    createdAt: Date;
    totalAmount: number;
    subtotal: number;
    items: { price: number; bookId: string }[];
  }[],
  bookFilterId?: string
): BookDataset {
  const relevantItems: { price: number; createdAt: Date }[] = [];
  for (const o of orders) {
    for (const item of o.items) {
      if (!bookFilterId || item.bookId === bookFilterId) {
        const netItemPrice =
          o.subtotal > 0 && o.totalAmount < o.subtotal
            ? (item.price / o.subtotal) * o.totalAmount
            : item.price;
        relevantItems.push({ price: netItemPrice, createdAt: o.createdAt });
      }
    }
  }

  // Anchor date: if orders exist, use latest order; otherwise use current real-time date
  const anchorDate = orders.length > 0 ? new Date(orders[0].createdAt) : new Date();
  const anchorYear = anchorDate.getUTCFullYear();

  // 1. Daily 7D
  const daily7d: ChartDataPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchorDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const matches = relevantItems.filter(
      (it) => it.createdAt.toISOString().slice(0, 10) === dateStr
    );
    const royalties = matches.reduce((s, it) => s + it.price, 0);
    const units = matches.length;
    const dayName = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    daily7d.push({
      label: monthDay,
      subLabel: dayName,
      fullTitle: d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
      royalties: Number(royalties.toFixed(2)),
      units,
      pages: units * 145,
    });
  }

  // 2. Daily 14D
  const daily14d: ChartDataPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(anchorDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const matches = relevantItems.filter(
      (it) => it.createdAt.toISOString().slice(0, 10) === dateStr
    );
    const royalties = matches.reduce((s, it) => s + it.price, 0);
    const units = matches.length;
    const dayName = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    const monthDay = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "UTC" });
    daily14d.push({
      label: monthDay,
      subLabel: dayName,
      fullTitle: d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
      royalties: Number(royalties.toFixed(2)),
      units,
      pages: units * 145,
    });
  }

  // 3. Monthly (12 Months of Active Year)
  const monthShorts = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthFulls = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthly: ChartDataPoint[] = monthShorts.map((m, idx) => {
    const matches = relevantItems.filter(
      (it) => it.createdAt.getUTCFullYear() === anchorYear && it.createdAt.getUTCMonth() === idx
    );
    const royalties = matches.reduce((s, it) => s + it.price, 0);
    const units = matches.length;
    return {
      label: m,
      subLabel: String(anchorYear),
      fullTitle: `${monthFulls[idx]} ${anchorYear}`,
      royalties: Number(royalties.toFixed(2)),
      units,
      pages: units * 145,
    };
  });

  // 4. Yearly (4-Year Window)
  const years = [anchorYear - 2, anchorYear - 1, anchorYear, anchorYear + 1];
  const yearly: ChartDataPoint[] = years.map((y) => {
    const matches = relevantItems.filter((it) => it.createdAt.getUTCFullYear() === y);
    const royalties = matches.reduce((s, it) => s + it.price, 0);
    const units = matches.length;
    return {
      label: String(y),
      subLabel: "FY",
      fullTitle: `Fiscal Year ${y}`,
      royalties: Number(royalties.toFixed(2)),
      units,
      pages: units * 145,
    };
  });

  return { daily7d, daily14d, monthly, yearly };
}

export default async function AdminDashboardPage() {
  const [
    totalOrdersCount,
    paidOrders,
    publishedBooks,
    totalReadersCount,
    totalEntitlementsCount,
    recentOrders,
    recentEntitlements,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.book.findMany({
      where: { status: "PUBLISHED" },
      include: {
        category: true,
        imprint: true,
      },
      orderBy: { isFeatured: "desc" },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.entitlement.count(),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    }),
    prisma.entitlement.findMany({
      take: 5,
      orderBy: { grantedAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        book: { select: { title: true } },
      },
    }),
  ]);

  const grossRevenue = paidOrders.reduce((acc, order) => acc + order.totalAmount, 0);
  const paidOrdersCount = paidOrders.length;
  const totalPaidUnits = paidOrders.reduce((acc, order) => acc + order.items.length, 0);

  // Group items by book ID with 100% mathematical precision
  const bookStatsMap = new Map<string, { count: number; revenue: number }>();
  for (const order of paidOrders) {
    for (const item of order.items) {
      const cur = bookStatsMap.get(item.bookId) || { count: 0, revenue: 0 };
      cur.count += 1;
      const netPrice =
        order.subtotal > 0 && order.totalAmount < order.subtotal
          ? (item.price / order.subtotal) * order.totalAmount
          : item.price;
      cur.revenue += netPrice;
      bookStatsMap.set(item.bookId, cur);
    }
  }

  // Format top performing publications from real store order items
  const topBooks = publishedBooks.map((b) => {
    const stats = bookStatsMap.get(b.id) || { count: 0, revenue: 0 };
    return {
      id: b.id,
      title: b.title,
      slug: b.slug,
      coverImage: b.coverImage,
      imprintName: b.imprint?.name || "Noveraile Publishing",
      categoryName: b.category?.name || "General",
      price: b.salePrice || b.price,
      salesCount: stats.count,
      totalRevenue: Number(stats.revenue.toFixed(2)),
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Build all-title KDP chart datasets
  const allTitlesDatasets = buildGranularDatasets(paidOrders);

  // Build per-book datasets for title filter dropdown
  const bookDatasets: Record<string, BookDataset> = {};
  for (const b of publishedBooks) {
    bookDatasets[b.id] = buildGranularDatasets(paidOrders, b.id);
  }

  // Format recent orders
  const formattedRecentOrders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerEmail: o.customerEmail,
    totalAmount: o.totalAmount,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt.toISOString(),
    itemsCount: o.items.length,
  }));

  // Format recent entitlements
  const formattedRecentEntitlements = recentEntitlements.map((e) => ({
    id: e.id,
    userEmail: e.user.email,
    bookTitle: e.book.title,
    status: e.status,
    grantedAt: e.grantedAt.toISOString(),
  }));

  return (
    <AdminOverviewClient
      grossRevenue={grossRevenue}
      totalOrdersCount={totalOrdersCount}
      paidOrdersCount={paidOrdersCount}
      totalPaidUnits={totalPaidUnits}
      activeTitlesCount={publishedBooks.length}
      totalReadersCount={totalReadersCount}
      totalEntitlementsCount={totalEntitlementsCount}
      recentOrders={formattedRecentOrders}
      recentEntitlements={formattedRecentEntitlements}
      topBooks={topBooks}
      initialDaily7d={allTitlesDatasets.daily7d}
      initialDaily14d={allTitlesDatasets.daily14d}
      initialMonthly={allTitlesDatasets.monthly}
      initialYearly={allTitlesDatasets.yearly}
      bookDatasets={bookDatasets}
    />
  );
}
