import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ valid: false, message: "Coupon code is required." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, message: "Invalid or inactive coupon code." }, { status: 404 });
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      return NextResponse.json({ valid: false, message: "This coupon is not yet active." }, { status: 400 });
    }

    if (coupon.endDate && coupon.endDate < now) {
      return NextResponse.json({ valid: false, message: "This coupon has expired." }, { status: 400 });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, message: "This coupon has reached its usage limit." }, { status: 400 });
    }

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        { valid: false, message: `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} required for this code.` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (error: any) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ valid: false, message: "Error validating coupon." }, { status: 500 });
  }
}
