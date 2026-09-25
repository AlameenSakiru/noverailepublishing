import React from "react";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ReaderClient } from "./ReaderClient";

export const dynamic = "force-dynamic";

interface ReaderPageProps {
  params: {
    bookSlug: string;
  };
}

export default async function ProtectedReaderPage({ params }: ReaderPageProps) {
  const { bookSlug } = params;

  const book = await prisma.book.findFirst({
    where: {
      OR: [
        { slug: bookSlug },
        { id: bookSlug },
      ],
    },
    include: {
      author: true,
      category: true,
    },
  });

  if (!book) {
    notFound();
  }

  const currentUser = await getCurrentUser();

  // If unauthenticated, redirect to login
  if (!currentUser) {
    redirect(`/login?redirect=/reader/${bookSlug}`);
  }

  // Check server-side entitlement or admin privileges
  const isStaff = currentUser.role === "ADMIN" || currentUser.role === "EDITOR";

  // Only published books accessible to regular customers; staff can preview all
  if (!isStaff && book.status !== "PUBLISHED") {
    notFound();
  }

  let hasEntitlement = isStaff;

  if (!hasEntitlement) {
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        bookId: book.id,
        status: "ACTIVE",
        OR: [
          { userId: currentUser.userId },
          { user: { email: currentUser.email } },
        ],
      },
    });
    hasEntitlement = Boolean(entitlement);
  }

  // If user does not own the book, redirect to book sales landing page with notice
  if (!hasEntitlement) {
    redirect(`/books/${book.slug}?notice=purchase_required`);
  }

  // Retrieve user's last saved reading position
  const progress = await prisma.readingProgress.findFirst({
    where: {
      bookId: book.id,
      OR: [
        { userId: currentUser.userId },
        { user: { email: currentUser.email } },
      ],
    },
  });

  const initialPage = progress?.currentPage || 1;

  let toc: any[] = [];
  try {
    toc = JSON.parse(book.tableOfContents || "[]");
  } catch {
    toc = [{ chapter: 1, title: "Curriculum Overview", startPage: 1 }];
  }

  let pdfUrl: string | null = null;
  try {
    const specs = JSON.parse(book.specifications || "{}");
    if (specs.manuscriptPdfUrl) {
      pdfUrl = specs.manuscriptPdfUrl;
    }
  } catch {
    pdfUrl = null;
  }

  return (
    <ReaderClient
      book={{
        id: book.id,
        slug: book.slug,
        title: book.title,
        subtitle: book.subtitle,
        authorName: book.author.name,
        pageCount: book.pageCount,
        tableOfContents: toc,
        pdfUrl: `/api/reader/pdf-stream?bookId=${book.id}`,
        pdfStreamUrl: `/api/reader/pdf-stream?bookId=${book.id}`,
      }}
      initialPage={initialPage}
      userEmail={currentUser.email}
      userName={currentUser.name}
      userId={currentUser.userId}
      hasEntitlement={hasEntitlement}
    />
  );
}
