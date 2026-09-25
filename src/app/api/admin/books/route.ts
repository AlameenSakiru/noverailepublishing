import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const books = await prisma.book.findMany({
      include: {
        category: true,
        author: true,
        imprint: true,
        _count: {
          select: {
            entitlements: true,
            pageAssets: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ books });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch books." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const {
      title,
      subtitle,
      slug,
      isbn,
      edition,
      language,
      price,
      salePrice,
      coverImage,
      description,
      shortDescription,
      categoryId,
      authorId,
      authorName,
      imprintId,
      previewPageNumbers,
      isFeatured,
      isBestseller,
      status,
      seoKeywords,
      keyBenefits,
      specifications,
      examName,
      examAcronym,
      examAuthority,
      profession,
      samplePages,
    } = body;

    let finalAuthorId = authorId;

    // Dynamically resolve or create author if authorName is supplied
    if (authorName && typeof authorName === "string" && authorName.trim()) {
      const cleanAuthorName = authorName.trim();
      let author = await prisma.author.findFirst({
        where: {
          name: { equals: cleanAuthorName, mode: "insensitive" },
        },
      });

      if (!author) {
        const baseSlug =
          cleanAuthorName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "author";

        let finalSlug = baseSlug;
        const collision = await prisma.author.findUnique({ where: { slug: finalSlug } });
        if (collision) {
          finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
        }

        author = await prisma.author.create({
          data: {
            name: cleanAuthorName,
            slug: finalSlug,
            bio: `Author at Noveraile Publishing.`,
          },
        });
      }
      finalAuthorId = author.id;
    }

    if (!title || !slug || !description || !categoryId || !finalAuthorId) {
      return NextResponse.json({ error: "Required fields missing (Title, Slug, Description, Category, Author)." }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Check unique slug
    const existing = await prisma.book.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return NextResponse.json({ error: "A book with this slug already exists." }, { status: 409 });
    }

    const book = await prisma.book.create({
      data: {
        title,
        subtitle,
        slug: cleanSlug,
        isbn,
        edition: edition || "1st Edition",
        language: language || "English",
        pageCount: samplePages && Array.isArray(samplePages) ? samplePages.length : 1,
        coverImage: coverImage || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
        description,
        shortDescription: shortDescription || description.slice(0, 160),
        price: parseFloat(price) || 29.99,
        salePrice: salePrice ? parseFloat(salePrice) : null,
        categoryId,
        authorId: finalAuthorId,
        imprintId: imprintId || null,
        isFeatured: Boolean(isFeatured),
        isBestseller: Boolean(isBestseller),
        seoKeywords: seoKeywords || null,
        keyBenefits: keyBenefits ? (typeof keyBenefits === "string" ? keyBenefits : JSON.stringify(keyBenefits)) : null,
        specifications: specifications ? (typeof specifications === "string" ? specifications : JSON.stringify(specifications)) : null,
        previewPageNumbers: previewPageNumbers || JSON.stringify([1]),
        status: status || "PUBLISHED",
      },
    });

    // If exam prep metadata is provided, create ExamMetadata
    if (examName && examAcronym) {
      await prisma.examMetadata.create({
        data: {
          bookId: book.id,
          examName,
          examAcronym,
          examAuthority: examAuthority || "Independent Certification Board",
          profession: profession || "Professional Licensure",
        },
      });
    }

    // Ingest sample pages if supplied
    if (samplePages && Array.isArray(samplePages)) {
      for (let i = 0; i < samplePages.length; i++) {
        const p = samplePages[i];
        await prisma.bookPageAsset.create({
          data: {
            bookId: book.id,
            pageNumber: i + 1,
            title: p.title || `Section ${i + 1}`,
            chapterTitle: p.chapterTitle || "General Curriculum",
            contentHtml: p.contentHtml || `<p>${p.content || "Content placeholder"}</p>`,
            wordCount: p.wordCount || 150,
          },
        });
      }
    } else {
      // Create at least 1 introductory page
      await prisma.bookPageAsset.create({
        data: {
          bookId: book.id,
          pageNumber: 1,
          title: "Introduction and Overview",
          chapterTitle: "Chapter 1",
          contentHtml: `<div class="prose"><p class="lead">${shortDescription || description}</p></div>`,
          wordCount: 100,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "BOOK_CREATED",
        entityType: "Book",
        entityId: book.id,
        details: JSON.stringify({ title: book.title, slug: book.slug }),
      },
    });

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    console.error("Admin book creation error:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create book." }, { status: 500 });
  }
}
