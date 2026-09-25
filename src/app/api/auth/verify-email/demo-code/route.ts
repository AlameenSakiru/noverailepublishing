import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const hasEmailProvider = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== "");

    // If live email provider is connected in production, do not expose code via public API for security
    if (hasEmailProvider && process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: true, liveEmailActive: true });
    }

    const record = await prisma.verificationCode.findFirst({
      where: {
        email,
        type: "EMAIL_VERIFICATION",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: "No active code found" });
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
