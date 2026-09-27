"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  Lock,
  ArrowLeft,
  ShoppingBag,
  Gift,
  Heart,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Coins,
  Zap,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CRYPTO">("CARD");
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
    isGift,
    recipientName,
    recipientEmail,
    giftMessage,
    setIsGift,
    setRecipientName,
    setRecipientEmail,
    setGiftMessage,
  } = useCart();
  const { user } = useAuth();

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState(user?.name || "");
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
    const emailToUse = user?.email || buyerEmail.trim();

    if (!emailToUse || !emailToUse.includes("@")) {
      setCheckoutError("Please provide your valid email address for the purchase receipt.");
      return;
    }

    if (isGift) {
      if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
        setCheckoutError("Please provide a valid email address for the gift recipient.");
        return;
      }
      if (!recipientName.trim()) {
        setCheckoutError("Please enter the recipient's name.");
        return;
      }
      if (recipientEmail.trim().toLowerCase() === emailToUse.toLowerCase()) {
        setCheckoutError("The recipient email cannot be the same as your sender email. Enter the person's email who is receiving the gift.");
        return;
      }
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
          preferredGateway: paymentMethod === "CRYPTO" ? "NOWPAYMENTS" : "PAYSTACK",
          isGift,
          recipientName: isGift ? recipientName.trim() : null,
          recipientEmail: isGift ? recipientEmail.trim() : null,
          giftMessage: isGift ? giftMessage.trim() : null,
          senderName: buyerName.trim() || user?.name || emailToUse.split("@")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setCheckoutError(data.error || "Unable to proceed to checkout. Please try again.");
        setIsCheckingOut(false);
        return;
      }

      // Clear cart locally upon successful checkout placement
      clearCart();

      // If Crypto, pop out invoice in a new tab so user continues viewing website
      if (paymentMethod === "CRYPTO" && data.checkoutUrl && data.checkoutUrl.startsWith("http")) {
        try {
          window.open(data.checkoutUrl, "_blank");
        } catch {}

        if (data.orderNumber) {
          router.push(`/checkout/success?orderNumber=${encodeURIComponent(data.orderNumber)}&provider=nowpayments`);
        } else {
          window.location.href = data.checkoutUrl;
        }
      } else {
        // Standard redirect for card / Paystack
        window.location.href = data.checkoutUrl;
      }
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
          {isGift
            ? "🎁 Gift purchase mode active: Titles will be directly delivered to the recipient's cloud library."
            : "Purchased titles are instantly delivered to your personal Noveraile digital library."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Cart Items List & Gift Form */}
        <div className="lg:col-span-8 space-y-6">
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
                      Digital Book • Instant Cloud Delivery
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

          {/* 🎁 Gift Purchase Toggle & Customization Box */}
          <div className={`rounded-2xl border transition-all duration-300 p-6 ${
            isGift
              ? "bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border-amber-300 shadow-sm"
              : "bg-white border-brand-border shadow-xs"
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isGift ? "bg-amber-500 text-white shadow-sm" : "bg-brand-100 text-brand-700"
                }`}>
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-brand-ink flex items-center gap-2">
                    <span>Send this purchase as a Gift</span>
                    {isGift && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        Gift Mode Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-brand-slate mt-0.5 font-light leading-relaxed">
                    Surprise a friend, colleague, or student. We will email them with immediate reading access and your personalized gift card note.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(e) => setIsGift(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Expanded Gift Input Details */}
            {isGift && (
              <div className="mt-6 pt-5 border-t border-amber-200/70 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-ink mb-1.5">
                      Recipient&apos;s Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300/80 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-ink mb-1.5">
                      Recipient&apos;s Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="alex.johnson@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300/80 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400"
                    />
                    <p className="text-[10px] text-amber-800/80 mt-1">
                      The gift notification and cloud reading access will be sent directly to this address.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-brand-ink">
                      Personal Gift Note / Message (Optional)
                    </label>
                    <span className="text-[10px] text-brand-muted">
                      {giftMessage.length}/400 characters
                    </span>
                  </div>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value.slice(0, 400))}
                    rows={3}
                    placeholder="e.g. Happy Birthday Alex! Wishing you great success on your upcoming exams. Enjoy this reading edition!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300/80 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400 leading-relaxed font-sans resize-none"
                  />
                </div>

                {/* Sender Name Customization */}
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1.5">
                    From (Your Name shown on the gift card)
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Your Name (e.g. Sarah Miller)"
                    className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-amber-300/80 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400"
                  />
                </div>
              </div>
            )}
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

        {/* Right Column: Order Summary & Checkout Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs">
            <h2 className="font-serif text-xl font-bold text-brand-ink mb-4 pb-3 border-b border-gray-100">
              Order Summary
            </h2>

            {/* Buyer Email input if not signed in */}
            {!user && (
              <div className="mb-5 pb-5 border-b border-gray-100">
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  {isGift ? "Your Email (Buyer / Sender)" : "Your Account Email"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
                <p className="text-[11px] text-brand-muted mt-1">
                  {isGift
                    ? "Your purchase confirmation receipt will be sent here."
                    : "Your digital book will be instantly linked to this email address."}
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

              {isGift && (
                <div className="flex justify-between text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Gift className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gift Delivery Service</span>
                  </div>
                  <span className="font-semibold text-amber-900">FREE</span>
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

            {/* Payment Method Selector */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <label className="block text-xs font-bold text-brand-ink mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    paymentMethod === "CARD"
                      ? "bg-brand-50/70 border-brand-ink shadow-xs ring-1 ring-brand-ink"
                      : "bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <CreditCard className={`w-4 h-4 ${paymentMethod === "CARD" ? "text-brand-ink" : "text-gray-400"}`} />
                    {paymentMethod === "CARD" && (
                      <span className="w-2 h-2 rounded-full bg-brand-ink"></span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-brand-ink">Cards & Bank</div>
                  <div className="text-[10px] text-brand-muted mt-0.5">Paystack • Instant</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CRYPTO")}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    paymentMethod === "CRYPTO"
                      ? "bg-gradient-to-br from-amber-50/90 to-amber-100/40 border-amber-500 shadow-xs ring-1 ring-amber-500"
                      : "bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Coins className={`w-4 h-4 ${paymentMethod === "CRYPTO" ? "text-amber-600" : "text-gray-400"}`} />
                    {paymentMethod === "CRYPTO" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-brand-ink flex items-center gap-1">
                    <span>Crypto</span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-200 text-amber-900 font-extrabold">300+</span>
                  </div>
                  <div className="text-[10px] text-amber-800/80 font-medium mt-0.5">USDT, BTC, SOL</div>
                </button>
              </div>

              {paymentMethod === "CRYPTO" && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Powered by NOWPayments. Auto-confirms on-chain with instant library access.</span>
                </div>
              )}
            </div>

            {checkoutError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {checkoutError}
              </div>
            )}

            {/* Main Checkout CTA */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`w-full mt-5 py-3.5 px-6 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 ${
                paymentMethod === "CRYPTO"
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-amber-900/10"
                  : "bg-brand-ink hover:bg-brand-900 text-white"
              }`}
            >
              {paymentMethod === "CRYPTO" ? (
                <Coins className="w-4 h-4 text-amber-200" />
              ) : (
                <Lock className="w-4 h-4 text-brand-300" />
              )}
              <span>
                {isCheckingOut
                  ? paymentMethod === "CRYPTO"
                    ? "Connecting to NOWPayments..."
                    : "Connecting to Secure Gateway..."
                  : isGift
                  ? paymentMethod === "CRYPTO"
                    ? "Pay Gift with Crypto (NOWPayments)"
                    : "Complete Gift Purchase"
                  : paymentMethod === "CRYPTO"
                  ? "Pay with Crypto (NOWPayments)"
                  : "Proceed to Secure Checkout"}
              </span>
            </button>

            {/* Payment Method Badges & Security */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-brand-muted">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {paymentMethod === "CRYPTO"
                    ? "NOWPayments Multi-Coin Checkout • Instant Fulfillment"
                    : "Paystack Encrypted Checkout • Instant Access"}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                {paymentMethod === "CRYPTO" ? (
                  <>
                    <span>USDT (TRC20/BEP20)</span>
                    <span>•</span>
                    <span>Bitcoin (BTC)</span>
                    <span>•</span>
                    <span>Ethereum (ETH)</span>
                    <span>•</span>
                    <span>Solana (SOL)</span>
                  </>
                ) : (
                  <>
                    <span>Cards</span>
                    <span>•</span>
                    <span>Bank Transfer</span>
                    <span>•</span>
                    <span>USSD</span>
                    <span>•</span>
                    <span>Apple Pay</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


