import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookCard } from "@/components/BookCard";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Complete Digital Book Catalog",
  description: "Browse all curated digital publications from Noveraile Publishing. Read instantly in your browser with automatic cloud progress synchronization.",
  alternates: {
    canonical: `${siteConfig.url}/books`,
  },
  openGraph: {
    title: "Complete Digital Book Catalog | Noveraile Publishing",
    description: "Browse all curated digital publications from Noveraile Publishing. Read instantly in your browser with automatic cloud progress synchronization.",
    url: `${siteConfig.url}/books`,
    type: "website",
    images: [
      {
        url: "/logo-square.png",
        width: 1024,
        height: 1024,
        alt: "Noveraile Publishing Catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Complete Digital Book Catalog | Noveraile Publishing",
    description: "Browse all curated digital publications from Noveraile Publishing.",
    images: ["/logo-square.png"],
  },
};

interface BooksPageProps {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  };
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const query = (searchParams.q || "").trim();
  const selectedCategory = (searchParams.category || "").trim();
  const sort = searchParams.sort || "newest";
  const currentPageNum = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const pageSize = 24;

  // Build filter criteria
  const where: any = {
    status: "PUBLISHED",
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { subtitle: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { author: { name: { contains: query, mode: "insensitive" } } },
      { category: { name: { contains: query, mode: "insensitive" } } },
      { examMetadata: { examName: { contains: query, mode: "insensitive" } } },
      { examMetadata: { examAcronym: { contains: query, mode: "insensitive" } } },
    ];
  }

  if (selectedCategory) {
    where.OR = [
      { category: { slug: selectedCategory } },
      { category: { parent: { slug: selectedCategory } } },
    ];
  }

  // Determine sort order
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-low") orderBy = { price: "asc" };
  if (sort === "price-high") orderBy = { price: "desc" };
  if (sort === "title") orderBy = { title: "asc" };

  const [totalBooks, books, categories] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      orderBy,
      skip: (currentPageNum - 1) * pageSize,
      take: pageSize,
      include: {
        author: true,
        category: {
          include: {
            parent: true,
          },
        },
        examMetadata: true,
        reviews: {
          select: { rating: true },
        },
      },
    }),
    prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
        OR: [
          { books: { some: { status: "PUBLISHED" } } },
          { children: { some: { books: { some: { status: "PUBLISHED" } } } } },
        ],
      },
      include: {
        children: {
          where: {
            isActive: true,
            books: { some: { status: "PUBLISHED" } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalBooks / pageSize));

  // Determine active parent and child categories for hierarchical taxonomy drilldown
  const activeParentCat = categories.find(
    (c) => c.slug === selectedCategory || c.children.some((child) => child.slug === selectedCategory)
  );
  const activeSubcategories = activeParentCat?.children || [];

  // Helper to build URL query preserving filters
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory) params.set("category", selectedCategory);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", page.toString());
    const str = params.toString();
    return str ? `/books?${str}` : "/books";
  };

  const startRecord = totalBooks === 0 ? 0 : (currentPageNum - 1) * pageSize + 1;
  const endRecord = Math.min(currentPageNum * pageSize, totalBooks);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Page Heading & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-brand-border">
        <div>
          <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
            Official Catalog
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
            All Digital Publications
          </h1>
          <p className="text-sm text-brand-slate mt-2">
            Showing {startRecord}–{endRecord} of {totalBooks} {totalBooks === 1 ? "publication" : "publications"} available for instant cloud library access.
          </p>
        </div>

        {/* Search & Sort Bar */}
        <form method="GET" action="/books" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full">
          {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search books, exams, authors..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
            />
          </div>
          <select
            name="sort"
            defaultValue={sort}
            className="px-3 py-2 bg-white border border-brand-border rounded-xl text-xs font-medium text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-ink"
          >
            <option value="newest">Newest Releases</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="title">Title: A–Z</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-ink text-white rounded-xl text-xs font-semibold hover:bg-brand-900 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Top-Level Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mt-6 scrollbar-none">
        <Link
          href="/books"
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            !selectedCategory
              ? "bg-brand-ink text-white shadow-xs"
              : "bg-white border border-brand-border text-brand-slate hover:border-brand-ink"
          }`}
        >
          All Categories
        </Link>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug || activeParentCat?.id === cat.id;
          return (
            <Link
              key={cat.id}
              href={`/books?category=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}`}
              className={`px-4 py-2 rounded-full text-xs whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-brand-ink text-white font-semibold shadow-xs"
                  : "bg-white border border-brand-border text-brand-slate hover:border-brand-ink font-medium"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Subcategory Drilldown Chips (If active parent category has children) */}
      {activeSubcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-3 border-b border-brand-border/60 scrollbar-none">
          <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider pl-1 mr-1">
            Subcategories:
          </span>
          <Link
            href={`/books?category=${activeParentCat!.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}`}
            className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors ${
              selectedCategory === activeParentCat!.slug
                ? "bg-amber-100 text-amber-900 font-semibold border border-amber-300"
                : "bg-gray-50 border border-brand-border text-brand-slate hover:border-brand-ink"
            }`}
          >
            All {activeParentCat!.name}
          </Link>
          {activeSubcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/books?category=${sub.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}`}
              className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors ${
                selectedCategory === sub.slug
                  ? "bg-amber-100 text-amber-900 font-semibold border border-amber-300"
                  : "bg-gray-50 border border-brand-border text-brand-slate hover:border-brand-ink"
              }`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Books Results Grid */}
      <div className="mt-8">
        {books.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-ink">
              No matching publications found
            </h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              We couldn&apos;t find a book matching that criteria. Try searching for broader terms or resetting catalog filters.
            </p>
            <Link
              href="/books"
              className="inline-block mt-5 px-4 py-2 bg-brand-ink text-white text-xs font-semibold rounded-lg hover:bg-brand-900 transition-colors"
            >
              Reset Catalog Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

      {/* Scalable Catalog Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-brand-border mt-12 pt-6">
          <div className="text-xs text-brand-muted">
            Page {currentPageNum} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {currentPageNum > 1 ? (
              <Link
                href={buildPageUrl(currentPageNum - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-slate hover:border-brand-ink transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-border bg-gray-50 text-xs font-medium text-gray-400 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </span>
            )}

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPageNum) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-xs text-gray-400">...</span>}
                      <Link
                        href={buildPageUrl(p)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                          currentPageNum === p
                            ? "bg-brand-ink text-white font-semibold"
                            : "bg-white border border-brand-border text-brand-slate hover:border-brand-ink"
                        }`}
                      >
                        {p}
                      </Link>
                    </React.Fragment>
                  );
                })}
            </div>

            {currentPageNum < totalPages ? (
              <Link
                href={buildPageUrl(currentPageNum + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-slate hover:border-brand-ink transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-border bg-gray-50 text-xs font-medium text-gray-400 cursor-not-allowed">
                Next
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
