"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Star,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Compass,
  GraduationCap,
  Check,
  Clock,
  Laptop,
} from "lucide-react";
import { FeaturedStory } from "@/lib/storyTypes";

export interface VerifiedReviewItem {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
  guestName?: string | null;
  user?: { id: string; name: string | null } | null;
  book: { id: string; title: string; slug: string; coverImage?: string | null };
}

export function SuccessStoriesClient({
  initialStories = [],
  verifiedReviews = [],
}: {
  initialStories?: FeaturedStory[];
  verifiedReviews?: VerifiedReviewItem[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    examOrBook: "",
    score: "",
    review: "",
  });

  const stories = initialStories || [];

  const filteredStories =
    activeCategory === "all"
      ? stories
      : stories.filter((s) => s.category === activeCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setModalOpen(false);
      setSubmitted(false);
      setFormData({ name: "", email: "", examOrBook: "", score: "", review: "" });
    }, 2500);
  };

  return (
    <div className="space-y-20 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/50 pt-14 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-300 shadow-xs mb-6 text-xs font-semibold text-amber-900 uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Verified Reader Community & Outcomes</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-brand-ink tracking-tight max-w-4xl mx-auto leading-tight">
            Real Readers. Authentic Experiences. Proven Quality.
          </h1>

          <p className="font-sans text-base sm:text-lg md:text-xl text-brand-slate max-w-3xl mx-auto mt-5 leading-relaxed font-light">
            From healthcare candidates sharpening their clinical judgment to novel enthusiasts discovering cozy worlds — explore genuine reflections from our verified readers.
          </p>

          {/* Key Outcome Metrics Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-200 shadow-xs text-center">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-amber-700">4</div>
              <div className="text-xs font-semibold text-brand-ink mt-1">Curated Imprints</div>
              <div className="text-[11px] text-brand-muted mt-0.5">Education, fiction, travel & business</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-200 shadow-xs text-center">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">100%</div>
              <div className="text-xs font-semibold text-brand-ink mt-1">In-Browser Reading</div>
              <div className="text-[11px] text-brand-muted mt-0.5">Zero third-party apps required</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-200 shadow-xs text-center">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-amber-700 flex items-center justify-center gap-1">
                <span>100%</span>
              </div>
              <div className="text-xs font-semibold text-brand-ink mt-1">Verified Readers Only</div>
              <div className="text-[11px] text-brand-muted mt-0.5">Zero unverified reviews</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-200 shadow-xs text-center">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">14 Days</div>
              <div className="text-xs font-semibold text-brand-ink mt-1">Satisfaction Pledge</div>
              <div className="text-[11px] text-brand-muted mt-0.5">Guaranteed reader support</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REFINED SATISFACTION PLEDGE BANNER (Balanced, Realistic & Professional) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-stone-900 via-[#0f172a] to-stone-950 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden border border-gray-800">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-500/10 pointer-events-none rounded-r-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-amber-400/30">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>The Noveraile Reader Satisfaction Pledge</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                Dedicated to Editorial Quality & Reader Trust
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                Every digital edition published by Noveraile is thoroughly vetted and crafted for clarity, depth, and immediate practical value. If any publication does not meet your expectations, our reader support team is here to assist with friendly exchanges and resolution within 14 days.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/books"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-500 text-stone-950 font-semibold text-sm hover:bg-amber-400 transition-colors shadow-md text-center"
              >
                Explore Publications
              </Link>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm transition-colors text-center"
              >
                Submit Your Review
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VERIFIED REVIEWS & STORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-4 border-b border-brand-border">
          <div>
            <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
              Reader Feedback & Outcomes
            </span>
            <h2 className="font-serif text-3xl font-bold text-brand-ink">
              Verified Reader Reviews
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate mt-1 font-light">
              Authentic reviews submitted by confirmed purchasers across our digital catalog.
            </p>
          </div>

          {(stories.length > 0 || verifiedReviews.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Publications", icon: Sparkles },
                { id: "exam-prep", label: "Healthcare & Prep", icon: GraduationCap },
                { id: "fiction", label: "Fiction & Literature", icon: BookOpen },
                { id: "travel", label: "Travel & Guides", icon: Compass },
                { id: "business", label: "Business & Strategy", icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-brand-ink text-white shadow-xs font-semibold"
                        : "bg-white text-brand-slate hover:text-brand-ink border border-brand-border hover:bg-brand-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Reviews or Transparency Policy */}
        {stories.length === 0 && verifiedReviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <ShieldCheck className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
              Verified Reader Policy & Transparency
            </h3>
            <p className="text-sm text-brand-slate mt-3 leading-relaxed font-light max-w-xl mx-auto">
              At Noveraile Publishing, we maintain a strict 100% verified purchaser policy. We do not publish unverified testimonials, import external aggregator ratings, or fabricate promotional reviews.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mt-8 pt-8 border-t border-gray-100">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-serif font-bold text-sm text-brand-ink mb-1">Purchaser-Only</div>
                <p className="text-xs text-brand-slate leading-relaxed font-light">
                  Only readers who have purchased an active digital entitlement can submit a rating.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-serif font-bold text-sm text-brand-ink mb-1">Zero Incentives</div>
                <p className="text-xs text-brand-slate leading-relaxed font-light">
                  Reviews are never paid, compensated, or solicited through discounts or gifts.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-serif font-bold text-sm text-brand-ink mb-1">14-Day Guarantee</div>
                <p className="text-xs text-brand-slate leading-relaxed font-light">
                  Every edition is backed by our full 14-day satisfaction pledge and reader support.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/books"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-800 transition-colors shadow-xs"
              >
                Browse Our Catalog
              </Link>
              <Link
                href="/my-library"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-brand-border text-brand-ink text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Review a Purchased Edition
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Render real verified purchaser reviews */}
            {verifiedReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl border border-brand-border p-7 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified Purchaser</span>
                    </span>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {review.title && (
                    <blockquote className="font-serif text-lg font-bold text-brand-ink leading-snug mb-3">
                      &ldquo;{review.title}&rdquo;
                    </blockquote>
                  )}

                  <p className="text-xs sm:text-sm text-brand-slate leading-relaxed font-light mb-6">
                    {review.comment}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-ink to-brand-800 text-white font-serif font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {(review.user?.name || review.guestName || "Verified Reader").charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-brand-ink">
                        {review.user?.name || review.guestName || "Verified Reader"}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {review.book && (
                    <div className="pt-2">
                      <Link
                        href={`/books/${review.book.slug}`}
                        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:text-amber-800 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-brand-muted group-hover:text-amber-800" />
                        <span className="line-clamp-1">{review.book.title}</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Render any admin-published curated stories */}
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-2xl border border-brand-border p-7 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{story.verifiedType}</span>
                    </span>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(story.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <blockquote className="font-serif text-lg font-bold text-brand-ink leading-snug mb-3">
                    &ldquo;{story.quote}&rdquo;
                  </blockquote>

                  <p className="text-xs sm:text-sm text-brand-slate leading-relaxed font-light mb-6">
                    {story.detailedReview}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-ink to-brand-800 text-white font-serif font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {story.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-brand-ink">{story.name}</div>
                      <div className="text-[11px] text-brand-muted">{story.role}</div>
                      <div className="text-[10px] text-gray-400">
                        {story.location} • {story.date}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/books/${story.bookSlug}`}
                      className="group inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:text-amber-800 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-brand-muted group-hover:text-amber-800" />
                      <span className="line-clamp-1">{story.bookTitle}</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. THE NOVERAILE PUBLISHING STANDARD (Quality Pillars replacing the demo stats table) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border p-8 md:p-12 shadow-xs">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-widest block mb-1">
              Editorial Standards
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
              The Noveraile Publishing Standard
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate mt-2 leading-relaxed font-light">
              We focus on substance, editorial discipline, and clean digital typography across every title we publish.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-border/70 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Laptop className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-brand-ink">Pure In-Browser Reader</h3>
              <p className="text-xs text-brand-slate font-light leading-relaxed">
                Zero proprietary app downloads or format headaches. Read on your phone, tablet, or laptop directly through your browser.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-border/70 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-brand-ink">Curated Catalogue</h3>
              <p className="text-xs text-brand-slate font-light leading-relaxed">
                No recycled summaries or AI fluff. Each publication is written with real technical, literary, or geographical authority.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-border/70 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-brand-ink">Instant Access</h3>
              <p className="text-xs text-brand-slate font-light leading-relaxed">
                Unlock full reading entitlements immediately upon checkout. Your library stays securely synced across your devices.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-border/70 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-brand-ink">Dedicated Reader Care</h3>
              <p className="text-xs text-brand-slate font-light leading-relaxed">
                Our support team is always available to ensure you have a seamless reading and study experience with zero friction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-brand-50 rounded-3xl border border-brand-border p-10 md:p-16">
          <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-2">
            Start Reading
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink mb-4">
            Discover Your Next Essential Read
          </h2>
          <p className="text-sm sm:text-base text-brand-slate max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            Instant digital access to curated licensure study manuals, captivating fiction, and overland routes in our distraction-free cloud reader.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/books"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-ink text-white font-semibold text-sm hover:bg-brand-900 transition-all shadow-md"
            >
              Browse Complete Catalog
            </Link>
            <Link
              href="/categories"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-brand-ink border border-brand-border font-medium text-sm hover:bg-gray-50 transition-all shadow-xs"
            >
              Explore Imprints & Genres
            </Link>
          </div>
        </div>
      </section>

      {/* 6. SUBMIT YOUR REVIEW MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-brand-border relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 text-lg font-bold"
            >
              ✕
            </button>

            {submitted ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-brand-ink">
                  Thank You for Your Feedback!
                </h3>
                <p className="text-xs text-brand-slate font-light leading-relaxed">
                  Your review has been submitted for editorial moderation. We appreciate your contribution to the Noveraile reader community.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-brand-ink">
                    Submit Reader Feedback
                  </h3>
                  <p className="text-xs text-brand-slate font-light mt-1">
                    Share your experience with a Noveraile digital edition.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Elena V., RN"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Book or Manual
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.examOrBook}
                    onChange={(e) => setFormData({ ...formData, examOrBook: e.target.value })}
                    placeholder="e.g. NCLEX-RN Ultimate Mastery Guide"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Your Review & Experience
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.review}
                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                    placeholder="What did you think of the digital edition? Mention any standout chapters or how it helped you..."
                    className="w-full text-xs p-3.5 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-ink leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand-ink text-white font-semibold text-xs hover:bg-brand-900 transition-colors shadow-md"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
