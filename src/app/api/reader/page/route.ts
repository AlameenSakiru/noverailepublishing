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

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const title = pageAsset?.title || `Curriculum Unit ${pageNumber}: Core Principles & Review`;
    const chapterTitle = pageAsset?.chapterTitle || `Module ${Math.ceil(pageNumber / 5)}`;
    const contentHtml = pageAsset?.contentHtml || `
      <div class="space-y-6 text-justify">
        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 my-2">
          <p class="text-xs font-mono text-amber-700 dark:text-amber-300 uppercase tracking-widest font-semibold">Active Study Module • Section ${pageNumber}</p>
          <h3 class="text-base font-bold font-serif mt-1">${title}</h3>
        </div>
        <p class="text-base font-serif leading-relaxed">
          In this module of <em>${book.title}</em>, students and editorial candidates engage in systematic evaluation of primary competencies. Critical analysis requires methodic understanding of underlying frameworks, operational benchmarks, and regulatory expectations.
        </p>
        <div class="my-6 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div class="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Exam & Practice Objectives</div>
          <ul class="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
            <li>Verify foundational formulas and compliance protocols before practical application.</li>
            <li>Analyze high-frequency question patterns and common exam pitfalls.</li>
            <li>Reinforce memory retention through structured note-taking in your study scratchpad.</li>
          </ul>
        </div>
        <p class="text-base font-serif leading-relaxed">
          Proceed to review the subsequent subsections and practice exercises to ensure comprehensive mastery of this curriculum unit.
        </p>
      </div>
    `;

    return NextResponse.json(
      {
        success: true,
        bookId: book.id,
        bookTitle: book.title,
        pageNumber: pageNumber,
        totalPages: book.pageCount,
        title: title,
        chapterTitle: chapterTitle,
        contentHtml: contentHtml,
        watermarkText: null,
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
