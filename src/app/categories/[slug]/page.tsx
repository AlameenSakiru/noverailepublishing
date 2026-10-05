import React from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { BookCard } from "@/components/BookCard";
import { siteConfig } from "@/lib/config";

export const revalidate = 60;

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  if (params.slug === "exam-prep") {
    permanentRedirect("/exam-prep");
  }

  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      description: true,
      slug: true,
      children: {
        select: {
          id: true,
          _count: {
            select: {
              books: {
                where: { status: "PUBLISHED" },
              },
            },
          },
        },
      },
      _count: {
        select: {
          books: {
            where: { status: "PUBLISHED" },
          },
        },
      },
    },
  });

  if (!category) {
    return {
      title: "Category Not Found",
      robots: { index: false, follow: false },
    };
  }

  const subTotal = category.children?.reduce((acc, c) => acc + (c._count?.books || 0), 0) || 0;
  const hasContent = (category._count.books + subTotal) > 0;
  const title = `${category.name} Books`;
  const description = category.description || `Browse curated digital publications in ${category.name} from Noveraile Publishing.`;
  const url = `${siteConfig.url}/categories/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | Noveraile Publishing`,
      description,
      url,
      type: "website",
      images: [
        {
          url: "/logo-square.png",
          width: 1024,
          height: 1024,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Noveraile Publishing`,
      description,
      images: ["/logo-square.png"],
    },
    robots: hasContent
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = params;

  if (slug === "exam-prep") {
    permanentRedirect("/exam-prep");
  }

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: true,
    },
  });

  if (!category) {
    notFound();
  }

  // Find books for this category or any child subcategories
  const childCategoryIds = category.children.map((c) => c.id);
  const targetCategoryIds = [category.id, ...childCategoryIds];

  const books = await prisma.book.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: { in: targetCategoryIds },
    },
    include: {
      author: true,
      category: true,
      reviews: {
        select: { rating: true },
      },
    },
    orderBy: { isFeatured: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Category Header */}
      <div className="pb-8 border-b border-brand-border">
        <div className="flex items-center gap-2 text-xs text-brand-muted mb-2">
          <Link href="/categories" className="hover:text-brand-ink">
            Categories
          </Link>
          {category.parent && (
            <>
              <span>/</span>
              <Link href={`/categories/${category.parent.slug}`} className="hover:text-brand-ink">
                {category.parent.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-brand-ink font-semibold">{category.name}</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-sm text-brand-slate mt-2 max-w-3xl leading-relaxed font-light">
            {category.description}
          </p>
        )}

        {/* Subcategories list if present */}
        {category.children.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {category.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.slug}`}
                className="px-3 py-1.5 rounded-lg bg-white border border-brand-border hover:bg-brand-50 text-xs font-medium text-brand-slate transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Books in this Category */}
      <div className="mt-10">
        <div className="mb-6 flex items-center justify-between text-xs text-brand-muted">
          <span>{books.length} publications in this category</span>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-brand-border">
            <p className="text-sm text-brand-muted">
              No publications currently available in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => {
              const reviewCount = book.reviews?.length || 0;
              const avgRating = reviewCount > 0
                ? book.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
                : null;

              return (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  subtitle={book.subtitle}
                  slug={book.slug}
                  coverImage={book.coverImage}
                  authorName={book.author.name}
                  categoryName={book.category.name}
                  price={book.price}
                  salePrice={book.salePrice}
                  rating={avgRating}
                  reviewCount={reviewCount}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
