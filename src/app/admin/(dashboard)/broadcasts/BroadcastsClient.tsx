"use client";

import React, { useState } from "react";
import {
  Megaphone,
  BookOpen,
  Tag,
  Sparkles,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Mail,
  Sliders,
} from "lucide-react";

interface BookOption {
  id: string;
  title: string;
  slug: string;
  price: number;
  coverImage: string | null;
  authorName: string;
}

interface CouponOption {
  id: string;
  code: string;
  discount: string;
}

interface CampaignHistory {
  id: string;
  subject: string;
  campaignType: string;
  recipientCount: number;
  sentCount: number;
  failureCount: number;
  audience: string;
  sentBy: string;
  createdAt: string;
}

interface BroadcastsData {
  audienceStats: {
    totalCustomers: number;
    verifiedCustomers: number;
  };
  books: BookOption[];
  coupons: CouponOption[];
  history: CampaignHistory[];
}

export function BroadcastsClient({ initialData }: { initialData: BroadcastsData }) {
  const [data, setData] = useState<BroadcastsData>(initialData);
  const [activePreset, setActivePreset] = useState<"BOOK_RELEASE" | "PROMOTION" | "SEASONAL" | "CUSTOM">("CUSTOM");

  // Form State
  const [subject, setSubject] = useState("");
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<"VERIFIED_CUSTOMERS" | "ALL_CUSTOMERS" | "TEST_ONLY">("VERIFIED_CUSTOMERS");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [ctaText, setCtaText] = useState("Explore Noveraile");
  const [ctaUrl, setCtaUrl] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Apply Quick Template Presets
  const applyPreset = (type: "BOOK_RELEASE" | "PROMOTION" | "SEASONAL" | "CUSTOM") => {
    setActivePreset(type);
    setStatusMessage(null);

    if (type === "BOOK_RELEASE") {
      const firstBook = data.books[0];
      setSubject("✨ New Release Announcement: Discover Our Latest Title");
      setHeadline("Announcing Our Newest Publication");
      setContent(
        "We are thrilled to present our newest publication to our reading community.\n\nCrafted with meticulous storytelling, this book is now officially available to read in your personal cloud library."
      );
      if (firstBook) {
        setSelectedBookId(firstBook.id);
        setCtaText(`Read "${firstBook.title}"`);
        setCtaUrl(`/books/${firstBook.slug}`);
      }
    } else if (type === "PROMOTION") {
      const firstCoupon = data.coupons[0];
      setSubject("🎁 Special Reader Offer: Limited-Time Promotional Discount");
      setHeadline("An Exclusive Invitation for Noveraile Readers");
      setContent(
        "To celebrate our community of passionate readers, we are extending a special promotional discount on your next digital book.\n\nUse the voucher code below during checkout to apply your savings immediately."
      );
      if (firstCoupon) {
        setSelectedCouponCode(firstCoupon.code);
      }
      setCtaText("Explore Library Catalog");
      setCtaUrl("/#catalog");
    } else if (type === "SEASONAL") {
      setSubject("🌟 Season's Greetings & Warm Wishes from Noveraile Publishing");
      setHeadline("Warm Greetings & Thank You for Being Part of Our Story");
      setContent(
        "As we celebrate this wonderful season, everyone at Noveraile Publishing extends our heartfelt gratitude for your continued readership and curiosity.\n\nWe look forward to bringing you even more inspiring stories, thoughtful literature, and unforgettable reading moments in the days ahead."
      );
      setSelectedBookId("");
      setSelectedCouponCode("");
      setCtaText("Browse Our Books");
      setCtaUrl("/");
    } else {
      setSubject("");
      setHeadline("");
      setContent("");
      setSelectedBookId("");
      setSelectedCouponCode("");
      setCtaText("Explore on Noveraile");
      setCtaUrl("");
    }
  };

  // Find selected book details for live preview
  const attachedBook = data.books.find((b) => b.id === selectedBookId);
  const attachedCoupon = data.coupons.find((c) => c.code === selectedCouponCode);

  // Send Test Preview
  const handleSendTest = async () => {
    if (!subject || !headline || !content) {
      setStatusMessage({ success: false, text: "Please provide a subject, headline, and message content." });
      return;
    }

    setIsTestLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          headline,
          content,
          audience: "TEST_ONLY",
          campaignType: activePreset === "CUSTOM" ? "ANNOUNCEMENT" : activePreset,
          ctaText: ctaText || undefined,
          ctaUrl: ctaUrl || undefined,
          bookId: selectedBookId || undefined,
          couponCode: selectedCouponCode || undefined,
          testRecipientEmail: testEmail.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setStatusMessage({
          success: true,
          text: resData.message || "Test preview email delivered successfully!",
        });
      } else {
        setStatusMessage({
          success: false,
          text: resData.error || "Failed to send test preview email.",
        });
      }
    } catch {
      setStatusMessage({ success: false, text: "Network error during preview dispatch." });
    } finally {
      setIsTestLoading(false);
    }
  };

  // Send Full Broadcast
  const handleSendBroadcast = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          headline,
          content,
          audience,
          campaignType: activePreset === "CUSTOM" ? "ANNOUNCEMENT" : activePreset,
          ctaText: ctaText || undefined,
          ctaUrl: ctaUrl || undefined,
          bookId: selectedBookId || undefined,
          couponCode: selectedCouponCode || undefined,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setStatusMessage({
          success: true,
          text: resData.message || "Broadcast successfully sent to all readers!",
        });

        // Refresh history
        const refreshRes = await fetch("/api/admin/broadcasts");
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.data) {
          setData(refreshData.data);
        }
      } else {
        setStatusMessage({
          success: false,
          text: resData.error || "Failed to send email broadcast.",
        });
      }
    } catch {
      setStatusMessage({ success: false, text: "Network error during broadcast dispatch." });
    } finally {
      setLoading(false);
    }
  };

  const recipientTargetCount =
    audience === "ALL_CUSTOMERS"
      ? data.audienceStats.totalCustomers
      : data.audienceStats.verifiedCustomers;

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-950 flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <span>Customer Email Broadcasts & Campaigns</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Dispatch announcements, promotional vouchers, new book releases, and season greetings directly to all customer inboxes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-xs font-semibold text-gray-700 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-brand-ink" />
            <span>{data.audienceStats.verifiedCustomers} Verified Readers</span>
          </div>
        </div>
      </div>

      {/* Quick Template Presets */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
          1. Select Quick Campaign Template
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => applyPreset("BOOK_RELEASE")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activePreset === "BOOK_RELEASE"
                ? "bg-[#0f172a] text-white border-gray-900 shadow-xs"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/80"
            }`}
          >
            <BookOpen className={`w-4 h-4 mb-2 ${activePreset === "BOOK_RELEASE" ? "text-amber-400" : "text-amber-600"}`} />
            <div className="font-bold text-xs">New Book Release</div>
            <div className={`text-[11px] mt-0.5 ${activePreset === "BOOK_RELEASE" ? "text-gray-300" : "text-gray-500"}`}>
              Showcase book & direct link
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("PROMOTION")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activePreset === "PROMOTION"
                ? "bg-[#0f172a] text-white border-gray-900 shadow-xs"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/80"
            }`}
          >
            <Tag className={`w-4 h-4 mb-2 ${activePreset === "PROMOTION" ? "text-amber-400" : "text-emerald-600"}`} />
            <div className="font-bold text-xs">Special Promotion</div>
            <div className={`text-[11px] mt-0.5 ${activePreset === "PROMOTION" ? "text-gray-300" : "text-gray-500"}`}>
              Discount voucher & sale offer
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("SEASONAL")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activePreset === "SEASONAL"
                ? "bg-[#0f172a] text-white border-gray-900 shadow-xs"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/80"
            }`}
          >
            <Sparkles className={`w-4 h-4 mb-2 ${activePreset === "SEASONAL" ? "text-amber-400" : "text-purple-600"}`} />
            <div className="font-bold text-xs">Season Greetings</div>
            <div className={`text-[11px] mt-0.5 ${activePreset === "SEASONAL" ? "text-gray-300" : "text-gray-500"}`}>
              Holidays & publisher gratitude
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("CUSTOM")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activePreset === "CUSTOM"
                ? "bg-[#0f172a] text-white border-gray-900 shadow-xs"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/80"
            }`}
          >
            <Sliders className={`w-4 h-4 mb-2 ${activePreset === "CUSTOM" ? "text-amber-400" : "text-blue-600"}`} />
            <div className="font-bold text-xs">Custom Broadcast</div>
            <div className={`text-[11px] mt-0.5 ${activePreset === "CUSTOM" ? "text-gray-300" : "text-gray-500"}`}>
              Freeform custom messaging
            </div>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in ${
            statusMessage.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold hover:underline opacity-70"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2-Column: Composer + Live Visual Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              2. Compose Message
            </span>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. ✨ New Release: Discover Our Latest Title"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Headline Banner (H1)
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Announcing Our Newest Publication"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Message Content (Paragraphs)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Write your announcement or message here. Separate paragraphs with a blank line."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink leading-relaxed"
                required
              />
            </div>

            {/* Optional Attachments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Attach Catalog Book (Optional)
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => {
                    setSelectedBookId(e.target.value);
                    const b = data.books.find((book) => book.id === e.target.value);
                    if (b) {
                      setCtaText(`Read "${b.title}"`);
                      setCtaUrl(`/books/${b.slug}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-ink"
                >
                  <option value="">-- No Book Attached --</option>
                  {data.books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (${b.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Attach Coupon Voucher (Optional)
                </label>
                <select
                  value={selectedCouponCode}
                  onChange={(e) => setSelectedCouponCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-ink"
                >
                  <option value="">-- No Coupon Attached --</option>
                  {data.coupons.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} ({c.discount})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CTA Button Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Explore on Noveraile"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  CTA Button Link URL (Optional)
                </label>
                <input
                  type="text"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="e.g. /books/my-book-slug"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink font-mono"
                />
              </div>
            </div>

            {/* Audience Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Audience
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAudience("VERIFIED_CUSTOMERS")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audience === "VERIFIED_CUSTOMERS"
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Readers</span>
                  </div>
                  <div className={`text-[11px] mt-0.5 ${audience === "VERIFIED_CUSTOMERS" ? "text-gray-300" : "text-gray-500"}`}>
                    {data.audienceStats.verifiedCustomers} Active Accounts (Recommended)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAudience("ALL_CUSTOMERS")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audience === "ALL_CUSTOMERS"
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>All Registered</span>
                  </div>
                  <div className={`text-[11px] mt-0.5 ${audience === "ALL_CUSTOMERS" ? "text-gray-300" : "text-gray-500"}`}>
                    {data.audienceStats.totalCustomers} Accounts (Including pending)
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Action Dispatcher Box */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Test Send Box */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@yourinbox.com"
                className="px-3 py-2 text-xs rounded-xl border border-gray-200 w-full sm:w-48 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isTestLoading || loading}
                className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5 text-gray-600" />
                <span>{isTestLoading ? "Sending..." : "Test Preview"}</span>
              </button>
            </div>

            {/* Broadcast Button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={loading || isTestLoading || recipientTargetCount === 0 || !subject || !headline || !content}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
            >
              <Send className={`w-3.5 h-3.5 ${loading ? "animate-pulse" : ""}`} />
              <span>{loading ? "Dispatching..." : `Broadcast to ${recipientTargetCount} Readers`}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Visual Email Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-gray-500" />
                <span>Live Reader Email Preview</span>
              </span>
              <span className="text-[11px] text-gray-400">Desktop & Mobile responsive</span>
            </div>

            {/* Email Container Mockup */}
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-sm overflow-hidden text-left">
              <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs max-w-md mx-auto space-y-4">
                {/* Email Header */}
                <div className="text-center pb-4 border-b border-slate-100">
                  <div className="font-serif text-lg font-bold tracking-[0.15em] text-slate-900">
                    NOVERAILE
                  </div>
                  <div className="text-[8px] tracking-[0.35em] text-slate-500 uppercase -mt-0.5">
                    PUBLISHING
                  </div>
                </div>

                {/* Email Content */}
                <div>
                  <h2 className="font-serif text-base font-bold text-slate-900 leading-snug mb-2">
                    {headline || "Email Headline Banner"}
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Dear <strong>Reader</strong>,</p>

                  <div className="text-xs text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap">
                    {content || "Your broadcast announcement and paragraphs will appear here formatted with clean typography and spacing."}
                  </div>

                  {/* Attached Book Card Preview */}
                  {attachedBook && (
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                      {attachedBook.coverImage ? (
                        <img
                          src={attachedBook.coverImage}
                          alt={attachedBook.title}
                          className="w-12 h-16 object-cover rounded shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                          Book
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 block">
                          Featured Book
                        </span>
                        <div className="font-serif text-xs font-bold text-slate-900 line-clamp-1">
                          {attachedBook.title}
                        </div>
                        <div className="text-[10px] text-slate-500">By {attachedBook.authorName}</div>
                        <div className="text-[11px] font-bold text-slate-900 mt-0.5">${attachedBook.price.toFixed(2)}</div>
                      </div>
                    </div>
                  )}

                  {/* Attached Coupon Card Preview */}
                  {attachedCoupon && (
                    <div className="mt-4 p-3 bg-amber-50/70 border border-dashed border-amber-400 rounded-xl text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                        {attachedCoupon.discount} Promo Voucher
                      </span>
                      <span className="font-mono text-base font-bold tracking-widest text-slate-900 block">
                        {attachedCoupon.code}
                      </span>
                    </div>
                  )}

                  {/* CTA Button Preview */}
                  <div className="text-center pt-4 pb-1">
                    <div className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-xs">
                      {ctaText || "Explore on Noveraile"} &rarr;
                    </div>
                  </div>
                </div>

                {/* Email Footer */}
                <div className="pt-4 border-t border-slate-100 text-center text-[9px] text-slate-400 leading-relaxed">
                  Sent by Noveraile Publishing Platform • Verified Security<br />
                  noverailepublishing@gmail.com
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Broadcast Campaign History</span>
            </h2>
            <span className="text-[11px] text-gray-500">Log of past emails dispatched to customers</span>
          </div>
        </div>

        {data.history.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No broadcast campaigns sent yet. Select a template above to dispatch your first email!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Subject / Campaign</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Target Audience</th>
                  <th className="pb-3 font-semibold">Delivered</th>
                  <th className="pb-3 font-semibold">Sent By</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {data.history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/60">
                    <td className="py-3 font-medium text-gray-900 max-w-xs truncate">{h.subject}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {h.campaignType}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-gray-600">
                      {h.audience === "VERIFIED_CUSTOMERS" ? "Verified Readers" : "All Customers"}
                    </td>
                    <td className="py-3 font-semibold text-emerald-600">
                      {h.sentCount} / {h.recipientCount} sent
                    </td>
                    <td className="py-3 text-gray-500">{h.sentBy}</td>
                    <td className="py-3 text-gray-400 font-mono text-[11px]">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-200 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-lg font-bold text-gray-900 mb-1.5">
              Confirm Customer Broadcast
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              You are about to send this email announcement to{" "}
              <strong className="text-gray-900 font-bold">{recipientTargetCount} customer inboxes</strong> via your Gmail SMTP (<code>noverailepublishing@gmail.com</code>).
            </p>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-left text-xs mb-6 space-y-1">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold">Subject:</span>{" "}
                <span className="font-semibold text-gray-800">{subject}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold">Audience:</span>{" "}
                <span className="font-semibold text-gray-800">
                  {audience === "VERIFIED_CUSTOMERS" ? "Verified Customer Accounts" : "All Registered Customers"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                className="w-1/2 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
