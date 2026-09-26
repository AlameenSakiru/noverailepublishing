"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();

  // Step 1: Credentials / Step 2: 2-Step OTP Verification
  const [step, setStep] = useState<"CREDENTIALS" | "VERIFY_CODE">("CREDENTIALS");

  // Credential states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification states
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // General states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-fill company admin credentials
  const handleFillCredentials = () => {
    setEmail("noverailepublishing@gmail.com");
    setPassword("AdminPass2026!");
    setError(null);
  };

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when step changes to VERIFY_CODE
  useEffect(() => {
    if (step === "VERIFY_CODE" && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // Step 1: Submit Credentials
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      if (data.requiresVerification) {
        setStep("VERIFY_CODE");
        setSuccess(`A 6-digit security code has been dispatched to ${email.trim()}.`);
        setResendCooldown(60);
        setDigits(["", "", "", "", "", ""]);
        setLoading(false);
        return;
      }

      // If already logged in (fallback)
      if (data.user?.role !== "ADMIN" && data.user?.role !== "EDITOR") {
        await fetch("/api/auth/logout", { method: "POST" });
        setError("Access Denied: This console is strictly restricted to administrative staff.");
        setLoading(false);
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Network or server connection error. Please try again.");
      setLoading(false);
    }
  };

  // Digit change handler
  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (char && !/^[0-9]$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);

    // Auto advance
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

  // Step 2: Submit 6-Digit OTP Verification Code
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid or expired security code.");
        setLoading(false);
        return;
      }

      // Check user role
      if (data.user?.role !== "ADMIN" && data.user?.role !== "EDITOR") {
        await fetch("/api/auth/logout", { method: "POST" });
        setError("Access Denied: This console is strictly restricted to administrative staff.");
        setLoading(false);
        return;
      }

      setSuccess("Identity verified! Loading management console...");
      setTimeout(() => {
        window.location.href = "/admin";
      }, 800);
    } catch {
      setError("Network error verifying code. Please try again.");
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`A fresh 6-digit code has been dispatched to ${email.trim()}.`);
        setResendCooldown(60);
      } else {
        setError(data.error || "Failed to resend verification code.");
      }
    } catch {
      setError("Network error while requesting a new code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0f172a] text-gray-100 rounded-3xl border border-gray-800 p-8 md:p-10 shadow-2xl relative overflow-hidden">
      {/* Top subtle decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4 shadow-xs">
          {step === "CREDENTIALS" ? <Shield className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
        </div>

        <span className="font-serif text-xl font-bold tracking-[0.2em] text-white block">
          NOVERAILE
        </span>
        <span className="font-sans text-[10px] tracking-[0.35em] text-amber-400/90 uppercase block -mt-1 mb-3">
          PUBLISHING
        </span>

        <h1 className="text-lg font-semibold text-white tracking-wide">
          {step === "CREDENTIALS" ? "Management Console" : "2-Step Security Verification"}
        </h1>
        <p className="text-xs text-gray-400 mt-1 font-light">
          {step === "CREDENTIALS"
            ? "Restricted access for company administrators and editorial staff."
            : `Enter the 6-digit security PIN sent to ${email}`}
        </p>
      </div>

      {/* Staff Demo Helper Badge (Step 1 only) */}
      {step === "CREDENTIALS" && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Company Admin Credentials
            </span>
            <button
              type="button"
              onClick={handleFillCredentials}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-[11px] transition-colors cursor-pointer"
            >
              Auto-Fill
            </button>
          </div>
          <div className="font-mono text-[11px] space-y-0.5 text-gray-300">
            <div>Email: <span className="text-white font-medium">noverailepublishing@gmail.com</span></div>
            <div>Password: <span className="text-white font-medium">AdminPass2026!</span></div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/70 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: CREDENTIALS FORM                                                  */}
      {/* ========================================================================= */}
      {step === "CREDENTIALS" && (
        <form onSubmit={handleCredentialSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
              Staff Email Address
            </label>
            <input
              type="email"
              name="admin_email_field"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="noverailepublishing@gmail.com"
              required
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
                name="admin_password_field"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? "Authenticating..." : "Sign In & Request Code"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: 2-STEP OTP VERIFICATION PIN FORM                                  */}
      {/* ========================================================================= */}
      {step === "VERIFY_CODE" && (
        <form onSubmit={handleVerifySubmit} className="space-y-6">

          <div
            onPaste={handlePaste}
            className="flex items-center justify-center gap-2 sm:gap-2.5 my-2"
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
                className="w-11 sm:w-12 h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-2xl border-2 border-gray-700 bg-gray-900 text-amber-400 focus:border-amber-400 focus:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all select-none shadow-xs"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || digits.join("").length < 6}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? "Verifying..." : "Verify PIN & Access Console"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Resend Code & Back Buttons */}
          <div className="pt-2 flex flex-col items-center gap-3 text-xs">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || resending}
              className="text-amber-400 hover:text-amber-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>
                {resendCooldown > 0
                  ? `Resend code available in ${resendCooldown}s`
                  : resending
                  ? "Dispatching..."
                  : "Resend 6-Digit Code"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("CREDENTIALS");
                setError(null);
                setSuccess(null);
              }}
              className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              ← Back to password login
            </button>
          </div>
        </form>
      )}

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

