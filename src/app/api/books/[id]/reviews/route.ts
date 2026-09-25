import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;

    const reviews = await prisma.review.findMany({
      where: { bookId, isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = reviews.length;
    const avg =
      total > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    // Distribution breakdown
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: distribution[stars],
      percentage: total > 0 ? Math.round((distribution[stars] / total) * 100) : 0,
    }));

    return NextResponse.json({
      reviews,
      total,
      average: Number(avg.toFixed(1)),
      breakdown,
    });
  } catch (error) {
    console.error("Error fetching book reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;
    const body = await req.json();
    const { rating, title, comment, guestName, guestEmail } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5 stars" },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Review title is required" },
        { status: 400 }
      );
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: "Review comment is required" },
        { status: 400 }
      );
    }

    // 1. User must be authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in with the account you used to purchase this book to leave a review." },
        { status: 401 }
      );
    }

    // 2. Strict check: Must have an ACTIVE entitlement or PAID order for this book
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        bookId,
        status: "ACTIVE",
        OR: [
          { userId: user.userId },
          { user: { email: user.email } },
        ],
      },
    });

    const paidOrder = await prisma.orderItem.findFirst({
      where: {
        bookId,
        order: {
          paymentStatus: "PAID",
          OR: [
            { userId: user.userId },
            { customerEmail: user.email },
          ],
        },
      },
    });

    if (!entitlement && !paidOrder) {
      return NextResponse.json(
        {
          error:
            "Verified Purchase Required: Only readers who have purchased this publication can write a review.",
        },
        { status: 403 }
      );
    }

    // 3. Check if user already reviewed this book (allow updating their review)
    const existingReview = await prisma.review.findFirst({
      where: {
        bookId,
        userId: user.userId,
      },
    });

    if (existingReview) {
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: Math.round(rating),
          title: title.trim(),
          comment: comment.trim(),
          isVerifiedPurchase: true,
          isApproved: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({ success: true, review: updatedReview, updated: true }, { status: 200 });
    }

    // 4. Create new verified review
    const review = await prisma.review.create({
      data: {
        bookId,
        userId: user.userId,
        rating: Math.round(rating),
        title: title.trim(),
        comment: comment.trim(),
        isVerifiedPurchase: true,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error("Error creating book review:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
