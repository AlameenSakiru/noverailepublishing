"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Clock,
  Library,
  Receipt,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gift,
  Star,
  X,
  AlertCircle,
  Edit3,
  Sparkles,
} from "lucide-react";

interface ReviewItem {
  id: string;
  bookId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string | Date;
}

interface MyLibraryClientProps {
  currentUser: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  entitlements: any[];
  progressRecords: any[];
  orders: any[];
  initialReviews: ReviewItem[];
  defaultTab?: "books" | "orders";
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: "1 Star — Poor (Significant issues)",
  2: "2 Stars — Fair (Needs improvement)",
  3: "3 Stars — Good (Helpful material)",
  4: "4 Stars — Very Good (High quality)",
  5: "5 Stars — Excellent (Essential / Highly Recommended)",
};

export function MyLibraryClient({
  currentUser,
  entitlements,
  progressRecords,
  orders,
  initialReviews,
  defaultTab = "books",
}: MyLibraryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === "orders" ? "orders" : defaultTab;

  // Review state
  const [reviews, setReviews] = useState<Record<string, ReviewItem>>(() => {
    const map: Record<string, ReviewItem> = {};
    initialReviews.forEach((r) => {
      map[r.bookId] = r;
    });
    return map;
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeBook, setActiveBook] = useState<{
    id: string;
    title: string;
    coverImage: string;
    slug: string;
    authorName?: string;
  } | null>(null);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const progressMap = new Map(progressRecords.map((p) => [p.bookId, p]));

  const openReviewModal = (book: {
    id: string;
    title: string;
    coverImage: string;
    slug: string;
    authorName?: string;
  }) => {
    setActiveBook(book);
    const existing = reviews[book.id];
    if (existing) {
      setRating(existing.rating);
      setTitle(existing.title);
      setComment(existing.comment);
    } else {
      setRating(5);
      setTitle("");
      setComment("");
    }
    setError(null);
    setSuccess(false);
    setModalOpen(true);
  };

  const closeReviewModal = () => {
    if (isSubmitting) return;
    setModalOpen(false);
    setActiveBook(null);
    setError(null);
    setSuccess(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBook) return;

    if (!title.trim() || title.trim().length < 2) {
      setError("Please provide a headline for your review.");
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setError("Please write at least a sentence or two explaining your experience.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/books/${activeBook.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      // Update local state immediately
      if (data.review) {
        setReviews((prev) => ({
          ...prev,
          [activeBook.id]: {
            id: data.review.id,
            bookId: activeBook.id,
            rating: data.review.rating,
            title: data.review.title,
            comment: data.review.comment,
            createdAt: data.review.createdAt,
          },
        }));
      }

      setSuccess(true);
      setTimeout(() => {
        closeReviewModal();
      }, 1400);
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: "books" | "orders") => {
    router.push(`/my-library?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Header Strip */}
      <div className="pb-8 border-b border-brand-border flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
            Customer Dashboard
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
            My Digital Library & Orders
          </h1>
          <p className="text-xs sm:text-sm text-brand-slate mt-1.5 font-light">
            Welcome back, <span className="font-semibold text-brand-ink">{currentUser.name}</span>. You have{" "}
            <span className="font-semibold text-brand-ink">{entitlements.length}</span>{" "}
            {entitlements.length === 1 ? "publication" : "publications"} licensed in your account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/books"
            className="px-4 py-2.5 rounded-xl bg-white border border-brand-border hover:bg-brand-50 text-xs font-semibold text-brand-ink transition-colors flex items-center gap-2 shadow-xs"
          >
            <Library className="w-4 h-4 text-brand-600" />
            <span>Discover More Titles</span>
          </Link>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="mt-8 flex items-center gap-3 border-b border-brand-border pb-4">
        <button
          onClick={() => handleTabChange("books")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "books"
              ? "bg-brand-ink text-white shadow-xs"
              : "bg-white text-brand-slate hover:text-brand-ink border border-brand-border/80 hover:bg-brand-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>My Bookshelf ({entitlements.length})</span>
        </button>

        <button
          onClick={() => handleTabChange("orders")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "orders"
              ? "bg-brand-ink text-white shadow-xs"
              : "bg-white text-brand-slate hover:text-brand-ink border border-brand-border/80 hover:bg-brand-50"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Order History & Receipts ({orders.length})</span>
        </button>
      </div>

      {/* TAB 1: MY BOOKSHELF */}
      {activeTab === "books" && (
        <div className="mt-8">
          {entitlements.length === 0 ? (
            <div className="bg-white rounded-3xl border border-brand-border p-12 text-center max-w-lg mx-auto shadow-xs my-12">
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-brand-ink">
                Your bookshelf is ready for its first book.
              </h3>
              <p className="text-sm text-brand-slate mt-3 leading-relaxed font-light">
                Explore our certification study manuals, executive leadership frameworks, or contemporary fiction. Whenever you purchase a digital edition, it appears here instantly.
              </p>
              <div className="flex justify-center gap-3 mt-8">
                <Link
                  href="/books"
                  className="px-6 py-3 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-900 transition-colors shadow-sm"
                >
                  Explore All Books
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {entitlements.map((entitlement) => {
                const book = entitlement.book;
                const progress = progressMap.get(book.id);
                const currentPage = progress?.currentPage || 1;
                const totalPages =
                  progress?.totalPages && progress.totalPages > 1
                    ? progress.totalPages
                    : book.pageCount && book.pageCount > 1
                    ? book.pageCount
                    : 1;

                const percent =
                  totalPages > 1
                    ? Math.min(100, Math.round((currentPage / totalPages) * 100))
                    : progress?.progressPercent || 0;

                const hasStarted = currentPage > 1 || percent > 0;
                const existingReview = reviews[book.id];

                const isValidCover =
                  book.coverImage &&
                  !book.coverImage.startsWith("blob:") &&
                  (book.coverImage.startsWith("http") || book.coverImage.startsWith("/"));

                return (
                  <div
                    key={entitlement.id || book.id}
                    className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="p-6 flex flex-col gap-4">
                      {/* Gift Badge & Note */}
                      {entitlement.isGift && (
                        <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
                          <Gift className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-[11px] text-amber-950 block">
                              Gift from {entitlement.giftSenderName || entitlement.giftSenderEmail || "a friend"}
                            </span>
                            {entitlement.giftMessage && (
                              <p className="font-serif italic text-amber-900 text-[11px] mt-0.5 leading-snug">
                                &ldquo;{entitlement.giftMessage}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-5">
                        {/* Book Cover */}
                        <Link
                          href={`/reader/${book.slug}`}
                          className="relative w-24 sm:w-28 aspect-[2/3] rounded-md shadow-book group-hover:scale-105 transition-transform shrink-0 border border-black/10 overflow-hidden bg-slate-900 flex items-center justify-center text-white"
                        >
                          {isValidCover ? (
                            <Image
                              src={book.coverImage}
                              alt={book.title}
                              fill
                              sizes="120px"
                              className="object-contain"
                            />
                          ) : (
                            <div className="p-3 text-center flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white">
                              <BookOpen className="w-5 h-5 text-amber-400 mb-2 opacity-80" />
                              <span className="font-serif text-[10px] font-bold leading-tight line-clamp-3">
                                {book.title}
                              </span>
                              <span className="text-[8px] text-amber-200/70 mt-1 block truncate max-w-full">
                                {book.author?.name}
                              </span>
                            </div>
                          )}
                          <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-white/10 to-transparent pointer-events-none" />
                        </Link>

                        {/* Metadata & Progress */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                              {book.category.name}
                            </span>
                            {book.examMetadata && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                {book.examMetadata.examAcronym}
                              </span>
                            )}
                          </div>

                          <Link href={`/reader/${book.slug}`}>
                            <h3 className="font-serif text-base sm:text-lg font-bold text-brand-ink leading-snug line-clamp-2 hover:text-brand-600 transition-colors">
                              {book.title}
                            </h3>
                          </Link>

                          <p className="text-xs text-brand-muted mt-1 font-medium">
                            By {book.author.name}
                          </p>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-[11px] mb-1.5">
                              <span className="font-semibold text-brand-slate">
                                {hasStarted ? `${Math.round(percent)}% complete` : "Not started"}
                              </span>
                              <span className="text-brand-muted text-[10px]">
                                {totalPages > 1 ? `${currentPage} of ${totalPages} Pages` : `Page ${currentPage}`}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-ink rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Review Section */}
                      <div className="mt-2 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                        {existingReview ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center text-amber-400 shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < existingReview.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-200 fill-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] font-semibold text-brand-slate truncate">
                              Your Review ({existingReview.rating}/5)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-brand-muted">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Share your reader review</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openReviewModal({
                              id: book.id,
                              title: book.title,
                              coverImage: book.coverImage,
                              slug: book.slug,
                              authorName: book.author.name,
                            })
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                            existingReview
                              ? "bg-gray-100 hover:bg-gray-200 text-brand-slate"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 hover:border-amber-300"
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                          <span>{existingReview ? "Edit Review" : "Write Review"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="px-6 py-4 bg-brand-50/60 border-t border-brand-border flex items-center justify-between">
                      <span className="text-[11px] text-brand-muted flex items-center gap-1 font-light">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{hasStarted ? "Saved position" : "Ready to read"}</span>
                      </span>

                      <Link
                        href={`/reader/${book.slug}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs shadow-xs transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-brand-300" />
                        <span>{hasStarted ? "Continue Reading" : "Start Reading"}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDER HISTORY & RECEIPTS */}
      {activeTab === "orders" && (
        <div className="mt-8">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-brand-border p-12 text-center max-w-lg mx-auto shadow-xs my-12">
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-brand-ink">
                No past orders recorded yet.
              </h3>
              <p className="text-sm text-brand-slate mt-3 leading-relaxed font-light">
                When you purchase books from Noveraile Publishing, your itemized receipts, order confirmation numbers, and payment details will be archived right here.
              </p>
              <div className="flex justify-center gap-3 mt-8">
                <Link
                  href="/books"
                  className="px-6 py-3 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-900 transition-colors shadow-sm"
                >
                  Browse Bookstore
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-xs"
                  >
                    {/* Summary Bar */}
                    <div className="p-6 bg-brand-50/70 border-b border-brand-border flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-brand-muted font-semibold block">
                            Order Number
                          </span>
                          <span className="font-mono font-bold text-brand-ink text-sm">
                            {order.orderNumber}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-brand-muted font-semibold block">
                            Date Placed
                          </span>
                          <span className="font-medium text-brand-slate">
                            {orderDate}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-brand-muted font-semibold block">
                            Total Paid
                          </span>
                          <span className="font-bold text-brand-ink text-sm">
                            ${order.totalAmount.toFixed(2)} {order.currency}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.isGift && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                            <Gift className="w-3.5 h-3.5 text-amber-600" />
                            <span>Gift Purchase</span>
                          </span>
                        )}
                        {order.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Payment Completed</span>
                          </span>
                        ) : order.paymentStatus === "PENDING" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Payment Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <span>Cancelled</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Gift Recipient Strip */}
                    {order.isGift && order.recipientEmail && (
                      <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-200/60 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>
                            Gift delivered to: <strong>{order.recipientName || order.recipientEmail}</strong> ({order.recipientEmail})
                          </span>
                        </div>
                        {order.giftMessage && (
                          <span className="font-serif italic text-amber-900/90 text-[11px]">
                            &ldquo;{order.giftMessage}&rdquo;
                          </span>
                        )}
                      </div>
                    )}

                    {/* Order Line Items */}
                    <div className="p-6 divide-y divide-gray-100">
                      {order.items.map((item: any) => {
                        const existingReview = reviews[item.book.id];

                        return (
                          <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="relative w-14 aspect-[2/3] rounded shadow-xs overflow-hidden border border-black/10 shrink-0 bg-white">
                                <Image
                                  src={item.book.coverImage}
                                  alt={item.book.title}
                                  fill
                                  sizes="60px"
                                  className="object-contain"
                                />
                              </div>

                              <div>
                                <Link
                                  href={`/books/${item.book.slug}`}
                                  className="font-serif font-bold text-brand-ink text-sm sm:text-base hover:text-brand-600 transition-colors line-clamp-1"
                                >
                                  {item.book.title}
                                </Link>
                                <p className="text-xs text-brand-muted mt-0.5">
                                  {order.isGift ? "Gifted Digital Access" : "Digital Edition • Instant Cloud Access"}
                                </p>
                                <span className="text-xs font-semibold text-brand-slate block mt-1">
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {order.paymentStatus === "PAID" && !order.isGift && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openReviewModal({
                                        id: item.book.id,
                                        title: item.book.title,
                                        coverImage: item.book.coverImage,
                                        slug: item.book.slug,
                                      })
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                      existingReview
                                        ? "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                        : "bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100"
                                    }`}
                                  >
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                    <span>{existingReview ? "Edit Review" : "Review Book"}</span>
                                  </button>

                                  <Link
                                    href={`/reader/${item.book.slug}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-ink hover:bg-brand-900 text-white text-xs font-semibold shadow-xs transition-colors"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-brand-300" />
                                    <span>Read Now</span>
                                  </Link>
                                </>
                              )}

                              {order.paymentStatus === "PENDING" &&
                                (order.cryptoInvoiceUrl ? (
                                  <a
                                    href={order.cryptoInvoiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                                  >
                                    <span>Pay Now</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-xs font-medium text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                                    Pending
                                  </span>
                                ))}

                              {order.isGift && (
                                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                                  Delivered as Gift
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Footer Breakdown */}
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between text-[11px] text-brand-muted gap-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-brand-slate" />
                        <span>Payment Method: {order.payment?.provider || "Direct Digital Checkout"}</span>
                      </div>

                      <div className="flex items-center gap-4 font-medium">
                        {order.discountAmount > 0 && (
                          <span className="text-emerald-700">
                            Discount: -${order.discountAmount.toFixed(2)}
                          </span>
                        )}
                        <span>Subtotal: ${order.subtotal.toFixed(2)}</span>
                        <span className="font-bold text-brand-ink text-xs">
                          Total: ${order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= INTERACTIVE REVIEW MODAL ================= */}
      {modalOpen && activeBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-brand-border max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={closeReviewModal}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-brand-50 text-gray-400 hover:text-gray-600 absolute top-5 right-5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Heading */}
            <div className="mb-6 flex gap-4 items-center">
              <div className="relative w-12 aspect-[2/3] rounded shadow-xs overflow-hidden border border-black/10 shrink-0 bg-white">
                {activeBook.coverImage ? (
                  <Image
                    src={activeBook.coverImage}
                    alt={activeBook.title}
                    fill
                    sizes="60px"
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-brand-navy flex items-center justify-center text-white">
                    <BookOpen className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block mb-0.5">
                  Reader Review
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-ink leading-tight line-clamp-1">
                  {reviews[activeBook.id] ? "Edit Your Review" : "Write a Customer Review"}
                </h3>
                <p className="text-xs text-brand-slate mt-0.5 font-light line-clamp-1">
                  {activeBook.title}
                </p>
              </div>
            </div>

            {/* Success State */}
            {success ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-serif font-bold text-xl">Thank You for Your Feedback!</h4>
                <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
                  Your verified reader review has been recorded and will help fellow candidates and readers in our community.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-5">
                {/* Verified Purchaser Badge */}
                <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200/90 text-xs text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Verified Reader: <strong>{currentUser.name}</strong>
                    </span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded shrink-0 ml-2">
                    Verified Purchase
                  </span>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Overall Rating (1 - 5 Stars) */}
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1.5">
                    Your Rating (1 to 5 Stars) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating !== null ? hoverRating : rating) >= star;
                      return (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 text-amber-400 hover:scale-115 transition-transform focus:outline-none"
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 ${
                              isFilled
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-200 fill-gray-200"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-medium text-brand-slate mt-1.5 block">
                    {RATING_DESCRIPTIONS[hoverRating || rating]}
                  </span>
                </div>

                {/* Headline Input */}
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Review Headline *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mastered high-yield topics in 2 weeks! Clear and rigorous"
                    maxLength={100}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-ink"
                  />
                  <div className="text-right text-[10px] text-brand-muted mt-1">
                    {title.length}/100
                  </div>
                </div>

                {/* Commentary Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Written Feedback & Experience *
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like most about this publication? How did it assist your clinical prep or study routine?"
                    maxLength={2000}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-ink resize-y"
                  />
                  <div className="text-right text-[10px] text-brand-muted mt-1">
                    {comment.length}/2000
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-slate hover:bg-brand-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <span>Saving Review...</span>
                    ) : (
                      <>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{reviews[activeBook.id] ? "Update Review" : "Publish Review"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
