"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Save,
  Trash2,
  BookOpen,
  DollarSign,
  Layers,
  FileText,
  FileUp,
  Image as ImageIcon,
  Award,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Archive,
  Upload,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface BookToEdit {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  isbn: string | null;
  edition: string;
  language: string;
  price: number;
  salePrice: number | null;
  coverImage: string;
  description: string;
  shortDescription: string;
  specifications?: string | any | null;
  status: string;
  isFeatured: boolean;
  isBestseller: boolean;
  isComingSoon: boolean;
  categoryId: string;
  authorId: string;
  imprintId: string | null;
  examMetadata?: {
    examName: string;
    examAcronym: string;
    examAuthority: string;
    profession: string;
  } | null;
  _count?: {
    entitlements: number;
    orderItems?: number;
  };
}

interface EditBookModalProps {
  isOpen: boolean;
  book: BookToEdit | null;
  onClose: () => void;
  categories: { id: string; name: string }[];
  authors: { id: string; name: string }[];
  imprints: { id: string; name: string }[];
  onBookUpdated?: (updatedBook: any) => void;
  onBookDeleted?: (bookId: string) => void;
}

export function EditBookModal({
  isOpen,
  book,
  onClose,
  categories,
  authors,
  imprints,
  onBookUpdated,
  onBookDeleted,
}: EditBookModalProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "content" | "metadata">("general");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Cover upload states
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [coverFileSize, setCoverFileSize] = useState<string | null>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  // PDF manuscript upload states
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<string | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    slug: "",
    isbn: "",
    edition: "1st Edition",
    language: "English",
    price: "29.99",
    salePrice: "",
    status: "PUBLISHED",
    categoryId: "",
    authorId: "",
    imprintId: "",
    coverImage: "",
    manuscriptPdfUrl: "",
    drmEnabled: true,
    royaltyPlan: "70",
    description: "",
    shortDescription: "",
    isFeatured: false,
    isBestseller: false,
    isComingSoon: false,
    // Exam prep fields
    isExamPrep: false,
    examName: "",
    examAcronym: "",
    examAuthority: "",
    profession: "",
  });

  // Sync form when book prop changes
  useEffect(() => {
    if (book) {
      let specs: any = {};
      try {
        if (typeof book.specifications === "string") {
          specs = JSON.parse(book.specifications || "{}");
        } else if (typeof book.specifications === "object" && book.specifications !== null) {
          specs = book.specifications;
        }
      } catch {
        specs = {};
      }

      setFormData({
        title: book.title || "",
        subtitle: book.subtitle || "",
        slug: book.slug || "",
        isbn: book.isbn || "",
        edition: book.edition || "1st Edition",
        language: book.language || "English",
        price: book.price ? String(book.price) : "29.99",
        salePrice: book.salePrice ? String(book.salePrice) : "",
        status: book.status || "PUBLISHED",
        categoryId: book.categoryId || categories[0]?.id || "",
        authorId: book.authorId || authors[0]?.id || "",
        imprintId: book.imprintId || "",
        coverImage: book.coverImage || "",
        manuscriptPdfUrl: specs.manuscriptPdfUrl || "",
        drmEnabled: specs.drmEnabled ?? true,
        royaltyPlan: specs.royaltyPlan || "70",
        description: book.description || "",
        shortDescription: book.shortDescription || "",
        isFeatured: Boolean(book.isFeatured),
        isBestseller: Boolean(book.isBestseller),
        isComingSoon: Boolean(book.isComingSoon),
        isExamPrep: Boolean(book.examMetadata),
        examName: book.examMetadata?.examName || "",
        examAcronym: book.examMetadata?.examAcronym || "",
        examAuthority: book.examMetadata?.examAuthority || "",
        profession: book.examMetadata?.profession || "",
      });

      setCoverFileName(null);
      setCoverFileSize(null);
      setPdfFileName(specs.manuscriptFileName || (specs.manuscriptPdfUrl ? specs.manuscriptPdfUrl.split("/").pop() : null));
      setPdfFileSize(specs.manuscriptFileSize || null);

      setError(null);
      setSuccessMsg(null);
      setShowDeleteConfirm(false);
      setDeleteError(null);
    }
  }, [book, categories, authors]);

  if (!isOpen || !book) return null;

  // Process Cover file upload (JPG / PNG)
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

    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverImage: localUrl }));

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

      setFormData((prev) => ({ ...prev, coverImage: data.url }));
      setCoverUploading(false);
    } catch {
      setError("Network error while uploading cover image.");
      setCoverUploading(false);
    }
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCoverFile(file);
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({ ...prev, coverImage: "" }));
    setCoverFileName(null);
    setCoverFileSize(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // Process Manuscript file upload (PDF)
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
    } catch {
      setError("Network interruption uploading manuscript PDF.");
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
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
    }));
  };

  const handleGenerateSlug = () => {
    const generated = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setFormData((prev) => ({ ...prev, slug: generated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        specifications: {
          manuscriptPdfUrl: formData.manuscriptPdfUrl || null,
          manuscriptFileName: pdfFileName || null,
          manuscriptFileSize: pdfFileSize || null,
          drmEnabled: formData.drmEnabled,
          royaltyPlan: formData.royaltyPlan,
        },
      };

      const res = await fetch(`/api/admin/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update book.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Publication details and content updated successfully!");
      if (onBookUpdated) {
        onBookUpdated(data.book);
      }
      router.refresh();
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 700);
    } catch {
      setError("Network error updating book.");
      setLoading(false);
    }
  };

  const handleDelete = async (archiveFallback = false) => {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/books/${book.id}${archiveFallback ? "?archive=true" : ""}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete book.");
        setDeleteLoading(false);
        return;
      }

      if (onBookDeleted) {
        onBookDeleted(book.id);
      }
      router.refresh();
      setDeleteLoading(false);
      onClose();
    } catch {
      setDeleteError("Network error deleting book.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-ink text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-brand-ink line-clamp-1">
                  Edit Publication
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    formData.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-800"
                      : formData.status === "DRAFT"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {formData.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5 line-clamp-1">
                ID: {book.id} • Slug: /{formData.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/books/${formData.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-brand-ink hover:bg-gray-100 text-xs font-medium transition-colors"
              title="Preview Public Sales Page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sales Page</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-gray-100 px-6 bg-white overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === "general"
                ? "border-brand-ink text-brand-ink"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Title & Edition</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pricing")}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === "pricing"
                ? "border-brand-ink text-brand-ink"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pricing & Taxonomy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === "content"
                ? "border-brand-ink text-brand-ink"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cover & PDF Manuscript</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("metadata")}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === "metadata"
                ? "border-brand-ink text-brand-ink"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Badges & Exam Prep</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* TAB 1: GENERAL / TITLE */}
          {activeTab === "general" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Book Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Master Clinical Pharmacology Review"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-serif font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Complete Diagnostic Question Bank & Blueprint"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-gray-700">
                      URL Slug *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="text-[11px] text-brand-600 hover:text-brand-900 underline"
                    >
                      Generate from title
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Will be accessible at /books/{formData.slug || "slug"}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Publication Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live on Storefront)</option>
                    <option value="DRAFT">DRAFT (Hidden from Storefront)</option>
                    <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="978-1-987654-32-1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Edition / Version
                  </label>
                  <input
                    type="text"
                    value={formData.edition}
                    onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                    placeholder="e.g. 2027 Edition, 3rd Revised"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    placeholder="English"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <span className="text-gray-500 text-xs">
                    Current active readers:{" "}
                    <strong className="text-gray-900">{book._count?.entitlements || 0}</strong> licensed
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & TAXONOMY */}
          {activeTab === "pricing" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    List Price (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400 font-semibold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="29.99"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Standard regular list price for digital purchase
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Sale / Promotional Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400 font-semibold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder="Leave blank for regular price"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    If set, customers pay this promotional discounted price
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
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
                    Author / Contributor *
                  </label>
                  <select
                    value={formData.authorId}
                    onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  >
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Publishing Imprint
                  </label>
                  <select
                    value={formData.imprintId}
                    onChange={(e) => setFormData({ ...formData, imprintId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  >
                    <option value="">None / Primary Noveraile Publishing</option>
                    {imprints.map((imp) => (
                      <option key={imp.id} value={imp.id}>
                        {imp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COVER & PDF CONTENT */}
          {activeTab === "content" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* SECTION 1: BOOK COVER IMAGE (JPG) */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-brand-700" />
                      <span>1. Book Cover Image (.jpg, .jpeg) *</span>
                    </h4>
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
                  
                  {/* Upload Dropzone & URL */}
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
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                        isDraggingCover
                          ? "border-brand-ink bg-brand-50/50 scale-[1.01]"
                          : "border-gray-300 hover:border-gray-500 bg-gray-50/40 hover:bg-gray-50"
                      }`}
                    >
                      <div className="p-2.5 rounded-full bg-white shadow-xs text-gray-700 border border-gray-200">
                        {coverUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-brand-700" />
                        ) : (
                          <Upload className="w-5 h-5 text-gray-700" />
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-gray-900 text-xs block">
                          {coverUploading ? "Uploading cover image..." : "Drag & drop JPG cover here, or browse"}
                        </span>
                        <span className="text-[11px] text-gray-500 block mt-0.5">
                          Standard portrait ratio (1:1.5 or 1:1.6). Maximum file size: 15MB.
                        </span>
                      </div>

                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold text-[11px] transition-colors shadow-2xs"
                      >
                        Choose JPG File
                      </button>
                    </div>

                    {/* Cover Status Confirmation */}
                    {formData.coverImage && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
                        <div className="flex items-center gap-2.5 text-emerald-950">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold block truncate max-w-xs">
                              {coverFileName || formData.coverImage.split("/").pop() || "Cover Image Active"}
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
                        required
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        placeholder="https://... or /covers/your-cover.jpg"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-mono focus:outline-none focus:ring-1 focus:ring-brand-ink"
                      />
                    </div>
                  </div>

                  {/* Live Cover Preview Mockup */}
                  <div className="flex flex-col items-center justify-center p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Cover Preview
                    </span>
                    <div className="relative w-28 aspect-[3/4] rounded-lg shadow-md overflow-hidden border border-gray-300 bg-white flex items-center justify-center">
                      {formData.coverImage ? (
                        <Image
                          src={formData.coverImage}
                          alt="Cover Preview"
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                      ) : (
                        <div className="p-2 text-center text-gray-400 flex flex-col items-center justify-center">
                          <ImageIcon className="w-7 h-7 opacity-40 mb-1" />
                          <span className="text-[10px] leading-tight">No cover image</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-900 text-center mt-2 line-clamp-2 max-w-[130px]">
                      {formData.title || "Book Title"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: UPLOAD PDF MANUSCRIPT */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-brand-700" />
                      <span>2. Book Interior & Manuscript (.pdf)</span>
                    </h4>
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
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                    isDraggingPdf
                      ? "border-brand-ink bg-brand-50/50 scale-[1.01]"
                      : "border-gray-300 hover:border-gray-500 bg-gray-50/40 hover:bg-gray-50"
                  }`}
                >
                  <div className="p-2.5 rounded-full bg-white shadow-xs text-rose-600 border border-gray-200">
                    {pdfUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand-700" />
                    ) : (
                      <FileText className="w-5 h-5" />
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
                    className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold text-[11px] transition-colors shadow-2xs"
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
                          {pdfFileName || formData.manuscriptPdfUrl.split("/").pop() || "Book Interior Manuscript.pdf"}
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

              {/* SECTION 3: DESCRIPTIONS */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-4 shadow-2xs">
                <h4 className="font-bold text-gray-900 text-sm">
                  3. Book Descriptions
                </h4>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Short Summary (Card Blurb & Search Excerpt) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Brief punchy summary shown on storefront catalog cards..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Full Description (Sales Page Body) *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed multi-paragraph breakdown of curriculum, chapters, and topics covered..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-ink leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BADGES & EXAM PREP */}
          {activeTab === "metadata" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <span className="font-semibold text-gray-900 block text-xs">
                  Merchandising Flags
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-brand-ink focus:ring-brand-ink"
                    />
                    <span className="font-medium text-gray-800">Featured Title</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.isBestseller}
                      onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                      className="rounded text-brand-ink focus:ring-brand-ink"
                    />
                    <span className="font-medium text-gray-800">Bestseller Badge</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.isComingSoon}
                      onChange={(e) => setFormData({ ...formData, isComingSoon: e.target.checked })}
                      className="rounded text-brand-ink focus:ring-brand-ink"
                    />
                    <span className="font-medium text-gray-800">Coming Soon</span>
                  </label>
                </div>
              </div>

              {/* Exam Prep Accordion / Toggle */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isExamPrep}
                    onChange={(e) => setFormData({ ...formData, isExamPrep: e.target.checked })}
                    className="rounded text-amber-700 focus:ring-amber-700 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-amber-900 text-xs">
                      Exam Prep & Certification Blueprint
                    </span>
                    <p className="text-[11px] text-amber-800">
                      Enable specialized certification badges, syllabus tags, and acronym highlights
                    </p>
                  </div>
                </label>

                {formData.isExamPrep && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200">
                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">
                        Exam Acronym (e.g. PTCB, NCLEX-RN, SY0-701) *
                      </label>
                      <input
                        type="text"
                        required={formData.isExamPrep}
                        value={formData.examAcronym}
                        onChange={(e) => setFormData({ ...formData, examAcronym: e.target.value })}
                        placeholder="e.g. NCLEX-RN"
                        className="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg text-xs font-mono font-bold text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-700"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">
                        Full Exam Name *
                      </label>
                      <input
                        type="text"
                        required={formData.isExamPrep}
                        value={formData.examName}
                        onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                        placeholder="e.g. National Council Licensure Examination"
                        className="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg text-xs text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-700"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">
                        Governing Authority
                      </label>
                      <input
                        type="text"
                        value={formData.examAuthority}
                        onChange={(e) => setFormData({ ...formData, examAuthority: e.target.value })}
                        placeholder="e.g. NCSBN / CompTIA"
                        className="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg text-xs text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-700"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">
                        Profession / Field
                      </label>
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        placeholder="e.g. Nursing / Critical Care"
                        className="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg text-xs text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-700"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirmation Warning Box */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900 text-xs">
                    Confirm Deletion of &ldquo;{book.title}&rdquo;
                  </h4>
                  <p className="text-[11px] text-rose-800 mt-1">
                    Are you sure you want to remove this publication?
                    {book._count?.orderItems && book._count.orderItems > 0 ? (
                      <span className="block mt-1 font-semibold text-rose-950">
                        Notice: This title has {book._count.orderItems} registered customer order(s).
                        To safeguard customer access and financial ledger history, it will be safely <strong>Archived</strong> instead of wiped.
                      </span>
                    ) : (
                      <span className="block mt-1">
                        Since this title has 0 customer orders, it will be permanently removed from the catalog.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="p-2.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-[11px]">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => handleDelete(Boolean(book._count?.orderItems && book._count.orderItems > 0))}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleteLoading ? "Processing..." : book._count?.orderItems ? "Archive Publication" : "Permanently Delete"}</span>
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              {!showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Title...</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
