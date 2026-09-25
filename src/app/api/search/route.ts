import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`search_${ip}`, 60, 60000)) {
      return NextResponse.json({ error: "Too many search requests." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get("q") || "";
    // Clean and limit query length
    const q = rawQ.replace(/[<>'"%]/g, "").trim().slice(0, 80);

    if (!q || q.length < 2) {
      return NextResponse.json({ books: [] });
    }

    const books = await prisma.book.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { subtitle: { contains: q, mode: "insensitive" } },
          { author: { name: { contains: q, mode: "insensitive" } } },
          { category: { name: { contains: q, mode: "insensitive" } } },
          { examMetadata: { examName: { contains: q, mode: "insensitive" } } },
          { examMetadata: { examAcronym: { contains: q, mode: "insensitive" } } },
        ],
      },
      take: 6,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
        examMetadata: { select: { examAcronym: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const results = books.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      subtitle: b.subtitle,
      coverImage: b.coverImage,
      authorName: b.author.name,
      categoryName: b.category.name,
      examAcronym: b.examMetadata?.examAcronym || null,
      price: b.price,
      salePrice: b.salePrice,
    }));

    return NextResponse.json({ books: results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ books: [] }, { status: 500 });
  }
}
