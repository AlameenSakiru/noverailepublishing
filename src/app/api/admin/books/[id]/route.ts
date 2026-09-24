import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

async function resolveId(params: RouteParams["params"]): Promise<string> {
  const resolved = await params;
  return resolved.id;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const id = await resolveId(params);

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        author: true,
        imprint: true,
        examMetadata: true,
        pageAssets: {
          orderBy: { pageNumber: "asc" },
          take: 10,
        },
        _count: {
          select: {
            entitlements: true,
            orderItems: true,
            reviews: true,
            pageAssets: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Fetch book error:", error);
    return NextResponse.json({ error: "Failed to fetch book." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const id = await resolveId(params);
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
      imprintId,
      status,
      isFeatured,
      isBestseller,
      isComingSoon,
      specifications,
      // Exam prep
      isExamPrep,
      examName,
      examAcronym,
      examAuthority,
      profession,
    } = body;

    if (!title || !slug || !description || !categoryId || !authorId) {
      return NextResponse.json({ error: "Required fields missing (Title, Slug, Description, Category, Author)." }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");

    // Check slug uniqueness excluding self
    const existingSlug = await prisma.book.findFirst({
      where: {
        slug: cleanSlug,
        NOT: { id },
      },
    });

    if (existingSlug) {
      return NextResponse.json({ error: "Another book is already using this URL slug." }, { status: 409 });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Price must be a valid positive number." }, { status: 400 });
    }

    const parsedSalePrice = salePrice && salePrice !== "" ? parseFloat(salePrice) : null;
    if (parsedSalePrice !== null && (isNaN(parsedSalePrice) || parsedSalePrice < 0)) {
      return NextResponse.json({ error: "Sale price must be a valid positive number." }, { status: 400 });
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        slug: cleanSlug,
        isbn: isbn ? isbn.trim() : null,
        edition: edition ? edition.trim() : "1st Edition",
        language: language ? language.trim() : "English",
        coverImage: coverImage ? coverImage.trim() : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
        description: description.trim(),
        shortDescription: shortDescription ? shortDescription.trim() : description.slice(0, 160).trim(),
        price: parsedPrice,
        salePrice: parsedSalePrice,
        categoryId,
        authorId,
        imprintId: imprintId && imprintId !== "" ? imprintId : null,
        status: status || "PUBLISHED",
        isFeatured: Boolean(isFeatured),
        isBestseller: Boolean(isBestseller),
        isComingSoon: Boolean(isComingSoon),
        ...(specifications !== undefined && {
          specifications:
            typeof specifications === "string"
              ? specifications
              : JSON.stringify(specifications),
        }),
      },
      include: {
        category: true,
        author: true,
        imprint: true,
        examMetadata: true,
      },
    });

    // Handle Exam Metadata
    if (isExamPrep && examName && examAcronym) {
      await prisma.examMetadata.upsert({
        where: { bookId: id },
        create: {
          bookId: id,
          examName: examName.trim(),
          examAcronym: examAcronym.trim(),
          examAuthority: examAuthority ? examAuthority.trim() : "Independent Certification Board",
          profession: profession ? profession.trim() : "Professional Licensure",
        },
        update: {
          examName: examName.trim(),
          examAcronym: examAcronym.trim(),
          examAuthority: examAuthority ? examAuthority.trim() : "Independent Certification Board",
          profession: profession ? profession.trim() : "Professional Licensure",
        },
      });
    } else if (!isExamPrep) {
      // Remove exam metadata if toggled off
      await prisma.examMetadata.deleteMany({
        where: { bookId: id },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "BOOK_UPDATED",
        entityType: "Book",
        entityId: id,
        details: JSON.stringify({
          title: updatedBook.title,
          slug: updatedBook.slug,
          price: updatedBook.price,
          salePrice: updatedBook.salePrice,
          status: updatedBook.status,
        }),
      },
    });

    return NextResponse.json({ success: true, book: updatedBook });
  } catch (error: any) {
    console.error("Admin book update error:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update book: " + (error.message || "Unknown error") }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const id = await resolveId(params);

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
            entitlements: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    // If book is tied to existing customer orders, permanent hard deletion would violate foreign key constraints
    // and destroy order ledger integrity. We automatically offer or enforce archiving in this case.
    const url = new URL(req.url);
    const forceArchive = url.searchParams.get("archive") === "true";

    if (book._count.orderItems > 0 && !forceArchive) {
      return NextResponse.json(
        {
          error: `Cannot permanently delete "${book.title}" because it has ${book._count.orderItems} existing order records. To preserve customer purchases and financial records, you can archive it instead.`,
          hasOrders: true,
          orderCount: book._count.orderItems,
        },
        { status: 400 }
      );
    }

    if (book._count.orderItems > 0 || forceArchive) {
      // Archive the book instead of hard deleting
      await prisma.book.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: "BOOK_ARCHIVED",
          entityType: "Book",
          entityId: id,
          details: JSON.stringify({ title: book.title, slug: book.slug }),
        },
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: `Book "${book.title}" has been archived to preserve transaction history.`,
      });
    }

    // Zero orders: safe to hard delete (cascades to page assets, exam metadata, bookmarks, progress)
    await prisma.book.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "BOOK_DELETED",
        entityType: "Book",
        entityId: id,
        details: JSON.stringify({ title: book.title, slug: book.slug }),
      },
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: `Book "${book.title}" permanently deleted.`,
    });
  } catch (error: any) {
    console.error("Admin book delete error:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete book: " + (error.message || "Unknown error") }, { status: 500 });
  }
}
