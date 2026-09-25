import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PRIVATE_MANUSCRIPTS_DIR = path.resolve(process.cwd(), "storage", "private", "manuscripts");
const PUBLIC_COVERS_DIR = path.resolve(process.cwd(), "public", "covers");

/**
 * Validates file magic bytes (file signature) to prevent disguised malicious file uploads
 */
function validateMagicBytes(buffer: Buffer, type: "cover" | "manuscript"): { valid: boolean; ext: string } {
  if (buffer.length < 12) return { valid: false, ext: "" };

  if (type === "manuscript") {
    // PDF Magic Bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    const isPdf =
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46 &&
      buffer[4] === 0x2d;

    return { valid: isPdf, ext: ".pdf" };
  }

  if (type === "cover") {
    // JPEG: 0xFF, 0xD8, 0xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { valid: true, ext: ".jpg" };
    }

    // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return { valid: true, ext: ".png" };
    }

    // WEBP: RIFF....WEBP
    if (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return { valid: true, ext: ".webp" };
    }
  }

  return { valid: false, ext: "" };
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = formData.get("type") as string; // "cover" | "manuscript"

    if (!file) {
      return NextResponse.json({ error: "No file was provided for upload." }, { status: 400 });
    }

    if (uploadType !== "cover" && uploadType !== "manuscript") {
      return NextResponse.json({ error: "Invalid upload type specified." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (uploadType === "cover") {
      // Max 15MB for cover
      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "Cover image must be under 15MB." }, { status: 400 });
      }

      // Validate magic bytes (JPEG, PNG, WEBP). Disallow SVGs to prevent Stored XSS.
      const validation = validateMagicBytes(buffer, "cover");
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid cover file. Only genuine JPG, PNG, or WEBP images are permitted." },
          { status: 400 }
        );
      }

      await fs.mkdir(PUBLIC_COVERS_DIR, { recursive: true });

      // Clean file name strictly
      const cleanBaseName = path
        .basename(file.name, path.extname(file.name))
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_")
        .slice(0, 40) || "cover";

      const uniqueFilename = `${cleanBaseName}_${Date.now()}${validation.ext}`;
      const filePath = path.join(PUBLIC_COVERS_DIR, uniqueFilename);

      await fs.writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        type: "cover",
        url: `/covers/${uniqueFilename}`,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
      });
    } else {
      // uploadType === "manuscript"
      // Max 100MB for manuscript PDF
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: "PDF manuscript must be under 100MB." }, { status: 400 });
      }

      // Cryptographically inspect magic bytes for %PDF-
      const validation = validateMagicBytes(buffer, "manuscript");
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid manuscript file format. The file is not a valid PDF document." },
          { status: 400 }
        );
      }

      // Store in private storage directory (OUTSIDE public/) so it cannot be downloaded statically
      await fs.mkdir(PRIVATE_MANUSCRIPTS_DIR, { recursive: true });

      const cleanBaseName = path
        .basename(file.name, ".pdf")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_")
        .slice(0, 40) || "manuscript";

      const uniqueFilename = `${cleanBaseName}_${Date.now()}.pdf`;
      const filePath = path.join(PRIVATE_MANUSCRIPTS_DIR, uniqueFilename);

      await fs.writeFile(filePath, buffer);

      // Extract page count from PDF buffer
      let pageCount = 0;
      try {
        const text = buffer.toString("latin1");
        const countMatch = text.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/);
        if (countMatch && parseInt(countMatch[1], 10) > 0) {
          pageCount = parseInt(countMatch[1], 10);
        } else {
          const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
          if (pageMatches && pageMatches.length > 0) {
            pageCount = pageMatches.length;
          }
        }
      } catch (err) {
        console.warn("Could not extract PDF page count:", err);
      }

      return NextResponse.json({
        success: true,
        type: "manuscript",
        // Note: url is returned as filename for internal specs storage, NOT as a public static path!
        url: uniqueFilename,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        pageCount: pageCount > 0 ? pageCount : null,
      });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Server error processing upload: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
