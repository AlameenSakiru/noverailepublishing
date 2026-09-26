import React from "react";
import prisma from "@/lib/prisma";
import { BroadcastsClient } from "./BroadcastsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customer Broadcasts | Noveraile Admin",
  description: "Send promotional offers, new book releases, and season greetings directly to all customers.",
};

export default async function AdminBroadcastsPage() {
  const [totalCustomers, verifiedCustomers] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", isEmailVerified: true } }),
  ]);

  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      coverImage: true,
      author: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const coupons = await prisma.coupon.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      discountType: true,
      discountValue: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const historyLogs = await prisma.auditLog.findMany({
    where: { action: "EMAIL_BROADCAST" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { name: true, email: true } } },
  });

  const history = historyLogs.map((log) => {
    let details: any = {};
    try {
      details = JSON.parse(log.details || "{}");
    } catch {}
    return {
      id: log.id,
      subject: details.subject || "Email Broadcast",
      campaignType: details.campaignType || "ANNOUNCEMENT",
      recipientCount: details.recipientCount || 0,
      sentCount: details.sentCount || 0,
      failureCount: details.failureCount || 0,
      audience: details.audience || "ALL_CUSTOMERS",
      sentBy: log.user?.name || "Admin",
      createdAt: log.createdAt.toISOString(),
    };
  });

  const initialData = {
    audienceStats: {
      totalCustomers,
      verifiedCustomers,
    },
    books: books.map((b) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      price: b.price,
      coverImage: b.coverImage,
      authorName: b.author?.name || "Unknown Author",
    })),
    coupons: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discount:
        c.discountType === "PERCENTAGE"
          ? `${c.discountValue}% OFF`
          : `$${c.discountValue.toFixed(2)} OFF`,
    })),
    history,
  };

  return <BroadcastsClient initialData={initialData} />;
}
