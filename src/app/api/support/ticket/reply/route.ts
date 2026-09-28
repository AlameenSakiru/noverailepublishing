import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSupportTicketNotificationToAdmin } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketNumber, email, message } = body;

    if (!ticketNumber || !email || !message || message.trim().length < 2) {
      return NextResponse.json(
        { error: "Ticket reference number, email, and reply message are required." },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { ticketNumber: ticketNumber.trim() },
    });

    if (!ticket || ticket.email.toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Ticket not found or email address does not match." },
        { status: 404 }
      );
    }

    // Create the customer reply message
    const reply = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: "CUSTOMER",
        senderName: ticket.name,
        senderEmail: ticket.email,
        message: message.trim(),
      },
    });

    // Update ticket status back to OPEN or IN_PROGRESS if it was resolved
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "OPEN" : ticket.status,
        updatedAt: new Date(),
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Alert admin of customer reply
    try {
      await sendSupportTicketNotificationToAdmin({
        ticketNumber: ticket.ticketNumber,
        customerName: ticket.name,
        customerEmail: ticket.email,
        category: ticket.category,
        subject: `[Customer Follow-up] ${ticket.subject}`,
        message: message.trim(),
        source: "CUSTOMER_WEB_REPLY",
      });
    } catch (mailErr) {
      console.error("Failed to notify admin of customer reply:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: reply,
      ticket: updatedTicket,
    });
  } catch (error: any) {
    console.error("Customer reply submission error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch follow-up reply." },
      { status: 500 }
    );
  }
}
