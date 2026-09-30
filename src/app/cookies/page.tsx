import React from "react";
import Link from "next/link";
import { Cookie, Shield, CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn how Noveraile Publishing uses cookies and local storage to provide secure, authenticated, in-browser digital reading.",
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-brand-slate hover:text-brand-ink transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Home</span>
      </Link>

      <div className="border-b border-brand-border pb-8 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-4">
          <Cookie className="w-4 h-4 text-amber-600" />
          <span>Privacy & Disclosures</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-brand-ink">
          Cookie Policy
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-2">
          Effective Date: September 2026 • Last Reviewed: September 30, 2026
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-brand-slate text-sm sm:text-base leading-relaxed space-y-8 font-light">
        <section className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80">
          <h2 className="font-serif text-lg font-bold text-brand-ink mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-700" />
            Our Core Privacy Principle: Zero Data Brokering
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate leading-relaxed">
            Noveraile Publishing does not sell your personal data, participate in cross-site behavioral tracking networks, or use third-party advertising cookies. We only use cookies and browser storage strictly necessary to authenticate your reading sessions, safeguard your transactions, and remember your reading preferences.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-ink mb-3">
            1. What Are Cookies & Local Storage?
          </h2>
          <p>
            Cookies are small text files placed on your device by websites you visit. Browser Local Storage is a modern web standard that allows web applications to store client-side state directly on your device. Both technologies enable our web-based reading engine to recognize your session and preserve your bookmarks without requiring desktop or mobile app installations.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-ink mb-3">
            2. Categories of Cookies We Use
          </h2>
          
          <div className="space-y-4 mt-4">
            <div className="p-5 rounded-2xl bg-white border border-brand-border">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-serif font-bold text-base text-brand-ink">
                  A. Strictly Essential Cookies (Required)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Always Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                These cookies are necessary for the website to function securely and cannot be disabled. They maintain your authenticated reader state, protect checkout transactions against CSRF forgery, and enforce digital license validation.
              </p>
              <div className="mt-3 overflow-x-auto text-xs font-mono bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-brand-ink font-bold mb-1">• noveraile_session:</div>
                <div className="text-gray-500 pl-4 mb-2">Encrypted HTTP-only token verifying your active reader profile. Duration: 30 days.</div>
                <div className="text-brand-ink font-bold mb-1">• noveraile_cart:</div>
                <div className="text-gray-500 pl-4 mb-2">Local storage keeping selected editions during checkout. Duration: Session.</div>
                <div className="text-brand-ink font-bold mb-1">• noveraile_cookie_consent:</div>
                <div className="text-gray-500 pl-4">Stores your cookie preference selection. Duration: 1 year.</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-brand-border">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-serif font-bold text-base text-brand-ink">
                  B. Cloud Reader Functional Storage
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                  Functional
                </span>
              </div>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                Used directly within the in-browser canvas reader to retain your reading progress, active chapter, saved bookmarks, reader font sizing, and day/night/sepia reading themes across sessions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-brand-border">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-serif font-bold text-base text-brand-ink">
                  C. Anonymous Performance & Diagnostics (Optional)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                  Consent-Based
                </span>
              </div>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                With your consent, we utilize privacy-focused Google Analytics 4 with IP anonymization enabled. This allows us to measure aggregate page engagement, identify broken links, and optimize reader performance across mobile and desktop devices. No personally identifiable credentials or financial details are ever shared.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-ink mb-3">
            3. Managing Your Cookie Preferences
          </h2>
          <p>
            When you first visit Noveraile Publishing, you are presented with our Cookie Consent Banner allowing you to accept all cookies or restrict to strictly essential cookies. You may also modify your preferences at any time by clearing your browser cache or configuring your browser to block third-party cookies.
          </p>
          <p className="mt-3">
            Please note that disabling strictly essential cookies will prevent logging into your cloud library, reading purchased digital editions, or completing checkout.
          </p>
        </section>

        <section className="pt-6 border-t border-brand-border">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-ink mb-3">
            4. Contact & Inquiries
          </h2>
          <p>
            If you have questions regarding our cookie practices or data privacy standards, our editorial support desk is available at{" "}
            <a href="mailto:privacy@noveraile.com" className="font-semibold text-brand-ink underline">
              privacy@noveraile.com
            </a>{" "}
            or via our{" "}
            <Link href="/contact" className="font-semibold text-brand-ink underline">
              Support Desk
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
