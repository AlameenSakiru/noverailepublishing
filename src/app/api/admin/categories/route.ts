import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      children: true,
      _count: {
        select: { books: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const { name, slug, description, parentId, icon, sortOrder } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const category = await prisma.category.create({
      data: {
        name,
        slug: cleanSlug,
        description,
        parentId: parentId || null,
        icon: icon || "BookOpen",
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "CATEGORY_CREATED",
        entityType: "Category",
        entityId: category.id,
        details: JSON.stringify({ name, slug: cleanSlug }),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
