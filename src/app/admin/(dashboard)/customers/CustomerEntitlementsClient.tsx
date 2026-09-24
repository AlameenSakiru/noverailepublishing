"use client";

import React, { useState } from "react";
import { Users, ShieldAlert, CheckCircle2, UserPlus, Ban } from "lucide-react";
import { useRouter } from "next/navigation";

interface CustomerEntitlementsClientProps {
  users: any[];
  books: { id: string; title: string }[];
}

export function CustomerEntitlementsClient({
  users,
  books,
}: CustomerEntitlementsClientProps) {
  const router = useRouter();
  const [grantEmail, setGrantEmail] = useState("");
  const [grantBookId, setGrantBookId] = useState(books[0]?.id || "");
  const [grantReason, setGrantReason] = useState("Customer service manual license provision");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/entitlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GRANT",
          userEmail: grantEmail,
          bookId: grantBookId,
          reason: grantReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to grant entitlement.");
        setLoading(false);
        return;
      }

      setMessage("Digital book entitlement successfully granted!");
      setGrantEmail("");
      router.refresh();
      setLoading(false);
    } catch {
      setMessage("Network error granting entitlement.");
      setLoading(false);
    }
  };

  const handleRevoke = async (userEmail: string, bookId: string) => {
    if (!confirm(`Are you sure you wish to revoke access for ${userEmail}?`)) return;

    try {
      const res = await fetch("/api/admin/entitlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVOKE",
          userEmail,
          bookId,
          reason: "Manual revocation by administrator",
        }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch {
      alert("Error revoking access.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Manual Entitlement Grant Card */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h2 className="font-serif text-base font-bold text-brand-ink mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-brand-500" />
          <span>Grant Digital Book Access</span>
        </h2>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            {message}
          </div>
        )}

        <form onSubmit={handleGrant} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Customer Account Email *
            </label>
            <input
              type="email"
              required
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="reader@example.com"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Publication *</label>
            <select
              value={grantBookId}
              onChange={(e) => setGrantBookId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Audit Rationale</label>
            <input
              type="text"
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-ink text-white font-semibold rounded-lg hover:bg-brand-900 disabled:opacity-50 transition-colors"
          >
            {loading ? "Granting..." : "Provision Entitlement"}
          </button>
        </form>
      </div>

      {/* Customer Accounts & Active Licenses Table */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-brand-ink">
            Registered Customers & Entitlements
          </h2>
          <span className="text-xs text-gray-400">{users.length} Customers</span>
        </div>

        <div className="divide-y divide-gray-100">
          {users.map((user) => (
            <div key={user.id} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-brand-ink">{user.name}</h4>
                  <p className="text-xs text-gray-500 font-mono">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
                  {user.entitlements.length} Active Licenses
                </span>
              </div>

              {user.entitlements.length > 0 && (
                <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-brand-200">
                  {user.entitlements.map((ent: any) => (
                    <div
                      key={ent.id}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <span className="font-medium text-brand-slate truncate max-w-md">
                        {ent.book.title}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                          {ent.status}
                        </span>
                        {ent.status === "ACTIVE" && (
                          <button
                            onClick={() => handleRevoke(user.email, ent.bookId)}
                            className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
