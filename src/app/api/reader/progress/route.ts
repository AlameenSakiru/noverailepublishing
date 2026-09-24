import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

    const { bookId, currentPage, totalPages, toggleBookmark, bookmarkLabel } = await req.json();

    if (!bookId || !currentPage) {
      return NextResponse.json({ error: "Missing bookId or currentPage" }, { status: 400 });
    }

    const total = totalPages || 1;
    const progressPercent = Math.min(100, Math.round((currentPage / total) * 100 * 10) / 10);

    // Upsert reading progress
    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: user.userId,
          bookId,
        },
      },
      update: {
        currentPage,
        totalPages: total,
        progressPercent,
        lastReadAt: new Date(),
      },
      create: {
        userId: user.userId,
        bookId,
        currentPage,
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
          pageNumber: currentPage,
        },
      });

      if (existingBookmark) {
        await prisma.bookmark.delete({
          where: { id: existingBookmark.id },
        });
        bookmarkStatus = "REMOVED";
      } else {
        await prisma.bookmark.create({
          data: {
            userId: user.userId,
            bookId,
            pageNumber: currentPage,
            label: bookmarkLabel || `Page ${currentPage}`,
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
