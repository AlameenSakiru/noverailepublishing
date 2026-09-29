import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";
import {
  sendSupportTicketConfirmationToCustomer,
  sendSupportTicketNotificationToAdmin,
} from "@/lib/email";

function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NOV-${year}-${randomPart}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!checkRateLimit(`contact_form_${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many messages sent. Please wait 15 minutes before submitting another inquiry." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, subject, category, message, source } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide your full name." },
        { status: 400 }
      );
    }

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a subject for your inquiry." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Please describe your inquiry in at least 10 characters." },
        { status: 400 }
      );
    }

    // Optional user association
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {
      // Unauthenticated visitor is perfectly normal
    }

    // Generate unique ticket number with collision avoidance
    let ticketNumber = generateTicketNumber();
    let collisionCheck = await prisma.supportTicket.findUnique({
      where: { ticketNumber },
    });
    while (collisionCheck) {
      ticketNumber = generateTicketNumber();
      collisionCheck = await prisma.supportTicket.findUnique({
        where: { ticketNumber },
      });
    }

    // Create ticket in database
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        category: category || "GENERAL",
        message: message.trim(),
        source: source || "CONTACT_PAGE",
        userId: user?.userId || null,
        status: "OPEN",
        priority: "NORMAL",
      },
    });

    console.log(`🎫 [SUPPORT TICKET CREATED] #${ticket.ticketNumber} from ${ticket.email}`);

    // Synchronously await email dispatches so serverless functions don't terminate early
    try {
      const emailResults = await Promise.allSettled([
        sendSupportTicketConfirmationToCustomer({
          ticketNumber: ticket.ticketNumber,
          customerName: ticket.name,
          customerEmail: ticket.email,
          category: ticket.category,
          subject: ticket.subject,
          message: ticket.message,
        }),
        sendSupportTicketNotificationToAdmin({
          ticketNumber: ticket.ticketNumber,
          customerName: ticket.name,
          customerEmail: ticket.email,
          category: ticket.category,
          subject: ticket.subject,
          message: ticket.message,
          source: ticket.source,
        }),
      ]);

      emailResults.forEach((res, idx) => {
        const dest = idx === 0 ? "Customer" : "Admin";
        if (res.status === "rejected") {
          console.error(`⚠️ Failed to deliver support ticket email to ${dest}:`, res.reason);
        } else {
          console.log(`✉️ Support ticket email dispatched to ${dest}`);
        }
      });
    } catch (mailErr) {
      console.error("⚠️ Background email dispatch failed for support ticket:", mailErr);
    }

    return NextResponse.json({
      success: true,
      ticketNumber: ticket.ticketNumber,
      id: ticket.id,
      message: "Your inquiry has been received. A confirmation has been sent to your email.",
    });
  } catch (error: any) {
    console.error("❌ Support ticket submission error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again or email us directly." },
      { status: 500 }
    );
  }
}
