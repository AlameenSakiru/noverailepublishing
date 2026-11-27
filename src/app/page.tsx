import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookCard } from "@/components/BookCard";
import { siteConfig } from "@/lib/config";
import { getStorefrontSettings } from "@/lib/settings";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import {
  ArrowRight,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Sparkles,
  Compass,
  TrendingUp,
  Search,
  CheckCircle2,
  Lock,
  Smartphone,
  Layers,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

type DivisionTheme = { iconWrap: string; accent: string; hover: string };

const DEFAULT_DIVISION_THEME: DivisionTheme = {
  iconWrap: "bg-brand-100 text-brand-800",
  accent: "text-brand-700",
  hover: "hover:text-brand-700",
};

// Display copy for the homepage "Editorial Divisions" cards, keyed by category slug.
// Imprints follow the rules in src/lib/imprintMapping.ts.
const DIVISION_PRESETS: Record<
  string,
  { title: string; blurb: string; imprint: string; href: string; cta: string; Icon: any; theme: DivisionTheme }
> = {
  "exam-prep": {
    title: "Certification & Exam Prep",
    blurb:
      "Rigorous study manuals developed directly from official candidate test blueprints with diagnostic questions and formula drills.",
    imprint: "Scholarforge ED.",
    href: "/exam-prep",
    cta: "Explore Exam Prep",
    Icon: GraduationCap,
    theme: { iconWrap: "bg-amber-50 text-amber-800", accent: "text-amber-800", hover: "hover:text-amber-800" },
  },
  fiction: {
    title: "Fiction & Literature",
    blurb:
      "Gripping suspense, nuanced drama, and character-driven stories crafted for readers who love to lose themselves in a book.",
    imprint: "Noveraile Publishing",
    href: "/categories/fiction",
    cta: "Explore Fiction",
    Icon: BookOpen,
    theme: { iconWrap: "bg-emerald-50 text-emerald-700", accent: "text-emerald-700", hover: "hover:text-emerald-700" },
  },
  "self-help": {
    title: "Self-Help & Personal Growth",
    blurb:
      "Practical, compassionate guides for calmer thinking, healthier boundaries, money confidence, and habits that finally stick.",
    imprint: "Noveraile Publishing",
    href: "/categories/self-help",
    cta: "Explore Self-Help",
    Icon: Sparkles,
    theme: { iconWrap: "bg-rose-50 text-rose-700", accent: "text-rose-700", hover: "hover:text-rose-700" },
  },
  travel: {
    title: "Travel & Overland Guides",
    blurb:
      "Authoritative expedition itineraries, off-grid campervan route maps, regional cultural history, and wilderness field guides.",
    imprint: "Noveraile Meridian",
    href: "/categories/travel",
    cta: "Explore Travel",
    Icon: Compass,
    theme: { iconWrap: "bg-blue-50 text-blue-700", accent: "text-blue-700", hover: "hover:text-blue-700" },
  },
  business: {
    title: "Business & Leadership",
    blurb:
      "Actionable executive frameworks for organizational governance, ethical technological transformation, and strategic decision-making.",
    imprint: "Noveraile Publishing",
    href: "/categories/business",
    cta: "Explore Business",
    Icon: TrendingUp,
    theme: { iconWrap: "bg-purple-50 text-purple-700", accent: "text-purple-700", hover: "hover:text-purple-700" },
  },
};

export default async function HomePage() {
  let allBooks: any[] = [];
  let categories: any[] = [];
  const storefrontSettings = await getStorefrontSettings();

  try {
    const [fetchedBooks, fetchedCategories] = await Promise.all([
      prisma.book.findMany({
        where: { status: "PUBLISHED" },
        include: {
          author: true,
          category: true,
          imprint: true,
          examMetadata: true,
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { createdAt: "asc" },
        ],
        take: 6,
      }),
      prisma.category.findMany({
        where: { parentId: null, isActive: true },
        include: {
          children: {
            where: { isActive: true },
            include: {
              _count: { select: { books: { where: { status: "PUBLISHED" } } } },
            },
          },
          _count: {
            select: { books: { where: { status: "PUBLISHED" } } },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
    allBooks = fetchedBooks;
    categories = fetchedCategories;
  } catch (err) {
    console.error("Home page DB fetch error (fallback applied):", err);
  }

  // Only promote divisions that readers can actually buy from: a top-level
  // category appears once it (or one of its subcategories) has a published book.
  const divisions = categories
    .map((cat) => {
      const subcategoryTotal =
        cat.children?.reduce((acc: number, sub: any) => acc + (sub._count?.books || 0), 0) || 0;
      const totalPublished = (cat._count?.books || 0) + subcategoryTotal;
      const preset = DIVISION_PRESETS[cat.slug];
      return {
        key: cat.id as string,
        totalPublished,
        title: preset?.title || (cat.name as string),
        blurb: preset?.blurb || (cat.description as string) || "",
        imprint: preset?.imprint || siteConfig.name,
        href: preset?.href || `/categories/${cat.slug}`,
        cta: preset?.cta || `Explore ${cat.name}`,
        Icon: preset?.Icon || BookOpen,
        theme: preset?.theme || DEFAULT_DIVISION_THEME,
      };
    })
    .filter((division) => division.totalPublished > 0);

  const divisionGridClass =
    divisions.length === 1
      ? "grid-cols-1 max-w-sm mx-auto"
      : divisions.length === 2
        ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
        : divisions.length % 4 === 0
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-20 pb-20 font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-100/60 via-brand-50/40 to-transparent pt-16 pb-20 md:pt-24 md:pb-28 border-b border-brand-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Subheading Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-brand-border/80 shadow-xs mb-6 text-xs font-sans text-brand-slate">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="font-semibold text-brand-ink">Independent Multi-Niche Digital Publisher</span>
            <span className="text-gray-300">•</span>
            <span>Direct-to-Reader Editions</span>
          </div>

          {/* Primary Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-brand-ink tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Study smarter. Travel further. Read deeper.
          </h1>

          {/* Supporting Statement */}
          <p className="font-sans text-base sm:text-lg md:text-xl text-brand-slate max-w-2xl mx-auto mt-6 leading-relaxed font-light">
            Independent digital books across exam prep, fiction, travel and business. Buy once, read securely in your browser, and keep them in your personal library.
          </p>

          {/* Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs text-brand-slate font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">✓</span> Direct Publisher Pricing
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">✓</span> Instant In-Browser Reader
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">✓</span> Lifetime Cloud Library
            </span>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/books"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-ink text-white font-semibold text-sm hover:bg-brand-900 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>Explore the Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/about"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-brand-ink border border-brand-border font-semibold text-sm hover:bg-brand-50 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Our Publishing Story</span>
            </Link>
          </div>

          {/* Instant Autocomplete Search in Hero */}
          <div className="max-w-2xl mx-auto mt-12">
            <SearchAutocomplete
              placeholder="Search across all genres: leadership, exam prep, travel, fiction..."
              inputClassName="py-3.5 text-sm sm:text-base rounded-2xl shadow-book border-brand-border/80 focus:ring-2 focus:ring-brand-ink"
            />
          </div>
        </div>
      </section>

      {/* 2. PUBLISHING DIVISIONS (only categories with published titles) */}
      {divisions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
              Our Publishing Program
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
              Curated Editorial Divisions
            </h2>
            <p className="text-sm text-brand-slate mt-2 font-light">
              Every subject area is developed and published under a dedicated Noveraile imprint.
            </p>
          </div>

          <div className={`grid gap-6 ${divisionGridClass}`}>
            {divisions.map(({ key, title, blurb, imprint, href, cta, Icon, theme, totalPublished }) => (
              <div
                key={key}
                className="bg-white rounded-2xl p-6 border border-brand-border shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${theme.iconWrap}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block mb-1 ${theme.accent}`}>
                    Imprint: {imprint}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-brand-ink group-hover:text-brand-700 transition-colors mb-2">
                    {title}
                  </h3>
                  <p className="text-xs text-brand-slate leading-relaxed font-light">{blurb}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <Link
                    href={href}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink transition-colors ${theme.hover}`}
                  >
                    <span>{cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[11px] text-brand-muted">
                    {totalPublished} {totalPublished === 1 ? "title" : "titles"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. FEATURED PUBLICATIONS ACROSS ALL NICHES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-brand-border">
          <div>
            <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
              Complete Editorial Roster
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-ink">
              Featured Publications
            </h2>
            <p className="text-xs text-brand-slate mt-1 font-light">
              Direct-to-reader editions available immediately in the Noveraile Protected Cloud Reader.
            </p>
          </div>
          <Link
            href="/books"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:text-brand-600 transition-colors mt-3 md:mt-0"
          >
            <span>View All Titles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 6-Book Multi-Niche Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {allBooks.map((book) => {
            const reviewCount = book.reviews?.length || 0;
            const avgRating = reviewCount > 0
              ? (book.reviews as Array<{ rating: number }>).reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / reviewCount
              : null;

            return (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                subtitle={book.subtitle}
                slug={book.slug}
                coverImage={book.coverImage}
                authorName={book.author?.name || "Noveraile Author"}
                categoryName={book.category?.name || "General"}
                price={book.price}
                salePrice={book.salePrice}
                rating={avgRating}
                reviewCount={reviewCount}
                createdAt={book.createdAt}
              />
            );
          })}
        </div>
      </section>

      {/* 4. WHY NOVERAILE PUBLISHING (DIRECT-TO-READER VALUE) */}
      <section className="bg-brand-50/70 border-y border-brand-border/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
              Direct Publishing Model
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
              Why Readers Choose Noveraile
            </h2>
            <p className="text-sm text-brand-slate mt-2 font-light">
              We eliminated intermediaries, cumbersome PDF downloads, and third-party marketplace fees to give you a clean, distraction-free reading platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-ink mb-2">
                Protected Cloud Reader
              </h3>
              <p className="text-sm text-brand-slate leading-relaxed font-light">
                No raw PDF files or dedicated e-readers required. Open your book directly in your browser with automatic reading progress, table of contents, and night mode.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-ink mb-2">
                Seamless Cross-Device Sync
              </h3>
              <p className="text-sm text-brand-slate leading-relaxed font-light">
                Start reading on your desktop at your desk, continue on your tablet, or review key passages on your phone. Your exact page location syncs automatically.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-ink mb-2">
                Lifetime Personal Library
              </h3>
              <p className="text-sm text-brand-slate leading-relaxed font-light">
                Your purchased digital editions remain securely available in your private account library forever. Enjoy immediate access whenever you need it.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
