"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Library,
  Receipt,
  Gift,
  Heart,
  Clock,
  ExternalLink,
  RefreshCw,
  XCircle,
  AlertCircle,
  Coins,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface SuccessClientProps {
  order: any;
  reference?: string;
  sessionId?: string;
  provider?: string;
  initialStatus?: string;
}

export function SuccessClient({
  order: initialOrder,
  reference,
  sessionId,
  provider,
  initialStatus,
}: SuccessClientProps) {
  const { clearCart, itemCount } = useCart();
  const { refreshUser } = useAuth();
  const hasClearedRef = useRef(false);

  const [order, setOrder] = useState<any>(initialOrder);
  const [paymentStatus, setPaymentStatus] = useState<string>(
    initialStatus === "cancelled" ? "CANCELLED" : initialOrder.paymentStatus || "PENDING"
  );
  const [isChecking, setIsChecking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // 12-Minute Expiration Window (720 seconds)
  const EXPIRATION_TOTAL_SECONDS = 12 * 60;
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const created = new Date(initialOrder?.createdAt || Date.now()).getTime();
    const elapsedSeconds = Math.floor((Date.now() - created) / 1000);
    return Math.max(0, EXPIRATION_TOTAL_SECONDS - elapsedSeconds);
  });

  const isGift = Boolean(order.isGift && order.recipientEmail);
  const isCrypto =
    provider === "nowpayments" ||
    Boolean(order.cryptoPaymentId);
  const isPaystack =
    provider === "paystack" ||
    (!isCrypto && provider !== "stripe" && (Boolean(order.stripeSessionId) || provider === "paystack"));
  const paymentUrl = order.cryptoInvoiceUrl;

  // Clear shopping cart once on mount if paid or pending
  useEffect(() => {
    if (!hasClearedRef.current && paymentStatus !== "CANCELLED") {
      hasClearedRef.current = true;
      if (itemCount > 0) {
        clearCart();
      }
    }
  }, [paymentStatus, itemCount, clearCart]);

  // 12-Minute Countdown Timer with Automatic Cancellation
  useEffect(() => {
    if (paymentStatus !== "PENDING") return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Automatically trigger server-side cancellation on expiration
          fetch("/api/checkout/cancel-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderNumber: order.orderNumber }),
          }).catch(() => {});
          setPaymentStatus("CANCELLED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, order.orderNumber]);

  // Attempt to claim user session if order is confirmed paid
  useEffect(() => {
    if (paymentStatus === "PAID") {
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
    }
  }, [paymentStatus, order.orderNumber, reference, sessionId, refreshUser]);

  // Automatic live status poller while order is PENDING
  useEffect(() => {
    if (paymentStatus !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/order-status?orderNumber=${encodeURIComponent(order.orderNumber)}`);
        const data = await res.json();
        if (res.ok && data.success && data.order) {
          setOrder((prev: any) => ({ ...prev, ...data.order }));
          if (typeof data.order.expiresInSeconds === "number") {
            setRemainingSeconds(data.order.expiresInSeconds);
          }
          if (data.order.paymentStatus !== "PENDING") {
            setPaymentStatus(data.order.paymentStatus);
          }
        }
      } catch {}
      setPollCount((c) => c + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [paymentStatus, order.orderNumber]);

  // Format MM:SS for countdown
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / EXPIRATION_TOTAL_SECONDS) * 100));

  // Manual status check trigger
  const handleManualStatusCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/checkout/order-status?orderNumber=${encodeURIComponent(order.orderNumber)}`);
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrder((prev: any) => ({ ...prev, ...data.order }));
        setPaymentStatus(data.order.paymentStatus);
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Cancel order handler
  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this pending checkout session?")) return;
    setIsCancelling(true);
    try {
      const res = await fetch("/api/checkout/cancel-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentStatus("CANCELLED");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const firstItem = order.items?.[0];
  const firstBook = firstItem?.book;
  const firstSlug = firstBook?.slug || firstItem?.bookId;

  // =========================================================================
  // VIEW 1: PAYMENT CANCELLED OR INCOMPLETE
  // =========================================================================
  if (paymentStatus === "CANCELLED") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <XCircle className="w-9 h-9" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-3">
          Checkout Cancelled • Order {order.orderNumber}
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">
          Payment was not completed
        </h1>

        <p className="text-sm sm:text-base text-brand-slate max-w-md mx-auto mt-3 leading-relaxed font-light">
          This payment session was cancelled before completion. No digital entitlements were granted and your account was not charged.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/cart"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Return to Cart & Retry</span>
          </Link>

          <Link
            href="/books"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-brand-border text-brand-ink font-semibold text-sm hover:bg-brand-50 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Library className="w-4 h-4 text-brand-500" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AWAITING ON-CHAIN CONFIRMATION (PENDING)
  // =========================================================================
  if (paymentStatus === "PENDING") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center animate-in fade-in">
        <div className="relative w-20 h-20 rounded-full bg-amber-100/90 text-amber-700 flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-200">
          <Clock className="w-10 h-10 animate-pulse text-amber-700" />
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white animate-ping" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-amber-900 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300 inline-block mb-3">
          ⏳ Awaiting Payment Confirmation • Order {order.orderNumber}
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-ink tracking-tight">
          Payment Processing
        </h1>

        <p className="text-sm sm:text-base text-brand-slate max-w-lg mx-auto mt-4 leading-relaxed font-light">
          {isCrypto
            ? "Your crypto payment session has been initiated. As soon as the network confirms your transaction on-chain (usually 1–5 minutes), your digital publications will unlock automatically."
            : isPaystack
            ? "Your Paystack checkout session has been opened. Complete your card, bank transfer, or USSD payment, and your digital publications will unlock immediately."
            : "We are confirming your payment with the processing gateway. Your titles will unlock immediately once confirmed."}
        </p>

        {/* Real-time Status Card with 12-Minute Expiration Countdown */}
        <div className="mt-7 max-w-md mx-auto p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-left space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-950 flex items-center gap-1.5">
              {isCrypto ? (
                <Coins className="w-4 h-4 text-amber-600" />
              ) : (
                <CreditCard className="w-4 h-4 text-emerald-600" />
              )}
              <span>
                {isCrypto ? "Payment Status: Pending On-Chain" : "Payment Status: Awaiting Paystack Confirmation"}
              </span>
            </span>
            <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Live Polling
            </span>
          </div>

          {/* 12-Minute Countdown Timer & Progress */}
          <div className="p-3 rounded-xl bg-amber-100/60 border border-amber-200/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                <span>Auto-Cancels In:</span>
              </span>
              <span className="font-mono font-bold text-xs text-amber-950 bg-amber-200/80 px-2.5 py-0.5 rounded-md border border-amber-300">
                {formatCountdown(remainingSeconds)}
              </span>
            </div>

            <div className="w-full h-1.5 bg-amber-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-800/80 block leading-tight">
              {isCrypto
                ? "Order automatically cancels if unconfirmed after 12 minutes to protect crypto rates."
                : "Order automatically cancels if uncompleted after 12 minutes to protect session security."}
            </span>
          </div>

          <div className="text-xs text-amber-900 leading-relaxed font-light">
            Amount Due: <strong className="font-bold text-amber-950">${Number(order.totalAmount || 0).toFixed(2)} USD</strong>
            <br />
            Linked Email: <strong className="font-bold text-amber-950">{order.customerEmail}</strong>
          </div>

          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2 text-xs">
            <button
              onClick={handleManualStatusCheck}
              disabled={isChecking}
              className={`px-3 py-1.5 rounded-lg text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isCrypto ? "bg-amber-800 hover:bg-amber-900" : "bg-emerald-800 hover:bg-emerald-900"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Checking..." : "Check Status Now"}</span>
            </button>

            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer disabled:opacity-50"
            >
              Cancel Order
            </button>
          </div>
        </div>

        {/* Action CTAs for Pending */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {paymentUrl && (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                isCrypto ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <span>{isCrypto ? "Complete Crypto Payment in New Tab" : "Complete Paystack Payment in New Tab"}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <Link
            href="/my-library?tab=orders"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-brand-border text-brand-ink font-semibold text-sm hover:bg-brand-50 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-brand-500" />
            <span>View Pending Orders</span>
          </Link>

          <Link
            href="/books"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-brand-border text-brand-ink font-semibold text-sm hover:bg-brand-50 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Library className="w-4 h-4 text-brand-500" />
            <span>Continue Browsing</span>
          </Link>
        </div>

        {/* Ordered Publications List (Showing Pending Lock Status) */}
        <div className="mt-12 text-left bg-white rounded-2xl border border-brand-border p-6 shadow-xs divide-y divide-gray-100">
          <h3 className="font-serif text-base font-bold text-brand-ink pb-3 flex items-center justify-between">
            <span>Pending Publications ({order.items?.length || 1})</span>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Unlocks Upon Payment
            </span>
          </h3>

          {order.items?.map((item: any) => (
            <div key={item.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {item.book?.coverImage && (
                  <div className="relative w-12 aspect-[2/3] rounded shadow-xs overflow-hidden shrink-0 border border-brand-border/60 opacity-80">
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
                  <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      {isCrypto ? "Awaiting Block Confirmation" : "Awaiting Payment Confirmation"}
                    </span>
                  </span>
                </div>
              </div>

              <span className="text-xs font-semibold text-brand-slate px-3 py-1.5 rounded-lg bg-gray-100">
                Locked
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: CONFIRMED PAID (ENTITLEMENTS UNLOCKED)
  // =========================================================================
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center animate-in fade-in">
      {isGift ? (
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <Gift className="w-9 h-9" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      )}

      <span
        className={`text-xs font-semibold uppercase tracking-widest block mb-2 ${
          isGift ? "text-amber-800" : "text-emerald-700"
        }`}
      >
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
          <strong className="text-brand-ink">{order.customerEmail}</strong>. Your publications are active inside your personal cloud library.
        </p>
      )}

      {isCrypto && (
        <div className="mt-4 max-w-lg mx-auto p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-900 flex items-center justify-center gap-2">
          <span className="text-base">🪙</span>
          <span>
            Crypto payment verified via <strong>NOWPayments</strong> on-chain. Digital access activated!
          </span>
        </div>
      )}

      {isPaystack && (
        <div className="mt-4 max-w-lg mx-auto p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-900 flex items-center justify-center gap-2">
          <span className="text-base">💳</span>
          <span>
            Card/Bank payment verified via <strong>Paystack</strong>. Digital access activated!
          </span>
        </div>
      )}

      {/* Gift Card Message Preview */}
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
          href="/my-library"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <Receipt className="w-4 h-4 text-brand-300" />
          <span>My Library</span>
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
                  <span
                    className={`text-[11px] font-medium ${
                      isGift ? "text-amber-800" : "text-emerald-700"
                    }`}
                  >
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
