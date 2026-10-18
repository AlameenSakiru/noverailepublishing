"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  FolderTree,
  Users,
  Tag,
  Sliders,
  Megaphone,
  Award,
  Headphones,
  ChevronDown,
  Check,
} from "lucide-react";

export function AdminNavTabs({ role = "ADMIN" }: { role?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allTabs = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, editorAllowed: false },
    { label: "Books & Publishing", href: "/admin/books", icon: BookOpen, editorAllowed: true },
    { label: "Reader Stories", href: "/admin/stories", icon: Award, editorAllowed: true },
    { label: "Orders & Royalties", href: "/admin/orders", icon: ShoppingBag, editorAllowed: false },
    { label: "Categories", href: "/admin/categories", icon: FolderTree, editorAllowed: true },
    { label: "Customer Access", href: "/admin/customers", icon: Users, editorAllowed: false },
    { label: "Support Desk", href: "/admin/support", icon: Headphones, editorAllowed: true },
    { label: "Discounts", href: "/admin/coupons", icon: Tag, editorAllowed: false },
    { label: "Broadcasts", href: "/admin/broadcasts", icon: Megaphone, editorAllowed: false },
    { label: "Settings", href: "/admin/settings", icon: Sliders, editorAllowed: false },
  ];

  const tabs = role === "EDITOR" ? allTabs.filter((t) => t.editorAllowed) : allTabs;

  // Determine currently active tab
  const activeTabItem =
    tabs.find((tab) =>
      tab.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(tab.href)
    ) || tabs[0];

  const ActiveIcon = activeTabItem.icon;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen]);

  // Close dropdown when pathname changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="w-full">
      {/* 1. Mobile Dropdown (< md): Clean, compact selector */}
      <div className="md:hidden relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 shadow-xs hover:border-gray-400 transition-colors"
          aria-expanded={mobileOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2.5 truncate">
            <span className="p-1 rounded-lg bg-slate-900 text-amber-400 shrink-0">
              <ActiveIcon className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">{activeTabItem.label}</span>
            <span className="text-[10px] font-normal text-gray-400">Section</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 ${
              mobileOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {mobileOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-xl py-1.5 z-50 max-h-[70vh] overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-1 space-y-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive =
                  tab.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(tab.href);

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#0f172a] text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-amber-400" : "text-gray-400"
                        }`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Desktop & Tablet Strip (>= md): Single-row, non-wrapping horizontal nav */}
      <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 whitespace-nowrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? "bg-[#0f172a] text-white shadow-xs border border-gray-900"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-brand-ink hover:border-gray-300 hover:bg-gray-50/80 shadow-2xs"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? "text-amber-400" : "text-gray-400"
                }`}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
