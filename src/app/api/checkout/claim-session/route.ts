import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, setSessionCookie, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { orderNumber } = await req.json();

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
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

    // Resolve or create user account for this order
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

    if (order.userId !== user.id) {
      await prisma.order.update({
        where: { id: order.id },
        data: { userId: user.id },
      });
    }

    // Issue session cookie so reader and library immediately recognize the customer
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error claiming order session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
