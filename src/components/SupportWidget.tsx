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
  FileText,
  BookOpen,
  ShieldCheck,
  ExternalLink,
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

export function SupportWidget() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"FAQS" | "MESSAGE">("FAQS");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Message Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("ORDER_ACCESS");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill user if authenticated
  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.email && !email) setEmail(user.email);
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
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-[#0f172a] hover:bg-slate-900 text-white rounded-full shadow-xl hover:shadow-2xl border border-slate-700/80 transition-all transform hover:scale-105 cursor-pointer"
          aria-label="Open Customer Support Assistant"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Headphones className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-12" />
          <span className="text-xs font-semibold tracking-wide">Support Desk</span>
        </button>
      )}

      {/* Support Popover Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] max-h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#0f172a] text-white p-4.5 px-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm tracking-wide text-white">
                    Noveraile Support
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reader assistance & editorial desk
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close support drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader Navigation Tabs */}
          <div className="flex items-center border-b border-gray-100 bg-slate-50/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("FAQS")}
              className={`flex-1 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "FAQS"
                  ? "bg-white text-slate-900 shadow-xs border border-gray-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Instant Answers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MESSAGE")}
              className={`flex-1 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "MESSAGE"
                  ? "bg-white text-slate-900 shadow-xs border border-gray-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Submit Ticket</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4.5 space-y-4 max-h-[420px] text-xs">
            {activeTab === "FAQS" ? (
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Frequently Asked Questions
                </div>

                <div className="space-y-2">
                  {QUICK_FAQS.map((faq, index) => {
                    const isExpanded = expandedFaq === index;
                    return (
                      <div
                        key={index}
                        className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all bg-white shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isExpanded ? null : index)}
                          className="w-full p-3 text-left font-medium text-slate-800 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors"
                        >
                          <span className="text-xs leading-snug">{faq.q}</span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                              isExpanded ? "rotate-90 text-amber-600" : ""
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="p-3 pt-0 border-t border-slate-100 bg-slate-50/50 text-slate-600 text-xs leading-relaxed space-y-2 animate-in fade-in duration-150">
                            <p>{faq.a}</p>
                            {faq.link && (
                              <Link
                                href={faq.link}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline pt-1"
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
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 hover:bg-amber-50 text-amber-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Visit Full Knowledge Base</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Message Form */
              <div>
                {submittedTicket ? (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-slate-900">
                      Inquiry Dispatched!
                    </h3>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-800">
                      Ticket #{submittedTicket}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                      A confirmation email has been dispatched to your inbox. Our desk responds within 24 business hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    {error && (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px]">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Elena Vance"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-800 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="elena@example.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-800 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-800 transition-colors bg-white"
                      >
                        <option value="ORDER_ACCESS">Order & Library Access</option>
                        <option value="EXAM_PREP">Exam Prep & Errata</option>
                        <option value="EDITORIAL">Author Submission</option>
                        <option value="TECHNICAL">Technical / Account</option>
                        <option value="GENERAL">General Question</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Your Message *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can our support team help you today?"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-800 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-[#0f172a] hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send to Support Desk</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Popover Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-4">
            <span>Direct: noverailepublishing@gmail.com</span>
            <span>24h Response SLA</span>
          </div>
        </div>
      )}
    </div>
  );
}
