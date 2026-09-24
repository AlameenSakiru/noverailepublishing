import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Users,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { AdminSignOutButton } from "../AdminSignOutButton";
import { AdminNavTabs } from "./AdminNavTabs";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR") {
    redirect("/admin/login?error=forbidden");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Pinned Unified Admin Command Bar */}
      <div className="sticky top-0 z-50 shadow-md">
        {/* Tier 1: Dark Executive Brand & User Strip */}
        <header className="bg-[#0f172a] text-white border-b border-gray-800">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                title="Open Reader Storefront in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View Storefront</span>
              </Link>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm tracking-wider text-white">
                  NOVERAILE
                </span>
                <span className="text-[10px] font-sans tracking-[0.2em] text-gray-400 uppercase hidden sm:inline">
                  ADMIN
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono uppercase font-bold border border-amber-500/30">
                {currentUser.role}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-semibold text-gray-200">{currentUser.name}</span>
                <span className="text-[11px] text-gray-400">{currentUser.email}</span>
              </div>
              <AdminSignOutButton />
            </div>
          </div>
        </header>

        {/* Tier 2: Pinned Navigation Tabs Sub-Bar (Edge-to-Edge with Backdrop Blur) */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2.5">
            <AdminNavTabs />
          </div>
        </div>
      </div>

      {/* Main Admin Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
