"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ShoppingBag,
  Check,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Lock,
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
  // Ensure we have a valid array of 3 to 5 preview pages
  const validPages =
    Array.isArray(previewPages) && previewPages.length > 0
      ? previewPages
      : [1, 2, 3, 4, 5];

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [loading, setLoading] = useState(true);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfJsReady, setPdfJsReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Text Fallback State
  const [textPageData, setTextPageData] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const { addItem, isInCart } = useCart();
  const inCart = isInCart(bookId);

  const activePageNumber = validPages[currentPageIndex] || 1;
  const isLastPreviewPage = currentPageIndex === validPages.length - 1;

  // 1. Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentPageIndex(0);
      setZoomLevel(100);
      setRenderError(null);
    }
  }, [isOpen, bookId]);

  // 2. Load PDF.js engine from Cloudflare CDN
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

  // 3. Load PDF Document via PDF.js
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
        console.warn("Could not load PDF manuscript preview, falling back to text:", err);
        if (isMounted) {
          setViewMode("text");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfJsReady, bookId, viewMode]);

  // 4. Render PDF Page onto Canvas
  const renderPdfPage = useCallback(
    async (pageNumber: number) => {
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

        const containerWidth = containerRef.current?.clientWidth || 760;
        const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const targetWidth = isMobile
          ? Math.max(containerWidth - 24, 280)
          : Math.min(containerWidth - 48, 760);

        const baseScale = targetWidth / unscaledViewport.width;
        const currentScale = baseScale * (zoomLevel / 100);

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
          console.error(`Error rendering preview page ${pageNumber}:`, err);
        }
      }
    },
    [pdfDoc, zoomLevel]
  );

  useEffect(() => {
    if (viewMode === "pdf" && pdfDoc) {
      renderPdfPage(activePageNumber);
    }
  }, [viewMode, pdfDoc, activePageNumber, zoomLevel, renderPdfPage]);

  // 5. Fallback HTML Page Fetcher
  useEffect(() => {
    if (!isOpen || viewMode !== "text") return;

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
  }, [isOpen, viewMode, bookId, activePageNumber]);

  // 6. Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && currentPageIndex < validPages.length - 1) {
        setCurrentPageIndex((prev) => prev + 1);
      }
      if (e.key === "ArrowLeft" && currentPageIndex > 0) {
        setCurrentPageIndex((prev) => prev - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentPageIndex, validPages.length, onClose]);

  if (!isOpen) return null;

  const displayPrice = salePrice != null && salePrice > 0 ? salePrice : price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/80">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950/90 border-b border-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Look Inside</span>
            </span>
            <div className="min-w-0">
              <h4 className="font-serif text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
                {bookTitle}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">By {authorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Zoom Controls (PDF Mode) */}
            {viewMode === "pdf" && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                  title="Zoom Out"
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-300 px-1.5 min-w-[36px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                  title="Zoom In"
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Unlock Button */}
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
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                inCart
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold"
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>In Cart (${displayPrice.toFixed(2)})</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buy Book (${displayPrice.toFixed(2)})</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Close Preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Selector Strip */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-slate-900/90 border-b border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
              Sample Pages:
            </span>
            {validPages.map((pg, idx) => (
              <button
                key={pg}
                onClick={() => setCurrentPageIndex(idx)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  currentPageIndex === idx
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60"
                }`}
              >
                Page {pg}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 shrink-0 font-medium">
            Page <span className="text-white font-bold">{currentPageIndex + 1}</span> of{" "}
            <span className="text-white font-bold">{validPages.length}</span> (Excerpt)
          </div>
        </div>

        {/* Main Preview Viewing Stage */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center justify-start bg-slate-900/60 relative scroll-smooth"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 text-slate-400 gap-3">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-sans font-medium text-slate-300">
                Rendering authentic book manuscript...
              </p>
              <p className="text-xs text-slate-500">Preparing high-resolution sample pages</p>
            </div>
          ) : viewMode === "pdf" ? (
            <div className="flex flex-col items-center w-full max-w-4xl">
              {/* Authentic PDF Manuscript Canvas with Book Drop Shadow */}
              <div className="relative rounded-lg shadow-2xl overflow-hidden bg-white border border-slate-700/60 transition-all duration-300">
                <canvas ref={canvasRef} className="block max-w-full h-auto" />
              </div>

              {/* End of Excerpt Notice on Last Preview Page */}
              {isLastPreviewPage && (
                <div className="w-full max-w-2xl mt-8 p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 text-center shadow-xl">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white">
                    You've reached the end of the free sample excerpt.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg mx-auto leading-relaxed">
                    Unlock the complete digital edition of{" "}
                    <span className="text-amber-300 font-semibold">{bookTitle}</span> to continue reading
                    all chapters in our cloud reader.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => {
                        addItem({
                          bookId,
                          slug: bookSlug,
                          title: bookTitle,
                          author: authorName,
                          coverImage,
                          price,
                          salePrice,
                        });
                        onClose();
                      }}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Unlock Full Book (${displayPrice.toFixed(2)})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* HTML Text Fallback Representation */
            <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-xl p-8 sm:p-12 my-auto">
              {textPageData ? (
                <div>
                  <div className="border-b border-gray-200 pb-3 mb-6">
                    <span className="text-xs font-sans font-semibold text-amber-600 uppercase tracking-widest block">
                      {textPageData.chapterTitle}
                    </span>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                      {textPageData.title}
                    </h1>
                  </div>
                  <div
                    className="prose prose-slate max-w-none font-serif text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: textPageData.contentHtml }}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <p>Sample excerpt text unavailable.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Pagination & Action Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <button
              onClick={() =>
                setCurrentPageIndex((prev) => Math.min(validPages.length - 1, prev + 1))
              }
              disabled={currentPageIndex >= validPages.length - 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-colors"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Unlock Full Book Call To Action */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 block">Complete Edition</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
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
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${
                inCart
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Unlock Full Book (${displayPrice.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
