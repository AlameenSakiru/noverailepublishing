import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PRIVATE_MANUSCRIPTS_DIR = path.resolve(process.cwd(), "storage", "private", "manuscripts");

/**
 * Public preview streaming endpoint for Look Inside / Sample Preview.
 * Allows unauthenticated visitors to read the permitted sample excerpt pages of the genuine book manuscript.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");

    if (!bookId || typeof bookId !== "string" || bookId.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid bookId parameter" }, { status: 400 });
    }

    const ip = getClientIp(req);
    // Rate limit: 60 sample preview requests per minute per IP
    if (!checkRateLimit(`preview_stream_${ip}`, 60, 60000)) {
      return NextResponse.json(
        { error: "Too many preview requests. Please view at a standard reading pace." },
        { status: 429 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        status: true,
        specifications: true,
        previewPageNumbers: true,
        pageCount: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Check publication status (staff can preview unpublished drafts)
    if (book.status !== "PUBLISHED") {
      const currentUser = await getCurrentUser();
      const isStaff = currentUser?.role === "ADMIN" || currentUser?.role === "EDITOR";
      if (!isStaff) {
        return NextResponse.json({ error: "Book preview not available" }, { status: 404 });
      }
    }

    let serverFilename: string | null = null;
    let originalFilename: string | null = null;
    try {
      const specs = JSON.parse(book.specifications || "{}");
      if (specs.manuscriptPdfUrl) {
        serverFilename = path.basename(specs.manuscriptPdfUrl).trim();
      }
      if (specs.manuscriptFileName) {
        originalFilename = path.basename(specs.manuscriptFileName).trim();
      }
    } catch {
      serverFilename = null;
      originalFilename = null;
    }

    const candidateNames = [serverFilename, originalFilename].filter(
      (n): n is string => Boolean(n && n.toLowerCase().endsWith(".pdf"))
    );

    if (candidateNames.length === 0) {
      return NextResponse.json(
        { error: "No PDF manuscript available for this publication." },
        { status: 404 }
      );
    }

    let fileBuffer: Buffer | null = null;

    // 1. Resolve target path and attempt reading from local private manuscripts directory
    for (const name of candidateNames) {
      const targetFilePath = path.resolve(PRIVATE_MANUSCRIPTS_DIR, name);
      if (targetFilePath.startsWith(PRIVATE_MANUSCRIPTS_DIR)) {
        try {
          fileBuffer = await fs.readFile(targetFilePath);
          if (fileBuffer) break;
        } catch {
          // File not on local container disk; fall back
        }
      }
    }

    // 2. Fall back to Neon PostgreSQL uploadedFile table (serverless storage)
    if (!fileBuffer) {
      const dbFile = await prisma.uploadedFile.findFirst({
        where: {
          OR: [
            ...candidateNames.map((name) => ({ filename: name })),
            ...candidateNames.map((name) => ({ originalName: name })),
          ],
        },
      });
      if (dbFile) {
        fileBuffer = dbFile.data;
      }
    }

    if (!fileBuffer) {
      return NextResponse.json(
        { error: "Manuscript file not found in storage." },
        { status: 404 }
      );
    }

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="sample-preview.pdf"',
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("Preview stream error:", error);
    return NextResponse.json(
      { error: "Internal server error streaming sample preview" },
      { status: 500 }
    );
  }
}
