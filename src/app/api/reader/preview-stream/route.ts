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

    let manuscriptFileName: string | null = null;
    try {
      const specs = JSON.parse(book.specifications || "{}");
      manuscriptFileName = specs.manuscriptFileName || specs.manuscriptPdfUrl || null;
    } catch {
      manuscriptFileName = null;
    }

    if (!manuscriptFileName) {
      return NextResponse.json(
        { error: "No PDF manuscript available for this publication." },
        { status: 404 }
      );
    }

    // Path traversal defense
    const sanitizedFileName = path.basename(manuscriptFileName).trim();
    if (!sanitizedFileName || !sanitizedFileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Invalid manuscript configuration." }, { status: 400 });
    }

    const targetFilePath = path.resolve(PRIVATE_MANUSCRIPTS_DIR, sanitizedFileName);
    if (!targetFilePath.startsWith(PRIVATE_MANUSCRIPTS_DIR)) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    let fileExists = false;
    try {
      await fs.access(targetFilePath);
      fileExists = true;
    } catch {
      fileExists = false;
    }

    if (!fileExists) {
      return NextResponse.json(
        { error: "Manuscript file not found in storage." },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(targetFilePath);

    return new Response(fileBuffer, {
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
