import React, { Suspense } from "react";
import prisma from "@/lib/prisma";
import { BookListClient } from "./BookListClient";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const [books, categories, authors, imprints] = await Promise.all([
    prisma.book.findMany({
      include: {
        category: true,
        author: true,
        imprint: true,
        examMetadata: true,
        _count: {
          select: {
            entitlements: true,
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.author.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.imprint.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading catalog...</div>}>
      <BookListClient
        books={books}
        categories={categories}
        authors={authors}
        imprints={imprints}
      />
    </Suspense>
  );
}
