"use client";

import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Heading,
  List,
  ListOrdered,
  Quote,
  Eye,
  Edit3,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Code,
} from "lucide-react";
import { AmazonBookDescription } from "./AmazonBookDescription";

interface AmazonDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  required?: boolean;
  helpText?: string;
}

export function AmazonDescriptionEditor({
  value,
  onChange,
  placeholder = "Write or paste full book description (supports bullet points, bold tags, headings, and Amazon KDP text)...",
  rows = 8,
  label = "Full Book Description (Sales Page Body)",
  required = false,
  helpText = "Supports rich formatting: paste bullet points (•, -, *), bold text (<b>bold</b> or **bold**), headings (<h3>Title</h3>), and paragraphs.",
}: AmazonDescriptionEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to insert or wrap text around selection
  const insertFormatting = (prefix: string, suffix: string = "", defaultPlaceholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || "";
    const selectedText = currentVal.substring(start, end) || defaultPlaceholder;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    onChange(newVal);

    // Reposition cursor after update
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleInsertTemplate = () => {
    const template = `<h3>Discover the Ultimate Guide to Mastering This Subject</h3>

Are you ready to elevate your knowledge, sharpen your core skills, and achieve professional excellence? This definitive edition provides clear, step-by-step methodologies and practical frameworks.

<h4>Inside this comprehensive publication, you will discover:</h4>
• Core Frameworks: Master fundamental concepts with zero fluff or guesswork
• Step-by-Step Blueprints: Practical applications and real-world case studies
• Expert Techniques: Actionable strategies designed for immediate implementation
• Proven Retention Strategies: Key takeaways and chapter review questions

<h4>Who This Edition Is Built For:</h4>
• Dedicated professionals seeking a competitive edge
• Students and practitioners preparing for advanced certification
• Anyone looking for an authoritative, comprehensive direct-learning guide

<em>Get your copy today and take your expertise to the highest level!</em>`;

    if (value.trim() && !confirm("Replace current description with the Amazon Best-Seller template?")) {
      return;
    }
    onChange(template);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Write / Preview Tab Switcher */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-gray-100 border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === "write"
                ? "bg-white text-gray-900 shadow-2xs font-semibold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === "preview"
                ? "bg-white text-amber-700 shadow-2xs font-semibold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Amazon Live Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === "write" ? (
        <div className="space-y-1.5">
          {/* Amazon-Style Quick Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-1.5 bg-gray-50 rounded-t-xl border border-gray-300 border-b-0 text-xs">
            <button
              type="button"
              onClick={() => insertFormatting("<b>", "</b>", "Bold text")}
              className="p-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-gray-950 border border-transparent hover:border-gray-200 transition-colors"
              title="Bold Text (<b>...</b>)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("<i>", "</i>", "Italic text")}
              className="p-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-gray-950 border border-transparent hover:border-gray-200 transition-colors"
              title="Italic Text (<i>...</i>)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("<h3>", "</h3>", "Section Heading")}
              className="p-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-gray-950 border border-transparent hover:border-gray-200 transition-colors flex items-center gap-0.5"
              title="Heading 3 (<h3>...</h3>)"
            >
              <Heading className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">H3</span>
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("<h4>", "</h4>", "Sub-heading")}
              className="p-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-gray-950 border border-transparent hover:border-gray-200 transition-colors flex items-center gap-0.5"
              title="Heading 4 (<h4>...</h4>)"
            >
              <Heading className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">H4</span>
            </button>

            <div className="w-px h-4 bg-gray-300 mx-1" />

            <button
              type="button"
              onClick={() => insertFormatting("• ", "", "Key feature bullet point")}
              className="px-2 py-1 rounded-lg hover:bg-white text-gray-700 hover:text-gray-950 border border-transparent hover:border-gray-200 transition-colors flex items-center gap-1"
              title="Insert Bullet Point (• )"
            >
              <List className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-medium">• Bullet</span>
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("1. ", "", "First step or takeaway")}
              className="px-2 py-1 rounded-lg hover:bg-white text-gray-700 hover:text-gray-950 border border-transparent hover:border-gray-200 transition-colors flex items-center gap-1"
              title="Insert Numbered Point (1. )"
            >
              <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-medium">1. Numbered</span>
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("✔ ", "", "Checkmark bullet item")}
              className="px-2 py-1 rounded-lg hover:bg-white text-gray-700 hover:text-gray-950 border border-transparent hover:border-gray-200 transition-colors flex items-center gap-1"
              title="Insert Checkmark Bullet (✔ )"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-medium">✔ Check</span>
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("<blockquote>", "</blockquote>", "Editorial pull quote or reader praise...")}
              className="p-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-gray-950 border border-transparent hover:border-gray-200 transition-colors"
              title="Quote Box (<blockquote>...</blockquote>)"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={handleInsertTemplate}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors flex items-center gap-1 border border-amber-300/80 cursor-pointer"
                title="Populate with Amazon Best-Seller Description Layout"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Amazon Template</span>
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            rows={rows}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-b-xl border border-gray-300 text-xs sm:text-sm text-gray-900 leading-relaxed font-sans placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink/20 focus:border-brand-ink transition-all shadow-2xs font-mono"
          />
        </div>
      ) : (
        /* Amazon Live Preview Box */
        <div className="p-6 rounded-xl border border-amber-200 bg-[#fdfcfb] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100 text-xs">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Amazon Sales Page Rendering Preview</span>
            </div>
            <span className="text-[11px] text-gray-500">
              {value.length} characters • {value.split(/\r?\n/).filter(Boolean).length} lines
            </span>
          </div>

          <AmazonBookDescription
            content={value}
            defaultExpanded={true}
            showExpandToggle={false}
          />
        </div>
      )}

      {helpText && (
        <p className="text-[11px] text-gray-500 flex items-start gap-1 mt-1">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>{helpText}</span>
        </p>
      )}
    </div>
  );
}
