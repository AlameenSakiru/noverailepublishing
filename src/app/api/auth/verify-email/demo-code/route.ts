import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const hasEmailProvider = Boolean(
      (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== "") ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    );

    // If live email provider is active in production, do not expose PINs publicly
    if (hasEmailProvider && process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: true, liveEmailActive: true });
    }

    let record = await prisma.verificationCode.findFirst({
      where: {
        email,
        type: "EMAIL_VERIFICATION",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    // If no active code found, auto-generate one for testing
    if (!record) {
      const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      record = await prisma.verificationCode.create({
        data: {
          email,
          code,
          type: "EMAIL_VERIFICATION",
          expiresAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      demoCode: record.code,
      expiresAt: record.expiresAt,
      hasEmailProvider,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
