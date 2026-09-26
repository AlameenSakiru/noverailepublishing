"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Mail, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || `A 6-digit password reset code has been sent to ${cleanEmail}.`);
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(cleanEmail)}`);
        }, 1200);
      } else {
        setError(data.error || "Failed to send reset code. Please try again.");
      }
    } catch {
      setError("Network or server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-brand-border p-8 md:p-10 shadow-book">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <span className="font-serif text-2xl font-bold tracking-[0.15em] text-brand-ink block">
          NOVERAILE
        </span>
        <span className="font-sans text-[10px] tracking-[0.35em] text-brand-muted uppercase block -mt-1 mb-4">
          PUBLISHING
        </span>
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Mail className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-brand-ink">
          Forgot Password
        </h1>
        <p className="text-xs text-brand-slate mt-1.5 leading-relaxed font-light">
          Enter your registered email address to receive a secure 6-digit password reset code.
        </p>
      </div>

      {success && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            Registered Email Address
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

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
        >
          <span>{loading ? "Sending Reset Code..." : "Send Password Reset Code"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-brand-muted">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>15-Minute Expiration • Single-Use Security PIN</span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-brand-slate">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-semibold text-brand-ink hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Reader Login</span>
        </Link>
        <Link
          href="/admin/login"
          className="text-brand-muted hover:text-brand-ink transition-colors"
        >
          Admin Portal
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-brand-muted">Loading secure portal...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
