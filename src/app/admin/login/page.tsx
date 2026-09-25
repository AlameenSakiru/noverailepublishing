"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, ArrowRight, ArrowLeft, AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFillCredentials = () => {
    setEmail("admin@noveraile.com");
    setPassword("AdminPass2026!");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      // Check if user is an ADMIN or EDITOR
      if (data.user?.role !== "ADMIN" && data.user?.role !== "EDITOR") {
        await fetch("/api/auth/logout", { method: "POST" });
        setError(
          "Access Denied: This console is strictly restricted to administrative and editorial staff. Readers please sign in via the storefront."
        );
        setLoading(false);
        return;
      }

      // Success: navigate with full page reload to ensure fresh cookie and layout hydration
      window.location.href = "/admin";
    } catch {
      setError("Network or server connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0f172a] text-gray-100 rounded-2xl border border-gray-800 p-8 md:p-10 shadow-2xl relative overflow-hidden">
      {/* Top subtle decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      <div className="text-center mb-6">
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

      {/* Staff Demo Helper Badge */}
      <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-amber-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Staff Credentials
          </span>
          <button
            type="button"
            onClick={handleFillCredentials}
            className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-[11px] transition-colors"
          >
            Auto-Fill
          </button>
        </div>
        <div className="font-mono text-[11px] space-y-0.5 text-gray-300">
          <div>Email: <span className="text-white font-medium">admin@noveraile.com</span></div>
          <div>Password: <span className="text-white font-medium">AdminPass2026!</span></div>
        </div>
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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
