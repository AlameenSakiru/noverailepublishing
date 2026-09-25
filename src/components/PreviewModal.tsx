"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ShoppingBag,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Coffee,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  authorName: string;
  coverImage: string;
  price: number;
  salePrice?: number | null;
  previewPages: number[];
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

type AmbianceMode = "warm" | "light" | "dark";

export function PreviewModal({
  isOpen,
  onClose,
  bookId,
  bookSlug,
  bookTitle,
  authorName,
  coverImage,
  price,
  salePrice,
  previewPages = [1, 2, 3, 4, 5],
}: PreviewModalProps) {
  // Guaranteed 5-page opening excerpt
  const validPages =
    Array.isArray(previewPages) && previewPages.length >= 3
      ? previewPages
      : [1, 2, 3, 4, 5];

  // Total pages including the final "Publisher's Excerpt Completion Plate"
  const totalSlides = validPages.length + 1;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [ambiance, setAmbiance] = useState<AmbianceMode>("warm");
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [loading, setLoading] = useState(true);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfJsReady, setPdfJsReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Fallback text state
  const [textPageData, setTextPageData] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const { addItem, isInCart } = useCart();
  const inCart = isInCart(bookId);

  const isCompletionSlide = currentSlideIndex === validPages.length;
  const activePageNumber = !isCompletionSlide ? validPages[currentSlideIndex] : validPages[validPages.length - 1];

  const displayPrice = salePrice != null && salePrice > 0 ? salePrice : price;

  // 1. Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
      setZoomLevel(100);
      setRenderError(null);
    }
  }, [isOpen, bookId]);

  // 2. Load Mozilla PDF.js engine
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    if (window.pdfjsLib) {
      setPdfJsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        setPdfJsReady(true);
      }
    };
    script.onerror = () => {
      setViewMode("text");
      setPdfJsReady(false);
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isOpen]);

  // 3. Load PDF Document via preview stream
  useEffect(() => {
    if (!isOpen || !pdfJsReady || viewMode !== "pdf") return;

    let isMounted = true;
    setLoading(true);
    setRenderError(null);

    const streamUrl = `/api/reader/preview-stream?bookId=${bookId}`;

    const loadingTask = window.pdfjsLib.getDocument({
      url: streamUrl,
      withCredentials: true,
    });

    loadingTask.promise
      .then((loadedDoc: any) => {
        if (isMounted) {
          setPdfDoc(loadedDoc);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        console.warn("PDF stream unavailable, falling back to text:", err);
        if (isMounted) {
          setViewMode("text");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfJsReady, bookId, viewMode]);

  // 4. Render PDF Page onto Retina Canvas with physical book geometry
  const renderPdfPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !canvasRef.current || isCompletionSlide) return;

      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // Task cancellation
          }
        }

        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const containerWidth = containerRef.current?.clientWidth || 800;
        const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Target display width (simulating an open physical book page)
        const targetWidth = isMobile
          ? Math.max(containerWidth - 28, 280)
          : Math.min(containerWidth - 64, 760);

        const baseScale = targetWidth / unscaledViewport.width;
        const currentScale = baseScale * (zoomLevel / 100);

        // HiDPI 2x scaling for ultra-crisp typography
        const pixelRatio = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 2) : 2;
        const viewport = page.getViewport({ scale: currentScale * pixelRatio });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / pixelRatio}px`;
        canvas.style.height = `${viewport.height / pixelRatio}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    },
    [pdfDoc, zoomLevel, isCompletionSlide]
  );

  useEffect(() => {
    if (viewMode === "pdf" && pdfDoc && !isCompletionSlide) {
      renderPdfPage(activePageNumber);
    }
  }, [viewMode, pdfDoc, activePageNumber, zoomLevel, isCompletionSlide, renderPdfPage]);

  // 5. Fallback HTML Page Fetcher
  useEffect(() => {
    if (!isOpen || viewMode !== "text" || isCompletionSlide) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/reader/page?bookId=${bookId}&pageNumber=${activePageNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success) {
            setTextPageData(data);
          } else {
            setTextPageData(null);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, viewMode, bookId, activePageNumber, isCompletionSlide]);

  // 6. Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, totalSlides, onClose]);

  if (!isOpen) return null;

  // Atmosphere Theme Styles
  const ambianceStyles = {
    warm: {
      bg: "bg-[#181613]",
      header: "bg-[#1f1d19]/95 border-[#2e2a24]",
      subHeader: "bg-[#151411]/90 border-[#26231d]",
      textPrimary: "text-[#f5f1ea]",
      textMuted: "text-[#a39a8c]",
      paperBg: "bg-[#f9f7f2]",
      spineCrease: "from-black/15 via-transparent to-transparent",
      accent: "bg-[#c59a4b] text-[#1a1408] hover:bg-[#d6aa57]",
      pillActive: "bg-[#c59a4b] text-[#1a1408] font-bold shadow-xs",
      pillInactive: "bg-[#25221c] text-[#a39a8c] hover:text-[#f5f1ea] border-[#363229]",
    },
    light: {
      bg: "bg-[#edece8]",
      header: "bg-white/95 border-[#dcdad4]",
      subHeader: "bg-[#f4f3ef]/90 border-[#e3e1dc]",
      textPrimary: "text-[#1c1d21]",
      textMuted: "text-[#6c6e78]",
      paperBg: "bg-white",
      spineCrease: "from-black/10 via-transparent to-transparent",
      accent: "bg-[#0c111d] text-white hover:bg-[#202738]",
      pillActive: "bg-[#0c111d] text-white font-bold shadow-xs",
      pillInactive: "bg-white text-[#6c6e78] hover:text-[#1c1d21] border-[#dcdad4]",
    },
    dark: {
      bg: "bg-[#0e1015]",
      header: "bg-[#14171f]/95 border-[#1f2430]",
      subHeader: "bg-[#0b0d12]/90 border-[#1a1e28]",
      textPrimary: "text-[#e6e8ee]",
      textMuted: "text-[#878d9d]",
      paperBg: "bg-[#faf8f5]",
      spineCrease: "from-black/20 via-transparent to-transparent",
      accent: "bg-[#e6e8ee] text-[#0e1015] hover:bg-white",
      pillActive: "bg-[#e6e8ee] text-[#0e1015] font-bold shadow-xs",
      pillInactive: "bg-[#191d26] text-[#878d9d] hover:text-[#e6e8ee] border-[#252b38]",
    },
  }[ambiance];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className={`relative w-full max-w-5xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-black/20 ${ambianceStyles.bg} transition-colors duration-300`}
      >
        {/* Editorial Header */}
        <header
          className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b backdrop-blur-sm ${ambianceStyles.header} shrink-0 transition-colors duration-300`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Publisher Monogram Badge */}
            <div className="w-8 h-8 rounded-lg bg-[#c59a4b]/20 border border-[#c59a4b]/40 flex items-center justify-center text-[#c59a4b] shrink-0 font-serif font-bold text-xs tracking-widest">
              NP
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-[#c59a4b]">
                  Look Inside • Excerpt
                </span>
                <span className="text-[10px] text-gray-500">•</span>
                <span className="text-[11px] font-sans font-medium opacity-70 truncate hidden sm:inline">
                  Pages 1–{validPages.length}
                </span>
              </div>
              <h3 className={`font-serif italic text-sm sm:text-base font-medium truncate max-w-xs sm:max-w-md ${ambianceStyles.textPrimary}`}>
                {bookTitle}
              </h3>
            </div>
          </div>

          {/* Right Header Toolbar: Ambiance, Zoom & Close */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Reading Ambiance Toggle */}
            <div className="hidden sm:flex items-center gap-0.5 p-1 rounded-lg bg-black/10 border border-white/5">
              <button
                onClick={() => setAmbiance("warm")}
                title="Warm Library (Parchment)"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  ambiance === "warm" ? "bg-[#c59a4b] text-[#1a1408] shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setAmbiance("light")}
                title="Studio Light"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  ambiance === "light" ? "bg-white text-black shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setAmbiance("dark")}
                title="Midnight Dark"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  ambiance === "dark" ? "bg-slate-800 text-white shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            {viewMode === "pdf" && !isCompletionSlide && (
              <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-black/10 border border-white/5 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                  title="Zoom Out"
                  className="p-1.5 rounded hover:bg-black/15 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1 opacity-80 min-w-[34px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                  title="Zoom In"
                  className="p-1.5 rounded hover:bg-black/15 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-black/10 hover:bg-black/25 opacity-75 hover:opacity-100 transition-all ml-1"
              title="Close Excerpt (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Sub-Header: Elegant Page Scrubber & Table of Excerpt Contents */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-2 border-b text-xs ${ambianceStyles.subHeader} shrink-0 transition-colors duration-300`}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className={`text-[11px] font-medium mr-1.5 hidden sm:inline ${ambianceStyles.textMuted}`}>
              Excerpt Pages:
            </span>
            {validPages.map((pg, idx) => (
              <button
                key={pg}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-sans transition-all ${
                  currentSlideIndex === idx ? ambianceStyles.pillActive : ambianceStyles.pillInactive
                }`}
              >
                Page {pg}
              </button>
            ))}

            <button
              onClick={() => setCurrentSlideIndex(validPages.length)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-sans flex items-center gap-1 transition-all ${
                isCompletionSlide ? ambianceStyles.pillActive : ambianceStyles.pillInactive
              }`}
            >
              <Bookmark className="w-3 h-3" />
              <span>Complete Edition</span>
            </button>
          </div>

          <div className={`text-[11px] font-mono shrink-0 ${ambianceStyles.textMuted}`}>
            {!isCompletionSlide ? (
              <span>
                Page <strong className={ambianceStyles.textPrimary}>{currentSlideIndex + 1}</strong> of{" "}
                <strong className={ambianceStyles.textPrimary}>{validPages.length}</strong>
              </span>
            ) : (
              <span className="text-[#c59a4b] font-sans font-semibold">Excerpt Complete</span>
            )}
          </div>
        </div>

        {/* Reading Stage & Physical Book Canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 md:p-10 flex flex-col items-center justify-start relative scroll-smooth"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center my-auto py-24 gap-3 text-center">
              <div className="w-9 h-9 border-2 border-[#c59a4b] border-t-transparent rounded-full animate-spin" />
              <p className={`text-xs font-sans tracking-wider uppercase font-semibold ${ambianceStyles.textMuted}`}>
                Loading Book Manuscript...
              </p>
            </div>
          ) : !isCompletionSlide ? (
            /* Physical Book Page Representation */
            <div className="relative group my-auto flex flex-col items-center max-w-full">
              {/* Physical Book Shadow and Deckled Paper Border */}
              <div
                className={`relative rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden ${ambianceStyles.paperBg} border border-black/10 transition-all duration-300`}
              >
                {/* Book Spine Crease Gradient (simulating center binding on left edge) */}
                <div
                  className={`absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r ${ambianceStyles.spineCrease} pointer-events-none z-10`}
                />

                {/* Left Margin Accent Line */}
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-black/10 pointer-events-none z-10" />

                {/* PDF Canvas for Real Manuscript */}
                {viewMode === "pdf" ? (
                  <canvas ref={canvasRef} className="block max-w-full h-auto reader-canvas" />
                ) : (
                  /* Fallback HTML View */
                  <div className="p-8 sm:p-14 max-w-2xl font-serif text-slate-900 leading-relaxed">
                    <div className="border-b border-gray-200 pb-3 mb-6">
                      <span className="text-[11px] font-sans uppercase tracking-widest text-[#c59a4b] font-bold">
                        {textPageData?.chapterTitle || "Chapter Overview"}
                      </span>
                      <h1 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                        {textPageData?.title || `Page ${activePageNumber}`}
                      </h1>
                    </div>
                    <div
                      className="prose prose-slate max-w-none text-base leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: textPageData?.contentHtml || "<p>Page preview unavailable.</p>",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Discreet Floating Previous / Next Click Zones */}
              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentSlideIndex === 0}
                className="hidden lg:flex absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white items-center justify-center transition-all disabled:opacity-0 disabled:pointer-events-none backdrop-blur-xs"
                title="Previous Page (←)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
                className="hidden lg:flex absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white items-center justify-center transition-all backdrop-blur-xs"
                title="Next Page (→)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            /* Masterpiece Publisher's Excerpt Completion Plate */
            <div className="w-full max-w-2xl my-auto p-8 sm:p-12 rounded-2xl bg-white/95 text-slate-900 shadow-2xl border border-black/10 flex flex-col items-center text-center animate-in fade-in duration-300">
              {/* Book Cover Artwork Miniature */}
              <div className="relative w-24 sm:w-28 aspect-[2/3] rounded-md shadow-book overflow-hidden border border-black/10 mb-6 bg-slate-900">
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt={bookTitle}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-[#c59a4b]">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
              </div>

              <span className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-[#996f27] mb-1">
                Noveraile First Edition
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {bookTitle}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">By {authorName}</p>

              <div className="w-16 h-px bg-[#c59a4b]/40 my-6" />

              <p className="text-sm font-serif leading-relaxed text-slate-700 max-w-lg">
                You have reached the end of the opening 5-page sample excerpt. To continue reading the complete manuscript, acquire the full digital edition for instant access on any device.
              </p>

              {/* CTA Action Deck */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
                <button
                  onClick={() => {
                    if (!inCart) {
                      addItem({
                        bookId,
                        slug: bookSlug,
                        title: bookTitle,
                        author: authorName,
                        coverImage,
                        price,
                        salePrice,
                      });
                    }
                    onClose();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0c111d] hover:bg-[#1f273b] text-white text-xs font-semibold shadow-md transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-[#c59a4b]" />
                  <span>
                    Unlock Complete Book • ${displayPrice.toFixed(2)}
                  </span>
                </button>

                <button
                  onClick={() => setCurrentSlideIndex(0)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Read Excerpt Again</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Publisher Bottom Ribbon */}
        <footer
          className={`flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t ${ambianceStyles.header} shrink-0 transition-colors duration-300 gap-3`}
        >
          {/* Previous / Next Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${ambianceStyles.pillInactive}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
              disabled={currentSlideIndex === totalSlides - 1}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${ambianceStyles.pillInactive}`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Buy Bar */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right hidden md:block">
              <span className={`text-[10px] uppercase tracking-wider block ${ambianceStyles.textMuted}`}>
                Digital Edition
              </span>
              <span className={`font-serif font-bold text-sm ${ambianceStyles.textPrimary}`}>
                ${displayPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => {
                if (!inCart) {
                  addItem({
                    bookId,
                    slug: bookSlug,
                    title: bookTitle,
                    author: authorName,
                    coverImage,
                    price,
                    salePrice,
                  });
                }
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                inCart
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                  : ambianceStyles.accent
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Item in Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Unlock Complete Book (${displayPrice.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
