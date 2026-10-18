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
}

export interface QuickSalesSummary {
  today: { royalties: number; units: number };
  yesterday: { royalties: number; units: number };
  thisMonth: { royalties: number; units: number; monthName: string };
  last7Days: { royalties: number; units: number };
  last14Days: { royalties: number; units: number };
  lifetime: { royalties: number; units: number };
}

export interface BookDataset {
  dailyToday: ChartDataPoint[];
  dailyYesterday: ChartDataPoint[];
  daily7d: ChartDataPoint[];
  daily14d: ChartDataPoint[];
  thisMonthDaily: ChartDataPoint[];
  monthly: ChartDataPoint[];
  yearly: ChartDataPoint[];
  quickSummary: QuickSalesSummary;
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
  initialQuickSummary: QuickSalesSummary;
  initialDailyToday: ChartDataPoint[];
  initialDailyYesterday: ChartDataPoint[];
  initialDaily7d: ChartDataPoint[];
  initialDaily14d: ChartDataPoint[];
  initialThisMonthDaily: ChartDataPoint[];
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
  initialQuickSummary,
  initialDailyToday,
  initialDailyYesterday,
  initialDaily7d,
  initialDaily14d,
  initialThisMonthDaily,
  initialMonthly,
  initialYearly,
  bookDatasets,
}: OverviewProps) {
  // Recent Orders Filter
  const [orderFilter, setOrderFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  // Active Quick Summary
  const activeQuickSummary: QuickSalesSummary = initialQuickSummary;

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

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>

          <Link
            href="/admin/books"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-gray-950 font-bold text-xs transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Title</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 TOP KPI TILES (100% Mathematically Aligned With DB) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">Total Lifetime Revenue</div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2 font-mono">
            ${grossRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
            {paidOrdersCount} completed orders
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">Total Paid Units</div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2 font-mono">
            {totalPaidUnits}
          </div>
          <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
            Avg. ${(paidOrdersCount > 0 ? grossRevenue / paidOrdersCount : 0).toFixed(2)} per order
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">Books in Catalog</div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2 font-mono">
            {activeTitlesCount}
          </div>
          <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
            Active digital editions
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">Registered Readers</div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2 font-mono">
            {totalReadersCount}
          </div>
          <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
            Customer reading accounts
          </div>
        </div>
      </div>

      {/* 2.5 SALES SNAPSHOT (Today, Yesterday, This Month, Last 7 Days) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Sales Snapshot
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Today */}
          <div className="p-3 sm:p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <span>Today</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Real-time" />
            </div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-gray-900 mt-1">
              ${formatCurrency(activeQuickSummary.today.royalties)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">
              {formatCount(activeQuickSummary.today.units)} {activeQuickSummary.today.units === 1 ? "unit" : "units"} ordered
            </div>
          </div>

          {/* Yesterday */}
          <div className="p-3 sm:p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Yesterday
            </div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-gray-900 mt-1">
              ${formatCurrency(activeQuickSummary.yesterday.royalties)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">
              {formatCount(activeQuickSummary.yesterday.units)} {activeQuickSummary.yesterday.units === 1 ? "unit" : "units"} ordered
            </div>
          </div>

          {/* This Month */}
          <div className="p-3 sm:p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 truncate">
              This Month ({activeQuickSummary.thisMonth.monthName})
            </div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-gray-900 mt-1">
              ${formatCurrency(activeQuickSummary.thisMonth.royalties)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">
              {formatCount(activeQuickSummary.thisMonth.units)} {activeQuickSummary.thisMonth.units === 1 ? "unit" : "units"} ordered
            </div>
          </div>

          {/* Last 7 Days */}
          <div className="p-3 sm:p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Last 7 Days
            </div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-gray-900 mt-1">
              ${formatCurrency(activeQuickSummary.last7Days.royalties)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">
              {formatCount(activeQuickSummary.last7Days.units)} {activeQuickSummary.last7Days.units === 1 ? "unit" : "units"} ordered
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT ORDERS & STORE SHORTCUTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Customer Orders */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Recent Orders & Transactions
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Direct-to-reader purchases processed through checkout.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
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

          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
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

          {/* Mobile Card List (visible on < md) */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <div className="py-10 px-4 text-center text-gray-400">
                <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 text-xs">No customer orders recorded yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Transactions will appear here automatically.
                </p>
              </div>
            ) : (
              filteredOrders.slice(0, 6).map((order) => (
                <div key={order.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-gray-900">
                      {order.orderNumber}
                    </span>
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
                  </div>
                  <div className="text-xs text-gray-700 font-medium truncate">
                    {order.customerEmail}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>
                      {order.itemsCount} {order.itemsCount === 1 ? "book" : "books"} • {formatOrderDate(order.createdAt)}
                    </span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
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
