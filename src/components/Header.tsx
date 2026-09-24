"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ShoppingBag, Search, Menu, X, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { siteConfig } from "@/lib/config";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  // Hide header on protected reader screen and admin console
  if (pathname?.startsWith("/reader/") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border transition-all">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Treatment */}
          <Link href="/" className="flex flex-col group">
            <span className="font-serif text-2xl font-bold tracking-[0.15em] text-brand-ink group-hover:text-brand-700 transition-colors">
              NOVERAILE
            </span>
            <span className="font-sans text-[10px] tracking-[0.35em] text-brand-muted uppercase -mt-1">
              PUBLISHING
            </span>
          </Link>

          {/* Desktop Nav Links - Clean, balanced publishing navigation */}
          <nav className="hidden lg:flex items-center gap-8 font-sans text-sm font-medium text-brand-slate">
            <Link
              href="/"
              className={`hover:text-brand-ink transition-colors ${
                pathname === "/" ? "text-brand-ink font-semibold" : ""
              }`}
            >
              Home
            </Link>

            <Link
              href="/books"
              className={`hover:text-brand-ink transition-colors ${
                pathname === "/books" ? "text-brand-ink font-semibold" : ""
              }`}
            >
              Catalog
            </Link>

            <Link
              href="/success-stories"
              className={`hover:text-brand-ink transition-colors ${
                pathname === "/success-stories" ? "text-brand-ink font-semibold" : ""
              }`}
            >
              Success Stories
            </Link>

            <Link
              href="/about"
              className={`hover:text-brand-ink transition-colors ${
                pathname === "/about" ? "text-brand-ink font-semibold" : ""
              }`}
            >
              About
            </Link>
          </nav>

          {/* Action Icons & Account State */}
          <div className="flex items-center gap-4">
            {/* Search link */}
            <Link
              href="/books"
              className="p-2 text-brand-slate hover:text-brand-ink hover:bg-brand-50 rounded-full transition-colors"
              title="Search Catalog"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Shopping Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-brand-slate hover:text-brand-ink hover:bg-brand-50 rounded-full transition-colors"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-ink text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Account / My Library CTA */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/my-library"
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-ink text-white text-xs font-semibold hover:bg-brand-900 transition-colors shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-brand-300" />
                  <span>My Library</span>
                </Link>

                <div className="relative group">
                  <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-brand-50 border border-brand-border">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-800 font-bold text-xs flex items-center justify-center">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-brand-border py-2 hidden group-hover:block z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-brand-ink truncate">{user.name}</p>
                      <p className="text-[11px] text-brand-muted truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/my-library"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50"
                    >
                      My Library
                    </Link>
                    {(user.role === "ADMIN" || user.role === "EDITOR") && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50/50 hover:bg-amber-100"
                      >
                        Admin Portal
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs font-medium text-brand-slate hover:text-brand-ink hover:bg-brand-50 rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold bg-brand-ink text-white rounded-md hover:bg-brand-900 transition-colors shadow-sm"
                >
                  Create Account
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-brand-slate hover:text-brand-ink"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-brand-border bg-white px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-150">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-brand-slate hover:text-brand-ink"
          >
            Home
          </Link>
          <Link
            href="/books"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-brand-slate hover:text-brand-ink"
          >
            Catalog
          </Link>
          <Link
            href="/success-stories"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-brand-slate hover:text-brand-ink"
          >
            Success Stories
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-brand-slate hover:text-brand-ink"
          >
            About
          </Link>
          <Link
            href="/my-library"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-brand-ink"
          >
            My Library
          </Link>
          {user ? (
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-base font-medium text-red-600"
            >
              Sign Out
            </button>
          ) : (
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 rounded-md border border-brand-border text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 rounded-md bg-brand-ink text-white text-sm font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
