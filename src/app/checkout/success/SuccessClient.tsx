"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, BookOpen, ArrowRight, Library, Receipt, Gift, Sparkles, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface SuccessClientProps {
  order: any;
  reference?: string;
  sessionId?: string;
  provider?: string;
}

export function SuccessClient({ order, reference, sessionId, provider }: SuccessClientProps) {
  const { clearCart, itemCount } = useCart();
  const { refreshUser } = useAuth();
  const hasClearedRef = useRef(false);

  const isGift = Boolean(order.isGift && order.recipientEmail);

  useEffect(() => {
    // 1. Clear shopping cart only once on mount to avoid re-render loops
    if (!hasClearedRef.current) {
      hasClearedRef.current = true;
      if (itemCount > 0) {
        clearCart();
      }
    }

    // 2. Guarantee customer session is verified and active for this order
    const claimSession = async () => {
      try {
        const res = await fetch("/api/checkout/claim-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            reference: reference || order.stripeSessionId,
            sessionId,
          }),
        });
        if (res.ok) {
          await refreshUser();
        }
      } catch (err) {
        console.error("Order session claim error:", err);
      }
    };

    claimSession();
  }, [order.orderNumber, reference, sessionId]); // Safe dependencies

  const firstItem = order.items?.[0];
  const firstBook = firstItem?.book;
  const firstSlug = firstBook?.slug || firstItem?.bookId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
      {isGift ? (
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <Gift className="w-9 h-9" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      )}

      <span className={`text-xs font-semibold uppercase tracking-widest block mb-2 ${
        isGift ? "text-amber-800" : "text-emerald-700"
      }`}>
        {isGift ? "🎁 Book Gift Dispatched" : "Payment Confirmed"} • Order {order.orderNumber}
      </span>

      <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-ink tracking-tight">
        {isGift ? "Your gift is on its way!" : "Your digital book is ready."}
      </h1>

      {isGift ? (
        <p className="text-sm sm:text-base text-brand-slate max-w-lg mx-auto mt-4 leading-relaxed font-light">
          A personalized gift notification email with instant cloud reading access has been dispatched to{" "}
          <strong className="text-brand-ink">{order.recipientName || "the recipient"}</strong> (
          <span className="font-mono text-brand-ink font-semibold">{order.recipientEmail}</span>).
        </p>
      ) : (
        <p className="text-sm sm:text-base text-brand-slate max-w-lg mx-auto mt-4 leading-relaxed font-light">
          A license confirmation has been dispatched to{" "}
          <strong className="text-brand-ink">{order.customerEmail}</strong>. Your publications are now active inside your personal cloud library.
        </p>
      )}

      {/* Gift Card Message Preview (if included) */}
      {isGift && order.giftMessage && (
        <div className="mt-8 max-w-lg mx-auto p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-1.5">
            <Heart className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
            <span>Personal Note Included With Gift</span>
          </div>
          <p className="font-serif italic text-sm text-brand-ink leading-relaxed">
            &ldquo;{order.giftMessage}&rdquo;
          </p>
        </div>
      )}

      {/* Action CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        {!isGift && firstSlug ? (
          <Link
            href={`/reader/${firstSlug}`}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <BookOpen className="w-4 h-4 text-brand-300" />
            <span>Start Reading Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : null}

        <Link
          href="/my-library?tab=orders"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <Receipt className="w-4 h-4 text-brand-300" />
          <span>View Order Receipt</span>
        </Link>

        <Link
          href="/books"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-brand-border text-brand-ink font-semibold text-sm hover:bg-brand-50 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <Library className="w-4 h-4 text-brand-500" />
          <span>Browse More Books</span>
        </Link>
      </div>

      {/* Purchased Items Overview */}
      <div className="mt-12 text-left bg-white rounded-2xl border border-brand-border p-6 shadow-xs divide-y divide-gray-100">
        <h3 className="font-serif text-base font-bold text-brand-ink pb-3 flex items-center justify-between">
          <span>{isGift ? "Gifted Publications" : "Purchased Digital Publications"}</span>
          {isGift && (
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Gift for {order.recipientName || order.recipientEmail}
            </span>
          )}
        </h3>

        {order.items?.map((item: any) => {
          const itemSlug = item.book?.slug || item.bookId;
          return (
            <div key={item.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {item.book?.coverImage && (
                  <div className="relative w-12 aspect-[2/3] rounded shadow-xs overflow-hidden shrink-0 border border-brand-border/60">
                    <Image
                      src={item.book.coverImage}
                      alt={item.bookTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-serif text-sm font-bold text-brand-ink">
                    {item.bookTitle}
                  </h4>
                  <span className={`text-[11px] font-medium ${
                    isGift ? "text-amber-800" : "text-emerald-700"
                  }`}>
                    {isGift
                      ? `Access Granted to ${order.recipientEmail}`
                      : "Active in Your Library"}
                  </span>
                </div>
              </div>

              {!isGift && itemSlug && (
                <Link
                  href={`/reader/${itemSlug}`}
                  className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer active:scale-95"
                >
                  Read Book
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
