import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Editor privileges required." },
        { status: 403 }
      );
    }

    const reviews = await prisma.review.findMany({
      include: {
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
          },
        },
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

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
