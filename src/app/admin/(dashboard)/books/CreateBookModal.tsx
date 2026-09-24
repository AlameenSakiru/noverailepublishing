"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  X,
  BookOpen,
  Check,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  FileText,
  Shield,
  Upload,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Award,
  Layers,
  FileUp,
  Image as ImageIcon,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  authors: { id: string; name: string }[];
  imprints: { id: string; name: string }[];
}

export function CreateBookModal({
  isOpen,
  onClose,
  categories,
  authors,
  imprints,
}: CreateBookModalProps) {
  const router = useRouter();

  // 3-Step Publishing Workflow
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Upload States
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [coverUploading, setCoverUploading] = useState(false);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [coverFileSize, setCoverFileSize] = useState<string | null>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<string | null>(null);
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Details
    language: "English",
    title: "",
    subtitle: "",
    slug: "",
    edition: "1st Edition",
    authorId: authors[0]?.id || "",
    imprintId: imprints[0]?.id || "",
    categoryId: categories[0]?.id || "",
    publishingRights: "OWNED",
    shortDescription: "",
    description: "",
    // Exam Prep
    isExamPrep: false,
    examName: "",
    examAcronym: "",
    examAuthority: "",
    profession: "",

    // Step 2: Content (Cover JPG + Manuscript PDF)
    coverImageUrl: "", // clean initial state
    manuscriptPdfUrl: "",
    drmEnabled: true,
    hasIsbn: false,
    isbn: "",
    chapter1Title: "Chapter 1: Introduction & Foundational Concepts",
    chapter1Content: "Welcome to this publication. Review the foundational principles and diagnostic review in the sections below.",

    // Step 3: Pricing & Royalties
    royaltyPlan: "70", // "70" | "35"
    price: "29.99",
    salePrice: "",
    isFeatured: false,
    isBestseller: false,
    enableLending: true,
    termsAccepted: true,
  });

  if (!isOpen) return null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const autoSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug === "" || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug,
    }));
  };

  // Upload JPG Cover Image logic
  const processCoverFile = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/) && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
      setError("Please select a JPG or JPEG image for the book cover.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Cover image size must be under 15MB.");
      return;
    }

    setError(null);
    setCoverUploading(true);
    setCoverFileName(file.name);
    setCoverFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverImageUrl: localUrl }));

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("type", "cover");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload cover image.");
        setCoverUploading(false);
        return;
      }

      setFormData((prev) => ({ ...prev, coverImageUrl: data.url }));
      setCoverUploading(false);
    } catch {
      setError("Network interruption uploading cover image. Please try again.");
      setCoverUploading(false);
    }
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCoverFile(file);
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({ ...prev, coverImageUrl: "" }));
    setCoverFileName(null);
    setCoverFileSize(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // Upload Manuscript PDF logic
  const processPdfFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf" && file.type !== "application/x-pdf") {
      setError("Please select a valid PDF manuscript file (.pdf).");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("PDF manuscript file must be under 100MB.");
      return;
    }

    setError(null);
    setPdfUploading(true);
    setPdfUploadSuccess(false);
    setPdfFileName(file.name);
    setPdfFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("type", "manuscript");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload manuscript PDF.");
        setPdfUploading(false);
        return;
      }

      setFormData((prev) => ({ ...prev, manuscriptPdfUrl: data.url }));
      setPdfUploading(false);
      setPdfUploadSuccess(true);
    } catch {
      setError("Network interruption uploading manuscript PDF. Please try again.");
      setPdfUploading(false);
    }
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPdfFile(file);
  };

  const handleRemovePdf = () => {
    setFormData((prev) => ({ ...prev, manuscriptPdfUrl: "" }));
    setPdfFileName(null);
    setPdfFileSize(null);
    setPdfUploadSuccess(false);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  // Pricing calculations
  const numericPrice = parseFloat(formData.price) || 0;
  const numericSalePrice = formData.salePrice ? parseFloat(formData.salePrice) : null;
  const activeCalcPrice = numericSalePrice && numericSalePrice > 0 ? numericSalePrice : numericPrice;
  const royaltyMultiplier = formData.royaltyPlan === "70" ? 0.7 : 0.35;
  const estimatedRoyaltyPerUnit = (activeCalcPrice * royaltyMultiplier).toFixed(2);

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      setError("Please enter a book title.");
      return false;
    }
    if (!formData.slug.trim()) {
      setError("Please provide a valid web URL slug.");
      return false;
    }
    if (!formData.categoryId) {
      setError("Please select a category.");
      return false;
    }
    if (!formData.authorId) {
      setError("Please select an author.");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Please write a description for this publication.");
      return false;
    }
    if (formData.isExamPrep && (!formData.examAcronym.trim() || !formData.examName.trim())) {
      setError("Please provide both the Exam Acronym and Full Exam Name.");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.coverImageUrl || !formData.coverImageUrl.trim()) {
      setError("Please upload a JPG image for your book cover.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (targetStatus: "PUBLISHED" | "DRAFT") => {
    if (numericPrice <= 0) {
      setError("List price must be greater than $0.00.");
      return;
    }
    if (!formData.termsAccepted) {
      setError("Please confirm compliance with Noveraile publishing terms.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim() || null,
        slug: formData.slug.trim().toLowerCase(),
        isbn: formData.hasIsbn && formData.isbn.trim() ? formData.isbn.trim() : null,
        edition: formData.edition.trim() || "1st Edition",
        language: formData.language,
        price: numericPrice,
        salePrice: numericSalePrice,
        categoryId: formData.categoryId,
        authorId: formData.authorId,
        imprintId: formData.imprintId || null,
        coverImage: formData.coverImageUrl,
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim() || formData.description.slice(0, 160).trim(),
        status: targetStatus,
        isFeatured: formData.isFeatured,
        isBestseller: formData.isBestseller,
        specifications: {
          manuscriptPdfUrl: formData.manuscriptPdfUrl || null,
          manuscriptFileName: pdfFileName || null,
          manuscriptFileSize: pdfFileSize || null,
          drmEnabled: formData.drmEnabled,
          royaltyPlan: formData.royaltyPlan,
        },
        examName: formData.isExamPrep ? formData.examName.trim() : null,
        examAcronym: formData.isExamPrep ? formData.examAcronym.trim() : null,
        examAuthority: formData.isExamPrep ? formData.examAuthority.trim() : null,
        profession: formData.isExamPrep ? formData.profession.trim() : null,
        samplePages: [
          {
            title: formData.chapter1Title || "Chapter 1",
            chapterTitle: "Introduction",
            contentHtml: `<div class="prose max-w-none"><p class="lead">${formData.chapter1Content}</p></div>`,
            wordCount: formData.chapter1Content.split(/\s+/).length,
          },
        ],
      };

      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create publication.");
        setLoading(false);
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("Network error while creating publication.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                  Publishing Console
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-xs text-gray-300">New Publication</span>
              </div>
              <h2 className="font-serif text-lg font-bold text-white tracking-tight">
                Add New Book Publication
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Steps Stepper */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2.5 text-xs font-semibold transition-all ${
                currentStep === 1
                  ? "text-gray-900 font-bold"
                  : currentStep > 1
                  ? "text-emerald-700 hover:text-gray-900"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  currentStep === 1
                    ? "bg-gray-900 text-white ring-4 ring-gray-200"
                    : currentStep > 1
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-[10px] uppercase text-gray-400">Step 1</span>
                <span>Book Details</span>
              </div>
            </button>

            <div className={`flex-1 h-0.5 mx-3 ${currentStep > 1 ? "bg-emerald-500" : "bg-gray-200"}`} />

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className={`flex items-center gap-2.5 text-xs font-semibold transition-all ${
                currentStep === 2
                  ? "text-gray-900 font-bold"
                  : currentStep > 2
                  ? "text-emerald-700 hover:text-gray-900"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  currentStep === 2
                    ? "bg-gray-900 text-white ring-4 ring-gray-200"
                    : currentStep > 2
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4" /> : "2"}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-[10px] uppercase text-gray-400">Step 2</span>
                <span>Cover & PDF Manuscript</span>
              </div>
            </button>

            <div className={`flex-1 h-0.5 mx-3 ${currentStep > 2 ? "bg-emerald-500" : "bg-gray-200"}`} />

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => {
                if (validateStep1() && validateStep2()) setCurrentStep(3);
              }}
              className={`flex items-center gap-2.5 text-xs font-semibold transition-all ${
                currentStep === 3
                  ? "text-gray-900 font-bold"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  currentStep === 3
                    ? "bg-gray-900 text-white ring-4 ring-gray-200"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                3
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-[10px] uppercase text-gray-400">Step 3</span>
                <span>Pricing & Royalties</span>
              </div>
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-800">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Please check the following</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: BOOK DETAILS                                                      */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Title & Subtitle */}
              <div className="p-5 bg-white rounded-xl border border-gray-200 space-y-4 shadow-2xs">
                <h3 className="font-bold text-gray-900 text-sm">
                  1. Title & Web Address
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="e.g. Master Clinical Pharmacology Review"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-serif font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Subtitle (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g. Complete Diagnostic Question Bank, Case Studies & Practice Exam"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        URL Slug *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono text-gray-900"
                      />
                      <span className="text-[11px] text-gray-400 mt-0.5 block">
                        Direct link: /books/{formData.slug || "slug"}
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Edition / Version
                      </label>
                      <input
                        type="text"
                        value={formData.edition}
                        onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                        placeholder="e.g. 1st Edition, 2027 Edition"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Author & Taxonomy */}
              <div className="p-5 bg-white rounded-xl border border-gray-200 space-y-4 shadow-2xs">
                <h3 className="font-bold text-gray-900 text-sm">
                  2. Author & Category
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Author *
                    </label>
                    <select
                      value={formData.authorId}
                      onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 font-medium"
                    >
                      {authors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Primary Category *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Imprint (Publisher)
                    </label>
                    <select
                      value={formData.imprintId}
                      onChange={(e) => setFormData({ ...formData, imprintId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 font-medium"
                    >
                      <option value="">Noveraile Publishing</option>
                      {imprints.map((imp) => (
                        <option key={imp.id} value={imp.id}>
                          {imp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Exam Prep Accordion */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isExamPrep}
                    onChange={(e) => setFormData({ ...formData, isExamPrep: e.target.checked })}
                    className="rounded text-amber-700 focus:ring-amber-700 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-amber-950 text-xs">
                      This is an Exam Prep or Certification Guide
                    </span>
                    <p className="text-[11px] text-amber-800">
                      Adds an official exam acronym badge (e.g. PTCB, NCLEX-RN, Security+) on storefront cards.
                    </p>
                  </div>
                </label>

                {formData.isExamPrep && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200">
                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">
                        Exam Acronym *
                      </label>
                      <input
                        type="text"
                        value={formData.examAcronym}
                        onChange={(e) => setFormData({ ...formData, examAcronym: e.target.value })}
                        placeholder="e.g. NCLEX-RN"
                        className="w-full px-3 py-1.5 border border-amber-300 bg-white rounded-lg text-xs font-mono font-bold text-amber-950"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">
                        Full Exam Name *
                      </label>
                      <input
                        type="text"
                        value={formData.examName}
                        onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                        placeholder="e.g. National Council Licensure Examination"
                        className="w-full px-3 py-1.5 border border-amber-300 bg-white rounded-lg text-xs text-amber-950"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Book Descriptions */}
              <div className="p-5 bg-white rounded-xl border border-gray-200 space-y-4 shadow-2xs">
                <h3 className="font-bold text-gray-900 text-sm">
                  3. Book Descriptions
                </h3>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Short Summary (Shown on search cards and catalog previews)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Brief 1-2 sentence overview of the book..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Full Description (Shown on public book sales page) *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide a complete description of the chapters, who this book is for, and key takeaways..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: COVER (JPG) & MANUSCRIPT (PDF)                                     */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* SECTION 1: UPLOAD JPG BOOK COVER */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-brand-700" />
                      <span>1. Book Cover Image (.jpg, .jpeg) *</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Upload the front cover image for this book. Recommended format: high-resolution JPG/JPEG (e.g. 1600 × 2400px).
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-[10px] font-semibold">
                    JPG / JPEG
                  </span>
                </div>

                {/* Cover Upload Dropzone & Live Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                  
                  {/* Upload Dropzone */}
                  <div className="md:col-span-2 space-y-3">
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverFileSelect}
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                    />

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingCover(true);
                      }}
                      onDragLeave={() => setIsDraggingCover(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingCover(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processCoverFile(file);
                      }}
                      onClick={() => coverInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
                        isDraggingCover
                          ? "border-brand-ink bg-brand-50/50 scale-[1.01]"
                          : "border-gray-300 hover:border-gray-500 bg-gray-50/40 hover:bg-gray-50"
                      }`}
                    >
                      <div className="p-3 rounded-full bg-white shadow-xs text-gray-700 border border-gray-200">
                        {coverUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-brand-700" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-700" />
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-gray-900 text-xs block">
                          {coverUploading ? "Uploading cover image..." : "Drag & drop your JPG cover here, or browse"}
                        </span>
                        <span className="text-[11px] text-gray-500 block mt-0.5">
                          Standard portrait ratio (1:1.5 or 1:1.6). Maximum file size: 15MB.
                        </span>
                      </div>

                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold text-[11px] transition-colors shadow-2xs"
                      >
                        Choose JPG File
                      </button>
                    </div>

                    {/* Upload Status Confirmation */}
                    {formData.coverImageUrl && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
                        <div className="flex items-center gap-2.5 text-emerald-950">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold block truncate max-w-xs">
                              {coverFileName || "Cover Image Selected"}
                            </span>
                            <span className="text-[10px] text-emerald-700">
                              {coverFileSize ? `${coverFileSize} • ` : ""}Cover image loaded & ready
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="px-2 py-1 rounded bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveCover}
                            className="px-2 py-1 rounded bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-[11px] transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Image URL fallback */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Or specify direct Image URL:
                      </label>
                      <input
                        type="text"
                        value={formData.coverImageUrl}
                        onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                        placeholder="https://... or /covers/your-cover.jpg"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  {/* Live Cover Preview Mockup */}
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                      Cover Preview
                    </span>
                    <div className="relative w-32 aspect-[3/4] rounded-lg shadow-md overflow-hidden border border-gray-300 bg-white flex items-center justify-center">
                      {formData.coverImageUrl ? (
                        <Image
                          src={formData.coverImageUrl}
                          alt="Cover Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="p-3 text-center text-gray-400 flex flex-col items-center justify-center">
                          <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                          <span className="text-[10px] leading-tight">No cover image uploaded yet</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-900 text-center mt-2.5 line-clamp-2 max-w-[140px]">
                      {formData.title || "Book Title"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: UPLOAD PDF MANUSCRIPT */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-brand-700" />
                      <span>2. Book Interior & Manuscript (.pdf)</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Upload the complete interior PDF version of your book. Customers with active entitlements read this inside the protected reader.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono text-[10px] font-semibold border border-rose-100">
                    PDF Document
                  </span>
                </div>

                <input
                  type="file"
                  ref={pdfInputRef}
                  onChange={handlePdfFileSelect}
                  accept="application/pdf,.pdf"
                  className="hidden"
                />

                {/* PDF Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(true);
                  }}
                  onDragLeave={() => setIsDraggingPdf(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processPdfFile(file);
                  }}
                  onClick={() => pdfInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
                    isDraggingPdf
                      ? "border-brand-ink bg-brand-50/50 scale-[1.01]"
                      : "border-gray-300 hover:border-gray-500 bg-gray-50/40 hover:bg-gray-50"
                  }`}
                >
                  <div className="p-3 rounded-full bg-white shadow-xs text-rose-600 border border-gray-200">
                    {pdfUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-brand-700" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-gray-900 text-xs block">
                      {pdfUploading ? "Uploading PDF manuscript..." : "Drag & drop your Book PDF file here, or browse"}
                    </span>
                    <span className="text-[11px] text-gray-500 block mt-0.5">
                      Complete interior manuscript (.pdf). Maximum file size: 100MB.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold text-[11px] transition-colors shadow-2xs"
                  >
                    Choose PDF File
                  </button>
                </div>

                {/* PDF Uploaded Status Card */}
                {formData.manuscriptPdfUrl && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                    <div className="flex items-center gap-3 text-emerald-950">
                      <div className="p-2 rounded-xl bg-white border border-emerald-200 text-rose-600 shadow-2xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold block truncate max-w-sm text-xs">
                          {pdfFileName || "Book Interior Manuscript.pdf"}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-emerald-700 font-medium">
                            {pdfFileSize ? `${pdfFileSize} • ` : ""}Uploaded & Ready for Digital Reader
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900 font-mono text-[9px] font-bold">
                            ATTACHED
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={formData.manuscriptPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-semibold text-[11px] transition-colors shadow-2xs"
                        title="Open PDF in new tab to verify"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View / Test PDF</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
                      >
                        Replace PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        className="px-2 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-[11px] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: DIGITAL RIGHTS & IDENTIFIERS */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-4 shadow-2xs">
                <h3 className="font-bold text-gray-900 text-sm">
                  3. Rights & Catalog Identifiers
                </h3>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.drmEnabled}
                      onChange={(e) => setFormData({ ...formData, drmEnabled: e.target.checked })}
                      className="rounded text-gray-900 focus:ring-gray-900 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-gray-900 block text-xs">
                        Enable Digital Rights & Protected In-Browser Reading
                      </span>
                      <span className="text-[11px] text-gray-500 leading-relaxed block mt-0.5">
                        Protects your publication by streaming pages inside the authenticated Noveraile Reader with dynamic anti-piracy watermarking.
                      </span>
                    </div>
                  </label>

                  <div className="p-3.5 rounded-xl border border-gray-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasIsbn}
                        onChange={(e) => setFormData({ ...formData, hasIsbn: e.target.checked })}
                        className="rounded text-gray-900 focus:ring-gray-900 w-4 h-4"
                      />
                      <span className="font-semibold text-gray-800 text-xs">
                        This publication has an official ISBN
                      </span>
                    </label>

                    {formData.hasIsbn && (
                      <div className="pt-1 max-w-sm">
                        <input
                          type="text"
                          value={formData.isbn}
                          onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                          placeholder="978-1-..."
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PRICING & ROYALTIES                                               */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Royalty Tier Selection */}
              <div className="p-5 bg-white rounded-xl border border-gray-200 space-y-4 shadow-2xs">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    1. Select Royalty Plan
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Choose the monetization split for this digital title.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                      formData.royaltyPlan === "70"
                        ? "border-gray-900 bg-gray-50 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-base">70% Royalty Plan</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold">
                            STANDARD
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1">
                          Standard author & publisher margin for commercial digital sales.
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="royaltyPlan"
                        checked={formData.royaltyPlan === "70"}
                        onChange={() => setFormData({ ...formData, royaltyPlan: "70" })}
                        className="text-gray-900 focus:ring-gray-900 mt-1"
                      />
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                      formData.royaltyPlan === "35"
                        ? "border-gray-900 bg-gray-50 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-gray-900 text-base">35% Royalty Plan</span>
                        <p className="text-[11px] text-gray-600 mt-1">
                          Reduced tier for promotional or external distribution partnerships.
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="royaltyPlan"
                        checked={formData.royaltyPlan === "35"}
                        onChange={() => setFormData({ ...formData, royaltyPlan: "35" })}
                        className="text-gray-900 focus:ring-gray-900 mt-1"
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Price Setting */}
              <div className="p-5 bg-white rounded-xl border border-gray-200 space-y-4 shadow-2xs">
                <h3 className="font-bold text-gray-900 text-sm">
                  2. Pricing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Digital List Price (USD $) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="29.99"
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-900"
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      Standard retail price
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Sale / Promotional Price (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        placeholder="e.g. 19.99"
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-emerald-700"
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      If entered, original price is struck through
                    </span>
                  </div>
                </div>

                {/* Royalty Breakdown Box */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      <span>Net Realized Royalty per Sale</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-mono text-[10px] font-bold">
                      {formData.royaltyPlan}% PLAN
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Retail Price</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">
                        ${activeCalcPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Delivery Fee</span>
                      <span className="text-sm font-bold text-gray-700 font-mono">
                        $0.00
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Royalty Split</span>
                      <span className="text-sm font-bold text-gray-700 font-mono">
                        {formData.royaltyPlan}%
                      </span>
                    </div>

                    <div className="bg-emerald-600 text-white p-2.5 rounded-lg">
                      <span className="text-[10px] text-emerald-100 block font-medium">Estimated Royalty</span>
                      <span className="text-sm font-bold text-white font-mono">
                        ${estimatedRoyaltyPerUnit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Publication Checklist Confirmation */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    className="mt-0.5 rounded text-gray-900 focus:ring-gray-900"
                  />
                  <div className="text-[11px] text-gray-600">
                    <strong className="text-gray-900 block font-semibold">
                      Publishing Rights & Quality Confirmation
                    </strong>
                    I confirm that this publication complies with Noveraile publishing standards and that I hold all necessary rights for digital distribution.
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs transition-colors"
              >
                <span>Save and Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit("DRAFT")}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit("PUBLISHED")}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? "Publishing Book..." : "Publish Book"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
