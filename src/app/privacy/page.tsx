import React from "react";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy and data protection policy for Noveraile Publishing.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8">
      <div className="pb-6 border-b border-brand-border">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
          Privacy Policy
        </h1>
        <p className="text-xs text-brand-muted mt-2">Last updated: January 2026</p>
      </div>

      <div className="prose max-w-none font-serif text-brand-slate text-base leading-relaxed space-y-6">
        <h2 className="text-xl font-bold text-brand-ink">1. Information We Collect</h2>
        <p>
          We collect only information essential to managing your reader account and delivering purchased publications: your name, email address, transaction records, and reading progress state.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">2. Payment Security</h2>
        <p>
          All financial transactions are conducted directly through our PCI-DSS Level 1 certified payment processor (Stripe). {siteConfig.name} servers never receive, process, or store raw credit or debit card numbers.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">3. Reading Telemetry</h2>
        <p>
          To enable position resumption and bookmarks across your devices, our reader records current page numbers and timestamps. This data is strictly associated with your private account and is never sold to advertising brokers.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">4. Your Rights</h2>
        <p>
          You may request an export of your account data or account deletion at any time by contacting{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-brand-ink underline">
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
