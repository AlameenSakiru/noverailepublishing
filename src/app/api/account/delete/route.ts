import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getCurrentUser, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { password, confirmation } = body;

    // If account has password, verify it
    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: "Please enter your password to confirm account deletion." },
          { status: 400 }
        );
      }
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Incorrect password. Deletion cancelled." },
          { status: 400 }
        );
      }
    } else {
      // Social login without password: require typing "DELETE"
      if (confirmation !== "DELETE") {
        return NextResponse.json(
          { success: false, error: "Please type DELETE to confirm account deletion." },
          { status: 400 }
        );
      }
    }

    // Execute deletion under transaction
    await prisma.$transaction(async (tx) => {
      // Delete user sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // Reading progress, bookmarks, entitlements, reviews cascade automatically on user deletion
      // Delete the user record
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    // Clear session cookie
    const cookieStore = cookies();
    cookieStore.delete("noveraile_session");

    return NextResponse.json({
      success: true,
      message: "Your account and personal data have been permanently erased.",
    });
  } catch (error: any) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete account. Please contact support@noveraile.com." },
      { status: 500 }
    );
  }
}
