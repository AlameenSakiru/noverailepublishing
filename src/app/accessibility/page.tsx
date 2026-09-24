import React from "react";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Accessibility Statement",
  description: "Accessibility commitment and standards compliance for Noveraile Publishing.",
};

export default function AccessibilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8">
      <div className="pb-6 border-b border-brand-border">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
          Accessibility Statement
        </h1>
        <p className="text-xs text-brand-muted mt-2">Last updated: January 2026</p>
      </div>

      <div className="prose max-w-none font-serif text-brand-slate text-base leading-relaxed space-y-6">
        <p>
          {siteConfig.name} is dedicated to ensuring digital publication access is usable for all readers, including individuals with visual, auditory, motor, or cognitive impairments.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">Conducted Measures</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Keyboard Navigation:</strong> Full keyboard support for reading page transitions, table of contents, and catalog filters.</li>
          <li><strong>Text Resizing & Themes:</strong> Built-in controls for cycling font sizes and high-contrast night/sepia reading palettes.</li>
          <li><strong>Semantic HTML:</strong> Proper hierarchical headings, ARIA landmarks, and descriptive image alternatives.</li>
          <li><strong>Color Contrast:</strong> Minimum 4.5:1 contrast ratios across all primary editorial copy.</li>
        </ul>

        <h2 className="text-xl font-bold text-brand-ink">Feedback & Assistance</h2>
        <p>
          If you encounter any barrier while reading a publication, please contact our accessibility coordinator at{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-brand-ink underline">
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
