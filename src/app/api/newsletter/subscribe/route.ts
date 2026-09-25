import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`newsletter_${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many subscription requests. Please try again later." },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const { email } = body || {};

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase().slice(0, 254);

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

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
