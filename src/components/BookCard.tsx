"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Check, Star, BookOpen } from "lucide-react";
import { useCart } from "@/context/CartContext";

export interface BookCardProps {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  coverImage: string;
  authorName: string;
  categoryName?: string;
  price: number;
  salePrice?: number | null;
  isOwned?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
}

export function BookCard({
  id,
  title,
  subtitle,
  slug,
  coverImage,
  authorName,
  categoryName,
  price,
  salePrice,
  isOwned = false,
  rating,
  reviewCount = 0,
}: BookCardProps) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(id);

  const activePrice = salePrice != null && salePrice > 0 ? salePrice : price;
  const hasDiscount = salePrice != null && salePrice > 0 && salePrice < price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOwned || inCart) return;

    addItem({
      bookId: id,
      slug,
      title,
      subtitle: subtitle || undefined,
      author: authorName,
      coverImage,
      price,
      salePrice,
    });
  };

  return (
    <div className="group flex flex-col h-full bg-white rounded-2xl border border-brand-border hover:border-brand-300 hover:shadow-book-lg transition-all duration-300 overflow-hidden">
      {/* 1. Amazon-Style Clean Book Cover Stage (No text overlaid on artwork) */}
      <Link
        href={`/books/${slug}`}
        className="relative block bg-gradient-to-b from-[#fbf9f5] to-[#f4efe4] p-6 flex items-center justify-center border-b border-brand-border/60 overflow-hidden"
      >
        {/* Soft vignette on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors pointer-events-none" />

        {/* 3D Tactile Book Presentation (2:3 Standard Book Ratio) */}
        <div className="relative w-full max-w-[190px] aspect-[2/3] rounded shadow-book group-hover:shadow-book-lg group-hover:scale-[1.03] transition-all duration-300 overflow-hidden bg-white border border-black/10">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`Cover of ${title}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={false}
            />
          ) : (
            /* Typographic fallback ONLY when no cover image exists */
            <div className="w-full h-full bg-gradient-to-br from-brand-navy to-brand-ink p-4 flex flex-col justify-between text-white">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-brand-300 block">Noveraile Edition</span>
                <p className="font-serif font-bold text-xs mt-2 line-clamp-3 leading-tight">{title}</p>
              </div>
              <p className="text-[10px] text-gray-300 font-sans">{authorName}</p>
            </div>
          )}

          {/* Spine light reflection for realistic tactile depth */}
          <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-white/10 to-transparent pointer-events-none z-10" />
        </div>

        {/* Category Pill Tag */}
        {categoryName && (
          <span className="absolute top-3 left-3 z-20 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded text-[10px] font-semibold text-brand-slate uppercase tracking-wider shadow-xs border border-brand-border/80">
            {categoryName}
          </span>
        )}
      </Link>

      {/* 2. Book Info Body Below Cover */}
      <div className="p-5 flex flex-col flex-1">
        {/* Rating / New Release Badge (No hardcoded fake 5.0 stars) */}
        <div className="mb-2">
          {reviewCount && reviewCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(rating || 5)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-brand-slate">
                {(rating || 5).toFixed(1)}
              </span>
              <span className="text-[11px] text-brand-muted">({reviewCount})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                New Release
              </span>
              <span className="text-[11px] text-brand-muted">Direct Edition</span>
            </div>
          )}
        </div>

        {/* Book Title */}
        <Link href={`/books/${slug}`} className="block group-hover:text-brand-700 transition-colors">
          <h3 className="font-serif text-lg font-bold text-brand-ink leading-snug line-clamp-2">
            {title}
          </h3>
        </Link>

        {/* Author Byline */}
        <p className="text-xs font-medium text-brand-slate mt-1.5">
          By <span className="font-semibold text-brand-ink">{authorName}</span>
        </p>

        {/* Subtitle if available */}
        {subtitle && (
          <p className="text-xs text-brand-muted line-clamp-1 mt-1 font-light">
            {subtitle}
          </p>
        )}

        {/* Format Badge */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-brand-muted">
          <span className="inline-flex items-center gap-1 text-brand-slate font-medium">
            <BookOpen className="w-3 h-3 text-brand-500" />
            Digital Edition
          </span>
          <span>•</span>
          <span>Instant Cloud Reader</span>
        </div>

        {/* Price & Action Row */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand-ink">
              ${activePrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-brand-muted line-through">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          {isOwned ? (
            <Link
              href={`/reader/${slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read</span>
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={inCart}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                inCart
                  ? "bg-gray-100 text-gray-500 cursor-default"
                  : "bg-brand-ink text-white hover:bg-brand-900 shadow-xs hover:shadow"
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>In Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
