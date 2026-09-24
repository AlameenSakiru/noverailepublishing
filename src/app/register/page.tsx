"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/my-library";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const result = await register(name, email, password);
    if (result.success) {
      router.push(redirectUrl);
    } else {
      setError(result.error || "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-brand-border p-8 md:p-10 shadow-book">
      <div className="text-center mb-8">
        <span className="font-serif text-2xl font-bold tracking-[0.15em] text-brand-ink block">
          NOVERAILE
        </span>
        <span className="font-sans text-[10px] tracking-[0.35em] text-brand-muted uppercase block -mt-1 mb-4">
          PUBLISHING
        </span>
        <h1 className="font-serif text-2xl font-bold text-brand-ink">
          Create Reader Account
        </h1>
        <p className="text-xs text-brand-slate mt-1.5 font-light">
          Register to read purchased digital books from your personal cloud library.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Elena Vance"
            required
            className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="elena@example.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            Password (min. 8 characters)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          <span>{loading ? "Creating Account..." : "Create Account"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-brand-slate">
        <span>Already have an account? </span>
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
          className="font-bold text-brand-ink hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
