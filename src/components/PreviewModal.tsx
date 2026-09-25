"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, BookOpen, ShoppingBag, Check } from "lucide-react";
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
  previewPages,
}: PreviewModalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(bookId);

  const activePageNumber = previewPages[currentPageIndex] || 1;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/reader/page?bookId=${bookId}&pageNumber=${activePageNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success) {
            setPageData(data);
          } else {
            setPageData(null);
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
  }, [isOpen, bookId, activePageNumber]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && currentPageIndex < previewPages.length - 1) {
        setCurrentPageIndex((prev) => prev + 1);
      }
      if (e.key === "ArrowLeft" && currentPageIndex > 0) {
        setCurrentPageIndex((prev) => prev - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentPageIndex, previewPages.length, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-brand-border">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-50">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-semibold text-xs uppercase tracking-wider">
              Free Sample Preview
            </span>
            <div className="hidden sm:block">
              <h4 className="font-serif text-sm font-bold text-brand-ink truncate max-w-md">
                {bookTitle}
              </h4>
              <p className="text-[11px] text-brand-muted">By {authorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-brand-slate mr-2">
              Preview Page {currentPageIndex + 1} of {previewPages.length}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-200 text-brand-slate transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reading Page Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 relative bg-reader-paper select-none">

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-brand-muted gap-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-sans">Loading preview page...</p>
            </div>
          ) : pageData ? (
            <div className="max-w-2xl mx-auto">
              <div className="border-b border-brand-border/60 pb-3 mb-6">
                <span className="text-xs font-sans font-medium text-brand-500 uppercase tracking-widest block">
                  {pageData.chapterTitle}
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink mt-1">
                  {pageData.title}
                </h1>
              </div>

              <div
                className="text-brand-ink font-serif text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: pageData.contentHtml }}
              />
            </div>
          ) : (
            <div className="text-center py-20 text-brand-muted">
              <p>Preview page unavailable.</p>
            </div>
          )}
        </div>

        {/* Navigation & Purchase Bar */}
        <div className="px-6 py-4 border-t border-brand-border bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-border text-xs font-medium text-brand-slate hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() =>
                setCurrentPageIndex((prev) => Math.min(previewPages.length - 1, prev + 1))
              }
              disabled={currentPageIndex >= previewPages.length - 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-border text-xs font-medium text-brand-slate hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Unlock Full Book CTA */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-brand-muted">Full Digital Edition</p>
              <p className="text-sm font-bold text-brand-ink">
                ${(salePrice != null && salePrice > 0 ? salePrice : price).toFixed(2)}
              </p>
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
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                inCart
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                  : "bg-brand-ink text-white hover:bg-brand-900"
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>In Your Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Unlock Full Book</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
