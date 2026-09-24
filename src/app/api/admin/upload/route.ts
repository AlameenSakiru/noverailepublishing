import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = formData.get("type") as string; // "cover" | "manuscript"

    if (!file) {
      return NextResponse.json({ error: "No file was provided for upload." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (uploadType === "cover") {
      // Validate image types (JPG, JPEG, PNG, WEBP)
      const allowedImageMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      const isJpgExt = /\.(jpg|jpeg|png|webp)$/i.test(file.name);

      if (!allowedImageMimes.includes(file.type) && !isJpgExt) {
        return NextResponse.json(
          { error: "Invalid cover file format. Please upload a JPG or JPEG image." },
          { status: 400 }
        );
      }

      // Max 15MB for cover
      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "Cover image must be under 15MB." }, { status: 400 });
      }

      const coversDir = path.join(process.cwd(), "public", "covers");
      await fs.mkdir(coversDir, { recursive: true });

      // Clean file name
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      const baseName = path
        .basename(file.name, ext)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_")
        .slice(0, 40);
      const uniqueFilename = `${baseName}_${Date.now()}${ext}`;
      const filePath = path.join(coversDir, uniqueFilename);

      await fs.writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        type: "cover",
        url: `/covers/${uniqueFilename}`,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
      });
    } else if (uploadType === "manuscript") {
      // Validate PDF format
      const isPdfExt = /\.pdf$/i.test(file.name);
      const isPdfMime = file.type === "application/pdf" || file.type === "application/x-pdf";

      if (!isPdfMime && !isPdfExt) {
        return NextResponse.json(
          { error: "Invalid manuscript file format. Please upload a valid PDF file." },
          { status: 400 }
        );
      }

      // Max 100MB for manuscript PDF
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: "PDF manuscript must be under 100MB." }, { status: 400 });
      }

      const manuscriptsDir = path.join(process.cwd(), "public", "manuscripts");
      await fs.mkdir(manuscriptsDir, { recursive: true });

      const baseName = path
        .basename(file.name, ".pdf")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_")
        .slice(0, 40);
      const uniqueFilename = `${baseName}_${Date.now()}.pdf`;
      const filePath = path.join(manuscriptsDir, uniqueFilename);

      await fs.writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        type: "manuscript",
        url: `/manuscripts/${uniqueFilename}`,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
      });
    } else {
      return NextResponse.json({ error: "Invalid upload type specified." }, { status: 400 });
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
