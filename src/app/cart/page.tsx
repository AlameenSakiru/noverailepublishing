"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ArrowRight, ShieldCheck, Tag, Lock, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const {
    items,
    removeItem,
    clearCart,
    subtotal,
    discountAmount,
    total,
    coupon,
    couponError,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { user } = useAuth();

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    const success = await applyCoupon(couponCodeInput);
    if (success) {
      setCouponCodeInput("");
    }
  };

  const handleCheckout = async () => {
    setCheckoutError(null);
    const emailToUse = user?.email || guestEmail.trim();

    if (!emailToUse || !emailToUse.includes("@")) {
      setCheckoutError("Please provide a valid email address for digital library delivery.");
      return;
    }

    setIsCheckingOut(true);

    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          couponCode: coupon?.code || null,
          email: emailToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setCheckoutError(data.error || "Unable to proceed to checkout. Please try again.");
        setIsCheckingOut(false);
        return;
      }

      // Redirect to checkout URL (Stripe or local sandbox completion)
      window.location.href = data.checkoutUrl;
    } catch {
      setCheckoutError("Network error initiating checkout.");
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand-ink">
          Your shopping cart is empty
        </h1>
        <p className="text-sm text-brand-slate max-w-md mx-auto mt-2 leading-relaxed">
          Your reading cart is waiting for its first title. Browse our complete catalog or explore our exam preparation study manuals.
        </p>
        <div className="flex justify-center gap-3 mt-8">
          <Link
            href="/books"
            className="px-6 py-3 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-900 transition-colors shadow-sm"
          >
            Browse All Books
          </Link>
          <Link
            href="/exam-prep"
            className="px-6 py-3 rounded-xl bg-white border border-brand-border text-brand-ink text-xs font-semibold hover:bg-brand-50 transition-colors"
          >
            Exam Preparation Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="pb-6 border-b border-brand-border mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
          Shopping Cart ({items.length} {items.length === 1 ? "Book" : "Books"})
        </h1>
        <p className="text-xs text-brand-muted mt-1">
          Purchased titles are instantly delivered to your personal Noveraile digital library.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-xs divide-y divide-gray-100">
            {items.map((item) => {
              const activePrice = item.salePrice != null && item.salePrice > 0 ? item.salePrice : item.price;
              return (
                <div key={item.bookId} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative w-16 sm:w-20 aspect-[3/4] rounded shadow-xs overflow-hidden shrink-0 border">
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/books/${item.slug}`}
                      className="font-serif text-base sm:text-lg font-bold text-brand-ink hover:text-brand-600 transition-colors block line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-brand-muted mt-0.5">By {item.author}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                      Digital Book • Instant Online Access
                    </span>
                  </div>

                  <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                    <div className="text-right">
                      <span className="font-bold text-lg text-brand-ink">
                        ${activePrice.toFixed(2)}
                      </span>
                      {item.salePrice && item.salePrice < item.price && (
                        <p className="text-xs text-brand-muted line-through">
                          ${item.price.toFixed(2)}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(item.bookId)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              href="/books"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-slate hover:text-brand-ink"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>

            <button
              onClick={clearCart}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs">
            <h2 className="font-serif text-xl font-bold text-brand-ink mb-4 pb-3 border-b border-gray-100">
              Order Summary
            </h2>

            {/* Email input if not signed in */}
            {!user && (
              <div className="mb-5 pb-5 border-b border-gray-100">
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Recipient Account Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
                <p className="text-[11px] text-brand-muted mt-1">
                  Your digital book will be instantly linked to this email address.
                </p>
              </div>
            )}

            {/* Subtotal / Discount / Total Lines */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-brand-slate">
                <span>Subtotal</span>
                <span className="font-medium text-brand-ink">${subtotal.toFixed(2)}</span>
              </div>

              {coupon && (
                <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon ({coupon.code})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>-${discountAmount.toFixed(2)}</span>
                    <button
                      onClick={removeCoupon}
                      className="text-gray-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-brand-slate text-xs">
                <span>Tax</span>
                <span className="text-brand-muted">Calculated at checkout</span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <span className="font-serif font-bold text-base text-brand-ink">Total Due</span>
                <span className="font-extrabold text-2xl text-brand-ink">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Code Entry Form */}
            {!coupon && (
              <form onSubmit={handleApplyCoupon} className="mt-5 pt-4 border-t border-gray-100">
                <label className="block text-xs font-semibold text-brand-slate mb-1">
                  Promo / Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    placeholder="e.g. WELCOME10, PASS2026"
                    className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-xs uppercase placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-ink border border-brand-border rounded-lg text-xs font-semibold transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-rose-500 mt-1">{couponError}</p>
                )}
              </form>
            )}

            {checkoutError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {checkoutError}
              </div>
            )}

            {/* Main Checkout CTA */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full mt-6 py-3.5 px-6 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-brand-300" />
              <span>{isCheckingOut ? "Processing..." : "Proceed to Secure Checkout"}</span>
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-brand-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted Direct Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
