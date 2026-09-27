import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { user: null, ownedBookIds: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }

  try {
    const [entitlements, paidOrderItems] = await Promise.all([
      prisma.entitlement.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { userId: user.userId },
            { user: { email: user.email } },
          ],
        },
        select: { bookId: true },
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            paymentStatus: "PAID",
            isGift: false,
            OR: [
              { userId: user.userId },
              { customerEmail: user.email },
            ],
          },
        },
        select: { bookId: true },
      }),
    ]);

    const ownedBookIds = Array.from(
      new Set([
        ...entitlements.map((e) => e.bookId),
        ...paidOrderItems.map((o) => o.bookId),
      ])
    );

    return NextResponse.json(
      {
        user,
        ownedBookIds,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching owned books for current user:", error);
    return NextResponse.json(
      { user, ownedBookIds: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}
