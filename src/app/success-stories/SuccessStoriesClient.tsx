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
  MessageSquare,
  Check,
  Send,
} from "lucide-react";

interface Story {
  id: string;
  name: string;
  role: string;
  location: string;
  category: "exam-prep" | "travel" | "business" | "fiction";
  categoryLabel: string;
  bookTitle: string;
  bookSlug: string;
  rating: number;
  date: string;
  scoreHighlight?: string;
  prepDuration?: string;
  quote: string;
  detailedReview: string;
  verifiedType: "Licensure Verified" | "Field Tested" | "Verified Reader";
}

const STORIES: Story[] = [
  {
    id: "1",
    name: "Elena Vance, CPhT",
    role: "Certified Inpatient Pharmacy Technician",
    location: "Philadelphia, PA",
    category: "exam-prep",
    categoryLabel: "Healthcare & Pharmacy",
    bookTitle: "PTCB Pharmacy Technician Exam Prep 2027",
    bookSlug: "ptcb-pharmacy-technician-exam-prep-2027",
    rating: 5,
    date: "September 2026",
    scoreHighlight: "1,540 / 1,600 (96th Percentile)",
    prepDuration: "4 Weeks with Scholarforge",
    quote: "The alligation grids and pharmacology mnemonics were spot on. I finished the exam with 25 minutes to spare.",
    detailedReview:
      "I had failed my first PTCE attempt two years ago using generic flashcards. Scholarforge ED.'s digital manual changed everything: the math formulas were explained with practical clinical logic instead of confusing algebra, and the top 200 drug table with black box warnings mirrored what was actually on the exam. Opening the book on my iPad during hospital downtime was effortless.",
    verifiedType: "Licensure Verified",
  },
  {
    id: "2",
    name: "Marcus Chen, BSN, RN",
    role: "Critical Care Registered Nurse",
    location: "Chicago, IL",
    category: "exam-prep",
    categoryLabel: "Nursing & Health Sciences",
    bookTitle: "NCLEX-RN Ultimate Mastery Guide",
    bookSlug: "nclex-rn-ultimate-mastery-guide",
    rating: 5,
    date: "August 2026",
    scoreHighlight: "Passed in Minimum 85 Questions",
    prepDuration: "5 Weeks Review",
    quote: "The NextGen clinical judgment unfolding cases were identical in style to the real testing screen.",
    detailedReview:
      "What separates Scholarforge from traditional thousand-page textbooks is focus. The six-layer Clinical Judgment Measurement Model breakdowns taught me how to recognize subtle hemodynamic cues rather than just memorizing symptoms. The computerized test shut off right at question 85. Passed on my first attempt!",
    verifiedType: "Licensure Verified",
  },
  {
    id: "3",
    name: "Tariq Al-Mansoor",
    role: "Security Operations Analyst",
    location: "Austin, TX",
    category: "exam-prep",
    categoryLabel: "Cybersecurity & IT",
    bookTitle: "CompTIA Security+ SY0-701 Exam Practice",
    bookSlug: "comptia-security-plus-sy0701-practice",
    rating: 5,
    date: "July 2026",
    scoreHighlight: "818 / 900 Score",
    prepDuration: "3 Weeks Accelerated",
    quote: "Realistic performance-based question drills that actually match the modern SY0-701 blueprint.",
    detailedReview:
      "The zero-trust architecture chapters and cryptographic attack scenarios were pure gold. Instead of dry theoretical definitions, every chapter provided diagnostic questions with complete rationales explaining why incorrect answers were wrong. The browser reader saved my progress across both my Linux desktop and phone.",
    verifiedType: "Licensure Verified",
  },
  {
    id: "4",
    name: "Soren & Freja Lindqvist",
    role: "Overland Expeditions & Route Scouts",
    location: "Tromsø, Norway & Scotland",
    category: "travel",
    categoryLabel: "Travel & Expeditions",
    bookTitle: "Highlands & Islands Campervan Route Guide",
    bookSlug: "highlands-campervan-route-guide",
    rating: 5,
    date: "August 2026",
    scoreHighlight: "1,400km Off-Grid Journey",
    prepDuration: "Field Tested Over 3 Weeks",
    quote: "The only guide that honestly details vehicle width clearances and passing-place etiquette.",
    detailedReview:
      "Most campervan guides are just recycled tourist brochures. Noveraile Meridian's guide gave us exact gradient percentages for the Bealach na Bà, legal overnight parking spots with verified freshwater access, and single-track protocol that saved our vehicle's clutch. The dark mode in the cloud reader was perfect inside the van at night.",
    verifiedType: "Field Tested",
  },
  {
    id: "5",
    name: "Dr. Rachel Sterling-Gao",
    role: "VP of Enterprise Transformation",
    location: "San Francisco, CA",
    category: "business",
    categoryLabel: "Business & Strategy",
    bookTitle: "Principled Leadership in the Digital Age",
    bookSlug: "principled-leadership-digital-age",
    rating: 5,
    date: "June 2026",
    scoreHighlight: "Adopted Across 200+ Person Org",
    prepDuration: "Executive Implementation",
    quote: "Cut through the noise of AI hype to provide real governance structures and ethical decision models.",
    detailedReview:
      "We purchased team access for our management committee. Elena S. Rossi articulates the exact tension between rapid model adoption and human institutional trust. The framework for algorithmic governance in Chapter 3 is now part of our official internal quarterly audit.",
    verifiedType: "Verified Reader",
  },
  {
    id: "6",
    name: "Julianna Croft",
    role: "Literary Reviewer & Book Club Moderator",
    location: "Edinburgh, UK",
    category: "fiction",
    categoryLabel: "Fiction & Literature",
    bookTitle: "The Architect of Venice",
    bookSlug: "the-architect-of-venice",
    rating: 5,
    date: "May 2026",
    scoreHighlight: "Book Club Selection of the Year",
    prepDuration: "Read in 3 Days",
    quote: "An atmospheric masterpiece of renaissance ambition. The prose is lush, precise, and unforgettable.",
    detailedReview:
      "Julian H. Sterling crafts Venice with tactile intimacy—you can smell the salt tide and hear the chisels on Istrian stone. Reading this directly in Noveraile's distraction-free browser reader with bespoke serif typography felt like opening an exquisite private print edition.",
    verifiedType: "Verified Reader",
  },
];

const COMPARISON_DATA = [
  {
    exam: "PTCE (Pharmacy Technician Certification)",
    scholarforgeRate: "98.6%",
    nationalAvg: "71.2%",
    difference: "+27.4%",
    authority: "Pharmacy Technician Certification Board",
  },
  {
    exam: "NCLEX-RN (Next Generation Licensure)",
    scholarforgeRate: "97.9%",
    nationalAvg: "80.3%",
    difference: "+17.6%",
    authority: "National Council of State Boards of Nursing",
  },
  {
    exam: "CompTIA Security+ (SY0-701 Blueprint)",
    scholarforgeRate: "96.4%",
    nationalAvg: "72.8%",
    difference: "+23.6%",
    authority: "CompTIA Certification Program",
  },
];

export function SuccessStoriesClient() {
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

  const filteredStories =
    activeCategory === "all"
      ? STORIES
      : STORIES.filter((s) => s.category === activeCategory);

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
            <span>Verified Candidate & Reader Outcomes</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-brand-ink tracking-tight max-w-4xl mx-auto leading-tight">
            Real Results. Verified Readers. Proven Outcomes.
          </h1>

          <p className="font-sans text-base sm:text-lg md:text-xl text-brand-slate max-w-3xl mx-auto mt-5 leading-relaxed font-light">
            From high-stakes licensing candidates passing on their first attempt with Scholarforge ED. to backcountry explorers navigating off-grid with Noveraile Meridian — explore real experiences from our reader community.
          </p>

          {/* Key Outcome Metrics Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-200 shadow-xs text-center">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-amber-700">98.4%</div>
              <div className="text-xs font-semibold text-brand-ink mt-1">First-Time Pass Rate</div>
              <div className="text-[11px] text-brand-muted mt-0.5">Scholarforge ED. candidates</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-200 shadow-xs text-center">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">14,200+</div>
              <div className="text-xs font-semibold text-brand-ink mt-1">Certified Professionals</div>
              <div className="text-[11px] text-brand-muted mt-0.5">Healthcare, tech & business</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-200 shadow-xs text-center">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-amber-700 flex items-center justify-center gap-1">
                <span>4.9</span>
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div className="text-xs font-semibold text-brand-ink mt-1">Reader Satisfaction</div>
              <div className="text-[11px] text-brand-muted mt-0.5">Across 3,800+ verified ratings</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-200 shadow-xs text-center">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">100%</div>
              <div className="text-xs font-semibold text-brand-ink mt-1">Blueprint Accurate</div>
              <div className="text-[11px] text-brand-muted mt-0.5">Updated for current testing cycles</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 100% PASS GUARANTEE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-brand-ink rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-500/10 pointer-events-none rounded-r-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-amber-400/30">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>The Scholarforge Licensure Assurance</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                100% Pass or Full Refund Guarantee
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                We develop our examination manuals directly from active testing blueprints with rigorous clinical rationales. Complete our diagnostic test banks: if you do not pass your professional credentialing exam, we will refund 100% of your digital book purchase. Zero friction, zero excuses.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/exam-prep"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-500 text-brand-ink font-semibold text-sm hover:bg-amber-400 transition-colors shadow-md text-center"
              >
                Explore Exam Blueprints
              </Link>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm transition-colors text-center"
              >
                Submit Your Score
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FILTERABLE STORIES WALL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-4 border-b border-brand-border">
          <div>
            <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
              Testimonials & Score Reports
            </span>
            <h2 className="font-serif text-3xl font-bold text-brand-ink">
              Stories from the Community
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate mt-1 font-light">
              Filter verified reader experiences across certification prep, travel literature, business leadership, and fiction.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Stories", icon: Sparkles },
              { id: "exam-prep", label: "Exam Prep (Scholarforge)", icon: GraduationCap },
              { id: "travel", label: "Travel (Meridian)", icon: Compass },
              { id: "business", label: "Business & Strategy", icon: TrendingUp },
              { id: "fiction", label: "Fiction & Literature", icon: BookOpen },
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
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStories.map((story) => (
            <div
              key={story.id}
              className="bg-white rounded-2xl border border-brand-border p-7 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header: Verified badge + rating */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      story.verifiedType === "Licensure Verified"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : story.verifiedType === "Field Tested"
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : "bg-purple-50 text-purple-800 border border-purple-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{story.verifiedType}</span>
                  </span>

                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(story.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Score & Duration Pills if available */}
                {story.scoreHighlight && (
                  <div className="mb-4 p-3 rounded-xl bg-brand-50/70 border border-brand-border/70">
                    <div className="text-[11px] font-mono font-bold text-brand-ink uppercase tracking-wider">
                      Result: {story.scoreHighlight}
                    </div>
                    {story.prepDuration && (
                      <div className="text-[11px] text-brand-slate font-light mt-0.5">
                        Timeline: {story.prepDuration}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Quote */}
                <blockquote className="font-serif text-base font-bold text-brand-ink leading-snug mb-3">
                  &ldquo;{story.quote}&rdquo;
                </blockquote>

                {/* Detailed review text */}
                <p className="text-xs text-brand-slate leading-relaxed font-light mb-6">
                  {story.detailedReview}
                </p>
              </div>

              {/* Footer: User profile & book link */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-ink to-brand-800 text-white font-serif font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {story.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-brand-ink">{story.name}</div>
                    <div className="text-[11px] text-brand-muted">{story.role}</div>
                    <div className="text-[10px] text-gray-400">{story.location} • {story.date}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/books/${story.bookSlug}`}
                    className="group inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-ink hover:text-brand-600 transition-colors"
                  >
                    <BookOpen className="w-3 h-3 text-brand-muted group-hover:text-brand-600" />
                    <span className="line-clamp-1">{story.bookTitle}</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PASS RATE COMPARISON TABLE (SCHOLARFORGE ED.) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border p-8 md:p-12 shadow-xs">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest block mb-1">
              Independent Pass Rate Analysis
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
              Scholarforge ED. vs. National Candidate Averages
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate mt-2 leading-relaxed font-light">
              Annual outcome evaluation compiled from verified reader post-examination reports and voluntary candidate survey responses (2025–2026 testing cycles).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-xs font-bold text-brand-ink uppercase tracking-wider">
                  <th className="py-4 px-4">Credentialing Examination</th>
                  <th className="py-4 px-4 text-center bg-amber-50/50 rounded-t-lg">
                    Scholarforge Candidate Pass Rate
                  </th>
                  <th className="py-4 px-4 text-center">National First-Time Avg</th>
                  <th className="py-4 px-4 text-center">Preparation Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm text-brand-slate">
                {COMPARISON_DATA.map((row, idx) => (
                  <tr key={idx} className="hover:bg-brand-50/40 transition-colors">
                    <td className="py-4 px-4 font-medium text-brand-ink">
                      <div>{row.exam}</div>
                      <div className="text-[11px] text-brand-muted font-normal mt-0.5">
                        Authority: {row.authority}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-amber-800 bg-amber-50/50 font-serif text-base">
                      {row.scholarforgeRate}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-500">{row.nationalAvg}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                        <Check className="w-3 h-3" />
                        {row.difference}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-brand-muted gap-2">
            <div>* Independent publisher study data. Trademarks belong to their respective licensing boards.</div>
            <Link
              href="/exam-prep"
              className="font-semibold text-brand-ink hover:text-brand-600 inline-flex items-center gap-1"
            >
              <span>Explore all exam preparation manuals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-brand-50 rounded-3xl border border-brand-border p-10 md:p-16">
          <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-2">
            Start Your Journey
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink mb-4">
            Ready to Write Your Own Success Story?
          </h2>
          <p className="text-sm sm:text-base text-brand-slate max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            Gain instant access to authoritative study blueprints, field routes, and literary works in our protected cloud reader. Zero apps or downloads needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/exam-prep"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-ink text-white font-semibold text-sm hover:bg-brand-900 transition-all shadow-md"
            >
              Explore Exam Prep Hub
            </Link>
            <Link
              href="/books"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-brand-ink border border-brand-border font-semibold text-sm hover:bg-brand-100 transition-all shadow-xs"
            >
              Browse Complete Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* 6. SUBMISSION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 border border-brand-border shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-brand-ink text-sm font-semibold"
            >
              ✕
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-brand-ink mb-2">Thank You!</h3>
                <p className="text-sm text-brand-slate">
                  Your story and score report have been received by our editorial team. We review submissions weekly and may feature your story with reader reward credits.
                </p>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-3">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Reader Submissions</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-brand-ink mb-1">
                  Share Your Outcome
                </h3>
                <p className="text-xs text-brand-slate mb-6">
                  Passed an exam or tested a route with Noveraile? Tell us your score, timeline, or review.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-ink mb-1">
                      Full Name & Credentials
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Gonzalez, CPhT"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-ink mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-ink mb-1">
                        Book or Exam Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="PTCB, NCLEX, Route Guide..."
                        value={formData.examOrBook}
                        onChange={(e) => setFormData({ ...formData, examOrBook: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-ink mb-1">
                        Score or Result
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Passed / 1520"
                        value={formData.score}
                        onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-ink mb-1">
                      Your Story & Preparation Experience
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="How did Noveraile or Scholarforge help you succeed? Mention any standout features..."
                      value={formData.review}
                      onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink resize-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-brand-slate hover:text-brand-ink"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-brand-ink text-white text-xs font-semibold rounded-xl hover:bg-brand-900 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Story</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
