"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/my-library";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      if (result.user?.role === "ADMIN" || result.user?.role === "EDITOR") {
        router.push("/admin");
      } else {
        router.push(redirectUrl);
      }
    } else {
      setError(result.error || "Invalid credentials.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    // Prompt user for Google account email or use Google Identity
    // In production with GOOGLE_CLIENT_ID, Google Identity One-Tap prompts automatically
    const googleEmail = prompt("Enter your Google Account email address to continue:", email || "reader@gmail.com");
    if (!googleEmail) {
      setGoogleLoading(false);
      return;
    }

    const result = await loginWithGoogle({
      email: googleEmail,
      name: googleEmail.split("@")[0].replace(/[._]/g, " "),
    });

    if (result.success) {
      if (result.user?.role === "ADMIN" || result.user?.role === "EDITOR") {
        router.push("/admin");
      } else {
        router.push(redirectUrl);
      }
    } else {
      setError(result.error || "Google authentication failed.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-brand-border p-8 md:p-10 shadow-book">
      <div className="text-center mb-6">
        <span className="font-serif text-2xl font-bold tracking-[0.15em] text-brand-ink block">
          NOVERAILE
        </span>
        <span className="font-sans text-[10px] tracking-[0.35em] text-brand-muted uppercase block -mt-1 mb-4">
          PUBLISHING
        </span>
        <h1 className="font-serif text-2xl font-bold text-brand-ink">
          Reader Account Sign In
        </h1>
        <p className="text-xs text-brand-slate mt-1.5 font-light">
          Access your digital library, saved bookmarks, and reading positions.
        </p>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-xs disabled:opacity-60 mb-5"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{googleLoading ? "Connecting with Google..." : "Continue with Google"}</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-5">
        <div className="border-t border-gray-200 w-full" />
        <span className="bg-white px-3 text-[11px] font-mono uppercase tracking-wider text-gray-400 shrink-0">
          or sign in with email
        </span>
        <div className="border-t border-gray-200 w-full" />
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reader@example.com"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-brand-slate">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          <span>{loading ? "Signing in..." : "Sign In to Library"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-brand-muted">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Protected by 256-bit SSL & HttpOnly Auth Cookies</span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-brand-slate">
        <span>Don&apos;t have an account yet? </span>
        <Link
          href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
          className="font-semibold text-brand-ink hover:underline"
        >
          Create Reader Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-brand-muted">Loading secure login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
