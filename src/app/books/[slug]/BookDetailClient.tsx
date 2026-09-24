"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  BookOpen,
  Check,
  Star,
  Eye,
  ShieldCheck,
  Clock,
  Sparkles,
  HelpCircle,
  Share2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { PreviewModal } from "@/components/PreviewModal";

interface BookDetailClientProps {
  book: any;
  isOwned?: boolean;
}

export function BookDetailClient({ book, isOwned = false }: BookDetailClientProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addItem, isInCart } = useCart();
  const router = useRouter();

  const inCart = isInCart(book.id);
  const activePrice = book.salePrice != null && book.salePrice > 0 ? book.salePrice : book.price;
  const hasDiscount = book.salePrice != null && book.salePrice > 0 && book.salePrice < book.price;

  let keyBenefits: string[] = [];
  try {
    keyBenefits = JSON.parse(book.keyBenefits || "[]");
  } catch {
    keyBenefits = [];
  }

  let whoIsThisFor: string[] = [];
  try {
    whoIsThisFor = JSON.parse(book.whoIsThisFor || "[]");
  } catch {
    whoIsThisFor = [];
  }

  let tableOfContents: any[] = [];
  try {
    tableOfContents = JSON.parse(book.tableOfContents || "[]");
  } catch {
    tableOfContents = [];
  }

  let faq: any[] = [];
  try {
    faq = JSON.parse(book.faq || "[]");
  } catch {
    faq = [];
  }

  let previewPages: number[] = [1, 2];
  try {
    previewPages = JSON.parse(book.previewPageNumbers || "[1,2]");
  } catch {
    previewPages = [1, 2];
  }

  const handleAddToCart = () => {
    if (!inCart && !isOwned) {
      addItem({
        bookId: book.id,
        slug: book.slug,
        title: book.title,
        subtitle: book.subtitle,
        author: book.author.name,
        coverImage: book.coverImage,
        price: book.price,
        salePrice: book.salePrice,
      });
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/cart");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-16">
      {/* Top Breadcrumb & Metadata Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans text-brand-muted pb-4 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <Link href="/books" className="hover:text-brand-ink">
            Books
          </Link>
          <span>/</span>
          <Link href={`/categories/${book.category.slug}`} className="hover:text-brand-ink">
            {book.category.name}
          </Link>
          <span>/</span>
          <span className="text-brand-ink font-medium truncate max-w-xs">{book.title}</span>
        </div>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-brand-slate hover:text-brand-ink transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? "Link Copied!" : "Share Publication"}</span>
        </button>
      </div>

      {/* Main Hero Section: Cover + Core Purchasing Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Book Cover Presentation */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl bg-brand-50 p-6 flex items-center justify-center border border-brand-border/80 shadow-xs">
            <div className="relative w-4/5 h-full rounded-md shadow-book-lg overflow-hidden border border-black/10">
              <Image
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
              />
              {/* Spine highlight */}
              <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/30 via-white/10 to-transparent pointer-events-none" />
            </div>

            {book.salePrice && (
              <span className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-brand-ink text-xs font-bold rounded-full shadow-sm">
                Special Edition
              </span>
            )}
          </div>

          {/* Sample Preview Trigger Button */}
          <button
            onClick={() => setPreviewOpen(true)}
            className="w-full max-w-sm mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-brand-border bg-white hover:bg-brand-50 text-brand-ink text-xs font-semibold shadow-xs transition-colors"
          >
            <Eye className="w-4 h-4 text-brand-500" />
            <span>Read Free Sample ({previewPages.length} Pages)</span>
          </button>
        </div>

        {/* Title, Subtitle, Author, Pricing & Checkout Panel */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Category & Imprint Pill */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-md bg-brand-100 text-brand-800 text-[11px] font-semibold uppercase tracking-wider">
              {book.category.name}
            </span>
            {book.imprint && (
              <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                Imprint: {book.imprint.name}
              </span>
            )}
            {book.examMetadata && (
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold">
                {book.examMetadata.examAcronym}
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-brand-ink tracking-tight leading-tight">
            {book.title}
          </h1>

          {book.subtitle && (
            <p className="font-sans text-base sm:text-lg text-brand-slate mt-3 leading-relaxed font-light">
              {book.subtitle}
            </p>
          )}

          {/* Author Byline */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <Link
              href={`/authors/${book.author.slug}`}
              className="font-serif text-sm font-bold text-brand-ink hover:text-brand-600 transition-colors"
            >
              By {book.author.name}
            </Link>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
              <span className="text-xs font-semibold text-brand-slate ml-1">5.0 (Verified Readers)</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="my-6 p-6 rounded-2xl bg-brand-50 border border-brand-border">
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-3xl sm:text-4xl font-extrabold text-brand-ink">
                ${activePrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-base text-brand-muted line-through">
                  ${book.price.toFixed(2)}
                </span>
              )}
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                Instant Online Access
              </span>
            </div>

            <p className="text-xs text-brand-slate mt-2">
              Includes permanent cloud library ownership, automatic reading progress, and access across phone, tablet, and desktop.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {isOwned ? (
                <Link
                  href={`/reader/${book.slug}`}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open & Continue Reading</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 px-8 py-3.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Buy Now & Read Online</span>
                  </button>

                  <button
                    onClick={handleAddToCart}
                    disabled={inCart}
                    className={`px-6 py-3.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                      inCart
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 cursor-default"
                        : "bg-white text-brand-ink border-brand-border hover:bg-brand-100"
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>In Your Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-brand-border/60 text-[11px] text-brand-muted justify-center">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Guaranteed Access
              </span>
              <span>•</span>
              <span>No Software Downloads</span>
              <span>•</span>
              <span>Read on Any Device</span>
            </div>
          </div>

          {/* Quick Specifications Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-gray-100 text-center bg-white text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Format</span>
              <span className="font-semibold text-brand-ink">Digital Book</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Edition</span>
              <span className="font-semibold text-brand-ink">{book.edition}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Language</span>
              <span className="font-semibold text-brand-ink">{book.language}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Length</span>
              <span className="font-semibold text-brand-ink">{book.pageCount} Content Units</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {/* Detailed Editorial Description */}
          <div>
            <h2 className="font-serif text-2xl font-bold text-brand-ink mb-4 pb-2 border-b border-brand-border">
              About This Publication
            </h2>
            <div className="text-brand-slate text-base leading-relaxed whitespace-pre-line font-light">
              {book.description}
            </div>
          </div>

          {/* Key Benefits / What's Inside */}
          {keyBenefits.length > 0 && (
            <div>
              <h3 className="font-serif text-xl font-bold text-brand-ink mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>What Is Inside</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {keyBenefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-brand-border flex items-start gap-2.5 text-xs text-brand-slate"
                  >
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table of Contents */}
          {tableOfContents.length > 0 && (
            <div>
              <h3 className="font-serif text-xl font-bold text-brand-ink mb-4 pb-2 border-b border-brand-border flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-500" />
                <span>Table of Contents</span>
              </h3>
              <div className="bg-white rounded-xl border border-brand-border divide-y divide-gray-100 overflow-hidden text-xs">
                {tableOfContents.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 flex items-center justify-between hover:bg-brand-50 transition-colors"
                  >
                    <span className="font-medium text-brand-ink">
                      {item.title || `Chapter ${item.chapter}`}
                    </span>
                    <span className="font-mono text-gray-400">Page {item.startPage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Disclaimer Alert (If applicable) */}
          {book.examMetadata && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong className="block font-semibold mb-1">Independent Editorial Notice:</strong>
              {book.examMetadata.disclaimer}
            </div>
          )}

          {/* Frequently Asked Questions */}
          {faq.length > 0 && (
            <div>
              <h3 className="font-serif text-xl font-bold text-brand-ink mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-500" />
                <span>Frequently Asked Questions</span>
              </h3>
              <div className="space-y-3">
                {faq.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-brand-border">
                    <h4 className="font-serif text-sm font-bold text-brand-ink">{item.q}</h4>
                    <p className="text-xs text-brand-slate mt-1.5 font-light leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Author Profile & Target Audience */}
        <div className="lg:col-span-4 space-y-6">
          {/* Author Card */}
          <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs">
            <h3 className="font-serif text-xs font-semibold text-brand-muted uppercase tracking-wider mb-4">
              About the Author
            </h3>
            <div className="flex items-center gap-3 mb-3">
              {book.author.profileImage && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border">
                  <Image
                    src={book.author.profileImage}
                    alt={book.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h4 className="font-serif text-base font-bold text-brand-ink">
                  {book.author.name}
                </h4>
                <Link
                  href={`/authors/${book.author.slug}`}
                  className="text-xs text-brand-500 hover:underline"
                >
                  View Author Profile →
                </Link>
              </div>
            </div>
            <p className="text-xs text-brand-slate leading-relaxed font-light">{book.author.bio}</p>
          </div>

          {/* Who Is This Book For */}
          {whoIsThisFor.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs">
              <h3 className="font-serif text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
                Who This Book Is For
              </h3>
              <ul className="space-y-2 text-xs text-brand-slate">
                {whoIsThisFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Free Sample Preview Modal */}
      <PreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        bookId={book.id}
        bookSlug={book.slug}
        bookTitle={book.title}
        authorName={book.author.name}
        coverImage={book.coverImage}
        price={book.price}
        salePrice={book.salePrice}
        previewPages={previewPages}
      />
    </div>
  );
}
