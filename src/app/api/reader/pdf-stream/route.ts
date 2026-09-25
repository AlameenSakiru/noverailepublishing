import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PRIVATE_MANUSCRIPTS_DIR = path.resolve(process.cwd(), "storage", "private", "manuscripts");

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");

    if (!bookId || typeof bookId !== "string" || bookId.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid bookId parameter" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required to stream publication manuscript" },
        { status: 401 }
      );
    }

    // Rate limit check: max 60 requests per minute per user to prevent automated scrapers
    const rateLimitKey = `pdf_stream_${currentUser.userId}`;
    if (!checkRateLimit(rateLimitKey, 60, 60000)) {
      return NextResponse.json(
        { error: "Too many manuscript stream requests. Please read at a standard pace." },
        { status: 429 }
      );
    }

    // Verify entitlement or staff role
    const isStaff = currentUser.role === "ADMIN" || currentUser.role === "EDITOR";
    let hasEntitlement = isStaff;

    if (!hasEntitlement) {
      const entitlement = await prisma.entitlement.findFirst({
        where: {
          bookId,
          status: "ACTIVE",
          OR: [
            { userId: currentUser.userId },
            { user: { email: currentUser.email } },
          ],
        },
      });
      hasEntitlement = Boolean(entitlement);
    }

    if (!hasEntitlement) {
      return NextResponse.json(
        { error: "Active book purchase entitlement required to read this manuscript." },
        { status: 403 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, specifications: true, title: true, status: true },
    });

    if (!book) {
      return NextResponse.json({ error: "Publication not found" }, { status: 404 });
    }

    if (!isStaff && book.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Publication not available" }, { status: 404 });
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
        { error: "No PDF manuscript has been uploaded for this publication." },
        { status: 404 }
      );
    }

    // Strict path traversal defense: Extract only the base file name
    const sanitizedFileName = path.basename(manuscriptFileName).trim();
    if (!sanitizedFileName || !sanitizedFileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Invalid manuscript configuration." }, { status: 400 });
    }

    // Resolve target path and verify it stays strictly inside the private manuscripts directory
    const targetFilePath = path.resolve(PRIVATE_MANUSCRIPTS_DIR, sanitizedFileName);
    if (!targetFilePath.startsWith(PRIVATE_MANUSCRIPTS_DIR)) {
      console.error(`Security alert: Directory traversal attempt detected: ${manuscriptFileName}`);
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
        { error: "Manuscript file not found in secure storage." },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(targetFilePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // Force inline display, anti-sniff, anti-cache, and download defense
        "Content-Disposition": 'inline; filename="protected-manuscript.pdf"',
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("PDF stream error:", error);
    return NextResponse.json(
      { error: "Internal server error streaming publication PDF" },
      { status: 500 }
    );
  }
}
