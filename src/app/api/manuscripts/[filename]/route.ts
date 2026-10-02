import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PRIVATE_MANUSCRIPTS_DIR = path.resolve(process.cwd(), "storage", "private", "manuscripts");

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  try {
    await requireAdmin();

    const resolvedParams = await Promise.resolve(params);
    const rawFilename = resolvedParams?.filename;
    if (!rawFilename) {
      return new Response("Not found", { status: 404 });
    }

    const filename = path.basename(rawFilename).trim();
    if (!filename || !filename.toLowerCase().endsWith(".pdf")) {
      return new Response("Invalid file format", { status: 400 });
    }

    // 1. Try local disk first
    const localPath = path.resolve(PRIVATE_MANUSCRIPTS_DIR, filename);
    if (localPath.startsWith(PRIVATE_MANUSCRIPTS_DIR)) {
      try {
        const buffer = await fs.readFile(localPath);
        return new Response(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch {
        // Fallback to database lookup
      }
    }

    // 2. Fetch from Neon database
    const file = await prisma.uploadedFile.findUnique({
      where: { filename },
    });

    if (!file) {
      return new Response("Manuscript file not found", { status: 404 });
    }

    return new Response(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${file.originalName || filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return new Response("Access denied", { status: 403 });
    }
    console.error("Manuscript preview error:", error);
    return new Response("Error streaming manuscript", { status: 500 });
  }
}
