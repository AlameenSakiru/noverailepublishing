import React from "react";
import prisma from "@/lib/prisma";
import { OrdersClient, TitlePerformanceItem } from "./OrdersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Orders & Royalties Estimator | Noveraile Admin",
  description: "View and manage all customer purchases, ledger records, and book title royalties.",
};

export default async function AdminOrdersPage() {
  const [orders, publishedBooks] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        payment: true,
      },
    }),
    prisma.book.findMany({
      where: { status: "PUBLISHED" },
      include: {
        category: true,
        imprint: true,
      },
      orderBy: { isFeatured: "desc" },
    }),
  ]);

  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");

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
  const titlePerformance: TitlePerformanceItem[] = publishedBooks
    .map((b) => {
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
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerEmail: o.customerEmail,
    totalAmount: o.totalAmount,
    paymentStatus: o.paymentStatus,
    currency: o.currency,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      bookId: i.bookId,
      bookTitle: i.bookTitle,
      price: i.price,
    })),
    payment: o.payment
      ? {
          id: o.payment.id,
          provider: o.payment.provider,
          transactionId: o.payment.transactionId,
          status: o.payment.status,
          amount: o.payment.amount,
        }
      : null,
  }));

  return (
    <OrdersClient
      initialOrders={formattedOrders}
      initialTitlePerformance={titlePerformance}
    />
  );
}
