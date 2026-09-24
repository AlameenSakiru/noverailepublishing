import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bookId = url.searchParams.get("bookId");

  if (!bookId) {
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: {
      bookId,
      isApproved: true,
    },
    include: {
      user: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      authorName: r.user.name,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to submit a review." }, { status: 401 });
    }

    const { bookId, rating, title, comment } = await req.json();

    if (!bookId || !rating || !title || !comment) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    // Check if user owns the book (verified purchase)
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        userId_bookId: {
          userId: user.userId,
          bookId,
        },
      },
    });

    const isVerifiedPurchase = Boolean(entitlement && entitlement.status === "ACTIVE");

    const review = await prisma.review.create({
      data: {
        bookId,
        userId: user.userId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        isVerifiedPurchase,
        isApproved: true, // auto-approve verified, or flag for moderation
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
