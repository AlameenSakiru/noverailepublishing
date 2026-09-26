"use client";

import React from "react";
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
} from "lucide-react";

export function AdminNavTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Books", href: "/admin/books", icon: BookOpen },
    { label: "Orders & Royalties", href: "/admin/orders", icon: ShoppingBag },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Customer Access", href: "/admin/customers", icon: Users },
    { label: "Discounts", href: "/admin/coupons", icon: Tag },
    { label: "Broadcasts", href: "/admin/broadcasts", icon: Megaphone },
    { label: "Settings", href: "/admin/settings", icon: Sliders },
  ];

  return (
    <nav className="flex flex-wrap items-center gap-2">
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
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
  );
}
