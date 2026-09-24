"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, BookOpen, ArrowRight, Library } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface SuccessClientProps {
  order: any;
}

export function SuccessClient({ order }: SuccessClientProps) {
  const { clearCart, itemCount } = useCart();
  const { refreshUser } = useAuth();
  const hasClearedRef = useRef(false);

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
          body: JSON.stringify({ orderNumber: order.orderNumber }),
        });
        if (res.ok) {
          await refreshUser();
        }
      } catch (err) {
        console.error("Order session claim error:", err);
      }
    };

    claimSession();
  }, [order.orderNumber]); // Safe dependency that does not mutate on cart state changes

  const firstItem = order.items?.[0];
  const firstBook = firstItem?.book;
  const firstSlug = firstBook?.slug || firstItem?.bookId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest block mb-2">
        Payment Confirmed • Order {order.orderNumber}
      </span>

      <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-ink tracking-tight">
        Your digital book is ready.
      </h1>

      <p className="text-sm sm:text-base text-brand-slate max-w-lg mx-auto mt-4 leading-relaxed font-light">
        A license confirmation has been dispatched to{" "}
        <strong className="text-brand-ink">{order.customerEmail}</strong>. Your publications are now active inside your personal cloud library.
      </p>

      {/* Immediate Reading CTA */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        {firstSlug ? (
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
          href="/my-library"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white border border-brand-border text-brand-ink font-semibold text-sm hover:bg-brand-50 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <Library className="w-4 h-4 text-brand-500" />
          <span>Open My Library</span>
        </Link>
      </div>

      {/* Purchased Items Overview */}
      <div className="mt-12 text-left bg-white rounded-2xl border border-brand-border p-6 shadow-xs divide-y divide-gray-100">
        <h3 className="font-serif text-base font-bold text-brand-ink pb-3">
          Purchased Digital Publications
        </h3>

        {order.items?.map((item: any) => {
          const itemSlug = item.book?.slug || item.bookId;
          return (
            <div key={item.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {item.book?.coverImage && (
                  <div className="relative w-12 aspect-[3/4] rounded shadow-xs overflow-hidden shrink-0 border border-brand-border/60">
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
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Active in Library
                  </span>
                </div>
              </div>

              {itemSlug && (
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
