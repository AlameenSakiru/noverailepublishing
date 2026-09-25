import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`coupon_check_${ip}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json(
        { valid: false, message: "Too many coupon validation attempts. Please try again later." },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ valid: false, message: "Malformed request payload." }, { status: 400 });
    }

    const { code, subtotal } = body || {};

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, message: "Coupon code is required." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().slice(0, 30);
    const orderSubtotal = typeof subtotal === "number" && !isNaN(subtotal) ? subtotal : 0;

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

    if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
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
