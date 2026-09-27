import React from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CouponsClient } from "./CouponsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Coupons & Discounts | Noveraile Admin",
  description: "Manage promotional discount vouchers and discount codes.",
};

export default async function AdminCouponsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/admin/books");
  }

  const coupons = await prisma.coupon.findMany({

    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { uses: true } },
    },
  });

  const formattedCoupons = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    minOrderAmount: c.minOrderAmount,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    _count: c._count,
  }));

  return <CouponsClient initialCoupons={formattedCoupons} />;
}
