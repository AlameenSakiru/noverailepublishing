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
  FileText,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { DynamicWatermark } from "@/components/DynamicWatermark";

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
  };
  initialPage: number;
  userEmail?: string;
  hasEntitlement: boolean;
}

export function ReaderClient({
  book,
  initialPage = 1,
  userEmail,
  hasEntitlement,
}: ReaderClientProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageData, setPageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reader Settings
  const [theme, setTheme] = useState<"light" | "sepia" | "dark">("light");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch page asset from protected server endpoint
  const fetchPage = useCallback(
    async (pageNumber: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/reader/page?bookId=${book.id}&pageNumber=${pageNumber}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || "Failed to load protected page.");
          setIsLoading(false);
          return;
        }

        setPageData(data);
        setIsLoading(false);

        // Auto-save reading progress to server (debounced)
        fetch("/api/reader/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: book.id,
            currentPage: pageNumber,
            totalPages: book.pageCount,
          }),
        }).catch(() => {
          // ignore background progress sync fail
        });
      } catch {
        setError("Network interruption loading publication page.");
        setIsLoading(false);
      }
    },
    [book.id, book.pageCount]
  );

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage, fetchPage]);

  // Load existing bookmarks
  useEffect(() => {
    fetch(`/api/reader/progress?bookId=${book.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bookmarks) {
          setBookmarks(data.bookmarks.map((b: any) => b.pageNumber));
        }
      })
      .catch(() => {});
  }, [book.id]);

  useEffect(() => {
    setIsBookmarked(bookmarks.includes(currentPage));
  }, [bookmarks, currentPage]);

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    try {
      const res = await fetch("/api/reader/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          currentPage,
          totalPages: book.pageCount,
          toggleBookmark: true,
          bookmarkLabel: pageData?.title || `Page ${currentPage}`,
        }),
      });
      const data = await res.json();
      if (data.bookmarkStatus === "ADDED") {
        setBookmarks((prev) => [...prev, currentPage]);
      } else {
        setBookmarks((prev) => prev.filter((p) => p !== currentPage));
      }
    } catch {
      // ignore
    }
  };

  // Fullscreen toggle
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
      // Don't trigger if user is in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (currentPage < book.pageCount) setCurrentPage((p) => p + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentPage > 1) setCurrentPage((p) => p - 1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, book.pageCount]);

  // Anti-piracy right-click suppression on reader canvas
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Theme styling definitions
  const themeClasses = {
    light: "bg-reader-paper text-brand-ink",
    sepia: "bg-reader-sepia text-reader-sepiatext",
    dark: "bg-reader-dark text-reader-darktext",
  };

  const fontSizes = {
    normal: "text-base sm:text-lg leading-relaxed",
    large: "text-lg sm:text-xl leading-relaxed",
    xlarge: "text-xl sm:text-2xl leading-loose",
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col h-screen w-screen overflow-hidden ${themeClasses[theme]} transition-colors duration-200 select-none`}
    >
      {/* Top Reader Chrome / Navigation Bar */}
      <header className="h-14 border-b border-black/10 px-4 flex items-center justify-between shrink-0 bg-black/5 backdrop-blur-sm z-30 no-print">
        {/* Left: Library Back & TOC Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/my-library"
            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
            title="Return to My Library"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">My Library</span>
          </Link>

          <span className="text-black/20 dark:text-white/20">|</span>

          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-xs font-medium transition-colors"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden md:inline">Contents</span>
          </button>

          {book.pdfUrl && (
            <a
              href={book.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-xs font-medium transition-colors text-rose-700 dark:text-rose-400"
              title="Open Original PDF Manuscript in new tab"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF Edition</span>
            </a>
          )}
        </div>

        {/* Center: Book Title & Active Chapter */}
        <div className="text-center px-4 max-w-sm sm:max-w-md md:max-w-lg truncate">
          <h2 className="font-serif text-sm font-bold truncate">{book.title}</h2>
          {pageData?.chapterTitle && (
            <p className="text-[10px] opacity-70 truncate -mt-0.5">{pageData.chapterTitle}</p>
          )}
        </div>

        {/* Right: Display Controls, Bookmarks & Fullscreen */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bookmark Toggle */}
          <button
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked ? "text-amber-500 bg-amber-500/10" : "hover:bg-black/10 opacity-70 hover:opacity-100"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark this page"}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* Theme Toggles */}
          <div className="hidden sm:flex items-center gap-1 bg-black/5 rounded-lg p-0.5">
            <button
              onClick={() => setTheme("light")}
              className={`p-1.5 rounded-md ${theme === "light" ? "bg-white text-black shadow-xs" : "opacity-60"}`}
              title="Light Paper"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("sepia")}
              className={`p-1.5 rounded-md ${theme === "sepia" ? "bg-[#e5dacf] text-stone-900 shadow-xs" : "opacity-60"}`}
              title="Warm Sepia"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-1.5 rounded-md ${theme === "dark" ? "bg-zinc-800 text-white shadow-xs" : "opacity-60"}`}
              title="Dark Reader"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font Size Cycle */}
          <button
            onClick={() => {
              if (fontSize === "normal") setFontSize("large");
              else if (fontSize === "large") setFontSize("xlarge");
              else setFontSize("normal");
            }}
            className="p-1.5 rounded-lg hover:bg-black/10 opacity-70 hover:opacity-100 transition-colors"
            title="Adjust Type Size"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-black/10 opacity-70 hover:opacity-100 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Reader Viewport */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Table of Contents Sliding Drawer */}
        {tocOpen && (
          <aside className="absolute top-0 bottom-0 left-0 w-72 sm:w-80 bg-white dark:bg-zinc-900 border-r border-black/10 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200 text-brand-ink dark:text-gray-100">
            <div className="p-4 border-b border-black/10 flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold">Table of Contents</h3>
              <button onClick={() => setTocOpen(false)} className="p-1 hover:bg-black/5 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
              {book.tableOfContents.map((item: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentPage(item.startPage || 1);
                    setTocOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center justify-between ${
                    currentPage >= item.startPage &&
                    (idx === book.tableOfContents.length - 1 || currentPage < book.tableOfContents[idx + 1].startPage)
                      ? "bg-brand-50 dark:bg-zinc-800 font-bold text-brand-ink dark:text-white"
                      : "hover:bg-black/5 opacity-80"
                  }`}
                >
                  <span className="truncate">{item.title || `Chapter ${item.chapter}`}</span>
                  <span className="font-mono text-[10px] opacity-60 ml-2">p. {item.startPage}</span>
                </button>
              ))}

              {bookmarks.length > 0 && (
                <div className="pt-4 mt-4 border-t border-black/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block mb-2">
                    Saved Bookmarks
                  </span>
                  {bookmarks.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setCurrentPage(p);
                        setTocOpen(false);
                      }}
                      className="w-full text-left p-2 rounded hover:bg-black/5 flex items-center gap-2"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      <span>Page {p}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Page Content Canvas with Anti-Copy & Watermarking */}
        <div
          onContextMenu={handleContextMenu}
          className="flex-1 overflow-y-auto p-6 sm:p-12 md:p-16 flex justify-center relative reader-canvas"
        >
          {/* Dynamic Customer Watermark Overlaid Across Reading Canvas */}
          <DynamicWatermark
            watermarkText={pageData?.watermarkText || (userEmail ? `Licensed to ${userEmail} • Noveraile Protected Reader` : undefined)}
            theme={theme}
          />

          <div
            className="max-w-3xl w-full min-h-[70vh] flex flex-col justify-between relative z-10 transition-transform origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center my-auto py-24 text-center opacity-60">
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-serif text-sm">Streaming protected publication content...</p>
              </div>
            ) : error ? (
              <div className="my-auto py-16 text-center max-w-md mx-auto p-6 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900">
                <Lock className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-rose-900 dark:text-rose-200">
                  Protected Content Notice
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-2 leading-relaxed">
                  {error}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link
                    href={`/books/${book.slug}`}
                    className="px-4 py-2 bg-rose-700 text-white text-xs font-semibold rounded-lg hover:bg-rose-800"
                  >
                    View Publication Details
                  </Link>
                  <Link
                    href="/my-library"
                    className="px-4 py-2 border border-rose-300 text-rose-800 text-xs font-semibold rounded-lg"
                  >
                    Back to Library
                  </Link>
                </div>
              </div>
            ) : pageData ? (
              <div className="space-y-6">
                {/* Chapter Heading Header */}
                <div className="pb-4 border-b border-black/10">
                  <span className="text-[11px] font-sans uppercase tracking-widest opacity-60 block">
                    {pageData.chapterTitle}
                  </span>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
                    {pageData.title}
                  </h1>
                </div>

                {/* Formatted Page Content HTML */}
                <div
                  className={`font-serif ${fontSizes[fontSize]} leading-relaxed reader-content`}
                  dangerouslySetInnerHTML={{ __html: pageData.contentHtml }}
                />
              </div>
            ) : null}

            {/* Bottom Page Footnote */}
            <div className="pt-8 mt-12 border-t border-black/10 flex items-center justify-between text-[11px] opacity-60 font-sans">
              <span>{book.title}</span>
              <span className="font-mono">
                Page {currentPage} of {book.pageCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Reader Toolbar Controls */}
      <footer className="h-14 border-t border-black/10 px-4 flex items-center justify-between shrink-0 bg-black/5 backdrop-blur-sm z-30 no-print text-xs">
        {/* Previous Page Button */}
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1 || isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Scrubber & Direct Jump */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={book.pageCount}
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
            className="w-24 sm:w-48 accent-brand-ink cursor-pointer"
          />
          <span className="font-mono font-medium text-xs">
            {currentPage} / {book.pageCount}
          </span>
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(book.pageCount, p + 1))}
          disabled={currentPage >= book.pageCount || isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
