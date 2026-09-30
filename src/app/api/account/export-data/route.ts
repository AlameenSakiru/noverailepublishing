import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            currency: true,
            paymentStatus: true,
            createdAt: true,
            payment: {
              select: {
                provider: true,
                status: true,
              },
            },
            items: {
              select: {
                id: true,
                price: true,
                bookTitle: true,
                book: {
                  select: {
                    id: true,
                    title: true,
                    isbn: true,
                  },
                },
              },
            },
          },
        },
        entitlements: {
          select: {
            id: true,
            bookId: true,
            status: true,
            isGift: true,
            grantedAt: true,
            revokedAt: true,
            book: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
            book: {
              select: {
                title: true,
              },
            },
          },
        },
        readingProgress: {
          select: {
            bookId: true,
            currentPage: true,
            totalPages: true,
            progressPercent: true,
            lastReadAt: true,
            updatedAt: true,
            book: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const exportPayload = {
      exportMetadata: {
        platform: "Noveraile Publishing",
        legalStandard: "GDPR Article 15 / CCPA Right of Access",
        exportedAt: new Date().toISOString(),
        requestingUser: currentUser.email,
      },
      userProfile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        memberSince: user.createdAt,
      },
      digitalLibraryEntitlements: user.entitlements,
      purchaseHistory: user.orders,
      submittedReviews: user.reviews,
      readingProgress: user.readingProgress,
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="noveraile-data-export-${user.id.slice(-6)}.json"`,
      },
    });
  } catch (error: any) {
    console.error("GDPR data export failed:", error);
    return NextResponse.json(
      { error: "Failed to generate data export." },
      { status: 500 }
    );
  }
}
