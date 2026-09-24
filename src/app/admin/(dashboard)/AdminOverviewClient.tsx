"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  ExternalLink,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  Tag,
  DollarSign,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";

interface BookLeaderboardItem {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  imprintName: string;
  categoryName: string;
  price: number;
  salesCount: number;
  totalRevenue: number;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  customerEmail: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  itemsCount: number;
}

interface EntitlementItem {
  id: string;
  userEmail: string;
  bookTitle: string;
  status: string;
  grantedAt: string;
}

export interface ChartDataPoint {
  label: string;
  subLabel?: string;
  fullTitle: string;
  royalties: number;
  units: number;
  pages: number;
}

export interface BookDataset {
  daily7d: ChartDataPoint[];
  daily14d: ChartDataPoint[];
  monthly: ChartDataPoint[];
  yearly: ChartDataPoint[];
}

// Deterministic formatters to prevent SSR/hydration locale mismatches
function formatCurrency(amount: number): string {
  const parts = Number(amount || 0).toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function formatCount(val: number): string {
  return Math.round(val || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatOrderDate(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  } catch {
    return String(dateInput);
  }
}

interface OverviewProps {
  grossRevenue: number;
  totalOrdersCount: number;
  paidOrdersCount: number;
  totalPaidUnits: number;
  activeTitlesCount: number;
  totalReadersCount: number;
  totalEntitlementsCount: number;
  recentOrders: OrderItem[];
  recentEntitlements: EntitlementItem[];
  topBooks: BookLeaderboardItem[];
  initialDaily7d: ChartDataPoint[];
  initialDaily14d: ChartDataPoint[];
  initialMonthly: ChartDataPoint[];
  initialYearly: ChartDataPoint[];
  bookDatasets?: Record<string, BookDataset>;
}

export function AdminOverviewClient({
  grossRevenue,
  totalOrdersCount,
  paidOrdersCount,
  totalPaidUnits,
  activeTitlesCount,
  totalReadersCount,
  recentOrders,
  topBooks,
  initialDaily7d,
  initialDaily14d,
  initialMonthly,
  initialYearly,
  bookDatasets,
}: OverviewProps) {
  // Granularity View: "day" | "month" | "year"
  const [viewMode, setViewMode] = useState<"day" | "month" | "year">("day");

  // Day Range sub-filter: "7d" | "14d"
  const [dayRange, setDayRange] = useState<"7d" | "14d">("7d");

  // KDP Metric Tab: "royalties" | "units" | "pages"
  const [metricTab, setMetricTab] = useState<"royalties" | "units" | "pages">("royalties");

  // Title selector filter
  const [selectedBookId, setSelectedBookId] = useState<string>("ALL");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Recent Orders Filter
  const [orderFilter, setOrderFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  // Determine active dataset based on viewMode, range & selectedBookId
  const activeDataset: ChartDataPoint[] = React.useMemo(() => {
    if (selectedBookId !== "ALL" && bookDatasets && bookDatasets[selectedBookId]) {
      const bookData = bookDatasets[selectedBookId];
      if (viewMode === "year") return bookData.yearly;
      if (viewMode === "month") return bookData.monthly;
      return dayRange === "7d" ? bookData.daily7d : bookData.daily14d;
    }

    const rawDataset =
      viewMode === "year"
        ? initialYearly
        : viewMode === "month"
        ? initialMonthly
        : dayRange === "7d"
        ? initialDaily7d
        : initialDaily14d;

    if (selectedBookId === "ALL") return rawDataset;

    // Fallback proportional calculation if book is not in precomputed datasets
    const selectedBook = topBooks.find((b) => b.id === selectedBookId);
    if (!selectedBook || grossRevenue === 0) return rawDataset;
    const ratio = selectedBook.totalRevenue / grossRevenue;
    return rawDataset.map((item) => ({
      ...item,
      royalties: Number((item.royalties * ratio).toFixed(2)),
      units: Math.round(item.units * ratio),
      pages: Math.round(item.pages * ratio),
    }));
  }, [
    selectedBookId,
    viewMode,
    dayRange,
    bookDatasets,
    initialYearly,
    initialMonthly,
    initialDaily7d,
    initialDaily14d,
    topBooks,
    grossRevenue,
  ]);

  // Active period totals (calculated dynamically from active dataset)
  const totalRoyalties = activeDataset.reduce((sum, d) => sum + d.royalties, 0);
  const totalUnits = activeDataset.reduce((sum, d) => sum + d.units, 0);
  const totalPages = activeDataset.reduce((sum, d) => sum + d.pages, 0);

  // Dynamic Y-Axis scale calculation
  const maxRawValue = Math.max(
    ...activeDataset.map((d) =>
      metricTab === "royalties"
        ? d.royalties
        : metricTab === "units"
        ? d.units
        : d.pages
    )
  );

  const yCeiling = Math.max(10, Math.ceil(maxRawValue * 1.15));

  const formatYLabel = (val: number) => {
    if (metricTab === "royalties") {
      if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
      return `$${Math.round(val)}`;
    }
    if (metricTab === "pages") {
      if (val >= 1000) return `${Math.round(val / 1000)}k`;
      return `${Math.round(val)}`;
    }
    return `${Math.round(val)}`;
  };

  const filteredOrders = recentOrders.filter((o) => {
    if (orderFilter === "ALL") return true;
    return o.paymentStatus === orderFilter;
  });

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. TOP HEADER (Aligned with Container) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Noveraile Direct Publishing • Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Sales & Royalties Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time reader purchases, digital downloads, and imprint royalties.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>

          <Link
            href="/admin/books"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-gray-950 font-bold text-xs transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Title</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 TOP KPI TILES (100% Mathematically Aligned With DB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-xs font-medium text-gray-500">Total Lifetime Revenue</div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            ${grossRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {paidOrdersCount} completed orders
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-xs font-medium text-gray-500">Total Paid Units</div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            {totalPaidUnits}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Avg. ${(paidOrdersCount > 0 ? grossRevenue / paidOrdersCount : 0).toFixed(2)} per order
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-xs font-medium text-gray-500">Books in Catalog</div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            {activeTitlesCount}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Active digital editions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-xs font-medium text-gray-500">Registered Readers</div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            {totalReadersCount}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Customer reading accounts
          </div>
        </div>
      </div>

      {/* 3. AMAZON KDP SALES & ROYALTIES CARD */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* KDP Top Filter Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-[#f8fafc] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* VIEW BY: PER DAY, PER MONTH, PER YEAR */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                View By
              </label>
              <div className="inline-flex items-center bg-white border border-gray-300 rounded-lg p-0.5 shadow-2xs">
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    viewMode === "day"
                      ? "bg-gray-900 text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Per Day
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    viewMode === "month"
                      ? "bg-gray-900 text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Per Month
                </button>
                <button
                  onClick={() => setViewMode("year")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    viewMode === "year"
                      ? "bg-gray-900 text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Per Year
                </button>
              </div>
            </div>

            {/* Sub-range for Per Day */}
            {viewMode === "day" && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                  Range
                </label>
                <div className="inline-flex items-center bg-white border border-gray-300 rounded-lg p-0.5 shadow-2xs">
                  <button
                    onClick={() => setDayRange("7d")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      dayRange === "7d"
                        ? "bg-gray-200 text-gray-900 font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setDayRange("14d")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      dayRange === "14d"
                        ? "bg-gray-200 text-gray-900 font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    14 Days
                  </button>
                </div>
              </div>
            )}

            {/* Title Filter Dropdown */}
            <div className="relative">
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                Title Filter
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
              >
                <option value="ALL">All Titles ({topBooks.length})</option>
                {topBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timeframe Scope Indicator */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Active Scope
            </span>
            <span className="text-xs font-semibold text-gray-700 font-mono">
              {viewMode === "day" && (dayRange === "7d" ? "Last 7 Days (Daily)" : "Last 14 Days (Daily)")}
              {viewMode === "month" && `Calendar Year ${initialMonthly[0]?.subLabel || "2026"} (Monthly)`}
              {viewMode === "year" && `Multi-Year Trajectory (${initialYearly[0]?.label || "2024"} - ${initialYearly[initialYearly.length - 1]?.label || "2027"})`}
            </span>
          </div>
        </div>

        {/* KDP Metric Tabs (The Famous KDP Top Bar) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-200 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          {/* Tab 1: Net Royalties */}
          <button
            onClick={() => setMetricTab("royalties")}
            className={`p-4 sm:p-5 text-left transition-all relative ${
              metricTab === "royalties"
                ? "bg-amber-50/40"
                : "hover:bg-gray-50"
            }`}
          >
            {metricTab === "royalties" && (
              <span className="absolute top-0 left-0 right-0 h-1 bg-[#FF9900]" />
            )}
            <div className="text-xs font-semibold text-gray-600 flex items-center justify-between">
              <span>Paid Royalties / Revenue</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono mt-1">
              ${formatCurrency(totalRoyalties)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Net digital book sales ({viewMode === "day" ? (dayRange === "7d" ? "last 7 days" : "last 14 days") : viewMode === "month" ? `${initialMonthly[0]?.subLabel || "2026"} YTD` : "multi-year"})
            </div>
          </button>

          {/* Tab 2: Units Ordered */}
          <button
            onClick={() => setMetricTab("units")}
            className={`p-4 sm:p-5 text-left transition-all relative ${
              metricTab === "units"
                ? "bg-amber-50/40"
                : "hover:bg-gray-50"
            }`}
          >
            {metricTab === "units" && (
              <span className="absolute top-0 left-0 right-0 h-1 bg-[#FF9900]" />
            )}
            <div className="text-xs font-semibold text-gray-600 flex items-center justify-between">
              <span>Paid Units Ordered</span>
              <ShoppingBag className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono mt-1">
              {formatCount(totalUnits)}{" "}
              <span className="text-sm font-sans font-normal text-gray-500">
                units
              </span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Full digital edition downloads
            </div>
          </button>

          {/* Tab 3: Cloud Pages Read */}
          <button
            onClick={() => setMetricTab("pages")}
            className={`p-4 sm:p-5 text-left transition-all relative ${
              metricTab === "pages"
                ? "bg-amber-50/40"
                : "hover:bg-gray-50"
            }`}
          >
            {metricTab === "pages" && (
              <span className="absolute top-0 left-0 right-0 h-1 bg-[#FF9900]" />
            )}
            <div className="text-xs font-semibold text-gray-600 flex items-center justify-between">
              <span>Cloud Reader Pages Read</span>
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono mt-1">
              {formatCount(totalPages)}{" "}
              <span className="text-sm font-sans font-normal text-gray-500">
                pages
              </span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Active browser reader engagement
            </div>
          </button>
        </div>

        {/* KDP Chart Body with Y-Axis & Horizontal Guidelines */}
        <div className="p-6 sm:p-8">
          <div className="relative h-64 w-full flex">
            {/* Y-Axis Labels */}
            <div className="w-14 sm:w-16 shrink-0 flex flex-col justify-between text-[11px] font-mono text-gray-400 text-right pr-3 select-none">
              <span>{formatYLabel(yCeiling)}</span>
              <span>{formatYLabel(yCeiling * 0.75)}</span>
              <span>{formatYLabel(yCeiling * 0.5)}</span>
              <span>{formatYLabel(yCeiling * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Grid Area with Bars */}
            <div className="flex-1 relative flex flex-col justify-between border-l border-b border-gray-300">
              {/* Horizontal Background Guideline Rules */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-gray-100" />
                <div className="w-full border-t border-gray-100" />
                <div className="w-full border-t border-gray-100" />
                <div className="w-full border-t border-gray-100" />
                <div className="w-full" />
              </div>

              {/* Data Columns */}
              <div className="relative z-10 w-full h-full flex items-end justify-between px-2 sm:px-4">
                {activeDataset.map((item, idx) => {
                  const val =
                    metricTab === "royalties"
                      ? item.royalties
                      : metricTab === "units"
                      ? item.units
                      : item.pages;

                  const heightPercent =
                    val === 0 ? 0 : Math.max(5, Math.round((val / yCeiling) * 100));

                  const isHovered = hoveredIndex === idx;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative px-0.5 sm:px-1"
                    >
                      {/* KDP Hover Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-16 z-30 bg-gray-900 text-white rounded-lg p-2.5 shadow-xl text-[11px] whitespace-nowrap pointer-events-none transform -translate-y-1">
                          <div className="font-semibold text-gray-300 border-b border-gray-700 pb-1 mb-1">
                            {item.fullTitle}
                          </div>
                          <div className="font-mono text-[#FF9900] font-bold text-sm">
                            {metricTab === "royalties" && `$${formatCurrency(item.royalties)}`}
                            {metricTab === "units" && `${formatCount(item.units)} units`}
                            {metricTab === "pages" && `${formatCount(item.pages)} pages`}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {item.units} {item.units === 1 ? "copy" : "copies"} • ${formatCurrency(item.royalties)} volume
                          </div>
                        </div>
                      )}

                      {/* Bar Graphic with Amazon Orange Accent */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full ${
                          viewMode === "year"
                            ? "max-w-[64px]"
                            : viewMode === "month"
                            ? "max-w-[28px]"
                            : "max-w-[34px]"
                        } rounded-t transition-all ${
                          val === 0
                            ? "bg-transparent border-t border-dashed border-gray-300"
                            : isHovered
                            ? "bg-[#e68a00] shadow-md ring-2 ring-amber-400/50"
                            : "bg-[#FF9900] hover:bg-[#e68a00]"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X-Axis Labels */}
          <div className="flex pl-14 sm:pl-16 pt-3 text-[11px] text-gray-500 font-medium">
            <div className="flex-1 flex justify-between px-2 sm:px-4">
              {activeDataset.map((item, idx) => (
                <div key={idx} className="flex-1 text-center truncate">
                  <span className="font-semibold text-gray-800">{item.label}</span>
                  {item.subLabel && viewMode !== "day" && (
                    <span className="block text-[10px] text-gray-400 -mt-0.5">
                      {item.subLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chart Legend / Summary */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
                <span className="w-3 h-3 rounded-xs bg-[#FF9900]" />
                <span>
                  {metricTab === "royalties"
                    ? "Net Royalties ($ USD)"
                    : metricTab === "units"
                    ? "Paid Digital Copies"
                    : "Cloud Reader Pages Read"}
                </span>
              </span>
              <span className="text-gray-400">•</span>
              <span>Granularity: <strong>{viewMode === "day" ? "Daily" : viewMode === "month" ? "Monthly" : "Yearly"}</strong></span>
            </div>
            <div className="font-mono text-gray-700 font-medium">
              Average per {viewMode === "day" ? "Day" : viewMode === "month" ? "Month" : "Year"}:{" "}
              <strong>
                ${(totalRoyalties / (activeDataset.filter((d) => d.royalties > 0).length || 1)).toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT ORDERS & STORE SHORTCUTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Customer Orders */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Recent Orders & Transactions
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Direct-to-reader purchases processed through checkout.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {(["ALL", "PAID", "PENDING"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderFilter(s)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    orderFilter === s
                      ? "bg-white text-gray-900 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f8fafc] text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-gray-700 text-xs">No customer orders recorded yet</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        As real readers complete checkout, transactions will appear here automatically.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {order.customerEmail}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {order.itemsCount} {order.itemsCount === 1 ? "book" : "books"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {order.paymentStatus === "PAID" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{order.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {formatOrderDate(order.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-gray-50/70 border-t border-gray-100 text-right">
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-gray-700 hover:text-gray-950 inline-flex items-center gap-1"
            >
              <span>View complete orders ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: KDP Fast Management Shortcuts */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Publisher Tools
            </h2>

            <div className="space-y-3">
              <Link
                href="/admin/books"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900 group-hover:text-amber-900">
                      Book Catalog
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Manage metadata, pricing & covers
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-700" />
              </Link>

              <Link
                href="/admin/coupons"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900 group-hover:text-emerald-900">
                      Promotions & Coupons
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Create student & launch discount codes
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700" />
              </Link>

              <Link
                href="/admin/customers"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900 group-hover:text-blue-900">
                      Reader Entitlements
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Verify customer reading access
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-700" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-400">
            All reports formatted according to independent digital publishing standards.
          </div>
        </div>
      </div>
    </div>
  );
}
