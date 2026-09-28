"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  MessageSquare,
  X,
  Send,
  HelpCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Headphones,
  Search,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
  link?: string;
  linkText?: string;
}

const QUICK_FAQS: FAQItem[] = [
  {
    q: "How do I access my purchased books?",
    a: "Immediately after checkout, your books are added to 'My Library'. You can open the online reader from any modern browser on desktop, tablet, or mobile.",
    link: "/my-library",
    linkText: "Go to My Library",
  },
  {
    q: "Can I highlight and add bookmarks in the reader?",
    a: "Yes! The Noveraile Cloud Reader automatically saves your bookmarks, reading progress, and page positions across all your devices.",
  },
  {
    q: "What payment methods are supported?",
    a: "We accept all major debit/credit cards (Visa, Mastercard, Verve) via Paystack with bank-grade 256-bit SSL encryption.",
  },
  {
    q: "How do I submit a manuscript for publishing?",
    a: "We actively welcome exam preparation authors and professional writers. Use our inquiry form under 'Author Submission' to connect with our editorial board.",
    link: "/contact",
    linkText: "Contact Editorial Board",
  },
];

interface TrackedTicketMessage {
  id: string;
  senderType: string;
  senderName: string;
  message: string;
  createdAt: string;
}

interface TrackedTicket {
  ticketNumber: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  messages: TrackedTicketMessage[];
}

export function SupportWidget() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"FAQS" | "MESSAGE" | "TRACK">("FAQS");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // New Ticket Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("ORDER_ACCESS");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track Ticket Form State
  const [trackRef, setTrackRef] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackedTicket, setTrackedTicket] = useState<TrackedTicket | null>(null);

  // Customer in-widget follow-up reply
  const [customerReply, setCustomerReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  // Auto-fill user if authenticated
  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.email && !email) {
        setEmail(user.email);
        setTrackEmail(user.email);
      }
    }
  }, [user]);

  // Don't display in distraction-free Reader or Admin Dashboard
  if (pathname.startsWith("/reader") || pathname.startsWith("/admin")) {
    return null;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          category,
          subject: `Widget Inquiry: ${category}`,
          message,
          source: "WIDGET",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message. Please try again.");
      }

      setSubmittedTicket(data.ticketNumber);
      setTrackRef(data.ticketNumber);
      setTrackEmail(email.trim());
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackRef.trim() || !trackEmail.trim()) {
      setTrackError("Please enter your Ticket Reference and Email Address.");
      return;
    }

    setTrackLoading(true);
    setTrackError(null);

    try {
      const res = await fetch(
        `/api/support/ticket?ticketNumber=${encodeURIComponent(
          trackRef.trim()
        )}&email=${encodeURIComponent(trackEmail.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ticket not found.");
      }

      setTrackedTicket(data.ticket);
    } catch (err: any) {
      setTrackError(err.message || "Unable to find ticket.");
      setTrackedTicket(null);
    } finally {
      setTrackLoading(false);
    }
  };

  const handleCustomerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedTicket || !customerReply.trim()) return;

    setReplyLoading(true);
    setTrackError(null);

    try {
      const res = await fetch("/api/support/ticket/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: trackedTicket.ticketNumber,
          email: trackEmail.trim(),
          message: customerReply.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reply.");
      }

      setTrackedTicket(data.ticket);
      setCustomerReply("");
      setReplySuccess(true);
      setTimeout(() => setReplySuccess(false), 4000);
    } catch (err: any) {
      setTrackError(err.message || "Failed to send follow-up.");
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-[#0a0f1d] hover:bg-slate-900 text-white rounded-full shadow-[0_10px_25px_rgba(10,15,29,0.35)] border border-slate-700/80 transition-all transform hover:scale-105 cursor-pointer"
          aria-label="Open Customer Support Assistant"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Headphones className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-12" />
          <span className="text-xs font-semibold tracking-wide">Support Desk</span>
        </button>
      )}

      {/* Razor-Sharp Support Popover Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] max-h-[610px] bg-white rounded-2xl shadow-[0_25px_60px_-15px_rgba(10,15,29,0.35)] border border-slate-300 ring-1 ring-black/5 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Executive Header */}
          <div className="bg-[#0a0f1d] text-white p-4 px-5 flex items-center justify-between border-b border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm tracking-tight text-white">
                    Noveraile Support
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-mono font-medium border border-emerald-500/40 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-light">
                  Reader assistance & editorial desk
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close support drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Razor-Sharp Segmented Navigation Tabs */}
          <div className="grid grid-cols-3 p-1.5 bg-slate-100/90 border-b border-slate-200 text-xs gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("FAQS")}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "FAQS"
                  ? "bg-white text-slate-950 font-bold shadow-xs border border-slate-300"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Answers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("MESSAGE")}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "MESSAGE"
                  ? "bg-white text-slate-950 font-bold shadow-xs border border-slate-300"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>New Ticket</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("TRACK")}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "TRACK"
                  ? "bg-white text-slate-950 font-bold shadow-xs border border-slate-300"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-700" />
              <span>Track & Reply</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[440px] text-xs bg-slate-50/30">
            {activeTab === "FAQS" && (
              <div className="space-y-3">
                <div className="text-[10px] font-mono font-bold tracking-[0.16em] text-slate-500 uppercase px-1">
                  Frequently Asked Questions
                </div>

                <div className="space-y-2">
                  {QUICK_FAQS.map((faq, index) => {
                    const isExpanded = expandedFaq === index;
                    return (
                      <div
                        key={index}
                        className="border border-slate-200 bg-white rounded-xl overflow-hidden hover:border-slate-300 shadow-2xs transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isExpanded ? null : index)}
                          className="w-full p-3 text-left font-medium text-slate-900 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                        >
                          <span className="text-[13px] leading-snug font-semibold text-slate-900">
                            {faq.q}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                              isExpanded ? "rotate-90 text-amber-600" : ""
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="p-3.5 pt-0 border-t border-slate-100 bg-slate-50/60 text-slate-700 text-xs leading-relaxed space-y-2">
                            <p>{faq.a}</p>
                            {faq.link && (
                              <Link
                                href={faq.link}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:underline pt-1"
                              >
                                {faq.linkText || "Learn more"} &rarr;
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1.5">
                  <Link
                    href="/help"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all border border-slate-800"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Visit Full Knowledge Base</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "MESSAGE" && (
              <div>
                {submittedTicket ? (
                  <div className="py-6 text-center space-y-3 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-slate-900">
                      Inquiry Dispatched!
                    </h3>
                    <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 font-mono text-xs font-bold text-slate-900">
                      Ticket #{submittedTicket}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed max-w-[280px] mx-auto">
                      A confirmation email has been dispatched. You can track replies right in this widget or reply via email.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("TRACK");
                          handleTrackTicket();
                        }}
                        className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
                      >
                        View Ticket & Replies Online &rarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmittedTicket(null)}
                        className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    {error && (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px]">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Elena Vance"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="elena@example.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white cursor-pointer font-medium"
                      >
                        <option value="ORDER_ACCESS">Order & Library Access</option>
                        <option value="EXAM_PREP">Exam Prep & Errata</option>
                        <option value="EDITORIAL">Author Submission</option>
                        <option value="TECHNICAL">Technical / Account</option>
                        <option value="GENERAL">General Question</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Your Message *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can our support team help you today?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors resize-none bg-white leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-amber-400" />
                          <span>Send to Support Desk</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeTab === "TRACK" && (
              <div className="space-y-3">
                {!trackedTicket ? (
                  <form onSubmit={handleTrackTicket} className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[11px] text-slate-600 leading-relaxed">
                      Enter your Ticket Reference Number and email to see live responses and continue the conversation.
                    </div>

                    {trackError && (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px]">
                        {trackError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Ticket Reference *
                      </label>
                      <input
                        type="text"
                        required
                        value={trackRef}
                        onChange={(e) => setTrackRef(e.target.value)}
                        placeholder="e.g. NOV-2026-X9Y2"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={trackEmail}
                        onChange={(e) => setTrackEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={trackLoading}
                      className="w-full py-2.5 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {trackLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Looking up Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5 text-amber-400" />
                          <span>View Ticket & Replies</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {/* Ticket Header Card */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {trackedTicket.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            trackedTicket.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : trackedTicket.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {trackedTicket.status}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-slate-900">
                        {trackedTicket.subject}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Category: {trackedTicket.category}</span>
                        <button
                          type="button"
                          onClick={() => setTrackedTicket(null)}
                          className="text-amber-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Change Ticket
                        </button>
                      </div>
                    </div>

                    {/* Conversation Messages */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {/* Customer Inquiry */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span>Your Initial Inquiry</span>
                          <span>{new Date(trackedTicket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap">
                          {trackedTicket.message}
                        </div>
                      </div>

                      {/* Replies */}
                      {trackedTicket.messages && trackedTicket.messages.length > 0 ? (
                        trackedTicket.messages.map((m) => {
                          const isAdmin = m.senderType === "ADMIN";
                          return (
                            <div
                              key={m.id}
                              className={`p-3 rounded-xl text-xs space-y-1 border ${
                                isAdmin
                                  ? "bg-slate-900 text-white border-slate-800 shadow-xs"
                                  : "bg-blue-50 text-slate-900 border-blue-200"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span
                                  className={`font-bold ${
                                    isAdmin ? "text-amber-400" : "text-blue-800"
                                  }`}
                                >
                                  {isAdmin ? "★ Noveraile Support" : "You (Follow-up)"}
                                </span>
                                <span className={isAdmin ? "text-slate-400" : "text-slate-500"}>
                                  {new Date(m.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div
                                className={`text-[11px] leading-relaxed whitespace-pre-wrap ${
                                  isAdmin ? "text-slate-200" : "text-slate-800"
                                }`}
                              >
                                {m.message}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-[11px] text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                          No replies yet. Our specialists are reviewing your inquiry.
                        </div>
                      )}
                    </div>

                    {/* Follow-up Reply Input */}
                    <form onSubmit={handleCustomerReply} className="space-y-2 pt-2 border-t border-slate-200">
                      {replySuccess && (
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] flex items-center gap-1.5 border border-emerald-300 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Follow-up sent to our desk!
                        </div>
                      )}

                      <textarea
                        rows={2}
                        required
                        value={customerReply}
                        onChange={(e) => setCustomerReply(e.target.value)}
                        placeholder="Add a follow-up reply or question..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none bg-white"
                      />

                      <button
                        type="submit"
                        disabled={replyLoading || !customerReply.trim()}
                        className="w-full py-2 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {replyLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Sending Follow-up...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 text-amber-400" />
                            <span>Send Follow-up Message</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Razor-Sharp Footer Strip */}
          <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 px-4 font-medium">
            <span>Direct: noverailepublishing@gmail.com</span>
            <span className="font-mono text-slate-500 text-[10px]">24h SLA</span>
          </div>
        </div>
      )}
    </div>
  );
}
