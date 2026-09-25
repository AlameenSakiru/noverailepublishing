"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Maximize2,
  Minimize2,
  Bookmark,
  BookmarkCheck,
  Type,
  Sun,
  Moon,
  Coffee,
  ArrowLeft,
  Lock,
  ZoomIn,
  ZoomOut,
  Columns,
  Square,
  Edit3,
  Copy,
  Trash2,
  DownloadCloud,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  BookOpen,
  FileText,
  Compass,
  Hash,
} from "lucide-react";

interface ReaderClientProps {
  book: {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    authorName: string;
    pageCount: number;
    tableOfContents: any[];
    pdfUrl?: string | null;
    pdfStreamUrl?: string | null;
  };
  initialPage: number;
  userEmail?: string;
  userName?: string;
  userId?: string;
  hasEntitlement: boolean;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export function ReaderClient({
  book,
  initialPage = 1,
  userEmail,
  userName,
  userId,
  hasEntitlement,
}: ReaderClientProps) {
  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(book.pageCount || 1);
  const [pageJumpInput, setPageJumpInput] = useState(initialPage.toString());

  // PDF.js Engine State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfJsReady, setPdfJsReady] = useState(false);

  // Fallback HTML page data (if PDF is not present or user switches to text)
  const [textPageData, setTextPageData] = useState<any>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  // Active Viewing Mode: "pdf" | "text"
  const [viewMode, setViewMode] = useState<"pdf" | "text">(
    book.pdfStreamUrl || book.pdfUrl ? "pdf" : "text"
  );

  // Reading & Display Settings
  const [theme, setTheme] = useState<"light" | "sepia" | "dark">("light");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [layoutMode, setLayoutMode] = useState<"single" | "spread">("single");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Side Drawers
  const [tocOpen, setTocOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [extractedToc, setExtractedToc] = useState<{ title: string; startPage: number }[]>([]);

  // Study Notepad / Scratchpad State
  const [studyNotes, setStudyNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const [copyNotesSuccess, setCopyNotesSuccess] = useState(false);

  // Bookmarking System
  const [bookmarks, setBookmarks] = useState<{ page: number; title: string }[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Canvas Refs
  const canvasLeftRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRightRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // 1. Load Notes from Local Storage
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(`noveraile_study_notes_${book.id}`);
      if (savedNotes) {
        setStudyNotes(savedNotes);
      }
      const savedBookmarks = localStorage.getItem(`noveraile_bookmarks_${book.id}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch {
      // LocalStorage unavailable
    }
  }, [book.id]);

  // 2. Auto-Save Study Notes to Local Storage (Debounced)
  useEffect(() => {
    setNotesSaved(false);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`noveraile_study_notes_${book.id}`, studyNotes);
        setNotesSaved(true);
      } catch {
        // LocalStorage quota or unavailable
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [studyNotes, book.id]);

  // 3. Dynamically Load Mozilla PDF.js from Cloudflare CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

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
      setPdfError("Could not load secure PDF rendering engine. Switching to text format.");
      setViewMode("text");
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script tag if unmounted before load
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 4. Load PDF Document via PDF.js
  useEffect(() => {
    if (!pdfJsReady || viewMode !== "pdf") return;

    const streamUrl = book.pdfStreamUrl || book.pdfUrl;
    if (!streamUrl) {
      setViewMode("text");
      return;
    }

    setPdfLoading(true);
    setPdfError(null);

    const loadingTask = window.pdfjsLib.getDocument({
      url: streamUrl,
      withCredentials: true,
    });

    loadingTask.promise
      .then(async (loadedDoc: any) => {
        setPdfDoc(loadedDoc);
        if (loadedDoc.numPages) {
          setTotalPages(loadedDoc.numPages);
        }

        // Extract native PDF outline / TOC if embedded in the document
        try {
          const outline = await loadedDoc.getOutline();
          if (outline && outline.length > 0) {
            const parsed = await Promise.all(
              outline.map(async (item: any) => {
                let pageNum = 1;
                if (typeof item.dest === "string") {
                  const dest = await loadedDoc.getDestination(item.dest);
                  if (dest) {
                    const idx = await loadedDoc.getPageIndex(dest[0]);
                    pageNum = idx + 1;
                  }
                } else if (Array.isArray(item.dest)) {
                  const idx = await loadedDoc.getPageIndex(item.dest[0]);
                  pageNum = idx + 1;
                }
                return {
                  title: item.title,
                  startPage: pageNum,
                };
              })
            );
            const valid = parsed.filter((it) => it.startPage >= 1);
            if (valid.length > 0) {
              setExtractedToc(valid);
            }
          }
        } catch {
          // Native outline extraction completed
        }

        setPdfLoading(false);
      })
      .catch((err: any) => {
        console.warn("PDF stream load error, falling back to rich text reader:", err);
        setPdfError(
          "PDF manuscript not formatted for canvas stream or missing. Showing interactive curriculum reader."
        );
        setViewMode("text");
        setPdfLoading(false);
      });
  }, [pdfJsReady, book.pdfStreamUrl, book.pdfUrl, viewMode]);

  // 5. Render PDF Page onto HTML5 Canvas
  const renderPdfPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement | null) => {
      if (!pdfDoc || !canvas) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const containerWidth = containerRef.current?.clientWidth || 800;
        const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

        // Base viewport at scale 1.0
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Calculate scale: on mobile expand edge-to-edge, on desktop maintain comfortable reading column
        const targetWidth = isMobile
          ? Math.max(containerWidth - 8, 300)
          : layoutMode === "spread"
          ? (containerWidth - 96) / 2
          : Math.min(containerWidth - 48, 880);

        const baseScale = targetWidth / unscaledViewport.width;
        const currentScale = baseScale * (zoomLevel / 100);

        // Account for Retina / HiDPI Displays (2x for ultra-sharp text and formulas)
        const pixelRatio = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 2) : 2;

        const viewport = page.getViewport({ scale: currentScale * pixelRatio });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / pixelRatio}px`;
        canvas.style.height = `${viewport.height / pixelRatio}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Reset transform and render
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    },
    [pdfDoc, zoomLevel, layoutMode]
  );

  // Trigger PDF Canvas Rendering when page, doc, zoom, or layout changes
  useEffect(() => {
    if (viewMode !== "pdf" || !pdfDoc) return;

    // Render primary page
    renderPdfPage(currentPage, canvasLeftRef.current);

    // If in spread mode, render the right page
    if (layoutMode === "spread" && currentPage + 1 <= totalPages) {
      renderPdfPage(currentPage + 1, canvasRightRef.current);
    }
  }, [viewMode, pdfDoc, currentPage, totalPages, zoomLevel, layoutMode, renderPdfPage]);

  // 6. Fetch Fallback HTML Page Data (if text mode)
  const fetchTextPage = useCallback(
    async (pageNumber: number) => {
      setTextLoading(true);
      setTextError(null);

      try {
        const res = await fetch(`/api/reader/page?bookId=${book.id}&pageNumber=${pageNumber}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setTextError(data.message || "Failed to load protected publication page.");
          setTextLoading(false);
          return;
        }

        setTextPageData(data);
        if (data.totalPages) {
          setTotalPages(data.totalPages);
        }
        setTextLoading(false);
      } catch {
        setTextError("Network interruption loading publication page.");
        setTextLoading(false);
      }
    },
    [book.id]
  );

  useEffect(() => {
    if (viewMode === "text") {
      fetchTextPage(currentPage);
    }
  }, [viewMode, currentPage, fetchTextPage]);

  // Synchronize reading progress with server (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/reader/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          currentPage,
          totalPages,
        }),
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentPage, totalPages, book.id]);

  // Synchronize Jump input
  useEffect(() => {
    setPageJumpInput(currentPage.toString());
    setIsBookmarked(bookmarks.some((b) => b.page === currentPage));
  }, [currentPage, bookmarks]);

  // Page Turn Handlers
  const handleNextPage = () => {
    const step = layoutMode === "spread" ? 2 : 1;
    setCurrentPage((p) => Math.min(totalPages, p + step));
  };

  const handlePrevPage = () => {
    const step = layoutMode === "spread" ? 2 : 1;
    setCurrentPage((p) => Math.max(1, p - step));
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(pageJumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setCurrentPage(target);
    } else {
      setPageJumpInput(currentPage.toString());
    }
  };

  // Bookmark Toggle
  const handleToggleBookmark = () => {
    let updated: { page: number; title: string }[];
    if (isBookmarked) {
      updated = bookmarks.filter((b) => b.page !== currentPage);
      setIsBookmarked(false);
    } else {
      const defaultTitle =
        textPageData?.chapterTitle ||
        textPageData?.title ||
        `Page ${currentPage} Key Review`;
      updated = [...bookmarks, { page: currentPage, title: defaultTitle }].sort(
        (a, b) => a.page - b.page
      );
      setIsBookmarked(true);
    }
    setBookmarks(updated);
    try {
      localStorage.setItem(`noveraile_bookmarks_${book.id}`, JSON.stringify(updated));
    } catch {
      // LocalStorage failed
    }
  };

  // Fullscreen Focus Mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        handleNextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        handlePrevPage();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "b" || e.key === "B") {
        handleToggleBookmark();
      } else if (e.key === "n" || e.key === "N") {
        setNotesOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, layoutMode]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (diff > 50) {
      // Swiped left -> next page
      handleNextPage();
    } else if (diff < -50) {
      // Swiped right -> prev page
      handlePrevPage();
    }
    touchStartXRef.current = null;
  };

  // Anti-piracy context menu suppression
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Copy study notes to clipboard
  const handleCopyNotes = () => {
    navigator.clipboard.writeText(studyNotes);
    setCopyNotesSuccess(true);
    setTimeout(() => setCopyNotesSuccess(false), 2000);
  };

  // Theme Styling Matrix
  const themeClasses = {
    light: "bg-[#f8fafc] text-gray-900 border-gray-200",
    sepia: "bg-[#f5efe6] text-[#3d2f1d] border-[#e2d5c3]",
    dark: "bg-[#0b0f19] text-gray-100 border-gray-800",
  };

  const canvasBackgrounds = {
    light: "bg-white shadow-xl shadow-slate-300/40 border border-slate-200",
    sepia: "bg-[#fffcf7] shadow-xl shadow-[#433422]/10 border border-[#e8ddcd]",
    dark: "bg-[#131926] shadow-2xl shadow-black/60 border border-gray-800",
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      className={`fixed inset-0 z-50 flex flex-col h-screen w-screen overflow-hidden ${themeClasses[theme]} select-none transition-colors duration-200`}
    >
      {/* Top Header Chrome / Toolbar */}
      <header className="h-14 border-b border-inherit px-3 sm:px-5 flex items-center justify-between shrink-0 bg-inherit/90 backdrop-blur-md z-30">
        {/* Left Section: Back to Library & TOC & Notes */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/my-library"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition-colors"
            title="Return to My Library"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Library</span>
          </Link>

          <span className="text-gray-300 dark:text-gray-700">|</span>

          {/* Table of Contents Drawer Toggle */}
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tocOpen
                ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold"
                : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
            }`}
            title="Table of Contents & Bookmarks"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Contents</span>
          </button>

          {/* Study Scratchpad / Notepad Drawer Toggle */}
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors relative ${
              notesOpen
                ? "bg-amber-500 text-gray-950 font-bold shadow-xs"
                : "hover:bg-black/5 dark:hover:bg-white/5 text-amber-700 dark:text-amber-400 font-semibold"
            }`}
            title="Open Exam Prep Study Notepad (N)"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Study Notes</span>
            {studyNotes.trim().length > 0 && !notesOpen && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-gray-900" />
            )}
          </button>
        </div>

        {/* Center: Publication Title & Module Label */}
        <div className="text-center px-2 max-w-[200px] sm:max-w-xs md:max-w-md truncate">
          <h2 className="font-serif text-xs sm:text-sm font-bold truncate">
            {book.title}
          </h2>
          <p className="text-[10px] opacity-60 truncate -mt-0.5">
            {book.authorName} • PDF Manuscript
          </p>
        </div>

        {/* Right Section: Zoom, Layout, Bookmark, Themes, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Zoom Controls (Available on all screens) */}
          {viewMode === "pdf" && (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] px-1 font-semibold">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(220, z + 15))}
                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Single vs Two-Page Spread Mode (Large Screens in PDF view) */}
          {viewMode === "pdf" && (
            <button
              onClick={() => setLayoutMode((m) => (m === "single" ? "spread" : "single"))}
              className={`hidden lg:inline-flex p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                layoutMode === "spread" ? "text-amber-600 dark:text-amber-400 font-bold" : "opacity-70"
              }`}
              title={layoutMode === "spread" ? "Switch to Single Page" : "Switch to 2-Page Book Spread"}
            >
              {layoutMode === "spread" ? <Columns className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>
          )}

          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? "text-amber-500 bg-amber-500/10"
                : "hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark this Page (B)"}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* Theme Toggles */}
          <div className="hidden sm:flex items-center gap-0.5 bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setTheme("light")}
              className={`p-1 rounded-md ${theme === "light" ? "bg-white text-gray-900 shadow-xs" : "opacity-60"}`}
              title="Light Editorial Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("sepia")}
              className={`p-1 rounded-md ${theme === "sepia" ? "bg-[#e5dacf] text-stone-900 shadow-xs" : "opacity-60"}`}
              title="Warm Sepia (Reduces eye fatigue for exam prep)"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-1 rounded-md ${theme === "dark" ? "bg-gray-800 text-white shadow-xs" : "opacity-60"}`}
              title="Midnight Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Focus Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition-colors"
            title="Toggle Distraction-Free Focus Mode (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Body: Sidebar Drawers + Reading Canvas + Notes Drawer */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Table of Contents & Bookmarks Drawer */}
        {tocOpen && (
          <aside className="absolute top-0 bottom-0 left-0 w-72 sm:w-80 bg-white dark:bg-gray-900 border-r border-inherit shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-inherit flex items-center justify-between">
              <div>
                <h3 className="font-serif text-sm font-bold">Table of Contents</h3>
                <span className="text-[10px] opacity-60">Interactive Chapter Outline</span>
              </div>
              <button
                onClick={() => setTocOpen(false)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Quick Jump by Page Number Form */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-bold text-[11px] block text-amber-900 dark:text-amber-200 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-600" />
                  <span>Direct Page Jump</span>
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const num = parseInt(pageJumpInput, 10);
                    if (!isNaN(num) && num >= 1 && num <= totalPages) {
                      setCurrentPage(num);
                      setTocOpen(false);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageJumpInput}
                    onChange={(e) => setPageJumpInput(e.target.value)}
                    placeholder={`1 - ${totalPages}`}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    Go
                  </button>
                </form>
              </div>

              {/* Milestones / Quick Navigation Grid */}
              {totalPages > 3 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-2 flex items-center gap-1.5">
                    <Compass className="w-3 h-3 text-amber-600" />
                    <span>Quick Navigation Markers</span>
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Array.from(
                      new Set([
                        1,
                        Math.max(1, Math.round(totalPages * 0.15)),
                        Math.max(1, Math.round(totalPages * 0.3)),
                        Math.max(1, Math.round(totalPages * 0.5)),
                        Math.max(1, Math.round(totalPages * 0.7)),
                        Math.max(1, Math.round(totalPages * 0.85)),
                        totalPages,
                      ])
                    ).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => {
                          setCurrentPage(pg);
                          setTocOpen(false);
                        }}
                        className={`p-1.5 rounded-lg border text-center font-mono text-[11px] transition-all ${
                          currentPage === pg
                            ? "bg-amber-600 text-white border-amber-600 font-bold"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-500 hover:text-amber-600"
                        }`}
                      >
                        p. {pg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chapters & Document Outline */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-2">
                  Document Chapters & Outline
                </span>

                {(extractedToc.length > 0
                  ? extractedToc
                  : book.tableOfContents && book.tableOfContents.length > 0
                  ? book.tableOfContents
                  : [
                      { title: "Front Cover & Title Page", startPage: 1 },
                      ...(totalPages > 4 ? [{ title: "Foundations & Overview", startPage: 2 }] : []),
                      ...(totalPages > 20
                        ? [
                            { title: "Early Modules & Key Concepts", startPage: Math.round(totalPages * 0.25) },
                            { title: "Midpoint Diagnostic Review", startPage: Math.round(totalPages * 0.5) },
                            { title: "Advanced Applications & Prep", startPage: Math.round(totalPages * 0.75) },
                            { title: "Concluding Review & Appendix", startPage: Math.max(1, totalPages - 5) },
                          ]
                        : []),
                      ...(totalPages > 1 ? [{ title: "Final Summary Page", startPage: totalPages }] : []),
                    ]
                ).map((item: any, idx: number, arr: any[]) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentPage(item.startPage || 1);
                      setTocOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between mb-1 ${
                      currentPage >= item.startPage &&
                      (idx === arr.length - 1 || currentPage < arr[idx + 1]?.startPage)
                        ? "bg-amber-500/15 font-bold text-amber-800 dark:text-amber-300 border border-amber-500/30"
                        : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
                    }`}
                  >
                    <span className="truncate">{item.title || `Chapter ${idx + 1}`}</span>
                    <span className="font-mono text-[10px] opacity-60 ml-2 shrink-0">p. {item.startPage}</span>
                  </button>
                ))}
              </div>

              {/* Saved Bookmarks Section */}
              {bookmarks.length > 0 && (
                <div className="pt-4 mt-4 border-t border-inherit">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Saved Bookmarks ({bookmarks.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {bookmarks.map((bm) => (
                      <button
                        key={bm.page}
                        onClick={() => {
                          setCurrentPage(bm.page);
                          setTocOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                          <span className="truncate">{bm.title || `Page ${bm.page}`}</span>
                        </div>
                        <span className="font-mono text-[10px] opacity-60 ml-2 shrink-0">p. {bm.page}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center: In-App Reading Viewport (Canvas / Adaptive Text) */}
        <main
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto p-1 sm:p-4 md:p-6 flex justify-center items-start relative transition-all"
        >
          {viewMode === "pdf" ? (
            /* =================== HIGH-FIDELITY PDF CANVAS RENDERER =================== */
            <div className="w-full max-w-6xl flex flex-col items-center justify-center my-auto py-2">
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-serif text-sm font-semibold tracking-wide">
                    Rendering High-Definition Manuscript...
                  </p>
                  <span className="text-xs opacity-60 mt-1">
                    Protected canvas rendering • No download permitted
                  </span>
                </div>
              ) : pdfError ? (
                <div className="my-auto py-12 text-center max-w-md mx-auto p-6 bg-amber-500/10 rounded-2xl border border-amber-500/30">
                  <HelpCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-serif text-base font-bold">Manuscript Notice</h3>
                  <p className="text-xs opacity-80 mt-2 leading-relaxed">{pdfError}</p>
                  <button
                    onClick={() => setViewMode("text")}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs"
                  >
                    Open eBook Study Format
                  </button>
                </div>
              ) : (
                /* PDF Canvas Container: Handles single page or two-page spread */
                <div
                  className={`flex items-center justify-center gap-4 sm:gap-6 ${
                    layoutMode === "spread" ? "flex-col lg:flex-row" : "flex-col"
                  }`}
                >
                  {/* Left (or Single) Page Canvas */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative rounded-xl overflow-hidden ${canvasBackgrounds[theme]} transition-all`}
                    >
                      <canvas ref={canvasLeftRef} className="block select-none" />
                    </div>
                    <span className="text-[10px] font-mono opacity-50 mt-1.5">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  {/* Right Page Canvas (Spread Mode) */}
                  {layoutMode === "spread" && currentPage + 1 <= totalPages && (
                    <div className="flex flex-col items-center">
                      <div
                        className={`relative rounded-xl overflow-hidden ${canvasBackgrounds[theme]} transition-all`}
                      >
                        <canvas ref={canvasRightRef} className="block select-none" />
                      </div>
                      <span className="text-[10px] font-mono opacity-50 mt-1.5">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* =================== FORMATTED ADAPTIVE TEXT RENDERER =================== */
            <div className="max-w-3xl w-full min-h-[75vh] flex flex-col justify-between py-6">
              {textLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-serif text-xs font-semibold">Streaming curriculum section...</p>
                </div>
              ) : textError ? (
                <div className="my-auto py-12 text-center max-w-md mx-auto p-6 bg-red-500/10 rounded-2xl border border-red-500/30">
                  <Lock className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-xs text-red-700 dark:text-red-300">{textError}</p>
                </div>
              ) : textPageData ? (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-inherit">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 block font-semibold">
                      {textPageData.chapterTitle}
                    </span>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
                      {textPageData.title}
                    </h1>
                  </div>

                  <div
                    className={`font-serif leading-relaxed ${
                      fontSize === "normal"
                        ? "text-base sm:text-lg"
                        : fontSize === "large"
                        ? "text-lg sm:text-xl"
                        : "text-xl sm:text-2xl"
                    }`}
                    dangerouslySetInnerHTML={{ __html: textPageData.contentHtml }}
                  />
                </div>
              ) : null}

              <div className="pt-8 mt-12 border-t border-inherit flex items-center justify-between text-[11px] opacity-60 font-mono">
                <span>{book.title}</span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          )}
        </main>

        {/* Right Study Notepad / Exam Prep Scratchpad Drawer */}
        {notesOpen && (
          <aside className="w-80 sm:w-96 bg-white dark:bg-gray-900 border-l border-inherit shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-inherit flex items-center justify-between bg-amber-500/5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-serif text-sm font-bold">Study Scratchpad</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-medium text-amber-700 dark:text-amber-300">
                  {notesSaved ? "Saved" : "Saving..."}
                </span>
                <button
                  onClick={() => setNotesOpen(false)}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Insert Study Tags */}
            <div className="p-3 border-b border-inherit bg-slate-50 dark:bg-gray-800/40 flex items-center gap-1.5 flex-wrap text-[11px]">
              <button
                onClick={() =>
                  setStudyNotes((n) => `${n}\n\n[Page ${currentPage} Key Exam Takeaway]: `)
                }
                className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/30 transition-colors"
              >
                + Page {currentPage} Takeaway
              </button>
              <button
                onClick={() =>
                  setStudyNotes((n) => `${n}\n\n[Formula / Mnemonics - p.${currentPage}]: `)
                }
                className="px-2 py-1 rounded bg-slate-200 dark:bg-gray-700 hover:opacity-80 text-gray-800 dark:text-gray-200 font-medium transition-colors"
              >
                + Formula
              </button>
              <button
                onClick={() =>
                  setStudyNotes((n) => `${n}\n\n[Question Review]: `)
                }
                className="px-2 py-1 rounded bg-slate-200 dark:bg-gray-700 hover:opacity-80 text-gray-800 dark:text-gray-200 font-medium transition-colors"
              >
                + Practice Question
              </button>
            </div>

            {/* Textarea Workspace */}
            <div className="flex-1 p-3 flex flex-col">
              <textarea
                value={studyNotes}
                onChange={(e) => setStudyNotes(e.target.value)}
                placeholder="Type your study notes, diagnostic calculations, mock exam answers, or revision reminders here... Notes automatically save per book."
                className="w-full flex-1 p-3 rounded-xl bg-slate-50 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-3 border-t border-inherit flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] opacity-60">
                {studyNotes.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyNotes}
                  className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Copy Notes to Clipboard"
                >
                  {copyNotesSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to clear your study notes for this publication?")) {
                      setStudyNotes("");
                    }
                  }}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Clear Study Notes"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Reader Control Bar */}
      <footer className="h-14 border-t border-inherit px-3 sm:px-6 flex items-center justify-between shrink-0 bg-inherit/90 backdrop-blur-md z-30 text-xs">
        {/* Previous Page Button */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Center: Scrubber Slider & Direct Page Jump Input */}
        <div className="flex items-center gap-3 max-w-sm sm:max-w-md w-full justify-center px-2">
          {/* Interactive Range Scrubber */}
          <input
            type="range"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
            className="w-24 sm:w-48 md:w-64 h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
            title="Drag to Scrub Pages"
          />

          {/* Jump-to-Page Input */}
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
            <span className="text-[10px] font-mono opacity-60">Pg</span>
            <input
              type="text"
              value={pageJumpInput}
              onChange={(e) => setPageJumpInput(e.target.value)}
              onBlur={() => setPageJumpInput(currentPage.toString())}
              className="w-11 px-1.5 py-1 text-center font-mono text-xs rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-[10px] font-mono opacity-60">/ {totalPages}</span>
          </form>
        </div>

        {/* Next Page Button */}
        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-all"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
