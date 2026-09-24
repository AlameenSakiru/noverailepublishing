import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookCard } from "@/components/BookCard";
import { Search, SlidersHorizontal } from "lucide-react";

export const revalidate = 30;

interface BooksPageProps {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
  };
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const query = searchParams.q || "";
  const selectedCategory = searchParams.category || "";
  const sort = searchParams.sort || "newest";

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

  const books = await prisma.book.findMany({
    where,
    orderBy,
    include: {
      author: true,
      category: true,
      examMetadata: true,
      reviews: {
        select: { rating: true },
      },
    },
  });

  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    include: { children: true },
  });

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
            Showing {books.length} {books.length === 1 ? "publication" : "publications"} available for instant cloud library access.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <form method="GET" action="/books" className="flex items-center gap-2 max-w-md w-full">
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
          <button
            type="submit"
            className="px-4 py-2 bg-brand-ink text-white rounded-xl text-xs font-semibold hover:bg-brand-900 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Mobile/Tablet Horizontal Category Chips */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-3 mt-6 scrollbar-none">
        <Link
          href="/books"
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            !selectedCategory
              ? "bg-brand-ink text-white shadow-xs"
              : "bg-white border border-brand-border text-brand-slate hover:border-brand-ink"
          }`}
        >
          All Categories
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/books?category=${cat.slug}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.slug
                ? "bg-brand-ink text-white font-semibold shadow-xs"
                : "bg-white border border-brand-border text-brand-slate hover:border-brand-ink"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6 lg:mt-8">
        {/* Category & Niche Sidebar (Desktop Only) */}
        <div className="hidden lg:block space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs">
            <h3 className="font-serif text-base font-bold text-brand-ink mb-3 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Categories</span>
              <SlidersHorizontal className="w-4 h-4 text-brand-muted" />
            </h3>

            <div className="space-y-1.5 text-sm">
              <Link
                href="/books"
                className={`block px-3 py-1.5 rounded-lg transition-colors ${
                  !selectedCategory
                    ? "bg-brand-ink text-white font-semibold"
                    : "text-brand-slate hover:bg-brand-50"
                }`}
              >
                All Categories
              </Link>

              {categories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <Link
                    href={`/books?category=${cat.slug}`}
                    className={`block px-3 py-1.5 rounded-lg transition-colors ${
                      selectedCategory === cat.slug
                        ? "bg-brand-ink text-white font-semibold"
                        : "text-brand-slate hover:bg-brand-50 font-medium"
                    }`}
                  >
                    {cat.name}
                  </Link>

                  {/* Subcategories */}
                  {cat.children && cat.children.length > 0 && (
                    <div className="pl-4 space-y-1 border-l border-gray-100 ml-3">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/books?category=${sub.slug}`}
                          className={`block px-2.5 py-1 text-xs rounded transition-colors ${
                            selectedCategory === sub.slug
                              ? "text-brand-ink font-bold bg-brand-100"
                              : "text-brand-muted hover:text-brand-ink"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Books Results Grid */}
        <div className="lg:col-span-3">
          {books.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-border p-12 text-center max-w-md mx-auto my-12 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-ink">
                No matching publications found
              </h3>
              <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                We couldn&apos;t find a book matching that search. Try searching for broader terms like &quot;PTCB&quot;, &quot;NCLEX&quot;, &quot;Security&quot;, or &quot;Venice&quot;.
              </p>
              <Link
                href="/books"
                className="inline-block mt-5 px-4 py-2 bg-brand-ink text-white text-xs font-semibold rounded-lg hover:bg-brand-900 transition-colors"
              >
                Reset Catalog Filters
              </Link>
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
    </div>
  );
}
