import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, setSessionCookie, hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!checkRateLimit(`claim_sess_${ip}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many claim attempts. Please sign in directly." }, { status: 429 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { orderNumber, sessionId } = body || {};

    if (!orderNumber || typeof orderNumber !== "string") {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim() },
      include: { user: true },
    });

    if (!order || order.paymentStatus !== "PAID") {
      return NextResponse.json({ error: "Valid paid order not found" }, { status: 404 });
    }

    // Check if the current request already has an active session for this user
    const currentUser = await getCurrentUser();
    if (currentUser && (currentUser.userId === order.userId || currentUser.email === order.customerEmail)) {
      return NextResponse.json({ success: true, user: currentUser });
    }

    // Critical Security Guard: NEVER allow claiming an order tied to an ADMIN or EDITOR role!
    if (order.user && (order.user.role === "ADMIN" || order.user.role === "EDITOR")) {
      return NextResponse.json(
        { error: "Staff orders require direct credential sign-in and cannot be claimed via order tokens." },
        { status: 403 }
      );
    }

    // For Stripe orders, verify the secret stripeSessionId matches to prevent guessing
    if (order.stripeSessionId) {
      if (!sessionId || sessionId !== order.stripeSessionId) {
        return NextResponse.json(
          { error: "Verification token mismatch. Please sign in with your account credentials." },
          { status: 403 }
        );
      }
    } else {
      // For non-Stripe orders, session cookie is already issued atomically during create-session.
      // If unauthenticated user reaches here without cookie, require them to log in to prevent guessing order numbers.
      if (!currentUser) {
        return NextResponse.json(
          { error: "Please sign in to access your digital library." },
          { status: 401 }
        );
      }
    }

    // Resolve user account for this order
    let user = order.user;
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: order.customerEmail },
      });
    }

    if (!user) {
      const randomPass = Math.random().toString(36).slice(-10) + "A1!";
      const passwordHash = await hashPassword(randomPass);
      user = await prisma.user.create({
        data: {
          email: order.customerEmail,
          name: order.customerEmail.split("@")[0],
          passwordHash,
          role: "CUSTOMER",
          isEmailVerified: true,
        },
      });
    }

    // Guarantee that claimed account cannot be elevated to staff
    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Administrative accounts cannot be claimed through order tokens." },
        { status: 403 }
      );
    }

    if (order.userId !== user.id) {
      await prisma.order.update({
        where: { id: order.id },
        data: { userId: user.id },
      });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    await setSessionCookie(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      response
    );

    return response;
  } catch (error) {
    console.error("Error claiming order session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
