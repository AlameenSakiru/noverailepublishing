import React from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  BookOpen,
  Clock,
  ArrowRight,
  Library,
  Receipt,
  CheckCircle2,
  Calendar,
  CreditCard,
  PackageCheck,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Library & Orders",
  description: "Access your purchased digital books, view past order receipts, and continue reading from your personal Noveraile cloud bookshelf.",
};

interface MyLibraryPageProps {
  searchParams?: {
    tab?: string;
  };
}

export default async function MyLibraryPage({ searchParams }: MyLibraryPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/my-library");
  }

  const activeTab = searchParams?.tab === "orders" ? "orders" : "books";

  // Concurrently fetch user's entitlements, reading progress, and order history
  const [entitlements, progressRecords, orders] = await Promise.all([
    prisma.entitlement.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { userId: currentUser.userId },
          { user: { email: currentUser.email } },
        ],
      },
      include: {
        book: {
          include: {
            author: true,
            category: true,
            examMetadata: true,
          },
        },
      },
      orderBy: { grantedAt: "desc" },
    }),
    prisma.readingProgress.findMany({
      where: {
        OR: [
          { userId: currentUser.userId },
          { user: { email: currentUser.email } },
        ],
      },
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { userId: currentUser.userId },
          { customerEmail: currentUser.email },
        ],
      },
      include: {
        payment: true,
        items: {
          include: {
            book: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const progressMap = new Map(progressRecords.map((p) => [p.bookId, p]));

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

      {/* Segmented Navigation Tabs: Bookshelf vs. Order History */}
      <div className="mt-8 flex items-center gap-3 border-b border-brand-border pb-4">
        <Link
          href="/my-library?tab=books"
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "books"
              ? "bg-brand-ink text-white shadow-xs"
              : "bg-white text-brand-slate hover:text-brand-ink border border-brand-border/80 hover:bg-brand-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>My Bookshelf ({entitlements.length})</span>
        </Link>

        <Link
          href="/my-library?tab=orders"
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "orders"
              ? "bg-brand-ink text-white shadow-xs"
              : "bg-white text-brand-slate hover:text-brand-ink border border-brand-border/80 hover:bg-brand-50"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Order History & Receipts ({orders.length})</span>
        </Link>
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
              {entitlements.map(({ book }) => {
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

                // Handle valid cover image or graceful fallback
                const isValidCover =
                  book.coverImage &&
                  !book.coverImage.startsWith("blob:") &&
                  (book.coverImage.startsWith("http") || book.coverImage.startsWith("/"));

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="p-6 flex gap-5">
                      {/* Book Cover Thumbnail with accurate 2:3 ratio */}
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
                            className="object-cover"
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

                      {/* Book Metadata & Progress */}
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

                        {/* Progress Bar & Percentage */}
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
                    {/* Order Top Summary Bar */}
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{order.paymentStatus === "PAID" ? "Payment Completed" : order.paymentStatus}</span>
                        </span>
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="p-6 divide-y divide-gray-100">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-14 aspect-[2/3] rounded shadow-xs overflow-hidden border border-black/10 shrink-0 bg-white">
                              <Image
                                src={item.book.coverImage}
                                alt={item.book.title}
                                fill
                                sizes="60px"
                                className="object-cover"
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
                                Digital Edition • Instant Cloud Access
                              </p>
                              <span className="text-xs font-semibold text-brand-slate block mt-1">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <Link
                              href={`/reader/${item.book.slug}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-ink hover:bg-brand-900 text-white text-xs font-semibold shadow-xs transition-colors"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-brand-300" />
                              <span>Read Now</span>
                            </Link>
                          </div>
                        </div>
                      ))}
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
    </div>
  );
}
