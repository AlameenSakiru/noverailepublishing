"use client";

import React, { useState } from "react";
import { Tag, Plus, CheckCircle2, XCircle, Search, Percent, DollarSign, AlertCircle } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  _count?: { uses: number };
}

export function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [maxUses, setMaxUses] = useState("500");

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          minOrderAmount,
          maxUses,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create coupon.");
        setLoading(false);
        return;
      }

      setCoupons([data.coupon, ...coupons]);
      setIsModalOpen(false);
      setCode("");
      setDiscountValue("");
      setMinOrderAmount("0");
      setMaxUses("500");
    } catch {
      setError("Network error while creating coupon.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      if (res.ok) {
        setCoupons(
          coupons.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
        );
      }
    } catch {
      // silently fail or retry
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-ink">
            Coupons & Promotional Discounts
          </h1>
          <p className="text-xs text-brand-slate mt-1">
            Create promotional voucher codes for campaigns, student discounts, and seasonal offers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-ink text-white font-semibold text-xs hover:bg-brand-900 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Search & Counter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupon codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="text-xs text-gray-500">
          Total Campaigns: <strong className="text-brand-ink">{coupons.length}</strong>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-brand-ink">No coupons found</p>
            <p className="text-xs text-gray-400 mt-1">
              Create your first promotional code to reward your readers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min. Spend</th>
                  <th className="p-4">Redemptions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Toggle Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-brand-ink text-sm">
                      <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-brand-ink">
                      {coupon.discountType === "PERCENTAGE" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <Percent className="w-3.5 h-3.5" />
                          <span>{coupon.discountValue}% OFF</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>${coupon.discountValue.toFixed(2)} OFF</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      ${coupon.minOrderAmount.toFixed(2)}
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="font-semibold text-brand-ink">
                        {coupon.usedCount || coupon._count?.uses || 0}
                      </span>{" "}
                      / {coupon.maxUses}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          coupon.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {coupon.isActive ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{coupon.isActive ? "ACTIVE" : "PAUSED"}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          coupon.isActive
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {coupon.isActive ? "Pause" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-brand-ink mb-1">
              Create New Promotion Code
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Set discount type, redemption allowances, and minimum cart amounts.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Coupon Code (uppercase)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXAM2026, SCHOLAR20"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono uppercase focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={discountType === "PERCENTAGE" ? "20" : "10.00"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Min Order Spend ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-brand-ink text-white font-semibold hover:bg-brand-900 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
