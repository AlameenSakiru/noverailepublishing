import React from "react";
import prisma from "@/lib/prisma";
import { CategoryManagerClient } from "./CategoryManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: {
        select: { books: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return <CategoryManagerClient categories={categories} />;
}
