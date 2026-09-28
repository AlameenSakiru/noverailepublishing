"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock,
  Mail,
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
  Send,
  MessageSquare,
  FileText,
  Inbox,
  AlertCircle,
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

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  ORDER_ACCESS: { label: "Order & Cloud Access", icon: ShieldCheck },
  EXAM_PREP: { label: "Exam Prep & Errata", icon: GraduationCap },
  EDITORIAL: { label: "Author Submission", icon: Sparkles },
  LICENSING: { label: "Academic Licensing", icon: Building2 },
  TECHNICAL: { label: "Technical & Security", icon: ShieldAlert },
  GENERAL: { label: "General Inquiry", icon: HelpCircle },
};

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

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
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  // Detail Workspace Tab
  const [activePaneTab, setActivePaneTab] = useState<"THREAD" | "NOTES">("THREAD");

  // In-app Reply States
  const [replyDraft, setReplyDraft] = useState("");
  const [resolveOnSend, setResolveOnSend] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState<string | null>(null);

  // Internal Notes State
  const [adminNoteDraft, setAdminNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [saveNoteSuccess, setSaveNoteSuccess] = useState(false);

  // Select initial ticket
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

  // Sync draft states when selected ticket changes
  useEffect(() => {
    if (selectedTicket) {
      setAdminNoteDraft(selectedTicket.adminNotes || "");
      setReplyDraft("");
      setReplySuccessMsg(null);
      setSaveNoteSuccess(false);
    }
  }, [selectedTicketId]);

  // Fetch updated tickets from API
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

  // Update Status or Priority
  const handleUpdateTicket = async (patch: {
    status?: string;
    priority?: string;
    adminNotes?: string;
  }) => {
    if (!selectedTicket) return;
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
        refreshTickets();
      }
    } catch (err) {
      console.error("Failed to update ticket", err);
    }
  };

  // Save Internal Notes
  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: adminNoteDraft }),
      });

      if (res.ok) {
        const data = await res.json();
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? { ...t, ...data.ticket } : t))
        );
        setSaveNoteSuccess(true);
        setTimeout(() => setSaveNoteSuccess(false), 3000);
      }
    } catch (err) {
      alert("Failed to save internal note.");
    } finally {
      setSavingNote(false);
    }
  };

  // Dispatch In-App Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyDraft.trim()) return;

    setSendingReply(true);
    setReplySuccessMsg(null);

    try {
      const newStatus = resolveOnSend ? "RESOLVED" : "IN_PROGRESS";
      const res = await fetch(`/api/admin/support/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyDraft.trim(),
          newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch reply.");
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? data.ticket : t))
      );
      setReplyDraft("");
      setReplySuccessMsg(`Reply sent and emailed to ${selectedTicket.email}.`);
      setTimeout(() => setReplySuccessMsg(null), 5000);
      refreshTickets();
    } catch (err: any) {
      alert(err.message || "Failed to dispatch reply.");
    } finally {
      setSendingReply(false);
    }
  };

  // Delete Ticket
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
    <div className="space-y-4 font-sans text-gray-900 max-w-7xl mx-auto">
      {/* Clean Executive Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">
              Support Inbox
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {stats.open} open
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Customer inquiries, book access, and editorial correspondence.
          </p>
        </div>

        {/* Clean Filter Tabs & Search */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter Pills */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter("OPEN")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "OPEN"
                  ? "bg-white text-amber-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Open ({stats.open})
            </button>
            <button
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "IN_PROGRESS"
                  ? "bg-white text-blue-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              In Progress ({stats.inProgress})
            </button>
            <button
              onClick={() => setStatusFilter("RESOLVED")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "RESOLVED"
                  ? "bg-white text-emerald-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Resolved ({stats.resolved})
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs text-gray-700 outline-none cursor-pointer font-medium hover:border-gray-300"
          >
            <option value="ALL">All Categories</option>
            <option value="ORDER_ACCESS">Order & Cloud Access</option>
            <option value="EXAM_PREP">Exam Prep & Errata</option>
            <option value="EDITORIAL">Author Submission</option>
            <option value="LICENSING">Academic Licensing</option>
            <option value="TECHNICAL">Technical & Security</option>
            <option value="GENERAL">General Reader Inquiry</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={refreshTickets}
            disabled={loading}
            className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main 2-Pane Workspace */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
        {/* Left Pane: Conversations List */}
        <div className="w-full lg:w-[380px] lg:border-r border-gray-200 flex flex-col shrink-0 bg-gray-50/50">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or #ref..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-gray-800 transition-colors"
              />
            </div>
          </div>

          {/* Ticket List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-[660px]">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500 space-y-2">
                <Inbox className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700">No matching tickets</p>
                <p className="text-gray-400 text-[11px]">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const catMeta = CATEGORY_LABELS[t.category] || CATEGORY_LABELS.GENERAL;

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-white border-l-4 border-l-gray-900 shadow-2xs"
                        : "hover:bg-white/80 border-l-4 border-l-transparent"
                    }`}
                  >
                    {/* Top Row: Name + Time */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-gray-900 truncate pr-2">
                        {t.name}
                      </span>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {formatTimeAgo(t.createdAt)}
                      </span>
                    </div>

                    {/* Subject Line */}
                    <div className="text-xs text-gray-800 font-medium line-clamp-1">
                      {t.subject}
                    </div>

                    {/* Excerpt */}
                    <div className="text-[11px] text-gray-500 line-clamp-1">
                      {t.message}
                    </div>

                    {/* Bottom Metadata Badges */}
                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${
                            t.status === "OPEN"
                              ? "bg-amber-100 text-amber-800"
                              : t.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${
                              t.status === "OPEN"
                                ? "bg-amber-500"
                                : t.status === "IN_PROGRESS"
                                ? "bg-blue-500"
                                : "bg-emerald-500"
                            }`}
                          ></span>
                          {t.status.replace("_", " ")}
                        </span>
                        <span className="text-gray-400 font-mono">
                          {t.ticketNumber}
                        </span>
                      </div>

                      <span className="text-gray-500 font-medium truncate max-w-[120px]">
                        {catMeta.label}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Ticket Workspace */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col">
              {/* Header Bar of Ticket */}
              <div className="p-4 sm:p-5 border-b border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span className="text-xs text-gray-400">
                        Received {new Date(selectedTicket.createdAt).toLocaleDateString()}
                      </span>
                      {selectedTicket.user && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          Registered Reader
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-xl font-bold text-gray-900 tracking-tight">
                      {selectedTicket.subject}
                    </h2>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span>From:</span>
                      <span className="font-semibold text-gray-800">{selectedTicket.name}</span>
                      <span>&lt;{selectedTicket.email}&gt;</span>
                    </div>
                  </div>

                  {/* Top Right Quick Controls */}
                  <div className="flex items-center gap-2 self-start">
                    {/* Status Dropdown */}
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateTicket({ status: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-800 outline-none cursor-pointer hover:border-gray-400 shadow-2xs"
                    >
                      <option value="OPEN">🟡 Open</option>
                      <option value="IN_PROGRESS">🔵 In Progress</option>
                      <option value="RESOLVED">🟢 Resolved</option>
                      <option value="CLOSED">⚪ Closed</option>
                    </select>

                    {/* Priority Dropdown */}
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => handleUpdateTicket({ priority: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-800 outline-none cursor-pointer hover:border-gray-400 shadow-2xs"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>

                    {/* Delete (Admin only) */}
                    {currentUserRole === "ADMIN" && (
                      <button
                        onClick={() => handleDeleteTicket(selectedTicket.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-bar Tabs: Conversation vs Internal Notes */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs font-semibold">
                  <button
                    onClick={() => setActivePaneTab("THREAD")}
                    className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all cursor-pointer ${
                      activePaneTab === "THREAD"
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Conversation & Replies ({1 + (selectedTicket.messages?.length || 0)})</span>
                  </button>

                  <button
                    onClick={() => setActivePaneTab("NOTES")}
                    className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all cursor-pointer ${
                      activePaneTab === "NOTES"
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Internal Desk Notes</span>
                    {selectedTicket.adminNotes && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab 1: Conversation & In-App Reply */}
              {activePaneTab === "THREAD" && (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Message History Feed */}
                  <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[380px]">
                    {/* Initial Customer Inquiry Card */}
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-[10px]">
                            {selectedTicket.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {selectedTicket.name}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            (Customer Inquiry)
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {new Date(selectedTicket.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-gray-800 text-xs leading-relaxed whitespace-pre-wrap pl-8">
                        {selectedTicket.message}
                      </div>
                    </div>

                    {/* Any Previous Messages / Replies */}
                    {selectedTicket.messages && selectedTicket.messages.length > 0
                      ? selectedTicket.messages.map((m) => {
                          const isAdmin = m.senderType === "ADMIN";
                          return (
                            <div
                              key={m.id}
                              className={`p-4 rounded-xl text-xs space-y-2 border ${
                                isAdmin
                                  ? "bg-slate-900 text-white border-slate-800 shadow-2xs"
                                  : "bg-blue-50/80 text-gray-900 border-blue-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                      isAdmin
                                        ? "bg-amber-400 text-slate-950"
                                        : "bg-blue-200 text-blue-900"
                                    }`}
                                  >
                                    {isAdmin ? "★" : m.senderName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className={`font-semibold ${isAdmin ? "text-white" : "text-gray-900"}`}>
                                    {m.senderName}
                                  </span>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                      isAdmin
                                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {isAdmin ? "Staff Reply" : "Customer Follow-up"}
                                  </span>
                                </div>
                                <span className={`text-[11px] ${isAdmin ? "text-slate-400" : "text-gray-400"}`}>
                                  {new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div
                                className={`text-xs leading-relaxed whitespace-pre-wrap pl-8 ${
                                  isAdmin ? "text-slate-200" : "text-gray-800"
                                }`}
                              >
                                {m.message}
                              </div>
                            </div>
                          );
                        })
                      : null}
                  </div>

                  {/* Clean In-App Reply Composer Box */}
                  <form
                    onSubmit={handleSendReply}
                    className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50/60 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800">
                        Reply to {selectedTicket.name}:
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Dispatched to <strong>{selectedTicket.email}</strong>
                      </span>
                    </div>

                    {replySuccessMsg && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{replySuccessMsg}</span>
                      </div>
                    )}

                    <textarea
                      rows={3}
                      required
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder={`Type your reply to ${selectedTicket.name}...`}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-800 transition-colors leading-relaxed resize-none shadow-2xs"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={resolveOnSend}
                          onChange={(e) => setResolveOnSend(e.target.checked)}
                          className="rounded text-gray-900 focus:ring-0 cursor-pointer"
                        />
                        <span>Mark ticket as Resolved upon sending</span>
                      </label>

                      <button
                        type="submit"
                        disabled={sendingReply || !replyDraft.trim()}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        {sendingReply ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending Reply...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Reply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Internal Team Notes */}
              {activePaneTab === "NOTES" && (
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-xs text-gray-900">
                          Private Internal Desk Notes
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Visible only to admins & editors. The customer will never see these notes.
                        </p>
                      </div>

                      {saveNoteSuccess && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={8}
                      value={adminNoteDraft}
                      onChange={(e) => setAdminNoteDraft(e.target.value)}
                      placeholder="Add private investigation notes, book entitlement check details, or follow-up tasks for your team..."
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-gray-800 transition-colors leading-relaxed resize-y"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={savingNote}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {savingNote ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Notes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-gray-500 space-y-2 my-auto">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700 text-sm">No ticket selected</p>
              <p className="text-gray-400">
                Choose an inquiry from the left to read messages and send responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
