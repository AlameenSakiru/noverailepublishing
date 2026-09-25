import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security";

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

    const ip = getClientIp(req);
    if (!checkRateLimit(`review_${user.userId}_${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many review submissions. Please wait before submitting another review." },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const { bookId, rating, title, comment } = body || {};

    if (!bookId || !rating || !title || !comment) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const numRating = Math.round(Number(rating));
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const cleanTitle = String(title).replace(/[<>]/g, "").trim().slice(0, 100);
    const cleanComment = String(comment).replace(/[<>]/g, "").trim().slice(0, 2000);

    if (cleanTitle.length < 2 || cleanComment.length < 5) {
      return NextResponse.json({ error: "Review title or comment is too short." }, { status: 400 });
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
        rating: numRating,
        title: cleanTitle,
        comment: cleanComment,
        isVerifiedPurchase,
        isApproved: true,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
