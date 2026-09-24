"use client";

import React, { useState } from "react";
import { siteConfig } from "@/lib/config";
import { Mail, CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-12">
      <div className="text-center pb-8 border-b border-brand-border">
        <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-2">
          Customer Service & Editorial Desk
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-ink">
          Contact Noveraile Publishing
        </h1>
        <p className="text-sm sm:text-base text-brand-slate mt-3 max-w-lg mx-auto font-light">
          Have an inquiry regarding an order, reader access, institutional licensing, or editorial submission?
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-brand-border p-8 md:p-10 shadow-xs">
        {submitted ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-brand-ink">
              Message Received
            </h3>
            <p className="text-xs sm:text-sm text-brand-slate mt-2 max-w-sm mx-auto leading-relaxed">
              Thank you for contacting Noveraile Publishing. Our support desk will respond within 24 business hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Elena Vance"
                  className="w-full px-3 py-2.5 border border-brand-border rounded-xl text-xs focus:ring-1 focus:ring-brand-ink"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="elena@example.com"
                  className="w-full px-3 py-2.5 border border-brand-border rounded-xl text-xs focus:ring-1 focus:ring-brand-ink"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Inquiry Subject *</label>
              <select className="w-full px-3 py-2.5 border border-brand-border rounded-xl text-xs">
                <option>Order or Entitlement Access Inquiry</option>
                <option>Exam Prep Content / Errata Question</option>
                <option>Author Submission or Manuscript Proposal</option>
                <option>Institutional or Academic Licensing</option>
                <option>Other Question</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Your Message *</label>
              <textarea
                rows={5}
                required
                placeholder="Please describe how we can assist you..."
                className="w-full px-3 py-2.5 border border-brand-border rounded-xl text-xs focus:ring-1 focus:ring-brand-ink"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              Send Message to Support Desk
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-muted gap-2">
          <span>Direct Email: {siteConfig.contactEmail}</span>
          <span>Response time: Within 1 business day</span>
        </div>
      </div>
    </div>
  );
}
