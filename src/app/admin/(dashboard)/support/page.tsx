import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SupportClient } from "./SupportClient";

export const metadata = {
  title: "Support Desk | Noveraile Admin",
  description: "Manage reader inquiries, editorial submissions, and customer tickets.",
};

export default async function AdminSupportPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR") {
    redirect("/admin/login?error=forbidden");
  }

  // Pre-fetch initial stats and recent tickets for instantaneous load
  const [initialTickets, totalCount, openCount, inProgressCount, resolvedCount, closedCount] =
    await Promise.all([
      prisma.supportTicket.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
      prisma.supportTicket.count({ where: { status: "CLOSED" } }),
    ]);

  return (
    <SupportClient
      initialTickets={JSON.parse(JSON.stringify(initialTickets))}
      initialStats={{
        total: totalCount,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
      }}
      currentUserRole={currentUser.role}
    />
  );
}
