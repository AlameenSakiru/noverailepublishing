"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update email if query param changes
  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // Focus first digit on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle digit change
  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (char && !/^[0-9]$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);

    // Auto-advance
    if (char && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim().replace(/\D/g, "");
    if (pasted.length === 0) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setDigits(newDigits);
    setError(null);

    const nextIndex = Math.min(5, pasted.length);
    inputRefs.current[nextIndex]?.focus();
  };

  // Password Security Strength Calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabels = ["Very Weak", "Weak", "Moderate", "Strong", "Very Secure"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-emerald-600"];

  // Resend code handler
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message || `A fresh 6-digit code has been sent to ${cleanEmail}.`);
        setResendCooldown(60);
      } else {
        setError(data.error || "Failed to resend code.");
      }
    } catch {
      setError("Network error while requesting a new code.");
    } finally {
      setResending(false);
    }
  };

  // Submit reset password form
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (cleanNew.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code,
          newPassword: cleanNew,
          confirmPassword: cleanConfirm,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Password updated successfully! Redirecting to sign in...");
        setTimeout(() => {
          router.push(data.redirectUrl || "/login");
        }, 1500);
      } else {
        setError(data.error || "Failed to reset password. Please verify your code and try again.");
      }
    } catch {
      setError("Network or connection error. Please try again.");
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
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-brand-ink">
          Choose New Password
        </h1>
        <p className="text-xs text-brand-slate mt-1.5 leading-relaxed font-light">
          Enter the 6-digit PIN sent to your email and set your new security password.
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

      <form onSubmit={handleResetPassword} className="space-y-4">
        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            Registered Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="reader@example.com"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-slate-50 font-mono text-xs text-gray-800"
          />
        </div>

        {/* 6-Digit Code Inputs */}
        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-2 text-center">
            6-Digit Security PIN (from your email)
          </label>
          <div
            onPaste={handlePaste}
            className="flex items-center justify-center gap-2"
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-10 sm:w-11 h-13 text-center font-mono text-xl font-bold rounded-xl border-2 border-brand-border bg-white text-brand-ink focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 transition-all shadow-xs"
              />
            ))}
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            New Password (min. 8 characters)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showNewPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
            />
            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Meter */}
          {newPassword.length > 0 && (
            <div className="mt-2 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-gray-600">
                  Security: {strengthLabels[strengthScore]}
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
              <div className="grid grid-cols-2 gap-1 pt-0.5 text-[10px] text-gray-500">
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

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-brand-slate mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showConfirmPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink bg-transparent"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-[10px] text-red-500 mt-1">Passwords do not match.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || digits.join("").length < 6 || newPassword.length < 8 || newPassword !== confirmPassword}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
        >
          <span>{loading ? "Resetting Password..." : "Set New Password & Sign In"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Resend code */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col items-center gap-2 text-xs">
        <span className="text-brand-muted">Didn&apos;t receive the PIN? Check spam or</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="font-semibold text-amber-700 hover:text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
          <span>
            {resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : resending
              ? "Sending..."
              : "Resend 6-Digit PIN"}
          </span>
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-brand-slate">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-semibold text-brand-ink hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
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

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-brand-muted">Loading reset portal...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
