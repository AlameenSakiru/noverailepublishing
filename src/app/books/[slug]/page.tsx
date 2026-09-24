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
    },
  });
});

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const book = await getBook(params.slug);

  if (!book) {
    return { title: "Book Not Found" };
  }

  return {
    title: `${book.title} | ${siteConfig.name}`,
    description: book.shortDescription || book.description.slice(0, 160),
    openGraph: {
      title: `${book.title} | ${siteConfig.name}`,
      description: book.shortDescription,
      images: [{ url: book.coverImage }],
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
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        userId_bookId: {
          userId: currentUser.userId,
          bookId: book.id,
        },
      },
    });
    isOwned = Boolean(entitlement && entitlement.status === "ACTIVE");
  }

  // Schema.org JSON-LD Structured Data for Book
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "alternateName": book.subtitle,
    "isbn": book.isbn,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Search Engine JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <BookDetailClient book={book} isOwned={isOwned} />
    </div>
  );
}
