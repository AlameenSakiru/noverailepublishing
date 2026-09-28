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
    a: "Immediately after checkout, your books are added to 'My Library'. You can open the cloud reader on any desktop, tablet, or phone without installing separate software.",
    link: "/my-library",
    linkText: "Open My Library",
  },
  {
    q: "Can I highlight and add bookmarks in the reader?",
    a: "Yes. The Noveraile Cloud Reader automatically syncs your progress, bookmarks, and font preferences across all your devices in real-time.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major debit & credit cards (Visa, Mastercard, Verve) via Paystack with bank-grade 256-bit SSL encryption.",
  },
  {
    q: "How do I submit a manuscript for publishing?",
    a: "We welcome exam preparation authors and professional writers. Choose 'Author Submission' under New Ticket to connect directly with our editorial board.",
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
          subject: `Concierge Inquiry: ${category}`,
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
      setTrackError("Please provide your ticket reference and email.");
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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 print:hidden font-sans">
      {/* Modern Razor-Sharp Floating Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center gap-2.5 h-11 w-11 sm:h-11 sm:w-auto sm:px-4 rounded-full bg-[#0b101b]/95 hover:bg-[#060a12] text-white border border-slate-700/80 hover:border-amber-400/80 shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Open Customer Concierge Desk"
        >
          {/* Beacon Dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>

          <Headphones className="w-4 h-4 text-amber-400 shrink-0 transition-transform group-hover:-translate-y-0.5" />

          {/* Desktop-only label for sleek responsiveness */}
          <span className="hidden sm:inline text-xs font-semibold tracking-wide text-slate-100">
            Support Desk
          </span>
        </button>
      )}

      {/* Modern Obsidian Concierge Drawer */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[410px] max-h-[85vh] sm:max-h-[620px] bg-[#0b101b] text-slate-100 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.65)] border border-slate-800 ring-1 ring-white/10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Executive Header */}
          <div className="bg-[#070b13] p-4 px-5 flex items-center justify-between border-b border-amber-500/25 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                <span className="font-serif font-black text-base text-amber-400 leading-none">
                  N
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm tracking-tight text-white">
                    Noveraile Concierge
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/40 tracking-wider">
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
              className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close concierge desk"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Dark Navigation Control */}
          <div className="grid grid-cols-3 p-1.5 bg-[#070b13] border-b border-slate-800 text-xs gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("FAQS")}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "FAQS"
                  ? "bg-slate-800 text-white font-bold shadow-xs border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Answers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("MESSAGE")}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "MESSAGE"
                  ? "bg-slate-800 text-white font-bold shadow-xs border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>New Ticket</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("TRACK")}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "TRACK"
                  ? "bg-slate-800 text-white font-bold shadow-xs border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>Track & Reply</span>
            </button>
          </div>

          {/* Body Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-[#0b101b]">
            {/* Tab 1: Instant Answers */}
            {activeTab === "FAQS" && (
              <div className="space-y-3">
                <div className="text-[10px] font-mono font-bold tracking-[0.16em] text-slate-400 uppercase px-1">
                  Common Reader Questions
                </div>

                <div className="space-y-2">
                  {QUICK_FAQS.map((faq, index) => {
                    const isExpanded = expandedFaq === index;
                    return (
                      <div
                        key={index}
                        className="border border-slate-800 bg-[#101625] rounded-xl overflow-hidden hover:border-slate-700 transition-all shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isExpanded ? null : index)}
                          className="w-full p-3.5 text-left font-medium text-slate-100 flex items-center justify-between gap-3 hover:bg-slate-800/50 transition-colors"
                        >
                          <span className="text-[13px] leading-snug font-semibold text-slate-100">
                            {faq.q}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                              isExpanded ? "rotate-90 text-amber-400" : ""
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="p-3.5 pt-0 border-t border-slate-800/80 bg-[#070b13]/80 text-slate-300 text-xs leading-relaxed space-y-2">
                            <p>{faq.a}</p>
                            {faq.link && (
                              <Link
                                href={faq.link}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:underline pt-1"
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

                <div className="pt-2">
                  <Link
                    href="/help"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Explore Full Knowledge Base</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-950/70 ml-0.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Tab 2: New Ticket Form */}
            {activeTab === "MESSAGE" && (
              <div>
                {submittedTicket ? (
                  <div className="py-6 text-center space-y-3 bg-[#101625] p-5 rounded-xl border border-slate-800 shadow-2xs">
                    <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-white">
                      Inquiry Dispatched!
                    </h3>
                    <div className="p-2.5 rounded-lg bg-[#070b13] border border-slate-700 font-mono text-xs font-bold text-amber-400">
                      Ticket #{submittedTicket}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                      A confirmation email has been dispatched. You can track replies directly in this window or reply via email.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("TRACK");
                          handleTrackTicket();
                        }}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        View Ticket & Replies Online &rarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmittedTicket(null)}
                        className="w-full py-2 text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-3 bg-[#101625] p-4 rounded-xl border border-slate-800 shadow-2xs">
                    {error && (
                      <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 text-[11px]">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Elena Vance"
                        className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors bg-[#070b13] text-white placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="elena@example.com"
                        className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors bg-[#070b13] text-white placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors bg-[#070b13] text-white cursor-pointer font-medium"
                      >
                        <option value="ORDER_ACCESS">Order & Library Access</option>
                        <option value="EXAM_PREP">Exam Prep & Errata</option>
                        <option value="EDITORIAL">Author Submission</option>
                        <option value="TECHNICAL">Technical / Account</option>
                        <option value="GENERAL">General Question</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        Message *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can our editorial & support desk assist you?"
                        className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors resize-none bg-[#070b13] text-white placeholder-slate-500 leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                          <span>Dispatching Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-slate-950" />
                          <span>Dispatch to Support Desk</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tab 3: Track & Reply */}
            {activeTab === "TRACK" && (
              <div className="space-y-3">
                {!trackedTicket ? (
                  <form onSubmit={handleTrackTicket} className="space-y-3 bg-[#101625] p-4 rounded-xl border border-slate-800 shadow-2xs">
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      Enter your Ticket Reference Number and email to review responses and continue the conversation.
                    </div>

                    {trackError && (
                      <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 text-[11px]">
                        {trackError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        Ticket Reference *
                      </label>
                      <input
                        type="text"
                        required
                        value={trackRef}
                        onChange={(e) => setTrackRef(e.target.value)}
                        placeholder="e.g. NOV-2026-X9Y2"
                        className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs font-mono uppercase outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors bg-[#070b13] text-white placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={trackEmail}
                        onChange={(e) => setTrackEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors bg-[#070b13] text-white placeholder-slate-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={trackLoading}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {trackLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                          <span>Looking up Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5 text-slate-950" />
                          <span>Track Ticket & Replies</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {/* Ticket Header Card */}
                    <div className="p-3.5 bg-[#101625] rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-[#070b13] px-2 py-0.5 rounded border border-slate-700">
                          {trackedTicket.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            trackedTicket.status === "RESOLVED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                              : trackedTicket.status === "IN_PROGRESS"
                              ? "bg-blue-950 text-blue-400 border border-blue-500/40"
                              : "bg-amber-950 text-amber-400 border border-amber-500/40"
                          }`}
                        >
                          {trackedTicket.status}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-white">
                        {trackedTicket.subject}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        <span>Category: {trackedTicket.category}</span>
                        <button
                          type="button"
                          onClick={() => setTrackedTicket(null)}
                          className="text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Change Ticket
                        </button>
                      </div>
                    </div>

                    {/* Messages Timeline */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {/* Customer Inquiry */}
                      <div className="p-3 rounded-xl bg-[#070b13] border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <span>Your Initial Inquiry</span>
                          <span>{new Date(trackedTicket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-slate-200 text-[11px] leading-relaxed whitespace-pre-wrap">
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
                                  ? "bg-slate-800/90 text-white border-slate-700 shadow-xs"
                                  : "bg-blue-950/40 text-blue-200 border-blue-900/60"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span
                                  className={`font-bold ${
                                    isAdmin ? "text-amber-400" : "text-blue-400"
                                  }`}
                                >
                                  {isAdmin ? "★ Noveraile Support" : "You (Follow-up)"}
                                </span>
                                <span className="text-slate-400">
                                  {new Date(m.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-[11px] leading-relaxed whitespace-pre-wrap text-slate-200">
                                {m.message}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-[11px] text-slate-500 bg-[#070b13] rounded-xl border border-dashed border-slate-800">
                          No replies yet. Our specialists are reviewing your inquiry.
                        </div>
                      )}
                    </div>

                    {/* Follow-up Reply Input */}
                    <form onSubmit={handleCustomerReply} className="space-y-2 pt-2 border-t border-slate-800">
                      {replySuccess && (
                        <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 text-[11px] flex items-center gap-1.5 border border-emerald-500/40 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Follow-up sent to our desk!
                        </div>
                      )}

                      <textarea
                        rows={2}
                        required
                        value={customerReply}
                        onChange={(e) => setCustomerReply(e.target.value)}
                        placeholder="Add a follow-up reply or question..."
                        className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none bg-[#070b13] text-white placeholder-slate-500"
                      />

                      <button
                        type="submit"
                        disabled={replyLoading || !customerReply.trim()}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {replyLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-slate-950" />
                            <span>Sending Follow-up...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 text-slate-950" />
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
          <div className="p-3 bg-[#070b13] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-4 font-medium shrink-0">
            <span>Direct: noverailepublishing@gmail.com</span>
            <span className="font-mono text-amber-400 text-[10px]">24h SLA</span>
          </div>
        </div>
      )}
    </div>
  );
}
