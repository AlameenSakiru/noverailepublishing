"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ShoppingBag,
  Check,
  ZoomIn,
  ZoomOut,
  BookOpen,
  ArrowDown,
  Sparkles,
  ShieldCheck,
  Zap,
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

/**
 * Individual Retina PDF Page Canvas for Continuous Vertical Scrolling
 */
function PdfPageItem({
  pdfDoc,
  pageNumber,
  zoomLevel,
  index,
  total,
}: {
  pdfDoc: any;
  pageNumber: number;
  zoomLevel: number;
  index: number;
  total: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState(false);
  const renderTaskRef = useRef<any>(null);

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

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

      const windowWidth = typeof window !== "undefined" ? window.innerWidth : 800;
      const isMobile = windowWidth < 640;

      const unscaledViewport = page.getViewport({ scale: 1.0 });

      // Target reading column width (Amazon Kindle continuous scroll width)
      const targetWidth = isMobile
        ? Math.min(windowWidth - 32, 540)
        : Math.min(windowWidth - 96, 760);

      const baseScale = targetWidth / unscaledViewport.width;
      const currentScale = baseScale * (zoomLevel / 100);

      // HiDPI 2x device pixel ratio for crystal clear text
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
      setRendered(true);
      setError(false);
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.error(`Error rendering page ${pageNumber}:`, err);
        setError(true);
      }
    }
  }, [pdfDoc, pageNumber, zoomLevel]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  return (
    <div id={`preview-page-${pageNumber}`} className="flex flex-col items-center w-full mb-8 scroll-mt-24">
      {/* Amazon-style Page Header Tag */}
      <div className="flex items-center justify-between w-full max-w-[760px] px-2 py-1.5 text-xs text-slate-500 font-sans">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
          Sample Page {pageNumber}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {index + 1} of {total}
        </span>
      </div>

      {/* Physical Book Page with Gutter Binding & Drop Shadow */}
      <div className="relative rounded-sm shadow-[0_12px_32px_rgba(0,0,0,0.18)] bg-white border border-slate-200 overflow-hidden transition-transform duration-200">
        {/* Amazon Kindle Book Gutter Shadow on Left Margin */}
        <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-black/10 via-black/2 to-transparent pointer-events-none z-10" />

        {/* Loading placeholder skeleton while PDF renders */}
        {!rendered && !error && (
          <div className="w-[320px] sm:w-[680px] h-[480px] sm:h-[880px] flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
            <div className="w-8 h-8 border-2 border-[#ff9900] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-sans text-slate-500">Loading page {pageNumber}...</span>
          </div>
        )}

        <canvas ref={canvasRef} className="block max-w-full h-auto reader-canvas" />

        {error && (
          <div className="p-12 text-center text-slate-400">
            <p className="text-xs">Page {pageNumber} excerpt unavailable.</p>
          </div>
        )}
      </div>
    </div>
  );
}

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

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [loading, setLoading] = useState(true);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfJsReady, setPdfJsReady] = useState(false);

  // Text Fallback State (if PDF stream is not present)
  const [textPages, setTextPages] = useState<any[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { addItem, isInCart } = useCart();
  const inCart = isInCart(bookId);

  const displayPrice = salePrice != null && salePrice > 0 ? salePrice : price;

  // 1. Reset zoom & scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(100);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, bookId]);

  // 2. Load Mozilla PDF.js from CDN
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
        console.warn("PDF stream unavailable, falling back to text scroll:", err);
        if (isMounted) {
          setViewMode("text");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfJsReady, bookId, viewMode]);

  // 4. Fallback text pages fetcher
  useEffect(() => {
    if (!isOpen || viewMode !== "text") return;

    let isMounted = true;
    setLoading(true);

    Promise.all(
      validPages.map((pg) =>
        fetch(`/api/reader/page?bookId=${bookId}&pageNumber=${pg}`)
          .then((r) => r.json())
          .catch(() => null)
      )
    ).then((results) => {
      if (isMounted) {
        setTextPages(results.filter((r) => r && r.success));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, viewMode, bookId, validPages]);

  // 5. ESC Key Close Listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`preview-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToBuy = () => {
    const el = document.getElementById("end-of-sample-card");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-full sm:h-[95vh] rounded-none sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-[#eef0f3] border border-slate-300/80">
        {/* Amazon-Style Top Command Header */}
        <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#131921] text-white border-b border-[#232f3e] shrink-0 z-20 shadow-md">
          {/* Left: Book Cover + Title + Amazon Look Inside Badge */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Book Miniature */}
            <div className="relative w-7 h-10 rounded shadow-xs overflow-hidden border border-white/20 shrink-0 bg-slate-800">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={bookTitle}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-amber-400">
                  <BookOpen className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff9900] uppercase tracking-wider font-sans">
                  <span>Look Inside</span>
                  <span className="text-[9px]">▼</span>
                </span>
                <span className="text-gray-500 text-xs hidden sm:inline">•</span>
                <span className="text-[11px] text-gray-300 hidden sm:inline font-medium">
                  {validPages.length} Pages Free Sample
                </span>
              </div>
              <h3 className="font-sans font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-md">
                {bookTitle}
              </h3>
              <p className="text-[11px] text-gray-400 truncate hidden sm:block">By {authorName}</p>
            </div>
          </div>

          {/* Right Header Toolbar: Page Jumper, Zoom & Amazon Amber Buy Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Zoom Controls */}
            {viewMode === "pdf" && (
              <div className="hidden md:flex items-center gap-1 bg-[#232f3e] rounded-md p-1 border border-white/10 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                  title="Zoom Out"
                  className="p-1 text-gray-300 hover:text-white rounded transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-gray-200 px-1 min-w-[34px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                  title="Zoom In"
                  className="p-1 text-gray-300 hover:text-white rounded transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Amazon Amber "Buy Now" Button in Header */}
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all ${
                inCart
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200]"
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>In Cart (${displayPrice.toFixed(2)})</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buy Book (${displayPrice.toFixed(2)})</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md bg-[#232f3e] hover:bg-[#37475a] text-gray-300 hover:text-white transition-colors"
              title="Close Look Inside (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Amazon Kindle Navigation Bar: Page Jump Pill Strip */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 bg-[#f8f9fa] border-b border-slate-300 text-xs text-slate-700 shrink-0 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-bold text-slate-600 mr-1 shrink-0 uppercase tracking-wider">
              Jump to:
            </span>
            {validPages.map((pg) => (
              <button
                key={pg}
                onClick={() => scrollToPage(pg)}
                className="px-2.5 py-1 rounded bg-white hover:bg-amber-50 hover:border-[#ff9900] border border-slate-300 text-slate-800 text-[11px] font-medium transition-all shrink-0 shadow-2xs"
              >
                Page {pg}
              </button>
            ))}

            <button
              onClick={scrollToBuy}
              className="px-2.5 py-1 rounded bg-[#fff8e7] hover:bg-[#ffebc2] border border-[#ff9900]/40 text-[#b12704] text-[11px] font-bold transition-all shrink-0"
            >
              Buy Full Book
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-sans shrink-0 hidden sm:block">
            Scroll down to read all <strong className="text-slate-800">{validPages.length} sample pages</strong>
          </div>
        </div>

        {/* Continuous Vertical Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start relative scroll-smooth bg-[#eef0f3]"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center my-auto py-24 gap-3 text-center">
              <div className="w-10 h-10 border-3 border-[#ff9900] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-sans font-bold text-slate-700">
                Opening Kindle Sample Preview...
              </p>
              <p className="text-xs text-slate-500">Preparing continuous reading stream</p>
            </div>
          ) : viewMode === "pdf" && pdfDoc ? (
            /* Continuous PDF Stream (One straight vertical feed) */
            <div className="w-full max-w-[800px] flex flex-col items-center">
              {validPages.map((pageNum, idx) => (
                <PdfPageItem
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  zoomLevel={zoomLevel}
                  index={idx}
                  total={validPages.length}
                />
              ))}

              {/* Amazon-Style End of Sample Card */}
              <div
                id="end-of-sample-card"
                className="w-full max-w-[760px] my-6 p-6 sm:p-10 rounded-lg bg-white border-2 border-dashed border-slate-300 text-slate-800 shadow-md flex flex-col items-center text-center scroll-mt-24"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 text-[#b12704] flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>

                <span className="text-xs font-bold uppercase tracking-widest text-[#c45500]">
                  End of Free Sample
                </span>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  Enjoyed the preview of {bookTitle}?
                </h3>

                <p className="text-sm text-slate-600 mt-2 max-w-lg leading-relaxed font-sans">
                  Buy the complete digital edition to continue reading immediately on your computer, tablet, or mobile browser with saved bookmarks and cloud sync.
                </p>

                {/* Pricing & Amazon-Style Buy Box */}
                <div className="my-6 p-4 rounded-lg bg-[#f8f9fa] border border-slate-200 w-full max-w-md flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-xs text-slate-500 block">Complete Digital Edition</span>
                    <span className="font-bold text-xl text-[#b12704] font-sans">
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
                    className={`px-6 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                      inCart
                        ? "bg-emerald-600 text-white"
                        : "bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200]"
                    }`}
                  >
                    {inCart ? "In Your Cart" : "Buy Now"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant Cloud Reader Access
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> DRM Protected & Secure
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Continuous Text Fallback View */
            <div className="w-full max-w-2xl bg-white text-slate-900 rounded-lg shadow-md p-6 sm:p-12 divide-y divide-slate-200">
              {textPages.map((page, idx) => (
                <div key={idx} id={`preview-page-${idx + 1}`} className="py-8 first:pt-0 last:pb-0 scroll-mt-24">
                  <div className="mb-4">
                    <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                      {page.chapterTitle} • Section {page.pageNumber}
                    </span>
                    <h2 className="font-serif text-xl font-bold text-slate-900 mt-0.5">{page.title}</h2>
                  </div>
                  <div
                    className="prose prose-slate max-w-none font-serif text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: page.contentHtml }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amazon-Style Bottom Sticky Banner */}
        <footer className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white border-t border-slate-300 text-slate-800 shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Reading free sample excerpt ({validPages.length} pages)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-base text-[#b12704]">
              ${displayPrice.toFixed(2)}
            </span>

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
              className={`px-5 py-2 rounded-md text-xs font-bold shadow-sm transition-all ${
                inCart
                  ? "bg-emerald-600 text-white"
                  : "bg-[#ffa41c] hover:bg-[#fa8900] text-black border border-[#ff8f00]"
              }`}
            >
              {inCart ? "In Your Cart" : "Buy Complete Book"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
