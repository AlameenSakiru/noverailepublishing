import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookCard } from "@/components/BookCard";
import { siteConfig } from "@/lib/config";
import { ShieldCheck, CheckCircle2, Award, BookOpen, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Professional Certification & Licensing Exam Prep Books",
  description: "Official Noveraile Exam Preparation Center. Comprehensive digital study guides, practice question banks, and clinical rationales for high-stakes professional licensing.",
};

export default async function ExamPrepPage() {
  const examBooks = await prisma.book.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { category: { slug: "exam-prep" } },
        { category: { parent: { slug: "exam-prep" } } },
      ],
    },
    include: {
      author: true,
      category: true,
      examMetadata: true,
      reviews: {
        select: { rating: true },
      },
    },
    orderBy: { isFeatured: "desc" },
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Exam Prep Banner */}
      <section className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/40 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Award className="w-4 h-4 text-amber-700" />
            <span>Scholarforge ED. • Professional Licensure Hub</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-brand-ink tracking-tight max-w-3xl mx-auto leading-tight">
            Prepare. Practice. Pass.
          </h1>

          <p className="font-sans text-base sm:text-lg text-brand-slate max-w-2xl mx-auto mt-4 leading-relaxed font-light">
            Targeted study manuals built strictly around contemporary examination blueprints. Each digital publication combines clinical pharmacology, calculation formulas, and verified diagnostic test banks.
          </p>

          {/* Independent Publisher Disclaimer */}
          <div className="max-w-3xl mx-auto mt-8 p-4 rounded-xl bg-white border border-amber-200 text-xs text-brand-slate text-left shadow-xs">
            <strong className="text-amber-900 block font-semibold mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Independent Educational Publisher Disclaimer
            </strong>
            {siteConfig.disclaimer.examPrep}
          </div>
        </div>
      </section>

      {/* Exam Prep Books Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-6 border-b border-brand-border mb-8">
          <div>
            <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
              Active Certifications
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
              All Exam Preparation Guides
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {examBooks.map((book) => (
            <div key={book.id} className="flex flex-col">
              {book.examMetadata && (
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold font-mono">
                    {book.examMetadata.examAcronym}
                  </span>
                  <span className="text-brand-muted text-[11px]">
                    {book.examMetadata.yearVersion} Blueprint
                  </span>
                </div>
              )}
              <BookCard
                id={book.id}
                title={book.title}
                subtitle={book.subtitle}
                slug={book.slug}
                coverImage={book.coverImage}
                authorName={book.author.name}
                categoryName={book.category.name}
                price={book.price}
                salePrice={book.salePrice}
                rating={book.reviews?.length ? book.reviews.reduce((acc, r) => acc + r.rating, 0) / book.reviews.length : null}
                reviewCount={book.reviews?.length || 0}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Rigor & Quality Framework */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-50 rounded-2xl p-8 sm:p-12 border border-brand-border">
          <h3 className="font-serif text-2xl font-bold text-brand-ink text-center mb-8">
            The Scholarforge ED. Standard
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white rounded-xl border border-brand-border">
              <CheckCircle2 className="w-5 h-5 text-amber-600 mb-2" />
              <h4 className="font-serif text-base font-bold text-brand-ink">Blueprint Alignment</h4>
              <p className="text-xs text-brand-slate mt-1 font-light leading-relaxed">
                Direct mapping to the official domain percentage weights specified by national certifying bodies.
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-brand-border">
              <BookOpen className="w-5 h-5 text-amber-600 mb-2" />
              <h4 className="font-serif text-base font-bold text-brand-ink">Diagnostic Rationales</h4>
              <p className="text-xs text-brand-slate mt-1 font-light leading-relaxed">
                Explanations addressing why correct options succeed and why distractors are clinically or legally invalid.
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-brand-border">
              <ShieldCheck className="w-5 h-5 text-amber-600 mb-2" />
              <h4 className="font-serif text-base font-bold text-brand-ink">Verified Clinical Review</h4>
              <p className="text-xs text-brand-slate mt-1 font-light leading-relaxed">
                Penned by active board-certified practitioners (PharmDs, MSN-RNs, CISSPs) with clinical classroom tenure.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
