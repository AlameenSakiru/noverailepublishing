"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User, Check, X } from "lucide-react";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/my-library";

  // Password Security Calculations
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const strengthScore = [hasMinLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabels = ["Very Weak", "Weak", "Moderate", "Strong", "Very Secure"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const result = await register(name, email, password);
    if (result.success) {
      const demoParam = result.demoCode ? `&code=${result.demoCode}` : "";
      router.push(`/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectUrl)}${demoParam}`);
    } else {
      setError(result.error || "Registration failed.");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setError(null);
    setGoogleLoading(true);
    window.location.href = `/api/auth/google/oauth?redirect=${encodeURIComponent(redirectUrl)}`;
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
          Create Reader Account
        </h1>
        <p className="text-xs text-brand-slate mt-1.5 font-light">
          Register to read purchased digital books from your personal cloud library.
        </p>
      </div>

      {/* Google OAuth Quick Register Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
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
          or register with email
        </span>
        <div className="border-t border-gray-200 w-full" />
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
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elena Vance"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
            />
          </div>
        </div>

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
              placeholder="elena@example.com"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            Password (min. 8 characters)
          </label>
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

          {/* Password Security Strength Bar */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-gray-600">
                  Security Strength: {strengthLabels[strengthScore]}
                </span>
                <span className="font-mono text-gray-400">{strengthScore}/4 requirements</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      strengthScore >= step ? strengthColors[strengthScore] : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Requirement Checkpoints */}
              <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-gray-500">
                <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 font-medium" : ""}`}>
                  {hasMinLength ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 opacity-40" />}
                  8+ characters
                </span>
                <span className={`flex items-center gap-1 ${hasUpper ? "text-emerald-600 font-medium" : ""}`}>
                  {hasUpper ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 opacity-40" />}
                  Uppercase letter
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-600 font-medium" : ""}`}>
                  {hasNumber ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 opacity-40" />}
                  Number (0-9)
                </span>
                <span className={`flex items-center gap-1 ${hasSpecial ? "text-emerald-600 font-medium" : ""}`}>
                  {hasSpecial ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 opacity-40" />}
                  Special character
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
            />
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-[10px] text-red-500 mt-1">Passwords do not match.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          <span>{loading ? "Creating Account..." : "Create Account"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-brand-muted">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Argon2/Bcrypt Salted Encryption Protected</span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-brand-slate">
        <span>Already have an account? </span>
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
          className="font-semibold text-brand-ink hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-brand-muted">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
