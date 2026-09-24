import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { uses: true } },
    },
  });

  return NextResponse.json({ coupons });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, discountType, discountValue, minOrderAmount, maxUses } = body;

    if (!code || !discountValue) {
      return NextResponse.json(
        { error: "Code and discount value are required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType || "PERCENTAGE",
        discountValue: parseFloat(discountValue),
        minOrderAmount: parseFloat(minOrderAmount || 0),
        maxUses: parseInt(maxUses || 1000, 10),
        isActive: true,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, isActive } = await request.json();
    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive },
    });
    return NextResponse.json({ coupon: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
