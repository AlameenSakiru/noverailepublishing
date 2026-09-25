import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        orders: {
          select: { id: true, totalAmount: true, paymentStatus: true, createdAt: true },
        },
        entitlements: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            bookId: true,
            book: { select: { id: true, title: true, slug: true, coverImage: true } },
          },
        },
        sessions: {
          orderBy: { lastActive: "desc" },
          select: {
            id: true,
            userAgent: true,
            ipAddress: true,
            lastActive: true,
            createdAt: true,
            token: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const currentToken = cookies().get("noveraile_session")?.value;

    // Mask active sessions so client knows which is current
    const formattedSessions = user.sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent || "Desktop Browser",
      ipAddress: s.ipAddress || "Active Connection",
      lastActive: s.lastActive.toISOString(),
      createdAt: s.createdAt.toISOString(),
      isCurrent: s.token === currentToken,
    }));

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        totalPurchases: user.entitlements.length,
        entitlements: user.entitlements,
        sessions: formattedSessions,
      },
    });
  } catch (error: any) {
    console.error("Fetch account profile error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatarUrl } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Full name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name.trim(),
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "UPDATE_PROFILE",
          entityType: "User",
          entityId: session.userId,
          details: JSON.stringify({ updatedName: updatedUser.name }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully.",
    });
  } catch (error: any) {
    console.error("Update account profile error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
