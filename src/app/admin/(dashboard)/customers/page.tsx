import React from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CustomerEntitlementsClient } from "./CustomerEntitlementsClient";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/admin/books");
  }

  const [users, books] = await Promise.all([

    prisma.user.findMany({
      include: {
        entitlements: {
          include: {
            book: {
              select: { title: true },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
            orders: true,
            bookmarks: true,
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
