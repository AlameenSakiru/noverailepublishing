"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Shield, Check, X } from "lucide-react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("noveraile_cookie_consent");
      if (!consent) {
        // Show banner after brief delay for smooth appearance
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      } else if (consent === "all") {
        // Apply granted consent to Google Analytics if present
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("consent", "update", {
            analytics_storage: "granted",
          });
        }
      }
    } catch {
      // In case localStorage is blocked or throws
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem("noveraile_cookie_consent", "all");
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "granted",
        });
      }
    } catch {}
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem("noveraile_cookie_consent", "essential");
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "denied",
        });
      }
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-brand-border shadow-2xl text-brand-slate text-xs sm:text-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-amber-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-brand-ink">
                Your Privacy & Cookie Choices
              </h3>
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close and keep essential cookies only"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-1.5 text-xs text-brand-slate leading-relaxed font-light">
              We use strictly essential cookies for secure login, reading position sync, and checkout. With your consent, we also use privacy-first analytics to improve publication readability. We never sell your personal data.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 rounded-xl bg-brand-ink text-white font-semibold text-xs hover:bg-brand-900 transition-colors shadow-xs"
              >
                Accept All
              </button>

              <button
                type="button"
                onClick={handleEssentialOnly}
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-slate font-medium text-xs transition-colors"
              >
                Essential Only
              </button>

              <Link
                href="/cookies"
                className="text-xs text-brand-muted hover:text-brand-ink underline ml-auto py-1"
              >
                Cookie Disclosures
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
