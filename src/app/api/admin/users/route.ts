import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim().toLowerCase() || "";
    const status = url.searchParams.get("status") || "ALL";

    const users = await prisma.user.findMany({
      where: {
        ...(status !== "ALL" ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: true,
            entitlements: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }
    console.error("Admin fetch users error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { userId, action, role } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Target User ID is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Safety: Cannot suspend or demote yourself
    if (targetUser.id === admin.userId && (action === "SUSPEND" || (action === "ROLE_CHANGE" && role === "CUSTOMER"))) {
      return NextResponse.json(
        { success: false, error: "Security restriction: You cannot suspend or demote your own active admin account." },
        { status: 400 }
      );
    }

    if (action === "SUSPEND") {
      // 1. Mark status as SUSPENDED
      await prisma.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      });

      // 2. Immediately terminate all active sessions so user is logged out instantly
      const sessionCount = await prisma.session.deleteMany({
        where: { userId },
      });

      // 3. Record audit log
      try {
        await prisma.auditLog.create({
          data: {
            userId: admin.userId,
            action: "USER_SUSPENDED",
            entityType: "User",
            entityId: userId,
            details: JSON.stringify({
              targetEmail: targetUser.email,
              terminatedSessions: sessionCount.count,
            }),
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `User ${targetUser.email} has been suspended and all active sessions were terminated.`,
      });
    }

    if (action === "ACTIVATE") {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
      });

      try {
        await prisma.auditLog.create({
          data: {
            userId: admin.userId,
            action: "USER_ACTIVATED",
            entityType: "User",
            entityId: userId,
            details: JSON.stringify({ targetEmail: targetUser.email }),
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `User ${targetUser.email} has been reactivated.`,
      });
    }

    if (action === "ROLE_CHANGE") {
      if (!["CUSTOMER", "EDITOR", "ADMIN"].includes(role)) {
        return NextResponse.json({ success: false, error: "Invalid role specified." }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      try {
        await prisma.auditLog.create({
          data: {
            userId: admin.userId,
            action: "USER_ROLE_CHANGED",
            entityType: "User",
            entityId: userId,
            details: JSON.stringify({ oldRole: targetUser.role, newRole: role }),
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `User role updated to ${role}.`,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }
    console.error("Admin user action error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Target User ID is required" }, { status: 400 });
    }

    if (userId === admin.userId) {
      return NextResponse.json(
        { success: false, error: "Security restriction: You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Delete user (Casacades sessions, entitlements, reading progress, bookmarks, reviews)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: "USER_DELETED",
          entityType: "User",
          entityId: userId,
          details: JSON.stringify({ deletedEmail: targetUser.email, deletedName: targetUser.name }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `User account (${targetUser.email}) and all associated records have been permanently deleted.`,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }
    console.error("Admin delete user error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
