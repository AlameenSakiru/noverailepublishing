import React from "react";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service and digital reading access license agreement for Noveraile Publishing.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8">
      <div className="pb-6 border-b border-brand-border">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
          Terms of Service
        </h1>
        <p className="text-xs text-brand-muted mt-2">Last updated: January 2026</p>
      </div>

      <div className="prose max-w-none font-serif text-brand-slate text-base leading-relaxed space-y-6">
        <h2 className="text-xl font-bold text-brand-ink">1. Agreement to Terms</h2>
        <p>
          By accessing or purchasing digital publications from {siteConfig.name} ({siteConfig.domain}), you agree to be bound by these Terms of Service, all applicable laws, and regulations.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">2. License Grant & Restrictions</h2>
        <p>
          Upon verified payment, {siteConfig.name} grants you a non-exclusive, non-transferable, revocable personal license to view the purchased digital publication through our protected online cloud reader.
        </p>
        <p>
          You agree NOT to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Extract, mass-scrape, reverse-engineer, or attempt to circumvent digital rights controls.</li>
          <li>Redistribute, sublicense, resell, or publicly display full book contents.</li>
          <li>Share reader account credentials for concurrent multi-party commercial utilization.</li>
        </ul>

        <h2 className="text-xl font-bold text-brand-ink">3. Intellectual Property</h2>
        <p>
          All textual materials, formulas, question banks, cover artwork, and digital reader software remain the exclusive intellectual property of {siteConfig.name} and its contributing authors.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">4. Independent Publisher Disclaimers</h2>
        <p>
          {siteConfig.disclaimer.examPrep}
        </p>
      </div>
    </div>
  );
}
