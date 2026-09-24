import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const { action, userEmail, bookId, reason } = await req.json();

    if (!userEmail || !bookId || !action) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found with this email." }, { status: 404 });
    }

    if (action === "GRANT") {
      const entitlement = await prisma.entitlement.upsert({
        where: {
          userId_bookId: {
            userId: targetUser.id,
            bookId,
          },
        },
        update: {
          status: "ACTIVE",
          revokedAt: null,
          revocationReason: null,
        },
        create: {
          userId: targetUser.id,
          bookId,
          status: "ACTIVE",
        },
      });

      // Ensure reading progress
      await prisma.readingProgress.upsert({
        where: {
          userId_bookId: {
            userId: targetUser.id,
            bookId,
          },
        },
        update: {},
        create: {
          userId: targetUser.id,
          bookId,
          currentPage: 1,
          totalPages: 1,
          progressPercent: 0,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: "ENTITLEMENT_MANUALLY_GRANTED",
          entityType: "Entitlement",
          entityId: entitlement.id,
          details: JSON.stringify({ userEmail, bookId, reason }),
        },
      });

      return NextResponse.json({ success: true, entitlement });
    } else if (action === "REVOKE") {
      const entitlement = await prisma.entitlement.update({
        where: {
          userId_bookId: {
            userId: targetUser.id,
            bookId,
          },
        },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revocationReason: reason || "Manual revocation by administrator",
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: "ENTITLEMENT_REVOKED",
          entityType: "Entitlement",
          entityId: entitlement.id,
          details: JSON.stringify({ userEmail, bookId, reason }),
        },
      });

      return NextResponse.json({ success: true, entitlement });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update entitlement." }, { status: 500 });
  }
}
