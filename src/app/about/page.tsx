import React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { ShieldCheck, BookOpen, Award, ArrowRight } from "lucide-react";

export const metadata = {
  title: "About Noveraile Publishing",
  description: "Learn about Noveraile Publishing, our editorial philosophy, independent direct publishing model, and imprints.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-12">
      {/* Header */}
      <div className="text-center pb-8 border-b border-brand-border">
        <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-2">
          Independent Digital Publisher
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-ink">
          About Noveraile Publishing
        </h1>
        <p className="font-serif italic text-lg sm:text-xl text-brand-slate mt-4 max-w-2xl mx-auto">
          &ldquo;Books built for where you&apos;re going next.&rdquo;
        </p>
      </div>

      {/* Main Philosophy Narrative */}
      <div className="prose max-w-none text-brand-slate font-serif text-base sm:text-lg leading-relaxed space-y-6">
        <p>
          <strong>Noveraile Publishing</strong> is an independent multi-niche digital publishing house founded on a clear premise: readers deserve direct, uncompromised access to high-value publications through an elegant, distraction-free reading experience.
        </p>

        <p>
          We are not an affiliate directory, a marketplace of third-party uploads, or an eBook file-dump. Every work bearing the Noveraile imprint is either directly developed by our subject teams or commissioned under rigorous editorial curation.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand-ink pt-4">
          Our Editorial Imprints
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose my-6 font-sans">
          <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-xs">
            <h3 className="font-serif font-bold text-base text-brand-ink">Noveraile Publishing</h3>
            <span className="text-[11px] text-brand-500 font-semibold uppercase block mt-0.5">Flagship Imprint</span>
            <p className="text-xs text-brand-slate mt-2 leading-relaxed font-light">
              General non-fiction, contemporary literature, narrative essays, and cultural studies.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-xs">
            <h3 className="font-serif font-bold text-base text-brand-ink">Scholarforge ED.</h3>
            <span className="text-[11px] text-amber-600 font-semibold uppercase block mt-0.5">Licensure & Certification</span>
            <p className="text-xs text-brand-slate mt-2 leading-relaxed font-light">
              High-stakes exam preparation manuals for pharmacy, nursing, IT infrastructure, and skilled professions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-xs">
            <h3 className="font-serif font-bold text-base text-brand-ink">Noveraile Meridian</h3>
            <span className="text-[11px] text-blue-600 font-semibold uppercase block mt-0.5">Field & Travel</span>
            <p className="text-xs text-brand-slate mt-2 leading-relaxed font-light">
              Campervan overland routes, off-grid road logistics, and regional expeditions.
            </p>
          </div>
        </div>

        <h2 className="font-serif text-2xl font-bold text-brand-ink pt-4">
          The Protected Cloud Reader Experience
        </h2>
        <p>
          Instead of scattering unversioned PDF files across customer downloads folders, Noveraile books are tied directly to your authenticated reader account. When you purchase a title, it enters your personal digital library immediately. Your reading progress, page position, and bookmarks synchronize across your phone, tablet, and workstation.
        </p>
      </div>

      {/* CTA Box */}
      <div className="bg-brand-50 rounded-2xl p-8 border border-brand-border text-center">
        <h3 className="font-serif text-2xl font-bold text-brand-ink mb-2">
          Explore Our Catalog
        </h3>
        <p className="text-xs sm:text-sm text-brand-slate max-w-md mx-auto mb-6">
          Start browsing our professional certification series or contemporary literature titles today.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/books"
            className="px-6 py-3 rounded-xl bg-brand-ink text-white font-semibold text-xs hover:bg-brand-900 transition-colors shadow-sm"
          >
            Browse All Books
          </Link>
          <Link
            href="/exam-prep"
            className="px-6 py-3 rounded-xl bg-white border border-brand-border text-brand-ink font-semibold text-xs hover:bg-brand-50 transition-colors"
          >
            Exam Prep Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
