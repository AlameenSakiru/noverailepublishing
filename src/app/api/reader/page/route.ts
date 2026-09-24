import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyReaderAccessToken, verifyBookAccess, checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");
    const pageNumberStr = url.searchParams.get("pageNumber");
    const readerToken = url.searchParams.get("token");

    if (!bookId || !pageNumberStr) {
      return NextResponse.json({ error: "Missing bookId or pageNumber parameter" }, { status: 400 });
    }

    const pageNumber = parseInt(pageNumberStr, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: "Invalid pageNumber" }, { status: 400 });
    }

    // Rate limiting check per client IP to prevent mass automated scrapers
    const ip = req.headers.get("x-forwarded-for") || "local_client";
    if (!checkRateLimit(`reader_${ip}`, 120, 60000)) {
      return NextResponse.json(
        { error: "Too many page requests. Please read at a standard reading pace." },
        { status: 429 }
      );
    }

    // Resolve user credentials either from active session cookie OR short-lived reader token
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (readerToken) {
      const decoded = verifyReaderAccessToken(readerToken);
      if (decoded && decoded.bookId === bookId) {
        userId = decoded.userId;
        userEmail = decoded.userEmail;
      }
    }

    if (!userId) {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        userId = currentUser.userId;
        userEmail = currentUser.email;
      }
    }

    // Server-side authorization check (checks preview rights or active paid entitlement)
    const access = await verifyBookAccess(userId, userEmail, bookId, pageNumber);

    if (!access.allowed) {
      return NextResponse.json(
        {
          error: "ACCESS_DENIED",
          reason: access.reason,
          message:
            access.reason === "AUTHENTICATION_REQUIRED"
              ? "Please sign in to read this protected publication."
              : "An active digital book entitlement is required to view this page.",
          isPreview: false,
        },
        { status: 403 }
      );
    }

    // Fetch the page asset from private database representation
    const pageAsset = await prisma.bookPageAsset.findUnique({
      where: {
        bookId_pageNumber: {
          bookId,
          pageNumber,
        },
      },
    });

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        pageCount: true,
        tableOfContents: true,
      },
    });

    if (!pageAsset || !book) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        bookId: book.id,
        bookTitle: book.title,
        pageNumber: pageAsset.pageNumber,
        totalPages: book.pageCount,
        title: pageAsset.title,
        chapterTitle: pageAsset.chapterTitle,
        contentHtml: pageAsset.contentHtml,
        watermarkText: access.watermarkText,
        isPreview: access.isPreview,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Reader page streaming error:", error);
    return NextResponse.json({ error: "Internal server error streaming page" }, { status: 500 });
  }
}
