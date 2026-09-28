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
  Search,
  ExternalLink,
  RotateCcw,
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
    a: "Immediately after checkout, your books are added to 'My Library'. You can open the reader from any browser on your computer, tablet, or phone.",
    link: "/my-library",
    linkText: "Go to My Library",
  },
  {
    q: "Can I highlight and add bookmarks in the reader?",
    a: "Yes. The Noveraile Cloud Reader automatically saves your reading progress, notes, and bookmarks across all your devices.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Visa, Mastercard, and Verve cards via Paystack with bank-grade 256-bit SSL encryption.",
  },
  {
    q: "How do I submit a manuscript for publishing?",
    a: "We welcome exam preparation authors and professional writers. Use our contact form to submit your book proposal directly to our editorial team.",
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

  // New Ticket Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("ORDER_ACCESS");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track Ticket Form
  const [trackRef, setTrackRef] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackedTicket, setTrackedTicket] = useState<TrackedTicket | null>(null);

  // Follow-up reply
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
          subject: `Support Inquiry: ${category}`,
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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 print:hidden font-sans">
      {/* Floating Button matching website theme */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 h-11 px-3.5 sm:px-4 rounded-full bg-white hover:bg-brand-50 text-brand-ink border border-brand-border shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Open Reader Support"
        >
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <MessageSquare className="w-4 h-4 text-brand-ink" />
          <span className="text-xs font-semibold text-brand-ink tracking-tight">
            Support
          </span>
        </button>
      )}

      {/* Support Popover Drawer matching website style */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[390px] max-h-[85vh] sm:max-h-[600px] bg-white rounded-2xl border border-brand-border shadow-2xl flex flex-col overflow-hidden text-brand-ink animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 px-5 border-b border-brand-border/70 flex items-center justify-between bg-brand-50/60">
            <div>
              <h2 className="font-serif text-base font-bold text-brand-ink">
                Reader Support
              </h2>
              <p className="text-[11px] text-brand-muted mt-0.5">
                Editorial desk & order inquiries
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-100/70 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close support dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Underline Tabs */}
          <div className="flex items-center px-4 border-b border-brand-border/70 bg-white text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("FAQS")}
              className={`py-3 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "FAQS"
                  ? "border-brand-ink text-brand-ink font-bold"
                  : "border-transparent text-brand-muted hover:text-brand-ink"
              }`}
            >
              FAQs
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("MESSAGE")}
              className={`py-3 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "MESSAGE"
                  ? "border-brand-ink text-brand-ink font-bold"
                  : "border-transparent text-brand-muted hover:text-brand-ink"
              }`}
            >
              Send Message
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("TRACK")}
              className={`py-3 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "TRACK"
                  ? "border-brand-ink text-brand-ink font-bold"
                  : "border-transparent text-brand-muted hover:text-brand-ink"
              }`}
            >
              Track Ticket
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-brand-50/30">
            {/* Tab 1: FAQs */}
            {activeTab === "FAQS" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {QUICK_FAQS.map((faq, index) => {
                    const isExpanded = expandedFaq === index;
                    return (
                      <div
                        key={index}
                        className="bg-white border border-brand-border/80 rounded-xl overflow-hidden shadow-2xs transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isExpanded ? null : index)}
                          className="w-full p-3.5 text-left font-medium text-brand-ink flex items-center justify-between gap-3 hover:bg-brand-50/50 transition-colors"
                        >
                          <span className="text-xs font-semibold text-brand-ink leading-snug">
                            {faq.q}
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-brand-muted shrink-0 transition-transform ${
                              isExpanded ? "rotate-90 text-brand-ink" : ""
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="p-3.5 pt-0 border-t border-brand-border/50 text-brand-slate text-xs leading-relaxed space-y-2 bg-brand-50/20">
                            <p>{faq.a}</p>
                            {faq.link && (
                              <Link
                                href={faq.link}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-500 hover:text-brand-700 pt-1"
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
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-brand-50 text-brand-ink font-semibold text-xs border border-brand-border flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Visit Full Help Center</span>
                    <ExternalLink className="w-3 h-3 text-brand-muted" />
                  </Link>
                </div>
              </div>
            )}

            {/* Tab 2: Send Message Form */}
            {activeTab === "MESSAGE" && (
              <div>
                {submittedTicket ? (
                  <div className="py-6 text-center space-y-3 bg-white p-5 rounded-xl border border-brand-border shadow-2xs">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-brand-ink">
                      Inquiry Received
                    </h3>
                    <div className="p-2 rounded-lg bg-brand-50 border border-brand-border font-mono text-xs font-bold text-brand-ink">
                      Ticket #{submittedTicket}
                    </div>
                    <p className="text-xs text-brand-slate leading-relaxed">
                      We sent a confirmation to your email. Our team will respond within 24 business hours.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("TRACK");
                          handleTrackTicket();
                        }}
                        className="w-full py-2 bg-brand-ink text-white font-semibold text-xs rounded-xl hover:bg-brand-900 transition-colors"
                      >
                        Track Ticket Here &rarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmittedTicket(null)}
                        className="w-full py-2 text-xs font-semibold text-brand-slate bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors cursor-pointer border border-brand-border"
                      >
                        Send Another Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-3 bg-white p-4 rounded-xl border border-brand-border shadow-2xs">
                    {error && (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Elena Vance"
                        className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="elena@example.com"
                        className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Inquiry Topic *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink transition-colors bg-white cursor-pointer"
                      >
                        <option value="ORDER_ACCESS">Order & Library Access</option>
                        <option value="EXAM_PREP">Exam Prep & Errata</option>
                        <option value="EDITORIAL">Author Submission</option>
                        <option value="TECHNICAL">Technical / Account</option>
                        <option value="GENERAL">General Question</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can our support team help you?"
                        className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink transition-colors resize-none bg-white leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-brand-ink hover:bg-brand-900 disabled:bg-gray-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending message...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tab 3: Track Ticket */}
            {activeTab === "TRACK" && (
              <div className="space-y-3">
                {!trackedTicket ? (
                  <form onSubmit={handleTrackTicket} className="space-y-3 bg-white p-4 rounded-xl border border-brand-border shadow-2xs">
                    <p className="text-xs text-brand-slate leading-relaxed">
                      Enter your Ticket Reference Number and email to review replies from our support desk.
                    </p>

                    {trackError && (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                        {trackError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Ticket Reference *
                      </label>
                      <input
                        type="text"
                        required
                        value={trackRef}
                        onChange={(e) => setTrackRef(e.target.value)}
                        placeholder="e.g. NOV-2026-X9Y2"
                        className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs font-mono uppercase outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={trackEmail}
                        onChange={(e) => setTrackEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink transition-colors bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={trackLoading}
                      className="w-full py-2.5 bg-brand-ink hover:bg-brand-900 disabled:bg-gray-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {trackLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Find Ticket</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {/* Ticket Header Card */}
                    <div className="p-3.5 bg-white rounded-xl border border-brand-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-brand-ink bg-brand-50 px-2 py-0.5 rounded border border-brand-border">
                          {trackedTicket.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            trackedTicket.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : trackedTicket.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {trackedTicket.status}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-brand-ink">
                        {trackedTicket.subject}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-brand-muted pt-1 border-t border-gray-100">
                        <span>Category: {trackedTicket.category}</span>
                        <button
                          type="button"
                          onClick={() => setTrackedTicket(null)}
                          className="text-brand-500 hover:text-brand-700 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Change Ticket
                        </button>
                      </div>
                    </div>

                    {/* Messages Timeline */}
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {/* Initial Inquiry */}
                      <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-border text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-brand-muted font-semibold">
                          <span>Your Inquiry</span>
                          <span>{new Date(trackedTicket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-brand-slate text-xs leading-relaxed whitespace-pre-wrap">
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
                                  ? "bg-brand-ink text-white border-brand-ink shadow-2xs"
                                  : "bg-blue-50 text-brand-ink border-blue-200"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className={`font-bold ${isAdmin ? "text-amber-400" : "text-blue-800"}`}>
                                  {isAdmin ? "Noveraile Support" : "You"}
                                </span>
                                <span className={isAdmin ? "text-slate-400" : "text-gray-500"}>
                                  {new Date(m.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className={`text-xs leading-relaxed whitespace-pre-wrap ${isAdmin ? "text-slate-200" : "text-brand-ink"}`}>
                                {m.message}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-brand-muted bg-white rounded-xl border border-dashed border-brand-border">
                          No replies yet. Our team is reviewing your message.
                        </div>
                      )}
                    </div>

                    {/* Follow-up Reply Form */}
                    <form onSubmit={handleCustomerReply} className="space-y-2 pt-2 border-t border-brand-border">
                      {replySuccess && (
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5 border border-emerald-200 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Reply sent to our desk!
                        </div>
                      )}

                      <textarea
                        rows={2}
                        required
                        value={customerReply}
                        onChange={(e) => setCustomerReply(e.target.value)}
                        placeholder="Add a follow-up reply..."
                        className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink resize-none bg-white"
                      />

                      <button
                        type="submit"
                        disabled={replyLoading || !customerReply.trim()}
                        className="w-full py-2 bg-brand-ink hover:bg-brand-900 disabled:bg-gray-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {replyLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Send Reply</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-brand-50/70 border-t border-brand-border/70 flex items-center justify-between text-[11px] text-brand-muted px-4 font-medium">
            <span>Direct: noverailepublishing@gmail.com</span>
            <span>24h Response SLA</span>
          </div>
        </div>
      )}
    </div>
  );
}
