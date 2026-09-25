import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentToken = cookies().get("noveraile_session")?.value;

    // Delete all sessions for user except current token
    const deleteResult = await prisma.session.deleteMany({
      where: {
        userId: session.userId,
        ...(currentToken ? { token: { not: currentToken } } : {}),
      },
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "REVOKE_OTHER_SESSIONS",
          entityType: "Session",
          entityId: session.userId,
          details: JSON.stringify({ revokedCount: deleteResult.count }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Signed out of ${deleteResult.count} other session(s).`,
      revokedCount: deleteResult.count,
    });
  } catch (error: any) {
    console.error("Revoke sessions error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
