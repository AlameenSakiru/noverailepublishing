"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { BookCard } from "@/components/BookCard";

export interface FeaturedBookItem {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  coverImage: string;
  authorName: string;
  categoryName?: string;
  price: number;
  salePrice?: number | null;
  rating?: number | null;
  reviewCount?: number;
  createdAt?: string | Date | null;
}

interface RotatingFeaturedBooksProps {
  books: FeaturedBookItem[];
  itemsPerPage?: number;
  autoRotateInterval?: number; // milliseconds
}

export function RotatingFeaturedBooks({
  books,
  itemsPerPage = 6,
  autoRotateInterval = 6000,
}: RotatingFeaturedBooksProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Split books into pages of 6
  const pages = useMemo(() => {
    if (!books || books.length === 0) return [];
    const chunks: FeaturedBookItem[][] = [];
    for (let i = 0; i < books.length; i += itemsPerPage) {
      chunks.push(books.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [books, itemsPerPage]);

  const totalPages = pages.length;

  const goToPage = useCallback(
    (pageIndex: number) => {
      if (totalPages <= 1) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage((pageIndex + totalPages) % totalPages);
        setIsTransitioning(false);
      }, 200);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Automatic rotation timer
  useEffect(() => {
    if (totalPages <= 1 || isPaused) return;

    const timer = setInterval(() => {
      goToPage(currentPage + 1);
    }, autoRotateInterval);

    return () => clearInterval(timer);
  }, [currentPage, totalPages, isPaused, autoRotateInterval, goToPage]);

  if (!books || books.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-brand-slate">
        No published books found at this time.
      </div>
    );
  }

  const currentBooks = pages[currentPage] || pages[0] || [];
  const startIdx = currentPage * itemsPerPage + 1;
  const endIdx = Math.min((currentPage + 1) * itemsPerPage, books.length);

  return (
    <div
      className="space-y-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Controls Bar: Page dots, Counter & Arrow Buttons (only if > 1 page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-xs border border-brand-border/70 rounded-2xl px-4 py-2.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-border text-[11px] font-medium text-brand-slate">
              <RefreshCw
                className={`w-3 h-3 text-brand-600 ${!isPaused ? "animate-spin" : ""}`}
                style={{ animationDuration: `${autoRotateInterval / 1000}s` }}
              />
              <span>
                {isPaused ? "Rotation Paused" : "Auto-rotating"} • {startIdx}–{endIdx} of {books.length}
              </span>
            </span>

            {/* Dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  aria-label={`Go to featured books slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentPage === idx
                      ? "w-6 bg-brand-ink"
                      : "w-2 bg-brand-border hover:bg-brand-slate/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-slate mr-1 hidden sm:inline">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={prevPage}
              aria-label="Previous set of featured books"
              className="p-1.5 rounded-lg border border-brand-border bg-white text-brand-ink hover:bg-brand-50 hover:border-brand-slate/40 transition-colors shadow-2xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPage}
              aria-label="Next set of featured books"
              className="p-1.5 rounded-lg border border-brand-border bg-white text-brand-ink hover:bg-brand-50 hover:border-brand-slate/40 transition-colors shadow-2xs active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6-Book Multi-Niche Grid with Smooth Transition */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-200 ${
          isTransitioning ? "opacity-30 scale-[0.99]" : "opacity-100 scale-100"
        }`}
      >
        {currentBooks.map((book) => (
          <BookCard
            key={book.id}
            id={book.id}
            title={book.title}
            subtitle={book.subtitle}
            slug={book.slug}
            coverImage={book.coverImage}
            authorName={book.authorName}
            categoryName={book.categoryName}
            price={book.price}
            salePrice={book.salePrice}
            rating={book.rating}
            reviewCount={book.reviewCount}
            createdAt={book.createdAt}
          />
        ))}
      </div>

      {/* Mobile dots indicator */}
      {totalPages > 1 && (
        <div className="flex sm:hidden justify-center items-center gap-1.5 pt-2">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentPage === idx
                  ? "w-6 bg-brand-ink"
                  : "w-2 bg-brand-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
