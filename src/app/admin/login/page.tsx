"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      // Check if user is an ADMIN or EDITOR
      if (data.user?.role !== "ADMIN" && data.user?.role !== "EDITOR") {
        // Log out immediately so the reader session isn't kept in admin context
        await fetch("/api/auth/logout", { method: "POST" });
        setError(
          "Access Denied: This console is strictly restricted to administrative and editorial staff. Readers please sign in via the storefront."
        );
        setLoading(false);
        return;
      }

      // Success: redirect directly to publisher dashboard
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error during staff authentication.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0f172a] text-gray-100 rounded-2xl border border-gray-800 p-8 md:p-10 shadow-2xl relative overflow-hidden">
      {/* Top subtle decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <Shield className="w-6 h-6" />
        </div>

        <span className="font-serif text-xl font-bold tracking-[0.2em] text-white block">
          NOVERAILE
        </span>
        <span className="font-sans text-[10px] tracking-[0.35em] text-amber-400/90 uppercase block -mt-1 mb-3">
          PUBLISHING
        </span>

        <h1 className="text-lg font-semibold text-white tracking-wide">
          Management Console
        </h1>
        <p className="text-xs text-gray-400 mt-1 font-light">
          Restricted access for editorial staff and platform administrators.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
            Staff Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@noveraile.com"
            required
            autoComplete="username"
            className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
            Security Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/10"
        >
          <Lock className="w-4 h-4" />
          <span>{loading ? "Authenticating..." : "Authenticate Session"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setEmail("admin@noveraile.com");
              setPassword("AdminPass2026!");
            }}
            className="w-full py-2 px-3 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>⚡ Fill Default Admin Credentials</span>
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-800 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Reader Storefront</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-gray-400">Loading console...</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
