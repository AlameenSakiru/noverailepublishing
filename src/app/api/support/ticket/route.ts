import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketNumber = searchParams.get("ticketNumber");
    const email = searchParams.get("email");

    if (!ticketNumber || !email) {
      return NextResponse.json(
        { error: "Ticket reference number and email are both required." },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: {
        ticketNumber: ticketNumber.trim(),
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            senderType: true,
            senderName: true,
            message: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket || ticket.email.toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "No matching ticket found for the provided reference and email." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        category: ticket.category,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        createdAt: ticket.createdAt,
        resolvedAt: ticket.resolvedAt,
        messages: ticket.messages,
      },
    });
  } catch (error: any) {
    console.error("Support ticket lookup error:", error);
    return NextResponse.json(
      { error: "Unable to retrieve ticket." },
      { status: 500 }
    );
  }
}
