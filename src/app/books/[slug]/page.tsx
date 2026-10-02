import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { siteConfig } from "@/lib/config";
import { BookDetailClient } from "./BookDetailClient";

export const revalidate = 60;

interface BookPageProps {
  params: {
    slug: string;
  };
}

const getBook = cache(async (slug: string) => {
  return prisma.book.findUnique({
    where: { slug },
    include: {
      author: true,
      category: true,
      imprint: true,
      examMetadata: true,
      reviews: {
        where: { isApproved: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
});

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const book = await getBook(params.slug);

  if (!book) {
    return { title: "Book Not Found" };
  }

  const bookUrl = `${siteConfig.url}/books/${book.slug}`;
  const bookTitle = book.title;
  const bookDescription = book.shortDescription || (book.description ? book.description.replace(/<[^>]*>?/gm, "").slice(0, 160) : "");

  return {
    title: bookTitle,
    description: bookDescription,
    alternates: {
      canonical: bookUrl,
    },
    openGraph: {
      title: bookTitle,
      description: bookDescription,
      url: bookUrl,
      type: "book",
      images: [
        {
          url: book.coverImage,
          alt: book.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: bookTitle,
      description: bookDescription,
      images: [book.coverImage],
    },
  };
}

export default async function BookDetailPage({ params }: BookPageProps) {
  const { slug } = params;
  const book = await getBook(slug);

  if (!book || book.status !== "PUBLISHED") {
    notFound();
  }

  // Check if current user owns this book
  const currentUser = await getCurrentUser();
  let isOwned = false;

  if (currentUser) {
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

    const paidOrder = await prisma.orderItem.findFirst({
      where: {
        bookId: book.id,
        order: {
          paymentStatus: "PAID",
          OR: [
            { userId: currentUser.userId },
            { customerEmail: currentUser.email },
          ],
        },
      },
    });

    isOwned = Boolean(entitlement || paidOrder);
  }

  // Schema.org JSON-LD Structured Data for Book
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "alternateName": book.subtitle,
    ...(book.isbn && /^97[89]\d{9}[\dX]$/i.test(book.isbn.replace(/[-\s]/g, ""))
      ? { isbn: book.isbn }
      : { identifier: book.isbn || book.id }),
    "numberOfPages": book.pageCount,
    "bookFormat": "https://schema.org/EBook",
    "inLanguage": book.language,
    "image": book.coverImage,
    "description": book.shortDescription,
    "author": {
      "@type": "Person",
      "name": book.author.name,
      "url": `${siteConfig.url}/authors/${book.author.slug}`,
    },
    "publisher": {
      "@type": "Organization",
      "name": book.imprint?.name || siteConfig.name,
      "url": siteConfig.url,
    },
    "offers": {
      "@type": "Offer",
      "price": (book.salePrice != null && book.salePrice > 0 ? book.salePrice : book.price).toFixed(2),
      "priceCurrency": book.currency,
      "availability": "https://schema.org/InStock",
      "url": `${siteConfig.url}/books/${book.slug}`,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-14">
      {/* Search Engine JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <BookDetailClient book={book} isOwned={isOwned} currentUser={currentUser} />
    </div>
  );
}
