import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MyLibraryClient } from "./MyLibraryClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Library & Orders",
  description: "Access your purchased digital books, write reader reviews, view past order receipts, and continue reading from your personal Noveraile cloud bookshelf.",
};

interface MyLibraryPageProps {
  searchParams?: {
    tab?: string;
  };
}

export default async function MyLibraryPage({ searchParams }: MyLibraryPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/my-library");
  }

  const activeTab = searchParams?.tab === "orders" ? "orders" : "books";

  // Concurrently fetch user's entitlements, reading progress, orders, and submitted reviews
  const [entitlements, progressRecords, orders, userReviews] = await Promise.all([
    prisma.entitlement.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { userId: currentUser.userId },
          { user: { email: currentUser.email } },
        ],
      },
      include: {
        book: {
          include: {
            author: true,
            category: true,
            examMetadata: true,
          },
        },
      },
      orderBy: { grantedAt: "desc" },
    }),
    prisma.readingProgress.findMany({
      where: {
        OR: [
          { userId: currentUser.userId },
          { user: { email: currentUser.email } },
        ],
      },
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { userId: currentUser.userId },
          { customerEmail: currentUser.email },
        ],
      },
      include: {
        payment: true,
        items: {
          include: {
            book: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: {
        userId: currentUser.userId,
      },
      select: {
        id: true,
        bookId: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-brand-muted">Loading your library...</div>}>
      <MyLibraryClient
        currentUser={currentUser}
        entitlements={entitlements}
        progressRecords={progressRecords}
        orders={orders}
        initialReviews={userReviews.map((r) => ({
          id: r.id,
          bookId: r.bookId,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
        }))}
        defaultTab={activeTab}
      />
    </Suspense>
  );
}
