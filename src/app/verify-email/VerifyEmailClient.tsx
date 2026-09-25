"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from "lucide-react";

export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const emailParam = searchParams.get("email") || "";
  const redirectUrl = searchParams.get("redirect") || "/my-library";

  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle digit change
  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1); // Take last character entered
    if (char && !/^[0-9]$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next input
    if (char && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keydown (backspace handling)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full code
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

  // Submit Verification Code
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email) {
      setError("Please provide the email address associated with your account.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Email verified successfully! Redirecting to your library...");
        await refreshUser();
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1200);
      } else {
        setError(data.error || "Invalid verification code.");
      }
    } catch {
      setError("Network error while verifying email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification Code
  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email) return;

    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "A new 6-digit code has been sent.");
        setResendCooldown(60);
      } else {
        setError(data.error || "Failed to resend code.");
      }
    } catch {
      setError("Network error while requesting code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-brand-border p-8 md:p-10 shadow-book text-center">
      {/* Brand Header */}
      <div className="mb-6">
        <span className="font-serif text-2xl font-bold tracking-[0.15em] text-brand-ink block">
          NOVERAILE
        </span>
        <span className="font-sans text-[10px] tracking-[0.35em] text-brand-muted uppercase block -mt-1 mb-4">
          PUBLISHING
        </span>
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Mail className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-brand-ink">
          Verify Your Email
        </h1>
        <p className="text-xs text-brand-slate mt-1.5 leading-relaxed">
          We sent a 6-digit verification code to:
          <span className="block font-bold text-brand-ink mt-0.5 font-mono text-[13px]">
            {email || "your registered email"}
          </span>
        </p>
      </div>

      {success && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6-Digit Segmented Code Inputs */}
      <form onSubmit={handleVerify} className="space-y-6">
        <div
          onPaste={handlePaste}
          className="flex items-center justify-center gap-2 sm:gap-2.5"
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
              className="w-11 sm:w-12 h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-2xl border-2 border-brand-border bg-slate-50/50 text-brand-ink focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 transition-all select-none shadow-xs"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || digits.join("").length < 6}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <span>{loading ? "Verifying..." : "Verify & Open Cloud Library"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Resend Code Section */}
      <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center gap-2 text-xs">
        <span className="text-brand-muted">Didn&apos;t receive the email code?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="font-semibold text-amber-700 hover:text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
          <span>
            {resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : resending
              ? "Sending..."
              : "Resend 6-Digit Code"}
          </span>
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-brand-muted">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>15-Minute Expiration • Single-Use Security PIN</span>
      </div>
    </div>
  );
}
