import React from "react";
import prisma from "@/lib/prisma";
import { CustomerEntitlementsClient } from "./CustomerEntitlementsClient";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const [users, books] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      include: {
        entitlements: {
          include: {
            book: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.book.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return <CustomerEntitlementsClient users={users} books={books} />;
}
