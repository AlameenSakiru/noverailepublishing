"use client";

import React, { useState } from "react";
import {
  Users,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  Ban,
  Trash2,
  ShieldCheck,
  Search,
  UserCheck,
  Laptop,
  BookOpen,
  Filter,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  createdAt: string | Date;
  entitlements: any[];
  _count?: {
    sessions: number;
    orders: number;
    bookmarks: number;
  };
}

interface CustomerEntitlementsClientProps {
  users: UserRecord[];
  books: { id: string; title: string }[];
}

export function CustomerEntitlementsClient({
  users,
  books,
}: CustomerEntitlementsClientProps) {
  const router = useRouter();

  // Navigation Sub-tab: "users" | "entitlements"
  const [activeSubTab, setActiveSubTab] = useState<"users" | "entitlements">("users");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "ADMIN">("ALL");

  // Manual Entitlement Form State
  const [grantEmail, setGrantEmail] = useState("");
  const [grantBookId, setGrantBookId] = useState(books[0]?.id || "");
  const [grantReason, setGrantReason] = useState("Customer service manual license provision");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ACTIVE") return u.status === "ACTIVE";
    if (statusFilter === "SUSPENDED") return u.status === "SUSPENDED";
    if (statusFilter === "ADMIN") return u.role === "ADMIN" || u.role === "EDITOR";
    return true;
  });

  const totalActive = users.filter((u) => u.status === "ACTIVE").length;
  const totalSuspended = users.filter((u) => u.status === "SUSPENDED").length;

  // Handle Suspend / Ban User
  const handleSuspendUser = async (user: UserRecord) => {
    const reason = prompt(
      `Are you sure you want to SUSPEND & BAN ${user.email}?\n\nThis will immediately terminate all their active sessions and block them from logging in.\n\nType 'CONFIRM' to proceed:`,
      ""
    );
    if (reason !== "CONFIRM") return;

    setActionLoadingId(user.id);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "SUSPEND",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: data.message || `User ${user.email} was suspended.`, type: "success" });
        router.refresh();
      } else {
        setMessage({ text: data.error || "Failed to suspend user.", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error suspending user.", type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reactivate User
  const handleActivateUser = async (user: UserRecord) => {
    if (!confirm(`Reactivate account for ${user.email}? They will be able to log in again.`)) return;

    setActionLoadingId(user.id);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "ACTIVATE",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: data.message || `User ${user.email} was reactivated.`, type: "success" });
        router.refresh();
      } else {
        setMessage({ text: data.error || "Failed to reactivate user.", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error reactivating user.", type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete User Permanently
  const handleDeleteUser = async (user: UserRecord) => {
    const confirmed = prompt(
      `⚠️ PERMANENT DELETION WARNING\n\nAre you sure you want to permanently delete user:\n${user.name} (${user.email})?\n\nThis will permanently remove their account, active sessions, bookmarks, and reader notes.\n\nType 'DELETE' to confirm:`,
      ""
    );
    if (confirmed !== "DELETE") return;

    setActionLoadingId(user.id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users?userId=${user.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: data.message || `User ${user.email} was permanently deleted.`, type: "success" });
        router.refresh();
      } else {
        setMessage({ text: data.error || "Failed to delete user.", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error deleting user.", type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Grant Entitlement
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
        setMessage({ text: data.error || "Failed to grant entitlement.", type: "error" });
        setLoading(false);
        return;
      }

      setMessage({ text: "Digital book entitlement successfully granted!", type: "success" });
      setGrantEmail("");
      router.refresh();
      setLoading(false);
    } catch {
      setMessage({ text: "Network error granting entitlement.", type: "error" });
      setLoading(false);
    }
  };

  // Handle Revoke Entitlement
  const handleRevoke = async (userEmail: string, bookId: string) => {
    if (!confirm(`Are you sure you wish to revoke license access for ${userEmail}?`)) return;

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
        setMessage({ text: `Revoked access for ${userEmail}.`, type: "success" });
      }
    } catch {
      alert("Error revoking access.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Accounts
            </span>
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <p className="font-serif text-2xl font-bold text-brand-ink mt-2">{users.length}</p>
          <span className="text-[11px] text-gray-400 font-mono">Platform registered readers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Active Users
            </span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-serif text-2xl font-bold text-emerald-700 mt-2">{totalActive}</p>
          <span className="text-[11px] text-gray-400 font-mono">In good standing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Suspended / Banned
            </span>
            <Ban className="w-4 h-4 text-red-500" />
          </div>
          <p className="font-serif text-2xl font-bold text-red-700 mt-2">{totalSuspended}</p>
          <span className="text-[11px] text-gray-400 font-mono">Access blocked & sessions evicted</span>
        </div>
      </div>

      {/* Global Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-[11px] opacity-60 hover:opacity-100 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Controls */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === "users"
                ? "bg-brand-ink text-white shadow-xs"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts & Security Controls</span>
          </button>

          <button
            onClick={() => setActiveSubTab("entitlements")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === "entitlements"
                ? "bg-brand-ink text-white shadow-xs"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Manual Book License Provisioning</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: User Accounts & Moderation Table */}
      {activeSubTab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by reader name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-ink"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mr-1">
                Filter:
              </span>
              {(["ALL", "ACTIVE", "SUSPENDED", "ADMIN"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === filter
                      ? "bg-brand-ink text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {filter === "ALL" ? `All (${users.length})` : filter}
                </button>
              ))}
            </div>
          </div>

          {/* User Moderation List */}
          <div className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                No users found matching your search criteria.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSuspended = user.status === "SUSPENDED";
                const isAdmin = user.role === "ADMIN" || user.role === "EDITOR";
                const isBusy = actionLoadingId === user.id;

                return (
                  <div
                    key={user.id}
                    className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                      isSuspended ? "bg-rose-50/40" : "hover:bg-gray-50/50"
                    }`}
                  >
                    {/* User Identity Info */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold font-serif text-sm shrink-0 ${
                          isSuspended
                            ? "bg-red-100 text-red-800"
                            : isAdmin
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif font-bold text-sm text-brand-ink">
                            {user.name}
                          </h4>

                          {/* Status Badge */}
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold border border-red-200">
                              <Ban className="w-2.5 h-2.5" />
                              Banned / Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Active
                            </span>
                          )}

                          {/* Role Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isAdmin
                                ? "bg-amber-500/20 text-amber-900 border border-amber-500/30"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {user.role}
                          </span>

                          {user.isEmailVerified && (
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 font-mono mt-0.5">{user.email}</p>

                        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono mt-1.5">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {user.entitlements?.length || 0} Books
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Laptop className="w-3 h-3" />
                            {user._count?.sessions || 0} Sessions
                          </span>
                          <span>•</span>
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Moderation Actions Group */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      {isSuspended ? (
                        <button
                          onClick={() => handleActivateUser(user)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reactivate Account</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendUser(user)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Suspend / Ban</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={isBusy}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete User Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Manual License Provisioning */}
      {activeSubTab === "entitlements" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Manual Entitlement Grant Card */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="font-serif text-base font-bold text-brand-ink mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-500" />
              <span>Grant Digital Book Access</span>
            </h2>

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
                Active Customer Book Licenses
              </h2>
              <span className="text-xs text-gray-400">{users.length} Customers</span>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-brand-ink">{user.name}</h4>
                      <p className="text-xs text-gray-500 font-mono">{user.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
                      {user.entitlements?.length || 0} Active Licenses
                    </span>
                  </div>

                  {user.entitlements && user.entitlements.length > 0 && (
                    <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-brand-200">
                      {user.entitlements.map((ent: any) => (
                        <div
                          key={ent.id}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <span className="font-medium text-brand-slate truncate max-w-md">
                            {ent.book?.title || "Book License"}
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
      )}
    </div>
  );
}
