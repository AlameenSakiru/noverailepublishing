"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  CheckCircle2,
  MessageSquare,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  FileQuestion,
  GraduationCap,
  Building2,
  ShieldAlert,
} from "lucide-react";

const CATEGORIES = [
  {
    id: "ORDER_ACCESS",
    label: "Order & Cloud Library Access",
    desc: "Assistance with book entitlements, checkout issues, or offline reading",
    icon: BookOpen,
  },
  {
    id: "EXAM_PREP",
    label: "Exam Prep Content & Errata",
    desc: "Inquiries regarding PTCB, NCLEX, practice questions, or content corrections",
    icon: GraduationCap,
  },
  {
    id: "EDITORIAL",
    label: "Author Submission / Manuscript",
    desc: "Proposals for new publications, editorial review, and author partnerships",
    icon: Sparkles,
  },
  {
    id: "LICENSING",
    label: "Institutional & Academic Licensing",
    desc: "Multi-seat university access, nursing school licenses, and bulk adoptions",
    icon: Building2,
  },
  {
    id: "TECHNICAL",
    label: "Technical & Account Security",
    desc: "Password reset issues, device authorization, and 2-step verification",
    icon: ShieldAlert,
  },
  {
    id: "GENERAL",
    label: "General Reader Inquiry",
    desc: "All other publishing, feedback, and customer desk questions",
    icon: HelpCircle,
  },
];

export default function ContactPage() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("ORDER_ACCESS");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<{
    ticketNumber: string;
    email: string;
  } | null>(null);

  // Auto-populate user info when logged in
  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
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
          subject,
          message,
          source: "CONTACT_PAGE",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry. Please try again.");
      }

      setTicketResult({
        ticketNumber: data.ticketNumber,
        email: email.trim(),
      });
      setMessage("");
      setSubject("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTicketResult(null);
    setError(null);
    setSubject("");
    setMessage("");
  };

  return (
    <div className="bg-[#fbfaf8] min-h-screen py-12 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Noveraile Customer Desk & Editorial Office
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-ink tracking-tight">
            How Can We Assist You?
          </h1>
          <p className="text-sm sm:text-base text-brand-slate mt-4 font-light leading-relaxed">
            Have questions about an order, cloud library access, exam prep materials, or publishing a manuscript? Our dedicated support and editorial desk is here to help.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-brand-border/80 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-brand-ink uppercase tracking-wider">Direct Email</h2>
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-xs text-brand-slate hover:text-brand-ink transition-colors mt-0.5 block font-medium"
              >
                {siteConfig.contactEmail}
              </a>
              <span className="text-[11px] text-gray-400 mt-0.5 block">24-hour response SLA</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border/80 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-brand-ink uppercase tracking-wider">Desk Hours</h2>
              <span className="text-xs text-brand-slate mt-0.5 block font-medium">Mon – Sat: 8:00 AM – 8:00 PM EST</span>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Sunday: Priority order support</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border/80 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-brand-ink uppercase tracking-wider">Instant Answers</h2>
              <Link
                href="/help"
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 mt-0.5"
              >
                Browse Knowledge Center <ArrowRight className="w-3 h-3" />
              </Link>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Reader guides & FAQ answers</span>
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white rounded-3xl border border-brand-border/90 shadow-sm p-6 sm:p-10 md:p-12">
          {ticketResult ? (
            /* Success confirmation screen */
            <div className="text-center py-8 space-y-6 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block mb-1">
                  Ticket Successfully Registered
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
                  We Have Received Your Request
                </h3>
              </div>

              <div className="bg-brand-50/70 border border-brand-border/80 rounded-2xl p-5 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                  <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                    Ticket Reference
                  </span>
                  <span className="font-mono text-sm font-bold text-brand-ink bg-white px-2.5 py-1 rounded-md border border-brand-border shadow-2xs">
                    {ticketResult.ticketNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-brand-slate">
                  <span>Confirmation Dispatched To:</span>
                  <span className="font-medium text-brand-ink">{ticketResult.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-brand-slate">
                  <span>Guaranteed Response:</span>
                  <span className="font-medium text-emerald-700">Within 24 business hours</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-brand-slate leading-relaxed">
                An automated confirmation email containing your ticket number and an exact summary of your inquiry has been sent to your email address. If you need to attach screenshots or additional information, simply reply directly to that email.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-brand-border hover:bg-gray-50 text-xs font-semibold text-brand-ink transition-colors"
                >
                  Submit Another Inquiry
                </button>
                <Link
                  href="/my-library"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-xs font-semibold text-white transition-colors"
                >
                  Return to My Library
                </Link>
              </div>
            </div>
          ) : (
            /* Inquiry Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-ink">
                  Submit an Inquiry to Our Support Team
                </h3>
                <p className="text-xs text-brand-slate mt-1">
                  Fields marked with an asterisk (<span className="text-red-500">*</span>) are required.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <span className="font-bold">Unable to submit inquiry:</span> {error}
                  </div>
                </div>
              )}

              {/* Inquiry Category Selector */}
              <div>
                <label className="block text-xs font-bold text-brand-ink uppercase tracking-wider mb-2.5">
                  Select Inquiry Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col gap-1 relative ${
                          isSelected
                            ? "border-brand-ink bg-slate-900 text-white shadow-xs"
                            : "border-brand-border bg-white text-brand-ink hover:border-gray-400 hover:bg-gray-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-amber-400" : "text-brand-slate"
                            }`}
                          />
                          <span className="font-semibold text-xs leading-snug">{cat.label}</span>
                        </div>
                        <span
                          className={`text-[11px] leading-tight mt-0.5 line-clamp-2 ${
                            isSelected ? "text-slate-300" : "text-brand-muted"
                          }`}
                        >
                          {cat.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-xs text-gray-700 mb-1.5">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Arthur Miller"
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs focus:ring-2 focus:ring-brand-ink/20 focus:border-brand-ink transition-all outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-xs text-gray-700 mb-1.5">
                    Email Address for Response <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. arthur.miller@university.edu"
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs focus:ring-2 focus:ring-brand-ink/20 focus:border-brand-ink transition-all outline-none bg-white"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-semibold text-xs text-gray-700 mb-1.5">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Accessing PTCB Exam Prep Flashcards on Tablet"
                  className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs focus:ring-2 focus:ring-brand-ink/20 focus:border-brand-ink transition-all outline-none bg-white"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-xs text-gray-700">
                    Detailed Message <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {message.length} characters (min 10)
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your inquiry, order number (if applicable), book title, or question in detail so our specialists can best serve you..."
                  className="w-full px-3.5 py-3 border border-brand-border rounded-xl text-xs focus:ring-2 focus:ring-brand-ink/20 focus:border-brand-ink transition-all outline-none bg-white leading-relaxed resize-y"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand-ink hover:bg-brand-900 disabled:bg-gray-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging Support Request & Sending Confirmation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Ticket to Support Desk</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Guarantee Footer */}
          <div className="mt-10 pt-6 border-t border-brand-border/70 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-muted gap-2">
            <span>Direct Support Email: {siteConfig.contactEmail}</span>
            <span>Security Guarantee: Encrypted & Private Communication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
