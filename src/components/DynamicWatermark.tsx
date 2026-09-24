"use client";

import React from "react";

interface DynamicWatermarkProps {
  watermarkText?: string;
  theme?: "light" | "sepia" | "dark";
}

export function DynamicWatermark({ watermarkText, theme = "light" }: DynamicWatermarkProps) {
  if (!watermarkText) return null;

  const textColor =
    theme === "dark"
      ? "text-white/10"
      : theme === "sepia"
      ? "text-[#433422]/10"
      : "text-black/8";

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20"
      aria-hidden="true"
    >
      {/* Repeating Diagonal Watermark Grid */}
      <div className="w-[180%] h-[180%] -translate-x-[20%] -translate-y-[20%] rotate-[-25deg] flex flex-col justify-around">
        {[...Array(6)].map((_, rowIndex) => (
          <div key={rowIndex} className="flex justify-around whitespace-nowrap">
            {[...Array(3)].map((_, colIndex) => (
              <span
                key={colIndex}
                className={`font-mono text-xs md:text-sm tracking-wider font-medium ${textColor}`}
              >
                {watermarkText}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
