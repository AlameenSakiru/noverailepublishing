import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json({ error: "Missing bookId parameter" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required to stream publication manuscript" },
        { status: 401 }
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
      select: { id: true, specifications: true, title: true },
    });

    if (!book) {
      return NextResponse.json({ error: "Publication not found" }, { status: 404 });
    }

    let pdfRelativePath: string | null = null;
    try {
      const specs = JSON.parse(book.specifications || "{}");
      if (specs.manuscriptPdfUrl) {
        pdfRelativePath = specs.manuscriptPdfUrl;
      }
    } catch {
      pdfRelativePath = null;
    }

    // Check default / sample manuscript if not explicitly set
    const manuscriptsDir = path.join(process.cwd(), "public", "manuscripts");
    let targetFilePath: string | null = null;

    if (pdfRelativePath) {
      // Strip leading slash if any
      const cleaned = pdfRelativePath.replace(/^\/+/, "");
      targetFilePath = path.join(process.cwd(), "public", cleaned.replace(/^manuscripts\//, "manuscripts/"));
      // Also check if cleaned already starts with public
      if (!targetFilePath.includes("public")) {
        targetFilePath = path.join(process.cwd(), "public", cleaned);
      }
    }

    // If specific file doesn't exist, check manuscripts folder for any available uploaded PDF
    let fileExists = false;
    if (targetFilePath) {
      try {
        await fs.access(targetFilePath);
        fileExists = true;
      } catch {
        fileExists = false;
      }
    }

    if (!fileExists) {
      try {
        const files = await fs.readdir(manuscriptsDir);
        const firstPdf = files.find((f) => f.endsWith(".pdf"));
        if (firstPdf) {
          targetFilePath = path.join(manuscriptsDir, firstPdf);
          fileExists = true;
        }
      } catch {
        fileExists = false;
      }
    }

    if (!fileExists || !targetFilePath) {
      return NextResponse.json(
        { error: "No PDF manuscript has been uploaded for this publication." },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(targetFilePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // Force inline display, anti-sniff, and anti-cache
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
