"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/config";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Hide on reader page and admin console
  if (pathname?.startsWith("/reader/") || pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Thank you for joining the Noveraile reader community.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Unable to subscribe.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <footer className="bg-brand-ink text-gray-300 font-sans border-t border-brand-800/40">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <span className="text-brand-400 text-xs font-semibold uppercase tracking-widest block mb-2">
                Editorial Dispatch & New Releases
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-white tracking-tight">
                Discover new publications, study resources & reader offers.
              </h3>
              <p className="text-sm text-gray-400 mt-2 font-light max-w-xl">
                Curated quarterly updates on upcoming digital editions, examination blueprints, and independent author releases. Unsubscribe anytime.
              </p>
            </div>

            <div className="lg:col-span-6">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent flex-1"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>{status === "loading" ? "Subscribing..." : "Join Reader List"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {status === "success" && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{message}</span>
                </p>
              )}
              {status === "error" && (
                <p className="text-xs text-rose-400 mt-2">{message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links - Streamlined */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <Link href="/" className="flex flex-col mb-3">
              <span className="font-serif text-2xl font-bold tracking-[0.15em] text-white">
                NOVERAILE
              </span>
              <span className="font-sans text-[10px] tracking-[0.35em] text-brand-400 uppercase -mt-1">
                PUBLISHING
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm font-light">
              Direct-to-reader digital publishing. Authoritative books across professional exam preparation, literature, travel, and business strategy.
            </p>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Catalog
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/books" className="hover:text-white transition-colors">
                  All Books
                </Link>
              </li>
              <li>
                <Link href="/exam-prep" className="hover:text-white transition-colors">
                  Exam Preparation
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/success-stories" className="hover:text-white transition-colors">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Reader Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Reader Support
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/my-library" className="hover:text-white transition-colors">
                  My Library
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center & FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Essential Legal Links */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 border-t border-gray-800/80 pt-6 gap-3">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/refunds" className="hover:text-white transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
