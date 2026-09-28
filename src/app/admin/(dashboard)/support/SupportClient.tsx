"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Headphones,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  ExternalLink,
  Trash2,
  Save,
  Loader2,
  RefreshCw,
  User,
  ShieldCheck,
  Building2,
  GraduationCap,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  Inbox,
  Send,
} from "lucide-react";

interface SupportMessageItem {
  id: string;
  ticketId: string;
  senderType: string;
  senderName: string;
  senderEmail: string | null;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  adminNotes: string | null;
  source: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  messages?: SupportMessageItem[];
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  ORDER_ACCESS: {
    label: "Order & Cloud Access",
    icon: ShieldCheck,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  EXAM_PREP: {
    label: "Exam Prep & Errata",
    icon: GraduationCap,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  EDITORIAL: {
    label: "Author Submission",
    icon: Sparkles,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  LICENSING: {
    label: "Academic Licensing",
    icon: Building2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  TECHNICAL: {
    label: "Technical & Security",
    icon: ShieldAlert,
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  GENERAL: {
    label: "General Inquiry",
    icon: HelpCircle,
    color: "bg-gray-50 text-gray-700 border-gray-200",
  },
};

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  OPEN: {
    label: "Open / Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  },
};

const PRIORITY_META: Record<
  string,
  { label: string; badge: string }
> = {
  LOW: { label: "Low", badge: "bg-gray-100 text-gray-600" },
  NORMAL: { label: "Normal", badge: "bg-slate-100 text-slate-700" },
  HIGH: { label: "High", badge: "bg-amber-100 text-amber-800 font-bold" },
  URGENT: { label: "Urgent", badge: "bg-red-100 text-red-800 font-bold" },
};

export function SupportClient({
  initialTickets,
  initialStats,
  currentUserRole,
}: {
  initialTickets: Ticket[];
  initialStats: Stats;
  currentUserRole: string;
}) {
  const searchParams = useSearchParams();
  const ticketParam = searchParams.get("ticket");

  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [saveNoteSuccess, setSaveNoteSuccess] = useState(false);
  const [adminNoteDraft, setAdminNoteDraft] = useState("");

  // In-app Reply States
  const [replyDraft, setReplyDraft] = useState("");
  const [replyStatusChoice, setReplyStatusChoice] = useState<
    "IN_PROGRESS" | "RESOLVED" | "KEEP"
  >("IN_PROGRESS");
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState<string | null>(null);

  // Select ticket based on query param or first item
  useEffect(() => {
    if (ticketParam) {
      const match = tickets.find(
        (t) => t.ticketNumber.toLowerCase() === ticketParam.toLowerCase()
      );
      if (match) {
        setSelectedTicketId(match.id);
        setAdminNoteDraft(match.adminNotes || "");
        return;
      }
    }
    if (!selectedTicketId && tickets.length > 0) {
      setSelectedTicketId(tickets[0].id);
      setAdminNoteDraft(tickets[0].adminNotes || "");
    }
  }, [ticketParam, tickets]);

  const selectedTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  // When selected ticket changes, update note draft & reset reply draft
  useEffect(() => {
    if (selectedTicket) {
      setAdminNoteDraft(selectedTicket.adminNotes || "");
      setSaveNoteSuccess(false);
      setReplyDraft("");
      setReplySuccessMsg(null);
    }
  }, [selectedTicketId]);

  // Fetch tickets from API
  const refreshTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/support?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to refresh tickets", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.ticketNumber.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.message.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, search]);

  // Update Ticket Status or Priority
  const handleUpdateTicket = async (patch: {
    status?: string;
    priority?: string;
    adminNotes?: string;
  }) => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (res.ok) {
        const data = await res.json();
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? { ...t, ...data.ticket } : t))
        );
        if (patch.adminNotes !== undefined) {
          setSaveNoteSuccess(true);
          setTimeout(() => setSaveNoteSuccess(false), 3000);
        }
        // Update stats
        if (patch.status) {
          refreshTickets();
        }
      }
    } catch (err) {
      console.error("Failed to update ticket", err);
    } finally {
      setUpdating(false);
    }
  };

  // Dispatch In-App Reply to Customer
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyDraft.trim()) return;

    setSendingReply(true);
    setReplySuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyDraft.trim(),
          newStatus:
            replyStatusChoice === "RESOLVED"
              ? "RESOLVED"
              : replyStatusChoice === "IN_PROGRESS"
              ? "IN_PROGRESS"
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch reply.");
      }

      // Update ticket in local state
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? data.ticket : t))
      );
      setReplyDraft("");
      setReplySuccessMsg(
        `Official reply dispatched to ${selectedTicket.email} and recorded in ticket history.`
      );
      setTimeout(() => setReplySuccessMsg(null), 6000);
      refreshTickets();
    } catch (err: any) {
      alert(err.message || "Failed to dispatch reply.");
    } finally {
      setSendingReply(false);
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this support ticket?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/support/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
        if (selectedTicketId === id) {
          const remaining = tickets.filter((t) => t.id !== id);
          setSelectedTicketId(remaining.length > 0 ? remaining[0].id : null);
        }
        refreshTickets();
      }
    } catch (err) {
      console.error("Failed to delete ticket", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#0f172a] text-amber-400">
              <Headphones className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
              Customer Support & Editorial Desk
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage inquiries, license requests, exam prep questions, and reader correspondence.
          </p>
        </div>

        <button
          onClick={refreshTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 shadow-2xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-[#0f172a] text-white border-gray-900 shadow-sm"
              : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-70">
            Total Inquiries
          </span>
          <span className="text-2xl font-serif font-bold mt-1 block">
            {stats.total}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("OPEN")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "OPEN"
              ? "bg-amber-500 text-white border-amber-600 shadow-sm"
              : "bg-white border-amber-200/80 hover:border-amber-300 text-amber-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
              Open / Pending
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <span className="text-2xl font-serif font-bold mt-1 block">
            {stats.open}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "IN_PROGRESS"
              ? "bg-blue-600 text-white border-blue-700 shadow-sm"
              : "bg-white border-blue-200/80 hover:border-blue-300 text-blue-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
              In Progress
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          </div>
          <span className="text-2xl font-serif font-bold mt-1 block">
            {stats.inProgress}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("RESOLVED")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "RESOLVED"
              ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
              : "bg-white border-emerald-200/80 hover:border-emerald-300 text-emerald-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
              Resolved
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <span className="text-2xl font-serif font-bold mt-1 block">
            {stats.resolved}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("CLOSED")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "CLOSED"
              ? "bg-gray-700 text-white border-gray-800 shadow-sm"
              : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-70">
            Archived / Closed
          </span>
          <span className="text-2xl font-serif font-bold mt-1 block">
            {stats.closed}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by # reference, customer name, email, or keywords..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-800 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white outline-none focus:border-gray-800 font-medium text-gray-700"
          >
            <option value="ALL">All Categories</option>
            <option value="ORDER_ACCESS">Order & Cloud Access</option>
            <option value="EXAM_PREP">Exam Prep & Errata</option>
            <option value="EDITORIAL">Author Submission</option>
            <option value="LICENSING">Academic Licensing</option>
            <option value="TECHNICAL">Technical & Security</option>
            <option value="GENERAL">General Reader Inquiry</option>
          </select>

          {search || statusFilter !== "ALL" || categoryFilter !== "ALL" ? (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {/* Split Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket List Pane */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-gray-500">
            <span>
              Showing <strong>{filteredTickets.length}</strong> tickets
            </span>
            {loading && (
              <span className="flex items-center gap-1 text-amber-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Updating...
              </span>
            )}
          </div>

          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto" />
              <div className="font-serif font-bold text-gray-800 text-base">
                No tickets matching criteria
              </div>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                No support requests found with the selected status, category, or search keywords.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {filteredTickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const statusMeta = STATUS_META[t.status] || STATUS_META.OPEN;
                const catMeta = CATEGORY_META[t.category] || CATEGORY_META.GENERAL;
                const prioMeta = PRIORITY_META[t.priority] || PRIORITY_META.NORMAL;
                const Icon = catMeta.icon;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-white border-gray-900 shadow-md ring-1 ring-gray-900"
                        : "bg-white border-gray-200/90 hover:border-gray-300 hover:shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusMeta.bg} ${statusMeta.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}
                          ></span>
                          {statusMeta.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <h4 className="font-semibold text-xs text-gray-900 line-clamp-1">
                        {t.subject}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {t.message}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[130px]">{t.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${prioMeta.badge}`}
                        >
                          {prioMeta.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${catMeta.color}`}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          <span className="hidden sm:inline">{catMeta.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket Details Workspace */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Detail Header Strip */}
              <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-sm font-bold text-amber-400 bg-white/10 px-2.5 py-0.5 rounded">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Source: {selectedTicket.source}
                    </span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                    {selectedTicket.subject}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${encodeURIComponent(selectedTicket.email)}?subject=${encodeURIComponent(
                      `Re: [${selectedTicket.ticketNumber}] ${selectedTicket.subject} - Noveraile Publishing Support`
                    )}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Direct Reply</span>
                  </a>

                  {currentUserRole === "ADMIN" && (
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status & Priority Action Bar */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-600">Status:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) =>
                      handleUpdateTicket({ status: e.target.value })
                    }
                    disabled={updating}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-semibold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="OPEN">🟡 Open / Pending</option>
                    <option value="IN_PROGRESS">🔵 In Progress</option>
                    <option value="RESOLVED">🟢 Resolved</option>
                    <option value="CLOSED">⚪ Closed / Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-600">Priority:</span>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) =>
                      handleUpdateTicket({ priority: e.target.value })
                    }
                    disabled={updating}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-semibold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">🚨 Urgent</option>
                  </select>
                </div>

                <div className="text-[11px] text-gray-400">
                  Received: {new Date(selectedTicket.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Customer Profile Card */}
              <div className="p-6 border-b border-gray-100 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                      {selectedTicket.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        {selectedTicket.name}
                        {selectedTicket.user && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                            Registered Member
                          </span>
                        )}
                      </div>
                      <a
                        href={`mailto:${selectedTicket.email}`}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        {selectedTicket.email}
                      </a>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block">
                      Category
                    </span>
                    <span className="font-medium text-gray-900">
                      {CATEGORY_META[selectedTicket.category]?.label ||
                        selectedTicket.category}
                    </span>
                  </div>
                </div>

                {/* Inquiry Full Content */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Customer Inquiry Message
                  </span>
                  <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Resolution timestamp badge if resolved */}
                {selectedTicket.resolvedAt && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Marked as resolved on{" "}
                      <strong>
                        {new Date(selectedTicket.resolvedAt).toLocaleString()}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Conversation History & In-App Replies */}
              <div className="p-6 border-b border-gray-100 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Conversation Thread ({1 + (selectedTicket.messages?.length || 0)})
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      Live History
                    </span>
                  </div>
                </div>

                {/* Messages Timeline */}
                <div className="space-y-3 pt-1">
                  {/* Original Customer Message Bubble */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {selectedTicket.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {selectedTicket.name} (Customer)
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          Original Inquiry
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-800 leading-relaxed whitespace-pre-wrap pl-7">
                      {selectedTicket.message}
                    </div>
                  </div>

                  {/* Any Previous Replies */}
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((m) => {
                      const isAdmin = m.senderType === "ADMIN";
                      return (
                        <div
                          key={m.id}
                          className={`p-4 rounded-2xl text-xs space-y-2 border transition-all ${
                            isAdmin
                              ? "bg-slate-900 text-white border-slate-800 shadow-xs"
                              : "bg-blue-50/70 text-slate-900 border-blue-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isAdmin ? (
                                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                                  ★
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                                  {m.senderName.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <span
                                className={`font-semibold ${
                                  isAdmin ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {m.senderName}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  isAdmin
                                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {isAdmin
                                  ? "Noveraile Support Desk"
                                  : "Customer Reply"}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] ${
                                isAdmin ? "text-slate-400" : "text-slate-400"
                              }`}
                            >
                              {new Date(m.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`leading-relaxed whitespace-pre-wrap pl-7 ${
                              isAdmin ? "text-slate-200" : "text-slate-800"
                            }`}
                          >
                            {m.message}
                          </div>
                        </div>
                      );
                    })
                  ) : null}
                </div>

                {/* In-App Reply Composer Box */}
                <form
                  onSubmit={handleSendReply}
                  className="mt-6 pt-5 border-t border-slate-100 space-y-3 bg-amber-50/30 -mx-6 -mb-6 p-6 rounded-b-3xl border-t border-amber-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-[#0f172a] text-amber-400">
                        <Send className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Reply Directly from Website
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Dispatched instantly to <strong>{selectedTicket.email}</strong>
                    </span>
                  </div>

                  {replySuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{replySuccessMsg}</span>
                    </div>
                  )}

                  <textarea
                    rows={4}
                    required
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder={`Write your response to ${selectedTicket.name} here. It will appear in this thread and be emailed to ${selectedTicket.email}...`}
                    className="w-full p-3.5 border border-slate-300 rounded-xl text-xs outline-none focus:border-slate-800 transition-colors bg-white leading-relaxed resize-y"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">After sending:</span>
                      <select
                        value={replyStatusChoice}
                        onChange={(e: any) => setReplyStatusChoice(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="IN_PROGRESS">Set Status to In Progress</option>
                        <option value="RESOLVED">Mark Ticket as Resolved</option>
                        <option value="KEEP">
                          Keep Current Status ({selectedTicket.status})
                        </option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={sendingReply || !replyDraft.trim()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f172a] hover:bg-slate-900 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      {sendingReply ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          <span>Dispatching Reply & Email...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-amber-400" />
                          <span>Send Reply to Customer</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Internal Admin Notes */}
              <div className="p-6 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Internal Desk Notes (Private)
                    </span>
                    <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                      Not visible to customer
                    </span>
                  </div>

                  {saveNoteSuccess && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Note Saved!
                    </span>
                  )}
                </div>

                <textarea
                  rows={4}
                  value={adminNoteDraft}
                  onChange={(e) => setAdminNoteDraft(e.target.value)}
                  placeholder="Record internal resolution details, actions taken, refund transaction IDs, or follow-up notes for the team..."
                  className="w-full p-3.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-800 transition-colors bg-white leading-relaxed resize-y"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      handleUpdateTicket({ adminNotes: adminNoteDraft })
                    }
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {updating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Internal Note</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center space-y-3">
              <Headphones className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="font-serif font-bold text-gray-800 text-lg">
                No Ticket Selected
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Select a support inquiry from the list on the left to review details, reply to the customer, update status, and manage resolution notes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
