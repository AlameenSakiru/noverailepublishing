import React from "react";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Refund Policy & Digital Entitlements",
  description: "Official refund policy for digital books and online cloud library access at Noveraile Publishing.",
};

export default function RefundsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8">
      <div className="pb-6 border-b border-brand-border">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
          Refund Policy
        </h1>
        <p className="text-xs text-brand-muted mt-2">Last updated: January 2026</p>
      </div>

      <div className="prose max-w-none font-serif text-brand-slate text-base leading-relaxed space-y-6">
        <h2 className="text-xl font-bold text-brand-ink">1. Nature of Digital Publications</h2>
        <p>
          Publications purchased through {siteConfig.name} are delivered via instant digital entitlement into your authenticated online reader account. Because access is immediate upon completed transaction, we offer a transparent and fair refund standard.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">2. 14-Day Reader Satisfaction Window</h2>
        <p>
          If you encounter technical incompatibility preventing reading in our protected cloud reader, or if a publication significantly diverges from its editorial curriculum, you may request a full refund within 14 calendar days of your purchase date by contacting{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-brand-ink underline">
            {siteConfig.contactEmail}
          </a>
          . Please include your order number (e.g. NOV-2026-XXXXX).
        </p>

        <h2 className="text-xl font-bold text-brand-ink">3. Digital Entitlement Revocation</h2>
        <p>
          In accordance with our digital rights management architecture, once a refund is approved and processed by our billing team, the corresponding digital book entitlement is immediately revoked from your personal Noveraile library.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">4. Processing Timeline</h2>
        <p>
          Approved refunds are credited back to your original payment method (via Stripe or payment processor) within 3 to 7 business days, depending on your banking institution.
        </p>
      </div>
    </div>
  );
}
