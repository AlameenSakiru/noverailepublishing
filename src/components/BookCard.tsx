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
    <div className="group flex flex-col h-full bg-white rounded-xl border border-brand-border hover:border-brand-300 hover:shadow-book-lg transition-all duration-300 overflow-hidden">
      {/* Book Cover Container with depth */}
      <Link href={`/books/${slug}`} className="relative block aspect-[3/4] overflow-hidden bg-brand-50 p-6 flex items-center justify-center">
        {/* Soft backdrop vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

        {/* 3D Book Cover Presentation */}
        <div className="relative w-4/5 h-full max-h-[260px] rounded shadow-book group-hover:scale-[1.03] transition-transform duration-300 overflow-hidden border border-black/10 bg-gradient-to-br from-brand-navy to-brand-ink flex flex-col justify-between p-4 text-white">
          <Image
            src={coverImage}
            alt={`Cover of ${title}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            onError={(e) => {
              // Hide broken image and reveal gradient cover underneath
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          {/* Tactile fallback typography visible if image fails or before load */}
          <div className="relative z-0 pointer-events-none">
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-300 block">Noveraile</span>
            <p className="font-serif font-bold text-xs mt-2 line-clamp-3 leading-tight">{title}</p>
          </div>
          <p className="text-[9px] text-gray-300 relative z-0">{authorName}</p>

          {/* Subtle Spine highlight for tactile feel */}
          <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/30 via-white/10 to-transparent pointer-events-none z-10" />
        </div>

        {categoryName && (
          <span className="absolute top-3 left-3 z-20 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-md text-[11px] font-semibold text-brand-ink uppercase tracking-wider shadow-sm border border-brand-border/60">
            {categoryName}
          </span>
        )}
      </Link>

      {/* Book Info Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-amber-500 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-current" />
          ))}
          <span className="text-xs font-semibold text-brand-slate ml-1">5.0</span>
        </div>

        <Link href={`/books/${slug}`} className="block group-hover:text-brand-700 transition-colors">
          <h3 className="font-serif text-lg font-bold text-brand-ink leading-snug line-clamp-2">
            {title}
          </h3>
        </Link>

        <p className="text-xs font-medium text-brand-muted mt-1">
          By {authorName}
        </p>

        {subtitle && (
          <p className="text-xs text-brand-slate line-clamp-2 mt-2 font-light">
            {subtitle}
          </p>
        )}

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read</span>
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={inCart}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inCart
                  ? "bg-gray-100 text-gray-500 cursor-default"
                  : "bg-brand-ink text-white hover:bg-brand-900 shadow-sm"
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
