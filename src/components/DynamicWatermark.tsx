"use client";

import React from "react";

interface DynamicWatermarkProps {
  watermarkText?: string;
  theme?: "light" | "sepia" | "dark";
}

export function DynamicWatermark({ watermarkText, theme = "light" }: DynamicWatermarkProps) {
  // Watermark completely disabled
  return null;
}
