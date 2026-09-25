import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, error: "Demo code endpoint disabled in production" }, { status: 404 });
}
