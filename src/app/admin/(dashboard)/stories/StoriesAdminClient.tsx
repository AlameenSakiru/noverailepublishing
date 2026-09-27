"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Star,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Check,
  AlertCircle,
  Eye,
  GraduationCap,
  Compass,
  TrendingUp,
} from "lucide-react";
import { FeaturedStory, DEFAULT_FEATURED_STORIES } from "@/lib/storyTypes";

interface BookOption {
  id: string;
  title: string;
  slug: string;
}

export function StoriesAdminClient({
  initialStories,
  availableBooks,
}: {
  initialStories: FeaturedStory[];
  availableBooks: BookOption[];
}) {
  const [stories, setStories] = useState<FeaturedStory[]>(
    initialStories && initialStories.length >= 4
      ? initialStories.slice(0, 4)
      : DEFAULT_FEATURED_STORIES
  );
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeStory = stories[selectedIdx] || stories[0];

  const updateActiveField = (field: keyof FeaturedStory, value: any) => {
    setStories((prev) => {
      const next = [...prev];
      next[selectedIdx] = {
        ...next[selectedIdx],
        [field]: value,
      };
      return next;
    });
  };

  const handleSelectBook = (slug: string) => {
    const found = availableBooks.find((b) => b.slug === slug);
    if (found) {
      setStories((prev) => {
        const next = [...prev];
        next[selectedIdx] = {
          ...next[selectedIdx],
          bookTitle: found.title,
          bookSlug: found.slug,
        };
        return next;
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setAlert(null);
    try {
      const res = await fetch("/api/admin/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stories }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save stories");
      }

      setAlert({
        type: "success",
        text: "The 4 featured reader stories have been updated on the public site!",
      });
      setTimeout(() => setAlert(null), 4000);
    } catch (err: any) {
      setAlert({
        type: "error",
        text: err.message || "An unexpected error occurred while saving.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all 4 stories back to the curated editorial defaults?")) {
      setStories(DEFAULT_FEATURED_STORIES);
      setAlert({
        type: "success",
        text: "Reset to curated defaults. Click 'Save Changes' to apply publicly.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-300 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>Featured Reader Showcase</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Featured Reader Stories & Reviews
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage the exactly 4 authentic community reviews and reader outcomes displayed on the public{" "}
            <Link
              href="/success-stories"
              target="_blank"
              className="text-amber-800 underline hover:text-amber-900 inline-flex items-center gap-1 font-medium"
            >
              /success-stories
              <ExternalLink className="w-3 h-3" />
            </Link>{" "}
            page.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f172a] text-white hover:bg-black font-semibold text-xs transition-all shadow-md disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isSaving ? "Saving..." : "Save 4 Stories"}</span>
          </button>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border transition-all ${
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {alert.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{alert.text}</span>
        </div>
      )}

      {/* 4 Story Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stories.map((story, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <button
              key={story.id || idx}
              onClick={() => setSelectedIdx(idx)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? "bg-white border-[#0f172a] shadow-md ring-2 ring-[#0f172a]/10"
                  : "bg-gray-50/70 border-gray-200 hover:bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider">
                  Story #{idx + 1}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isSelected ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {story.category.toUpperCase()}
                </span>
              </div>
              <div className="font-semibold text-xs text-gray-900 line-clamp-1">
                {story.name || `Reader ${idx + 1}`}
              </div>
              <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                {story.bookTitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Edit Panel & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-[11px] font-mono text-amber-800 font-bold uppercase tracking-wider block">
                Editing Slot #{selectedIdx + 1}
              </span>
              <h2 className="text-base font-bold text-gray-900 mt-0.5">
                Reader Details & Review Content
              </h2>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateActiveField("rating", s)}
                  className="p-1 hover:scale-110 transition-transform"
                  title={`${s} Stars`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      s <= activeStory.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Reader Name & Title
              </label>
              <input
                type="text"
                value={activeStory.name}
                onChange={(e) => updateActiveField("name", e.target.value)}
                placeholder="e.g. Sarah Jenkins, BSN"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Role / Profession
              </label>
              <input
                type="text"
                value={activeStory.role}
                onChange={(e) => updateActiveField("role", e.target.value)}
                placeholder="e.g. Registered Nurse & NCLEX Candidate"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={activeStory.location}
                onChange={(e) => updateActiveField("location", e.target.value)}
                placeholder="e.g. Columbus, OH"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Date / Timeframe
              </label>
              <input
                type="text"
                value={activeStory.date}
                onChange={(e) => updateActiveField("date", e.target.value)}
                placeholder="e.g. August 2026"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              />
            </div>
          </div>

          {/* Book Link / Selection */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700">
              Associated Catalog Book
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-gray-500 block mb-1">
                  Choose from existing books:
                </span>
                <select
                  value={activeStory.bookSlug}
                  onChange={(e) => handleSelectBook(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                >
                  <option value="">-- Select a Book --</option>
                  {availableBooks.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 block mb-1">
                  Or manual Book Title:
                </span>
                <input
                  type="text"
                  value={activeStory.bookTitle}
                  onChange={(e) => updateActiveField("bookTitle", e.target.value)}
                  placeholder="Book Title"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                />
              </div>
            </div>
          </div>

          {/* Genre, Category & Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Category
              </label>
              <select
                value={activeStory.category}
                onChange={(e) => updateActiveField("category", e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              >
                <option value="exam-prep">Exam Prep / Healthcare</option>
                <option value="fiction">Fiction & Literature</option>
                <option value="travel">Travel & Expeditions</option>
                <option value="business">Business & Tech</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Category Label
              </label>
              <input
                type="text"
                value={activeStory.categoryLabel}
                onChange={(e) => updateActiveField("categoryLabel", e.target.value)}
                placeholder="e.g. Healthcare & Licensure"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Verification Badge
              </label>
              <select
                value={activeStory.verifiedType}
                onChange={(e) => updateActiveField("verifiedType", e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              >
                <option value="Verified Reader">Verified Reader</option>
                <option value="Licensure Verified">Licensure Verified</option>
                <option value="Field Tested">Field Tested</option>
              </select>
            </div>
          </div>

          {/* Outcome Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Outcome Highlight Badge (Optional)
              </label>
              <input
                type="text"
                value={activeStory.scoreHighlight || ""}
                onChange={(e) => updateActiveField("scoreHighlight", e.target.value)}
                placeholder="e.g. Passed 1st Attempt (85 Qs)"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Timeline / Prep Duration (Optional)
              </label>
              <input
                type="text"
                value={activeStory.prepDuration || ""}
                onChange={(e) => updateActiveField("prepDuration", e.target.value)}
                placeholder="e.g. 5 Weeks Focused Study"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              />
            </div>
          </div>

          {/* Headline Quote */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Short Pull-Quote / Headline
            </label>
            <input
              type="text"
              value={activeStory.quote}
              onChange={(e) => updateActiveField("quote", e.target.value)}
              placeholder="e.g. The NextGen clinical judgment cases taught me how to think under pressure."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
            />
          </div>

          {/* Detailed Review */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Full Reader Review / Testimonial
            </label>
            <textarea
              rows={4}
              value={activeStory.detailedReview}
              onChange={(e) => updateActiveField("detailedReview", e.target.value)}
              placeholder="Write the reader's authentic story and reflection..."
              className="w-full text-xs p-3.5 rounded-xl border border-gray-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
            />
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4 sticky top-28">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-800" />
              <span>Live Public Card Preview</span>
            </span>
            <span className="text-[11px] text-gray-400">Card #{selectedIdx + 1}</span>
          </div>

          {/* Render of the card as it appears on /success-stories */}
          <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-lg flex flex-col justify-between">
            <div>
              {/* Header: Verified badge + rating */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    activeStory.verifiedType === "Licensure Verified"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : activeStory.verifiedType === "Field Tested"
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : "bg-purple-50 text-purple-800 border border-purple-200"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{activeStory.verifiedType}</span>
                </span>

                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(activeStory.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Highlight Pill */}
              {activeStory.scoreHighlight && (
                <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-[11px] font-mono font-bold text-gray-900 uppercase tracking-wider">
                    Result: {activeStory.scoreHighlight}
                  </div>
                  {activeStory.prepDuration && (
                    <div className="text-[11px] text-gray-500 font-light mt-0.5">
                      Timeline: {activeStory.prepDuration}
                    </div>
                  )}
                </div>
              )}

              {/* Main Quote */}
              <blockquote className="font-serif text-base font-bold text-gray-900 leading-snug mb-3">
                &ldquo;{activeStory.quote || "Pull quote will appear here..."}&rdquo;
              </blockquote>

              {/* Detailed review text */}
              <p className="text-xs text-gray-600 leading-relaxed font-light mb-6">
                {activeStory.detailedReview || "Reader testimonial text will appear here..."}
              </p>
            </div>

            {/* Footer: User profile & book link */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0f172a] to-gray-800 text-white font-serif font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {(activeStory.name || "R").charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-900">{activeStory.name}</div>
                  <div className="text-[11px] text-gray-500">{activeStory.role}</div>
                  <div className="text-[10px] text-gray-400">
                    {activeStory.location} • {activeStory.date}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-900">
                  <BookOpen className="w-3 h-3 text-gray-400" />
                  <span className="line-clamp-1">{activeStory.bookTitle}</span>
                  <ArrowRight className="w-3 h-3 text-amber-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
