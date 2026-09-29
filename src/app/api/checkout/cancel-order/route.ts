import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!checkRateLimit(`cancel_order_${ip}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many cancel requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { orderNumber } = body || {};

    if (!orderNumber || typeof orderNumber !== "string") {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim() },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Cannot cancel an order that has already been confirmed as paid." },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "Order has been marked as cancelled.",
      orderNumber: updated.orderNumber,
      paymentStatus: updated.paymentStatus,
    });
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
