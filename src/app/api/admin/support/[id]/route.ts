import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch ticket." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, priority, adminNotes } = body;

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      if (status === "RESOLVED" && !existing.resolvedAt) {
        updateData.resolvedAt = new Date();
      } else if (status !== "RESOLVED") {
        updateData.resolvedAt = null;
      }
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      ticket: updated,
    });
  } catch (error: any) {
    console.error("❌ Ticket update error:", error);
    return NextResponse.json(
      { error: "Failed to update ticket." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Executive Admins can delete tickets." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.supportTicket.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Ticket removed successfully.",
    });
  } catch (error: any) {
    console.error("❌ Ticket delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket." },
      { status: 500 }
    );
  }
}
