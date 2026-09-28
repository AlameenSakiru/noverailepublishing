import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendSupportTicketReplyToCustomer } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Editor privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { message, newStatus } = body;

    if (!message || typeof message !== "string" || message.trim().length < 2) {
      return NextResponse.json(
        { error: "Reply message cannot be empty." },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    // Create the message reply record
    const reply = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: "ADMIN",
        senderName: session.name || "Noveraile Support",
        senderEmail: session.email || null,
        message: message.trim(),
      },
    });

    // Update ticket status
    const statusToSet =
      newStatus || (ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status);
    const resolvedAt =
      statusToSet === "RESOLVED"
        ? ticket.resolvedAt || new Date()
        : null;

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: statusToSet,
        resolvedAt,
        updatedAt: new Date(),
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Synchronously send email so serverless runtimes don't freeze before completion
    try {
      await sendSupportTicketReplyToCustomer({
        ticketNumber: ticket.ticketNumber,
        customerName: ticket.name,
        customerEmail: ticket.email,
        subject: ticket.subject,
        replyMessage: message.trim(),
        adminName: session.name || "Noveraile Support Desk",
        originalMessage: ticket.message,
      });
      console.log(`✉️ Reply email delivered to customer ${ticket.email} for ticket #${ticket.ticketNumber}`);
    } catch (mailErr) {
      console.error("⚠️ Failed to deliver reply email:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: reply,
      ticket: updatedTicket,
    });
  } catch (error: any) {
    console.error("❌ Support reply error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch reply. Please try again." },
      { status: 500 }
    );
  }
}
