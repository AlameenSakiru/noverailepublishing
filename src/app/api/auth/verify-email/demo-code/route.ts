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

    let record = await prisma.verificationCode.findFirst({
      where: {
        email,
        type: "EMAIL_VERIFICATION",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

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
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
