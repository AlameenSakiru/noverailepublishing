import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendBroadcastEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Customer counts
    const [totalCustomers, verifiedCustomers] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "CUSTOMER", isEmailVerified: true } }),
    ]);

    // Published Books for quick-attach
    const books = await prisma.book.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        coverImage: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Active Coupons for quick-attach
    const coupons = await prisma.coupon.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Broadcast History from AuditLog
    const historyLogs = await prisma.auditLog.findMany({
      where: { action: "EMAIL_BROADCAST" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    });

    const history = historyLogs.map((log) => {
      let details: any = {};
      try {
        details = JSON.parse(log.details || "{}");
      } catch {}
      return {
        id: log.id,
        subject: details.subject || "Email Broadcast",
        campaignType: details.campaignType || "ANNOUNCEMENT",
        recipientCount: details.recipientCount || 0,
        sentCount: details.sentCount || 0,
        failureCount: details.failureCount || 0,
        audience: details.audience || "ALL_CUSTOMERS",
        sentBy: log.user?.name || "Admin",
        createdAt: log.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        audienceStats: {
          totalCustomers,
          verifiedCustomers,
        },
        books: books.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          price: b.price,
          coverImage: b.coverImage,
          authorName: b.author?.name || "Unknown Author",
        })),
        coupons: coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discount:
            c.discountType === "PERCENTAGE"
              ? `${c.discountValue}% OFF`
              : `$${c.discountValue.toFixed(2)} OFF`,
        })),
        history,
      },
    });
  } catch (error: any) {
    console.error("Fetch broadcasts error:", error);
    return NextResponse.json({ error: "Failed to load broadcast data." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can send email broadcasts." }, { status: 403 });
    }

    const body = await req.json();
    const {
      subject,
      headline,
      content,
      audience = "VERIFIED_CUSTOMERS", // "ALL_CUSTOMERS" | "VERIFIED_CUSTOMERS" | "TEST_ONLY"
      campaignType = "ANNOUNCEMENT",
      ctaText,
      ctaUrl,
      bookId,
      couponCode,
      testRecipientEmail,
    } = body || {};

    if (!subject || !headline || !content) {
      return NextResponse.json(
        { error: "Subject, headline, and message content are required." },
        { status: 400 }
      );
    }

    // Resolve book details if attached
    let attachedBook = undefined;
    if (bookId) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: { author: { select: { name: true } } },
      });
      if (book) {
        attachedBook = {
          title: book.title,
          author: book.author?.name || "Author",
          price: book.price,
          coverUrl: book.coverImage || undefined,
        };
      }
    }

    // Resolve coupon discount description if attached
    let couponDiscount = undefined;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      if (coupon) {
        couponDiscount =
          coupon.discountType === "PERCENTAGE"
            ? `${coupon.discountValue}% OFF`
            : `$${coupon.discountValue.toFixed(2)} OFF`;
      }
    }

    // 1. If Test Send
    if (audience === "TEST_ONLY") {
      const testEmail = testRecipientEmail?.trim() || session.email;
      const sendResult = await sendBroadcastEmail({
        toEmail: testEmail,
        recipientName: session.name || "Administrator",
        subject: `[TEST PREVIEW] ${subject}`,
        headline,
        content,
        campaignType,
        ctaText,
        ctaUrl,
        bookTitle: attachedBook?.title,
        bookAuthor: attachedBook?.author,
        bookPrice: attachedBook?.price,
        bookCoverUrl: attachedBook?.coverUrl,
        couponCode,
        couponDiscount,
      });

      if (!sendResult.success) {
        return NextResponse.json(
          { error: `Failed to send preview: ${sendResult.error}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Preview test email successfully delivered to ${testEmail}!`,
        isTest: true,
      });
    }

    // 2. Full Audience Broadcast
    const whereClause: any = { role: "CUSTOMER", status: "ACTIVE" };
    if (audience === "VERIFIED_CUSTOMERS") {
      whereClause.isEmailVerified = true;
    }

    const recipients = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, email: true, name: true },
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No matching customers found for the selected audience." },
        { status: 400 }
      );
    }

    let sentCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const res = await sendBroadcastEmail({
          toEmail: recipient.email,
          recipientName: recipient.name || "Reader",
          subject,
          headline,
          content,
          campaignType,
          ctaText,
          ctaUrl,
          bookTitle: attachedBook?.title,
          bookAuthor: attachedBook?.author,
          bookPrice: attachedBook?.price,
          bookCoverUrl: attachedBook?.coverUrl,
          couponCode,
          couponDiscount,
        });

        if (res.success) {
          sentCount++;
        } else {
          failureCount++;
          errors.push(`${recipient.email}: ${res.error}`);
        }
      } catch (err: any) {
        failureCount++;
        errors.push(`${recipient.email}: ${err?.message}`);
      }

      // Small delay between emails to respect SMTP throughput
      await new Promise((r) => setTimeout(r, 120));
    }

    // Save campaign record to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "EMAIL_BROADCAST",
        entityType: "BroadcastCampaign",
        details: JSON.stringify({
          subject,
          headline,
          campaignType,
          audience,
          recipientCount: recipients.length,
          sentCount,
          failureCount,
          bookId,
          couponCode,
          previewSnippet: content.slice(0, 100),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast completed: ${sentCount} sent successfully (${failureCount} failed).`,
      stats: {
        totalRecipients: recipients.length,
        sentCount,
        failureCount,
      },
    });
  } catch (error: any) {
    console.error("Send broadcast error:", error);
    return NextResponse.json({ error: error?.message || "Failed to send email broadcast." }, { status: 500 });
  }
}
