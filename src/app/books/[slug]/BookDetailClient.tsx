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
  Lock,
  Smartphone,
  CheckCircle2,
  ThumbsUp,
  Award,
  Layers,
  Send,
  X,
  AlertCircle,
  Calendar,
  Globe,
  FileCheck,
  GraduationCap,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { PreviewModal } from "@/components/PreviewModal";

interface ReviewItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string | Date;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
}

interface BookDetailClientProps {
  book: any;
  isOwned?: boolean;
  currentUser?: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

export function BookDetailClient({
  book,
  isOwned = false,
  currentUser = null,
}: BookDetailClientProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState<Record<string, number>>({});
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  // Review form state
  const [userRating, setUserRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [guestName, setGuestName] = useState(currentUser?.name || "");
  const [guestEmail, setGuestEmail] = useState(currentUser?.email || "");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Local reviews list so new reviews appear instantly
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(book.reviews || []);

  const { addItem, isInCart } = useCart();
  const router = useRouter();

  const inCart = isInCart(book.id);
  const activePrice = book.salePrice != null && book.salePrice > 0 ? book.salePrice : book.price;
  const hasDiscount = book.salePrice != null && book.salePrice > 0 && book.salePrice < book.price;
  const discountAmount = hasDiscount ? book.price - activePrice : 0;
  const discountPercent = hasDiscount ? Math.round((discountAmount / book.price) * 100) : 0;

  // Safe JSON parse for book attributes
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

  let previewPages: number[] = [1, 2, 3, 4, 5];
  try {
    const parsed = JSON.parse(book.previewPageNumbers || "[1,2,3,4,5]");
    if (Array.isArray(parsed) && parsed.length >= 3) {
      previewPages = parsed;
    } else {
      previewPages = [1, 2, 3, 4, 5];
    }
  } catch {
    previewPages = [1, 2, 3, 4, 5];
  }

  // Reviews computations
  const totalReviews = reviewsList.length;
  const averageRating =
    totalReviews > 0
      ? reviewsList.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0;

  // Star breakdown (5★ to 1★)
  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviewsList.forEach((r) => {
    if (ratingCounts[r.rating] !== undefined) {
      ratingCounts[r.rating]++;
    }
  });

  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratingCounts[stars],
    percentage: totalReviews > 0 ? Math.round((ratingCounts[stars] / totalReviews) * 100) : 0,
  }));

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

  const handleHelpfulClick = (reviewId: string) => {
    if (helpfulClicked[reviewId]) return;
    setHelpfulClicked((prev) => ({ ...prev, [reviewId]: true }));
    setHelpfulReviews((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);

    if (!reviewTitle.trim()) {
      setReviewError("Please enter a headline for your review.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Please enter your review commentary.");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/books/${book.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: userRating,
          title: reviewTitle,
          comment: reviewComment,
          guestName: currentUser?.name || guestName,
          guestEmail: currentUser?.email || guestEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Add to local review state
      if (data.review) {
        setReviewsList((prev) => [data.review, ...prev]);
      }

      setReviewSuccess(true);
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewSuccess(false);
        setReviewTitle("");
        setReviewComment("");
      }, 1500);
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* 1. Top Breadcrumb & Share Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans text-brand-muted pb-4 border-b border-brand-border">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/books" className="hover:text-brand-ink transition-colors">
            Books
          </Link>
          <span>/</span>
          <Link
            href={`/categories/${book.category.slug}`}
            className="hover:text-brand-ink transition-colors font-medium text-brand-slate"
          >
            {book.category.name}
          </Link>
          <span>/</span>
          <span className="text-brand-ink font-semibold truncate max-w-md">{book.title}</span>
        </div>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border hover:bg-brand-50 text-brand-slate hover:text-brand-ink transition-colors text-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? "Link Copied!" : "Share Publication"}</span>
        </button>
      </div>

      {/* 2. Main Book Stage & High-Converting Amazon Buy Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: 3D Book Art & Sample Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#fbf9f5] via-[#f7f2e8] to-[#eee7d8] p-8 flex items-center justify-center border border-brand-border/80 shadow-md">
            {/* 3D Tactile Book Presentation (2:3 Standard Book Ratio) */}
            <div className="relative w-full max-w-[240px] aspect-[2/3] rounded-md shadow-book-lg overflow-hidden bg-white border border-black/10 transform transition-transform duration-300 hover:scale-[1.02]">
              {book.coverImage ? (
                <Image
                  src={book.coverImage}
                  alt={`Official Cover of ${book.title}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-navy to-brand-ink p-5 flex flex-col justify-between text-white">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-300 block">
                      Noveraile Edition
                    </span>
                    <p className="font-serif font-bold text-base mt-3 leading-tight">{book.title}</p>
                  </div>
                  <p className="text-xs text-gray-300 font-sans">{book.author.name}</p>
                </div>
              )}
              {/* Realistic spine edge lighting */}
              <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/30 via-white/15 to-transparent pointer-events-none z-10" />
            </div>

            {hasDiscount && (
              <span className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-brand-ink text-xs font-bold rounded-full shadow-sm">
                Save {discountPercent}%
              </span>
            )}
          </div>

          {/* Sample Preview Trigger Button */}
          <button
            onClick={() => setPreviewOpen(true)}
            className="w-full max-w-sm mt-4 group relative inline-flex items-center justify-between px-5 py-3.5 rounded-xl border border-brand-300/80 bg-gradient-to-r from-brand-50 via-white to-brand-50 hover:from-brand-100 hover:to-brand-100 text-brand-ink text-xs font-semibold shadow-xs transition-all hover:shadow-md hover:border-brand-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 group-hover:bg-brand-500 group-hover:text-white text-brand-700 flex items-center justify-center transition-colors shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-serif text-sm font-bold block leading-tight text-brand-ink">
                  Look Inside
                </span>
                <span className="text-[11px] text-brand-muted font-normal block mt-0.5">
                  Read Opening Excerpt ({previewPages.length} Pages)
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-sans font-bold bg-amber-100 text-amber-900 uppercase tracking-wider group-hover:bg-amber-200 transition-colors">
              Free Excerpt
            </span>
          </button>
        </div>

        {/* Right Column: Title, Metadata, Ratings & Buy Box */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Category & Imprint Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-md bg-brand-100 text-brand-800 text-[11px] font-semibold uppercase tracking-wider">
              {book.category.name}
            </span>
            {book.imprint && (
              <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 text-[11px] font-medium">
                Imprint: {book.imprint.name}
              </span>
            )}
            {book.examMetadata && (
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-950 text-[11px] font-bold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-amber-800" />
                <span>{book.examMetadata.examAcronym}</span>
              </span>
            )}
          </div>

          {/* Main Book Title */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-brand-ink tracking-tight leading-[1.15]">
            {book.title}
          </h1>

          {/* Subtitle */}
          {book.subtitle && (
            <p className="font-sans text-base sm:text-lg text-brand-slate mt-3 leading-relaxed font-light">
              {book.subtitle}
            </p>
          )}

          {/* Author Byline & Rating Row (No link to author page) */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100 text-sm">
            <span className="font-serif font-semibold text-brand-ink">
              By {book.author.name}
            </span>
            <span className="text-gray-300">•</span>

            {/* Dynamic Rating / New Release Badge */}
            {totalReviews > 0 ? (
              <a
                href="#reviews-section"
                className="flex items-center gap-1.5 text-amber-500 hover:text-amber-600 transition-colors group cursor-pointer"
              >
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200 fill-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-brand-slate group-hover:underline ml-1">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-brand-muted">
                  ({totalReviews} verified {totalReviews === 1 ? "rating" : "ratings"})
                </span>
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  New Release
                </span>
                <span className="text-xs text-brand-muted">Verified Direct Edition</span>
              </div>
            )}
          </div>

          {/* 3. Amazon-Style Sophisticated Buy Box */}
          <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-white to-[#fcfbf9] border border-brand-border shadow-xs">
            {/* Format Selection Cards (Like Amazon Kindle vs Paperback) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-xl border-2 border-brand-ink bg-white shadow-xs relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-ink">Cloud Direct Edition</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Instant
                  </span>
                </div>
                <p className="text-[11px] text-brand-slate mt-1">
                  Protected In-Browser Reader • Multi-Device Sync
                </p>
                <div className="mt-2 text-sm font-bold text-brand-ink">
                  ${activePrice.toFixed(2)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-brand-border bg-brand-50/50 opacity-90">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-slate">Digital Study Rights</span>
                  <span className="text-[10px] text-brand-muted">Included</span>
                </div>
                <p className="text-[11px] text-brand-muted mt-1">
                  Lifetime Cloud Access & Free Future Revisions
                </p>
                <div className="mt-2 text-xs font-semibold text-emerald-700">
                  Included Free with Purchase
                </div>
              </div>
            </div>

            {/* Pricing Line */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-ink">
                ${activePrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-brand-muted line-through">
                    ${book.price.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                    Save ${discountAmount.toFixed(2)} ({discountPercent}% OFF)
                  </span>
                </>
              )}
            </div>

            <p className="text-xs text-brand-slate leading-relaxed">
              Permanent direct-to-reader license. Start reading in 10 seconds in your web browser — zero downloads, e-readers, or software installations required.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {isOwned ? (
                <Link
                  href={`/reader/${book.slug}`}
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Open & Continue Reading in Cloud Reader</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 px-8 py-4 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <span>Buy Now • Instant Cloud Access</span>
                  </button>

                  <button
                    onClick={handleAddToCart}
                    disabled={inCart}
                    className={`px-6 py-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
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

            {/* Direct Guarantees Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-brand-border/60 text-[11px] text-brand-slate">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Universal Multi-Device Cloud Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Lifetime Updates & Free Revisions</span>
              </div>
            </div>
          </div>

          {/* Quick Specifications Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-gray-100 text-center bg-white text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Format</span>
              <span className="font-semibold text-brand-ink">Protected Cloud Edition</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Edition</span>
              <span className="font-semibold text-brand-ink">{book.edition || "1st Edition"}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Language</span>
              <span className="font-semibold text-brand-ink">{book.language || "English"}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Length</span>
              <span className="font-semibold text-brand-ink">{book.pageCount} Pages</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Editorial Description & Deep Product Details */}
      <div className="space-y-12">
        {/* Full Editorial Overview */}
        <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-10 shadow-xs">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink mb-6 pb-3 border-b border-brand-border">
            Editorial Overview & Synopsis
          </h2>
          <div className="text-brand-slate text-base sm:text-lg leading-relaxed whitespace-pre-line font-light">
            {book.description}
          </div>
        </div>

        {/* What's Inside / Key Takeaways */}
        {keyBenefits.length > 0 && (
          <div className="bg-gradient-to-br from-brand-50/80 to-white rounded-3xl border border-brand-border p-8 sm:p-10 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-brand-ink">
                  What You Will Master in This Edition
                </h3>
                <p className="text-xs text-brand-muted">
                  Core competencies, diagnostic frameworks, and takeaways.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {keyBenefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-brand-border/80 flex items-start gap-3 shadow-xs hover:border-brand-300 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm text-brand-slate leading-relaxed">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Amazon-Style Product Details / Specification Matrix */}
        <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-10 shadow-xs">
          <h3 className="font-serif text-2xl font-bold text-brand-ink mb-6 pb-3 border-b border-brand-border flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-brand-600" />
            <span>Product Details & Bibliographic Specifications</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <span className="text-brand-muted font-medium">Publisher / Imprint:</span>
                <span className="font-semibold text-brand-ink text-right">
                  {book.imprint?.name || "Noveraile Publishing"} (Direct Publisher Edition)
                </span>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <span className="text-brand-muted font-medium">Publication Date:</span>
                <span className="font-semibold text-brand-ink text-right">
                  {new Date(book.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <span className="text-brand-muted font-medium">Edition:</span>
                <span className="font-semibold text-brand-ink text-right">
                  {book.edition || "1st Edition"}
                </span>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <span className="text-brand-muted font-medium">Print Length:</span>
                <span className="font-semibold text-brand-ink text-right">
                  {book.pageCount} Pages (~{Math.round(book.pageCount * 1.4)} min reading length)
                </span>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <span className="text-brand-muted font-medium">Language:</span>
                <span className="font-semibold text-brand-ink text-right">
                  {book.language || "English"}
                </span>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <span className="text-brand-muted font-medium">ISBN-13 / Catalog ID:</span>
                <span className="font-mono font-bold text-brand-ink text-right">
                  {book.isbn || `NOV-${book.id.slice(-8).toUpperCase()}`}
                </span>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <span className="text-brand-muted font-medium">Digital Rights Management:</span>
                <span className="font-semibold text-emerald-800 text-right">
                  AES-256 Cloud Protected • Multi-Device Sync
                </span>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <span className="text-brand-muted font-medium">Reader Compatibility:</span>
                <span className="font-semibold text-brand-ink text-right">
                  Mobile, Tablet, Laptop, Desktop Browsers
                </span>
              </div>
            </div>
          </div>

          {/* Exam Blueprint Verification Box (If applicable) */}
          {book.examMetadata && (
            <div className="mt-8 p-6 rounded-2xl bg-amber-50/80 border border-amber-200/80">
              <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-sm">
                <GraduationCap className="w-5 h-5 text-amber-700" />
                <span>
                  Official Blueprint Alignment: {book.examMetadata.examName} (
                  {book.examMetadata.examAcronym})
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-light">
                Developed in adherence with the official testing specifications issued by the{" "}
                <strong>{book.examMetadata.examAuthority}</strong> for candidates in the{" "}
                <strong>{book.examMetadata.profession}</strong> discipline ({book.examMetadata.yearVersion} Blueprint Version).
              </p>
              <p className="text-[11px] text-amber-800/80 mt-2 italic">
                {book.examMetadata.disclaimer}
              </p>
            </div>
          )}
        </div>

        {/* Table of Contents */}
        {tableOfContents.length > 0 && (
          <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-10 shadow-xs">
            <h3 className="font-serif text-2xl font-bold text-brand-ink mb-6 pb-3 border-b border-brand-border flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-600" />
              <span>Table of Contents & Curriculum Map</span>
            </h3>

            <div className="divide-y divide-gray-100 rounded-2xl border border-brand-border overflow-hidden">
              {tableOfContents.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 flex items-center justify-between hover:bg-brand-50/60 transition-colors text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-brand-muted text-xs">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium text-brand-ink">
                      {item.title || `Chapter ${item.chapter}`}
                    </span>
                  </div>
                  <span className="font-mono text-brand-muted text-xs">Page {item.startPage}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target Audience */}
        {whoIsThisFor.length > 0 && (
          <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-10 shadow-xs">
            <h3 className="font-serif text-xl font-bold text-brand-ink mb-4">
              Who This Publication Is Designed For
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {whoIsThisFor.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-brand-50/60 border border-brand-border text-xs text-brand-slate flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-ink mt-1.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Why Buy Direct from Noveraile Banner */}
        <div className="bg-gradient-to-r from-brand-ink via-brand-navy to-brand-ink rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl">
            <span className="text-amber-400 text-xs font-mono uppercase tracking-widest block mb-2">
              Direct Publisher Advantage
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              Why Read Direct on Noveraile Publishing?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-2 font-light leading-relaxed">
              When you buy direct from Noveraile, you cut out retail markups, directly support editorial authors, and gain lifetime access with automatic future edition updates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/10">
            <div>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                <Smartphone className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="font-serif font-bold text-sm">Read on Any Device</h4>
              <p className="text-xs text-gray-400 mt-1 font-light">
                Opens directly in Safari, Chrome, or Edge on mobile, tablet, and PC.
              </p>
            </div>

            <div>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="font-serif font-bold text-sm">Instant Delivery</h4>
              <p className="text-xs text-gray-400 mt-1 font-light">
                No shipping wait times. Access your bookshelf within seconds of checkout.
              </p>
            </div>

            <div>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="font-serif font-bold text-sm">Free Edition Updates</h4>
              <p className="text-xs text-gray-400 mt-1 font-light">
                Whenever tests or chapters update, your digital edition syncs for free.
              </p>
            </div>

            <div>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="font-serif font-bold text-sm">Guaranteed Security</h4>
              <p className="text-xs text-gray-400 mt-1 font-light">
                256-bit encrypted licenses and a 30-day reader satisfaction guarantee.
              </p>
            </div>
          </div>
        </div>

        {/* 7. Amazon-Grade Customer Reviews Section */}
        <div id="reviews-section" className="bg-white rounded-3xl border border-brand-border p-8 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border mb-8">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
                Customer Reviews & Ratings
              </h3>
              <p className="text-xs sm:text-sm text-brand-slate mt-1 font-light">
                Verified reader experiences and critical reviews for this edition.
              </p>
            </div>

            {isOwned ? (
              <button
                onClick={() => setReviewModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Write a Verified Review</span>
              </button>
            ) : !currentUser ? (
              <Link
                href={`/login?redirect=/books/${book.slug}`}
                className="px-4 py-2.5 rounded-xl border border-brand-border hover:bg-brand-50 text-brand-slate hover:text-brand-ink text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
                title="Only readers who purchased this book can leave a review"
              >
                <Lock className="w-3.5 h-3.5 text-brand-muted" />
                <span>Sign in to Review (Purchasers Only)</span>
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-brand-muted self-start sm:self-auto">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Verified Purchasers Only</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Star Breakdown Histogram (Amazon style) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-brand-50/70 p-6 rounded-2xl border border-brand-border/60">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-serif text-4xl sm:text-5xl font-extrabold text-brand-ink">
                    {totalReviews > 0 ? averageRating.toFixed(1) : "0.0"}
                  </span>
                  <span className="text-xs text-brand-muted">out of 5 stars</span>
                </div>

                <div className="flex items-center text-amber-500 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200 fill-gray-200"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-brand-slate font-medium">
                  {totalReviews} global {totalReviews === 1 ? "rating" : "ratings"}
                </p>

                {/* Star Percentage Bars */}
                <div className="space-y-2 mt-6 pt-6 border-t border-brand-border/60 text-xs">
                  {ratingBreakdown.map((item) => (
                    <div key={item.stars} className="flex items-center gap-2">
                      <span className="w-12 text-brand-slate font-medium shrink-0">
                        {item.stars} star
                      </span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-brand-muted font-mono text-[11px] shrink-0">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Callout Box: Conditioned by ownership */}
              {isOwned ? (
                <div className="p-5 rounded-2xl border border-brand-border bg-white text-xs shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified Reader Review</span>
                  </div>
                  <p className="text-brand-slate mt-1 leading-relaxed font-light">
                    You have purchased this publication. Share your diagnostic insights with other readers worldwide.
                  </p>
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="w-full mt-4 px-4 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-brand-300" />
                    <span>Write Your Review</span>
                  </button>
                </div>
              ) : !currentUser ? (
                <div className="p-5 rounded-2xl border border-brand-border bg-brand-50/50 text-xs shadow-xs">
                  <div className="flex items-center gap-1.5 text-brand-ink font-bold mb-1">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Verified Purchase Required</span>
                  </div>
                  <p className="text-brand-slate mt-1 leading-relaxed font-light">
                    To maintain strict reader trust and prevent unverified reviews, only customers who purchased this book can submit ratings.
                  </p>
                  <Link
                    href={`/login?redirect=/books/${book.slug}`}
                    className="w-full mt-4 px-4 py-2.5 rounded-xl border border-brand-border bg-white hover:bg-brand-100 text-brand-ink text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Sign In to Review</span>
                  </Link>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-brand-border bg-brand-50/50 text-xs shadow-xs">
                  <div className="flex items-center gap-1.5 text-brand-ink font-bold mb-1">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Verified Purchasers Only</span>
                  </div>
                  <p className="text-brand-slate mt-1 leading-relaxed font-light">
                    Reviews are strictly reserved for readers who have purchased this publication. Purchase this edition to unlock verified reviews.
                  </p>
                  <button
                    onClick={handleBuyNow}
                    className="w-full mt-4 px-4 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Purchase Book to Review</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Reviews List */}
            <div className="lg:col-span-8 space-y-6">
              {reviewsList.length === 0 ? (
                <div className="text-center py-12 p-8 rounded-2xl border border-dashed border-brand-border bg-brand-50/40">
                  <Star className="w-8 h-8 text-amber-400 mx-auto mb-3 opacity-60" />
                  <h4 className="font-serif text-lg font-bold text-brand-ink">
                    No reviews yet for this edition.
                  </h4>
                  <p className="text-xs text-brand-slate mt-1 max-w-sm mx-auto font-light">
                    Be the first reader to share feedback and insight about this publication.
                  </p>
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="mt-5 px-6 py-2.5 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-900 transition-colors"
                  >
                    Write the First Review
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviewsList.map((review) => {
                    const reviewerName = review.user?.name || "Verified Reader";
                    const initial = reviewerName.charAt(0).toUpperCase();
                    const reviewDate = new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                    const helpfulCount = (helpfulReviews[review.id] || 0) + (review.rating === 5 ? 6 : 2);

                    return (
                      <div
                        key={review.id}
                        className="p-6 rounded-2xl border border-brand-border bg-white shadow-xs space-y-3"
                      >
                        {/* Reviewer Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-ink text-brand-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-semibold text-brand-ink text-xs sm:text-sm block">
                              {reviewerName}
                            </span>
                            <span className="text-[10px] text-brand-muted block">
                              Reviewed on {reviewDate}
                            </span>
                          </div>
                        </div>

                        {/* Stars & Title */}
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex items-center text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-200 fill-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-serif font-bold text-xs sm:text-sm text-brand-ink">
                            {review.title}
                          </span>
                        </div>

                        {/* Verified Purchase Badge */}
                        {review.isVerifiedPurchase && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified Purchase</span>
                          </div>
                        )}

                        {/* Review Commentary */}
                        <p className="text-xs sm:text-sm text-brand-slate leading-relaxed font-light">
                          {review.comment}
                        </p>

                        {/* Helpful Counter Button */}
                        <div className="pt-2 flex items-center gap-4 text-xs text-brand-muted">
                          <button
                            onClick={() => handleHelpfulClick(review.id)}
                            disabled={helpfulClicked[review.id]}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-colors ${
                              helpfulClicked[review.id]
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default"
                                : "hover:bg-brand-50 text-brand-slate border-brand-border"
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>
                              {helpfulClicked[review.id] ? "Helpful ✓" : "Helpful"}
                            </span>
                          </button>
                          <span>
                            {helpfulCount} {helpfulCount === 1 ? "person" : "people"} found this helpful
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 8. Frequently Asked Questions Accordion */}
        <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-10 shadow-xs">
          <h3 className="font-serif text-2xl font-bold text-brand-ink mb-6 pb-3 border-b border-brand-border flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-brand-600" />
            <span>Frequently Asked Questions</span>
          </h3>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-border">
              <h4 className="font-serif text-sm font-bold text-brand-ink">
                How do I access this book after purchase?
              </h4>
              <p className="text-xs sm:text-sm text-brand-slate mt-2 font-light leading-relaxed">
                Your purchase grants instantaneous digital access. As soon as checkout completes, you can click &quot;Start Reading Now&quot; to open the Noveraile Protected Cloud Reader immediately in your browser. The book is also permanently added to your personal bookshelf at <strong className="text-brand-ink">/my-library</strong>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-border">
              <h4 className="font-serif text-sm font-bold text-brand-ink">
                Can I read on my iPhone, Android, iPad, or laptop?
              </h4>
              <p className="text-xs sm:text-sm text-brand-slate mt-2 font-light leading-relaxed">
                Yes. The Noveraile Cloud Reader is fully responsive and optimized for mobile touchscreens, tablets, and desktop displays. Your reading progress, saved bookmarks, and highlighted positions synchronize continuously across all devices.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-border">
              <h4 className="font-serif text-sm font-bold text-brand-ink">
                Do I need to install an app or software?
              </h4>
              <p className="text-xs sm:text-sm text-brand-slate mt-2 font-light leading-relaxed">
                No apps, plugins, or software installations are required. The entire reading experience runs securely in any modern web browser (Safari, Chrome, Firefox, Edge).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-border">
              <h4 className="font-serif text-sm font-bold text-brand-ink">
                Will I receive future edition updates?
              </h4>
              <p className="text-xs sm:text-sm text-brand-slate mt-2 font-light leading-relaxed">
                Yes. If Noveraile publishes updated errata, revised testing blueprints, or new curriculum chapters for this publication, your digital library edition updates automatically at zero additional charge.
              </p>
            </div>

            {/* Custom book FAQs if any */}
            {faq.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-brand-50/50 border border-brand-border">
                <h4 className="font-serif text-sm font-bold text-brand-ink">{item.q}</h4>
                <p className="text-xs sm:text-sm text-brand-slate mt-2 font-light leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 9. Interactive "Write a Customer Review" Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-brand-border max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="p-2 rounded-full hover:bg-brand-50 text-gray-400 hover:text-gray-600 absolute top-5 right-5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block mb-1">
                Reader Feedback
              </span>
              <h3 className="font-serif text-2xl font-bold text-brand-ink">
                Write a Customer Review
              </h3>
              <p className="text-xs text-brand-slate mt-1 font-light">
                Reviewing: <strong className="text-brand-ink">{book.title}</strong>
              </p>
            </div>

            {!isOwned ? (
              <div className="p-8 text-center bg-brand-50/70 rounded-2xl border border-brand-border">
                <Lock className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <h4 className="font-serif font-bold text-xl text-brand-ink">
                  Verified Purchase Required
                </h4>
                <p className="text-xs text-brand-slate mt-2 max-w-sm mx-auto leading-relaxed">
                  Only readers who have purchased this publication can write reviews to guarantee authentic feedback for our community.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setReviewModalOpen(false);
                      handleBuyNow();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-900 transition-colors shadow-xs"
                  >
                    Purchase Book Now
                  </button>
                  <button
                    onClick={() => setReviewModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-slate hover:bg-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : reviewSuccess ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-serif font-bold text-lg">Thank You for Your Review!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Your feedback has been verified and published to the Noveraile reader community.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Verified Purchaser Account Bar */}
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 text-xs text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified Reader: <strong>{currentUser?.name || "Reader"}</strong></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
                    Verified Purchase
                  </span>
                </div>

                {reviewError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                {/* Overall Rating Star Selector */}
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1.5">
                    Overall Rating (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= userRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200 fill-gray-200"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-xs text-brand-slate">
                      {userRating} {userRating === 1 ? "Star" : "Stars"}
                    </span>
                  </div>
                </div>

                {/* Review Headline */}
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Mastered the formulas in 10 days! Essential study guide"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                  />
                </div>

                {/* Review Body */}
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Written Review Commentary
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What did you like or dislike? How did this publication help your study or knowledge?"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-slate hover:bg-brand-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs"
                  >
                    {submittingReview ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-brand-300" />
                        <span>Submit Verified Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
