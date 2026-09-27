import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Editor privileges required." },
        { status: 403 }
      );
    }

    const reviewId = params.id;
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        book: { select: { title: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: "REVIEW_DELETED",
          entityType: "Review",
          entityId: reviewId,
          details: JSON.stringify({
            bookTitle: existing.book.title,
            reviewTitle: existing.title,
            rating: existing.rating,
          }),
        },
      });
    } catch {
      // Ignored
    }

    return NextResponse.json({
      success: true,
      message: "Review successfully deleted.",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Editor privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { isApproved } = body;

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: {
        isApproved: Boolean(isApproved),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Review ${updated.isApproved ? "approved" : "hidden"}.`,
      review: updated,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
