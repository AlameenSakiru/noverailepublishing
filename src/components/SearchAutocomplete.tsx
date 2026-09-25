"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowRight, BookOpen } from "lucide-react";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  coverImage: string;
  authorName: string;
  categoryName: string;
  examAcronym?: string | null;
  price: number;
  salePrice?: number | null;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onSelect?: () => void;
}

export function SearchAutocomplete({
  placeholder = "Search books, exams, authors...",
  className = "",
  inputClassName = "",
  autoFocus = false,
  onSelect,
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.books || []);
        setIsOpen(true);
      } catch (err) {
        console.error("Autocomplete search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (selectedIndex >= 0 && results[selectedIndex]) {
      router.push(`/books/${results[selectedIndex].slug}`);
      if (onSelect) onSelect();
      setIsOpen(false);
    } else {
      router.push(`/books?q=${encodeURIComponent(query.trim())}`);
      if (onSelect) onSelect();
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={`w-full pl-10 pr-9 py-2 bg-white border border-brand-border rounded-xl text-sm text-brand-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink transition-all ${inputClassName}`}
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-brand-muted animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </form>

      {/* Floating Suggestions Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-brand-border shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 bg-brand-50/70 border-b border-brand-border/60 flex items-center justify-between text-xs text-brand-slate font-medium">
            <span>
              {results.length > 0
                ? `${results.length} publication${results.length === 1 ? "" : "s"} matched`
                : "No matching titles"}
            </span>
            <span className="text-[10px] text-brand-muted">Press Enter to browse all</span>
          </div>

          {results.length > 0 ? (
            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
              {results.map((book, idx) => {
                const activePrice = book.salePrice != null && book.salePrice > 0 ? book.salePrice : book.price;
                const isSelected = selectedIndex === idx;

                return (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      if (onSelect) onSelect();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-3.5 p-3.5 transition-colors ${
                      isSelected ? "bg-brand-50" : "hover:bg-brand-50/50"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-10 aspect-[2/3] rounded shadow-xs overflow-hidden border border-black/10 shrink-0 bg-white">
                      {book.coverImage ? (
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-ink flex items-center justify-center text-white text-[8px]">
                          Book
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-semibold text-brand-muted uppercase tracking-wider truncate">
                          {book.categoryName}
                        </span>
                        {book.examAcronym && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-bold">
                            {book.examAcronym}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-brand-ink truncate">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-brand-slate truncate">By {book.authorName}</p>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <span className="font-bold text-brand-ink text-xs block">
                        ${activePrice.toFixed(2)}
                      </span>
                      {book.salePrice && (
                        <span className="text-[10px] text-brand-muted line-through block">
                          ${book.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}

              <Link
                href={`/books?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  setIsOpen(false);
                  if (onSelect) onSelect();
                }}
                className="p-3 bg-brand-50/40 hover:bg-brand-100/60 text-xs font-semibold text-brand-ink flex items-center justify-between transition-colors"
              >
                <span>View all search results for &quot;{query}&quot;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="p-8 text-center">
              <BookOpen className="w-8 h-8 text-brand-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs text-brand-slate font-medium">No publications found for &quot;{query}&quot;</p>
              <p className="text-[11px] text-brand-muted mt-1">Try searching by topic, author, or exam acronym.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
