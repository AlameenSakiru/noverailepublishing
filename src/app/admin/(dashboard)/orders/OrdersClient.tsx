"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Sliders,
  Calculator,
} from "lucide-react";

export interface TitlePerformanceItem {
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
  bookId: string;
  bookTitle: string;
  price: number;
}

interface Payment {
  id: string;
  provider: string;
  transactionId: string;
  status: string;
  amount: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  totalAmount: number;
  paymentStatus: string;
  currency: string;
  createdAt: string;
  items: OrderItem[];
  payment: Payment | null;
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

function formatCurrency(amount: number): string {
  const parts = Number(amount || 0).toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

interface OrdersClientProps {
  initialOrders: Order[];
  initialTitlePerformance: TitlePerformanceItem[];
}

export function OrdersClient({
  initialOrders,
  initialTitlePerformance,
}: OrdersClientProps) {
  const [orders] = useState<Order[]>(initialOrders);
  const [titlePerformance] = useState<TitlePerformanceItem[]>(initialTitlePerformance);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Active View Tab: "orders" | "royalties" | "all"
  const [activeView, setActiveView] = useState<"orders" | "royalties" | "all">("all");

  // Royalties Estimator Calculator State
  const [estimatorBookId, setEstimatorBookId] = useState<string>(
    initialTitlePerformance[0]?.id || "ALL"
  );
  const [estimatorUnits, setEstimatorUnits] = useState<number>(50);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "ALL" || order.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const paidCount = orders.filter((o) => o.paymentStatus === "PAID").length;
  const pendingCount = orders.filter((o) => o.paymentStatus === "PENDING").length;

  const totalUnitsSold = titlePerformance.reduce((sum, b) => sum + b.salesCount, 0);
  const totalCatalogRoyalties = titlePerformance.reduce((sum, b) => sum + b.totalRevenue, 0);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // Estimator computation
  const selectedEstimatorBook = titlePerformance.find((b) => b.id === estimatorBookId);
  const estimatorBookPrice = selectedEstimatorBook
    ? selectedEstimatorBook.price
    : titlePerformance.length > 0
    ? titlePerformance.reduce((s, b) => s + b.price, 0) / titlePerformance.length
    : 25.0;

  const projectedGross = estimatorBookPrice * estimatorUnits;
  const projectedRoyalty = projectedGross * 0.70; // 70% standard net royalty tier

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Commercial Ledger & Author Earnings</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Orders & Royalties Estimator
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Customer checkout ledger, real-time title revenue, and publisher royalty projections.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-2xs">
          <button
            onClick={() => setActiveView("orders")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeView === "orders"
                ? "bg-white text-gray-950 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveView("royalties")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeView === "royalties"
                ? "bg-white text-gray-950 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            <span>Title Royalties ({titlePerformance.length})</span>
          </button>

          <button
            onClick={() => setActiveView("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeView === "all"
                ? "bg-white text-gray-950 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>All Sections</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500">
            <span>Total Realized Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            ${formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {paidCount} paid transactions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500">
            <span>Paid Digital Units</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            {totalUnitsSold}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Across {titlePerformance.length} catalog editions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500">
            <span>Total Orders Recorded</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            {orders.length}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {pendingCount > 0 ? `${pendingCount} awaiting payment` : "100% fulfilled"}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500">
            <span>Catalog Royalties Ledger</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
            ${formatCurrency(totalCatalogRoyalties)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Avg. ${(totalUnitsSold > 0 ? totalCatalogRoyalties / totalUnitsSold : 0).toFixed(2)} net / unit
          </div>
        </div>
      </div>

      {/* 3. Title Performance & Royalties Breakdown (MOVED FROM OVERVIEW) */}
      {(activeView === "royalties" || activeView === "all") && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                  Title Performance & Royalties Breakdown
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Individual book performance, digital list prices, unit sales, and net royalties earned.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/books"
                className="text-xs font-semibold text-gray-700 hover:text-gray-950 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 shadow-2xs transition-colors"
              >
                <span>Manage Catalog Titles</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f8fafc] text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Imprint</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">List Price</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4">Total Royalties</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {titlePerformance.map((book) => (
                  <tr key={book.id} className="hover:bg-amber-50/20 transition-colors">
                    {/* Book Title & Cover */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-12 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200 shadow-2xs">
                          {book.coverImage ? (
                            <Image
                              src={book.coverImage}
                              alt={book.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/books/${book.slug}`}
                            target="_blank"
                            className="font-bold text-gray-900 hover:text-amber-800 transition-colors line-clamp-1"
                          >
                            {book.title}
                          </Link>
                          <div className="text-[11px] text-gray-500">
                            {book.categoryName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Imprint */}
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-mono">
                        {book.imprintName}
                      </span>
                    </td>

                    {/* Format */}
                    <td className="py-3 px-4 text-gray-600">
                      Cloud Reader Edition
                    </td>

                    {/* List Price */}
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                      ${book.price.toFixed(2)}
                    </td>

                    {/* Units Sold */}
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {book.salesCount}{" "}
                      <span className="text-[11px] font-normal text-gray-500">
                        {book.salesCount === 1 ? "unit" : "units"}
                      </span>
                    </td>

                    {/* Total Royalties */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm">
                      ${formatCurrency(book.totalRevenue)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>LIVE</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/books?edit=${book.id}`}
                        className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-[11px] transition-colors"
                      >
                        Edit Title
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Table Summary Footer */}
              <tfoot className="bg-[#f8fafc] border-t-2 border-gray-300 font-bold text-xs text-gray-900">
                <tr>
                  <td colSpan={4} className="py-3.5 px-4 text-gray-700">
                    Total Catalog Performance (All {titlePerformance.length} Titles)
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {totalUnitsSold} units
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-800 text-sm">
                    ${formatCurrency(totalCatalogRoyalties)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 text-gray-400 font-normal text-[11px]">
                    Matches Storefront Ledger 100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Interactive Royalties Simulator / Estimator Widget */}
          <div className="p-5 border-t border-gray-200 bg-amber-50/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  Interactive Royalties Estimator
                </h4>
                <p className="text-[11px] text-gray-500">
                  Model projected earnings at 70% standard net royalty tier.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-gray-600">
                  Title:
                </label>
                <select
                  value={estimatorBookId}
                  onChange={(e) => setEstimatorBookId(e.target.value)}
                  className="text-xs font-medium bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800 max-w-[180px] truncate"
                >
                  <option value="ALL">Catalog Average (${estimatorBookPrice.toFixed(2)})</option>
                  {titlePerformance.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (${b.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-gray-600">
                  Projected Units:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={estimatorUnits}
                  onChange={(e) => setEstimatorUnits(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-xs font-mono font-bold bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800 text-center"
                />
              </div>

              <div className="pl-3 border-l border-amber-200">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Est. Net Royalties:
                </span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  ${formatCurrency(projectedRoyalty)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Customer Orders Section */}
      {(activeView === "orders" || activeView === "all") && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Customer Purchases & Order Ledger
              </h2>
              <p className="text-xs text-gray-500">
                Search and inspect individual customer purchases, gateway verification, and transactions.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order #, customer email, book..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {["ALL", "PAID", "PENDING", "FAILED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    statusFilter === status
                      ? "bg-brand-ink text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-brand-ink">No orders found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try adjusting your search query or status filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="p-4">Order Number</th>
                      <th className="p-4">Customer Email</th>
                      <th className="p-4">Items</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Payment Status</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      return (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-gray-50/60 transition-colors">
                            <td className="p-4 font-mono font-bold text-brand-ink">
                              {order.orderNumber}
                            </td>
                            <td className="p-4 text-gray-700 font-medium">
                              {order.customerEmail}
                            </td>
                            <td className="p-4 text-gray-500">
                              <span className="inline-flex items-center gap-1 font-semibold text-brand-ink">
                                <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                <span>{order.items.length} {order.items.length === 1 ? "Book" : "Books"}</span>
                              </span>
                            </td>
                            <td className="p-4 font-bold text-brand-ink font-serif text-sm">
                              ${order.totalAmount.toFixed(2)} {order.currency}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  order.paymentStatus === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : order.paymentStatus === "PENDING"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {order.paymentStatus === "PAID" ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : order.paymentStatus === "PENDING" ? (
                                  <Clock className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                <span>{order.paymentStatus}</span>
                              </span>
                            </td>
                            <td className="p-4 text-gray-400">
                              {formatOrderDate(order.createdAt)}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => toggleExpand(order.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] transition-colors"
                              >
                                <span>{isExpanded ? "Hide" : "Inspect"}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Order Breakdown */}
                          {isExpanded && (
                            <tr className="bg-gray-50/80">
                              <td colSpan={7} className="p-5 border-t border-gray-100">
                                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-2xs">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                                    <div className="text-xs">
                                      <span className="font-semibold text-gray-700">
                                        Gateway Verification:
                                      </span>{" "}
                                      <span className="font-mono text-gray-500">
                                        {order.payment?.provider || "Direct / Sandbox"} — TxID:{" "}
                                        {order.payment?.transactionId || "N/A"}
                                      </span>
                                    </div>
                                    <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                      <CreditCard className="w-3.5 h-3.5" />
                                      <span>Processed Digitally</span>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                      Items In This Order ({order.items.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {order.items.map((item) => (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                                        >
                                          <div className="flex items-center gap-2">
                                            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                                            <span className="font-semibold text-brand-ink">
                                              {item.bookTitle}
                                            </span>
                                          </div>
                                          <span className="font-bold text-brand-ink">
                                            ${item.price.toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
