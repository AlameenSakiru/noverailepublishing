import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    await prisma.newsletterSubscriber.upsert({
      where: { email: cleanEmail },
      update: { isActive: true },
      create: {
        email: cleanEmail,
        source: "homepage_footer",
        consentDate: new Date(),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, message: "Thank you for subscribing to Noveraile Publishing." });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Unable to complete subscription." }, { status: 500 });
  }
}
