import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    const progress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: user.userId,
          bookId,
        },
      },
    });

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.userId,
        bookId,
      },
      orderBy: { pageNumber: "asc" },
    });

    return NextResponse.json({
      currentPage: progress?.currentPage || 1,
      totalPages: progress?.totalPages || 1,
      progressPercent: progress?.progressPercent || 0,
      lastReadAt: progress?.lastReadAt || null,
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        pageNumber: b.pageNumber,
        label: b.label,
      })),
    });
  } catch (error) {
    console.error("Reading progress fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { bookId, currentPage, totalPages, toggleBookmark, bookmarkLabel } = body || {};

    if (!bookId || typeof bookId !== "string") {
      return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    const pageNum = Math.max(1, Math.min(50000, parseInt(String(currentPage), 10) || 1));
    const total = Math.max(1, Math.min(50000, parseInt(String(totalPages), 10) || 1));
    const progressPercent = Math.min(100, Math.round((pageNum / total) * 100 * 10) / 10);

    // Upsert reading progress strictly for the authenticated user
    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: user.userId,
          bookId,
        },
      },
      update: {
        currentPage: pageNum,
        totalPages: total,
        progressPercent,
        lastReadAt: new Date(),
      },
      create: {
        userId: user.userId,
        bookId,
        currentPage: pageNum,
        totalPages: total,
        progressPercent,
        lastReadAt: new Date(),
      },
    });

    // Handle bookmark toggle if requested
    let bookmarkStatus = null;
    if (toggleBookmark) {
      const existingBookmark = await prisma.bookmark.findFirst({
        where: {
          userId: user.userId,
          bookId,
          pageNumber: pageNum,
        },
      });

      if (existingBookmark) {
        await prisma.bookmark.delete({
          where: { id: existingBookmark.id },
        });
        bookmarkStatus = "REMOVED";
      } else {
        const cleanLabel = (bookmarkLabel && typeof bookmarkLabel === "string"
          ? bookmarkLabel.trim().slice(0, 80)
          : `Page ${pageNum}`);

        await prisma.bookmark.create({
          data: {
            userId: user.userId,
            bookId,
            pageNumber: pageNum,
            label: cleanLabel,
          },
        });
        bookmarkStatus = "ADDED";
      }
    }

    return NextResponse.json({
      success: true,
      currentPage: progress.currentPage,
      progressPercent: progress.progressPercent,
      bookmarkStatus,
    });
  } catch (error) {
    console.error("Reading progress update error:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
