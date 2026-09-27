"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

interface AmazonBookDescriptionProps {
  content: string;
  defaultExpanded?: boolean;
  maxCollapsedHeight?: number;
  className?: string;
  showExpandToggle?: boolean;
}

/**
 * Parses raw description text (which may be HTML, Markdown, Plain Text with bullets,
 * or copied directly from Amazon KDP / Word) and renders it with Amazon-style rich formatting.
 */
export function formatAmazonDescriptionHtml(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let text = raw.trim();

  // Check if content is already rich HTML (contains <p>, <ul>, <ol>, <h3>, <div>, <b>, <strong>, etc.)
  const hasHtmlTags = /<\/?(p|ul|ol|li|h[1-6]|b|strong|i|em|blockquote|br|div|span|section)[^>]*>/i.test(text);

  if (hasHtmlTags) {
    // Process and enhance existing HTML
    let processed = text
      // Normalize linebreaks inside HTML
      .replace(/\r\n/g, "\n")
      // Style standard <ul> lists with Amazon-style bullet spacing
      .replace(/<ul([^>]*)>/gi, '<ul class="my-4 space-y-2.5 pl-1" $1>')
      // Style standard <ol> lists
      .replace(/<ol([^>]*)>/gi, '<ol class="my-4 space-y-2.5 pl-5 list-decimal" $1>')
      // Style <li> with custom bullet marker and padding
      .replace(/<li([^>]*)>/gi, '<li class="flex items-start gap-2.5 text-slate-800 leading-relaxed" $1><span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span><span class="flex-1">')
      .replace(/<\/li>/gi, '</span></li>')
      // Style <h3>, <h4> headings
      .replace(/<h3([^>]*)>/gi, '<h3 class="font-serif text-lg sm:text-xl font-bold text-slate-900 mt-6 mb-2.5" $1>')
      .replace(/<h4([^>]*)>/gi, '<h4 class="font-sans text-base sm:text-lg font-bold text-slate-900 mt-5 mb-2" $1>')
      .replace(/<h5([^>]*)>/gi, '<h5 class="font-sans text-sm sm:text-base font-bold text-slate-900 mt-4 mb-1.5" $1>')
      // Style <b> and <strong>
      .replace(/<b([^>]*)>/gi, '<strong class="font-bold text-slate-950" $1>')
      .replace(/<\/b>/gi, '</strong>')
      // Style blockquotes
      .replace(/<blockquote([^>]*)>/gi, '<blockquote class="border-l-4 border-amber-500 bg-amber-50/70 p-4 rounded-r-2xl italic my-4 text-slate-800" $1>')
      // Style <p>
      .replace(/<p([^>]*)>/gi, '<p class="mb-3.5 text-slate-800 leading-relaxed font-normal" $1>');

    return processed;
  }

  // If plain text or markdown format: Parse line by line into rich HTML
  const lines = text.split(/\r?\n/);
  const formattedBlocks: string[] = [];
  let inList = false;
  let inOrderedList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      formattedBlocks.push(
        `<ul class="my-4 space-y-2.5 pl-1">${listItems.join("")}</ul>`
      );
      listItems = [];
      inList = false;
    }
    if (inOrderedList && listItems.length > 0) {
      formattedBlocks.push(
        `<ol class="my-4 space-y-2.5 pl-5 list-decimal">${listItems.join("")}</ol>`
      );
      listItems = [];
      inOrderedList = false;
    }
  };

  const processInlineFormatting = (str: string): string => {
    return str
      // Bold markdown **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-bold text-slate-950">$1</strong>')
      // Italic markdown *text* or _text_
      .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em class="italic text-slate-800">$1</em>')
      .replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<em class="italic text-slate-800">$1</em>');
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();

    // Empty line
    if (!rawLine) {
      flushList();
      continue;
    }

    // Check for Markdown headings (### or ## or #)
    if (rawLine.startsWith("### ")) {
      flushList();
      const heading = processInlineFormatting(rawLine.replace(/^###\s+/, ""));
      formattedBlocks.push(`<h3 class="font-serif text-lg sm:text-xl font-bold text-slate-900 mt-6 mb-2.5">${heading}</h3>`);
      continue;
    }
    if (rawLine.startsWith("## ")) {
      flushList();
      const heading = processInlineFormatting(rawLine.replace(/^##\s+/, ""));
      formattedBlocks.push(`<h3 class="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-6 mb-3">${heading}</h3>`);
      continue;
    }

    // Check for Bullet points (•, -, *, +, ✔, ✓, ★, ➤, ►, ▪, ▫)
    const bulletMatch = rawLine.match(/^([•\-\*\+✔✓★➤►▪▫]|\u2022|\u2023|\u25E6|\u2043|\u2219)\s*(.*)$/);
    if (bulletMatch) {
      if (inOrderedList) flushList();
      inList = true;
      const itemContent = processInlineFormatting(bulletMatch[2]);
      listItems.push(
        `<li class="flex items-start gap-2.5 text-slate-800 leading-relaxed"><span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span><span class="flex-1">${itemContent}</span></li>`
      );
      continue;
    }

    // Check for Numbered lists (1., 2., 3.)
    const numberMatch = rawLine.match(/^(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      if (inList) flushList();
      inOrderedList = true;
      const itemContent = processInlineFormatting(numberMatch[2]);
      listItems.push(
        `<li class="text-slate-800 leading-relaxed pl-1">${itemContent}</li>`
      );
      continue;
    }

    // Check for Blockquote (> quote)
    if (rawLine.startsWith("> ")) {
      flushList();
      const quoteText = processInlineFormatting(rawLine.replace(/^>\s+/, ""));
      formattedBlocks.push(
        `<blockquote class="border-l-4 border-amber-500 bg-amber-50/70 p-4 rounded-r-2xl italic my-4 text-slate-800">${quoteText}</blockquote>`
      );
      continue;
    }

    // Check if line looks like a Section Header (e.g., ends with ":" and is relatively short, or ALL CAPS)
    const isHeadingLike =
      (rawLine.endsWith(":") && rawLine.length < 90 && !rawLine.includes(".")) ||
      (rawLine === rawLine.toUpperCase() && rawLine.length > 3 && rawLine.length < 60 && !rawLine.includes("."));

    if (isHeadingLike) {
      flushList();
      const heading = processInlineFormatting(rawLine);
      formattedBlocks.push(
        `<h4 class="font-serif text-base sm:text-lg font-bold text-slate-900 mt-5 mb-2">${heading}</h4>`
      );
      continue;
    }

    // Regular paragraph line
    flushList();
    const paragraphText = processInlineFormatting(rawLine);
    formattedBlocks.push(
      `<p class="mb-3.5 text-slate-800 leading-relaxed font-normal">${paragraphText}</p>`
    );
  }

  flushList();

  return formattedBlocks.join("");
}

export function AmazonBookDescription({
  content,
  defaultExpanded = false,
  maxCollapsedHeight = 280,
  className = "",
  showExpandToggle = true,
}: AmazonBookDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const formattedHtml = useMemo(() => {
    return formatAmazonDescriptionHtml(content);
  }, [content]);

  // Determine if content is long enough to warrant collapse
  const isLongContent = content && (content.length > 450 || content.split(/\r?\n/).length > 6);

  const shouldCollapse = showExpandToggle && isLongContent && !isExpanded;

  if (!content || !content.trim()) {
    return (
      <div className="text-gray-400 italic text-sm py-4">
        No editorial description provided for this publication.
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Content wrapper with smooth clamp & gradient */}
      <div
        className={`transition-all duration-300 ease-in-out relative ${
          shouldCollapse ? "overflow-hidden" : ""
        }`}
        style={
          shouldCollapse
            ? { maxHeight: `${maxCollapsedHeight}px` }
            : { maxHeight: "none" }
        }
      >
        <div
          className="amazon-description prose prose-slate max-w-none text-sm sm:text-base text-slate-800 font-sans"
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />

        {/* Amazon-style subtle bottom white gradient when collapsed */}
        {shouldCollapse && (
          <div
            className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Amazon-Style Expand / Collapse Toggle Button */}
      {showExpandToggle && isLongContent && (
        <div className="mt-3 pt-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200/80 px-4 py-2 rounded-xl transition-all shadow-2xs group cursor-pointer"
          >
            <span>{isExpanded ? "Read less" : "Read more"}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-amber-600 group-hover:-translate-y-0.5 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-600 group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
