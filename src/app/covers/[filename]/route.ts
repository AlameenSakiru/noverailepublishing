import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const rawFilename = resolvedParams?.filename;
    if (!rawFilename) {
      return new Response("Not found", { status: 404 });
    }

    const filename = path.basename(rawFilename);

    // 1. Try local disk first
    const localPath = path.resolve(process.cwd(), "public", "covers", filename);
    try {
      const buffer = await fs.readFile(localPath);
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      // Proceed to database lookup
    }

    // 2. Fetch from Neon database
    const file = await prisma.uploadedFile.findUnique({
      where: { filename },
    });

    if (!file) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Cover image fetch error:", error);
    return new Response("Error fetching cover", { status: 500 });
  }
}
