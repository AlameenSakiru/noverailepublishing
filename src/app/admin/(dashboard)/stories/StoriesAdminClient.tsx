"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Trash2,
  MessageSquare,
  ShieldAlert,
  EyeOff,
  User,
} from "lucide-react";
import { FeaturedStory, DEFAULT_FEATURED_STORIES } from "@/lib/storyTypes";

interface BookOption {
  id: string;
  title: string;
  slug: string;
}

export interface CustomerReviewItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string | Date;
  book: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function StoriesAdminClient({
  initialStories,
  availableBooks,
  initialCustomerReviews = [],
}: {
  initialStories: FeaturedStory[];
  availableBooks: BookOption[];
  initialCustomerReviews?: CustomerReviewItem[];
}) {
  const [currentTab, setCurrentTab] = useState<"FEATURED" | "REVIEWS">("FEATURED");

  // Featured 4 stories state
  const [stories, setStories] = useState<FeaturedStory[]>(
    initialStories && initialStories.length >= 4
      ? initialStories.slice(0, 4)
      : DEFAULT_FEATURED_STORIES
  );
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Customer book reviews state
  const [customerReviews, setCustomerReviews] = useState<CustomerReviewItem[]>(
    initialCustomerReviews
  );
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [togglingReviewId, setTogglingReviewId] = useState<string | null>(null);

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

  const handleClearSlot = () => {
    if (confirm(`Clear all content from Story Slot #${selectedIdx + 1}?`)) {
      setStories((prev) => {
        const next = [...prev];
        next[selectedIdx] = {
          id: `story-${selectedIdx + 1}`,
          name: "",
          role: "",
          location: "",
          category: "fiction",
          categoryLabel: "Reader Review",
          bookTitle: availableBooks[0]?.title || "Featured Title",
          bookSlug: availableBooks[0]?.slug || "",
          rating: 5,
          date: "",
          quote: "",
          detailedReview: "",
          verifiedType: "Verified Reader",
        };
        return next;
      });
      setAlert({
        type: "success",
        text: `Slot #${selectedIdx + 1} cleared. Click "Save 4 Stories" to apply.`,
      });
      setTimeout(() => setAlert(null), 3000);
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

  // Delete Customer Review
  const handleDeleteCustomerReview = async (review: CustomerReviewItem) => {
    const confirmed = confirm(
      `Are you sure you want to permanently delete the review "${review.title}" by ${review.user.name} on "${review.book.title}"?\n\nThis will remove it from the book's sales page and recalculate the average rating.`
    );
    if (!confirmed) return;

    setDeletingReviewId(review.id);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete review");
      }

      setCustomerReviews((prev) => prev.filter((r) => r.id !== review.id));
      setAlert({
        type: "success",
        text: `Review "${review.title}" was permanently deleted.`,
      });
      setTimeout(() => setAlert(null), 4000);
    } catch (err: any) {
      setAlert({
        type: "error",
        text: err.message || "Could not delete review.",
      });
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Toggle Approve / Hide Customer Review
  const handleToggleApproveReview = async (review: CustomerReviewItem) => {
    setTogglingReviewId(review.id);
    try {
      const newStatus = !review.isApproved;
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update review status");
      }

      setCustomerReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, isApproved: newStatus } : r))
      );
      setAlert({
        type: "success",
        text: `Review is now ${newStatus ? "approved and visible" : "hidden from public view"}.`,
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({
        type: "error",
        text: err.message || "Could not update review status.",
      });
    } finally {
      setTogglingReviewId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-300 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>Community Stories & Review Management</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Reader Reviews & Testimonials
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage public showcase stories on{" "}
            <Link
              href="/success-stories"
              target="_blank"
              className="text-amber-800 underline hover:text-amber-900 inline-flex items-center gap-1 font-medium"
            >
              /success-stories
              <ExternalLink className="w-3 h-3" />
            </Link>{" "}
            and delete or moderate verified customer book reviews.
          </p>
        </div>

        {/* Action Buttons for Featured Stories */}
        {currentTab === "FEATURED" && (
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
        )}
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

      {/* Main Mode Tabs: 4 Featured Stories vs Customer Book Reviews */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
        <button
          onClick={() => setCurrentTab("FEATURED")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentTab === "FEATURED"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>4 Featured Showcase Stories</span>
        </button>

        <button
          onClick={() => setCurrentTab("REVIEWS")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentTab === "REVIEWS"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Customer Book Reviews</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              currentTab === "REVIEWS"
                ? "bg-amber-400 text-stone-950"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {customerReviews.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: 4 FEATURED SHOWCASE STORIES */}
      {/* ============================================================== */}
      {currentTab === "FEATURED" && (
        <div className="space-y-6">
          {/* 4 Story Selector Pills */}
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
                      Slot #{idx + 1}
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
                    {story.name || `[Empty Slot ${idx + 1}]`}
                  </div>
                  <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {story.bookTitle || "Select a book..."}
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
                <div className="flex items-center gap-3">
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

                  <button
                    onClick={handleClearSlot}
                    type="button"
                    title="Clear content from this slot"
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                      <div className="text-xs font-semibold text-gray-900">
                        {activeStory.name || "Reader Name"}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {activeStory.role || "Profession / Role"}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {activeStory.location || "City, State"} • {activeStory.date || "Date"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-900">
                      <BookOpen className="w-3 h-3 text-gray-400" />
                      <span className="line-clamp-1">{activeStory.bookTitle || "Book Title"}</span>
                      <ArrowRight className="w-3 h-3 text-amber-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: CUSTOMER BOOK REVIEWS MODERATION & DELETION */}
      {/* ============================================================== */}
      {currentTab === "REVIEWS" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Customer Book Reviews ({customerReviews.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Reviews submitted by verified purchasers on individual book sales pages. You can delete or hide any review at any time.
              </p>
            </div>
          </div>

          {customerReviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No Reviews in Database</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                There are currently no reviews on any books. When customers purchase an edition and submit a rating, it will show up here for moderation and deletion.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customerReviews.map((rev) => {
                const isDeleting = deletingReviewId === rev.id;
                const isToggling = togglingReviewId === rev.id;

                return (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
                  >
                    <div>
                      {/* Top Row: Stars + Status Badges + Delete Button */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
                            {rev.title}
                          </h3>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Approve / Hide Toggle */}
                          <button
                            onClick={() => handleToggleApproveReview(rev)}
                            disabled={isToggling}
                            title={rev.isApproved ? "Click to hide from public" : "Click to approve and show"}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                              rev.isApproved
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            {rev.isApproved ? "Visible" : "Hidden"}
                          </button>

                          {/* Permanently Delete Button */}
                          <button
                            onClick={() => handleDeleteCustomerReview(rev)}
                            disabled={isDeleting}
                            title="Delete this review permanently"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs text-gray-600 leading-relaxed font-light mb-4">
                        {rev.comment}
                      </p>
                    </div>

                    {/* Footer: User info & Book connection */}
                    <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-[10px]">
                            {rev.user.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block leading-tight">
                              {rev.user.name}
                            </span>
                            <span className="text-[10px] text-gray-400">{rev.user.email}</span>
                          </div>
                        </div>

                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>

                      <div className="pt-1.5 flex items-center justify-between text-[11px] text-gray-500">
                        <Link
                          href={`/books/${rev.book.slug}`}
                          target="_blank"
                          className="font-medium text-amber-800 hover:underline line-clamp-1 inline-flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{rev.book.title}</span>
                        </Link>
                        <span className="shrink-0 text-[10px] text-gray-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
