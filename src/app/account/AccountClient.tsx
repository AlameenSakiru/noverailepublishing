"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Shield,
  Key,
  Laptop,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  LogOut,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Lock,
  Mail,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";

interface SessionInfo {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  status: string;
  createdAt: string;
  totalPurchases: number;
  entitlements: any[];
  sessions: SessionInfo[];
}

export function AccountClient() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "sessions">("profile");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Form State
  const [nameInput, setNameInput] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Session Revocation State
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState<string | null>(null);

  // Password Security Calculations
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabels = ["Very Weak", "Weak", "Moderate", "Strong", "Very Secure"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ];

  // Fetch Full Profile & Sessions
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/account/profile");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?redirect=/account");
          return;
        }
        throw new Error("Failed to load profile");
      }
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setNameInput(data.profile.name || "");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileSaving(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSuccess("Personal profile updated successfully.");
        await refreshUser();
        setProfile((prev) => (prev ? { ...prev, name: nameInput } : null));
      } else {
        setProfileError(data.error || "Failed to update profile.");
      }
    } catch {
      setProfileError("Network error while updating profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!hasMinLength) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccess("Password updated successfully! Your account is secured.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(data.error || "Failed to update password.");
      }
    } catch {
      setPasswordError("Network error while updating password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Revoke other active sessions
  const handleRevokeOtherSessions = async () => {
    if (!confirm("Are you sure you want to sign out of all other devices?")) return;

    setRevokingSessions(true);
    setSessionSuccess(null);

    try {
      const res = await fetch("/api/account/revoke-sessions", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessionSuccess(data.message || "All other sessions revoked.");
        await fetchProfile();
      }
    } catch {
      alert("Failed to revoke sessions. Please try again.");
    } finally {
      setRevokingSessions(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-brand-ink border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-sm font-semibold text-brand-slate">
          Loading your security profile...
        </p>
      </div>
    );
  }

  const userInitials = (profile?.name || user?.name || "R")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Account Hero Card */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 md:p-8 shadow-book mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 font-serif font-bold text-2xl flex items-center justify-center shadow-xs">
            {userInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-brand-ink">
                {profile?.name || user?.name}
              </h1>
              {profile?.isEmailVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted mt-0.5">{profile?.email || user?.email}</p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-brand-slate font-mono">
              <span>Member since {memberSince}</span>
              <span>•</span>
              <span className="capitalize font-semibold text-amber-700">
                {profile?.role === "ADMIN" ? "Publisher Admin" : "Reader Account"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats & Library Action */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/my-library"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>My Cloud Library ({profile?.totalPurchases || 0})</span>
          </Link>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Account Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-8 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "profile"
              ? "border-brand-ink text-brand-ink"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Identity</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "security"
              ? "border-brand-ink text-brand-ink"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Password & Credentials</span>
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "sessions"
              ? "border-brand-ink text-brand-ink"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Active Devices & Sessions ({profile?.sessions?.length || 1})</span>
        </button>
      </div>

      {/* TAB 1: Profile & Identity */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-brand-border p-6 md:p-8 shadow-sm">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h2 className="font-serif text-lg font-bold text-brand-ink">Personal Information</h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Update your reader name and public display details.
              </p>
            </div>

            {profileSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-brand-slate mb-1.5">
                  Display Full Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                  className="w-full max-w-md px-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-brand-muted mt-1">
                  Your email address is locked to protect your digital DRM licenses. Contact support for transfers.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  {profileSaving ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>

          {/* Account Security Highlights Card */}
          <div className="space-y-6">
            <div className="bg-amber-500/5 rounded-3xl border border-amber-500/20 p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-sm font-bold text-amber-950">Security Standing</h3>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Your Noveraile account is protected with encrypted session tokens and DRM license watermarking on all reading streams.
              </p>
              <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-amber-800">Email Verification:</span>
                  <span className="font-bold text-emerald-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-800">DRM Book Ownership:</span>
                  <span className="font-bold text-amber-950">{profile?.totalPurchases || 0} Titles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Password & Credentials */}
      {activeTab === "security" && (
        <div className="max-w-2xl bg-white rounded-3xl border border-brand-border p-6 md:p-8 shadow-sm">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="font-serif text-lg font-bold text-brand-ink">Change Account Password</h2>
            <p className="text-xs text-brand-muted mt-0.5">
              Secure your reader account with a strong, distinct password.
            </p>
          </div>

          {passwordSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-slate mb-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-slate mb-1">
                New Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1.5">
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
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNew ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-[10px] text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {passwordSaving ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Active Devices & Sessions */}
      {activeTab === "sessions" && (
        <div className="bg-white rounded-3xl border border-brand-border p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-ink">Active Devices & Sessions</h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Review logged-in browsers and revoke compromised sessions immediately.
              </p>
            </div>

            {profile?.sessions && profile.sessions.length > 1 && (
              <button
                onClick={handleRevokeOtherSessions}
                disabled={revokingSessions}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{revokingSessions ? "Revoking..." : "Sign Out of All Other Devices"}</span>
              </button>
            )}
          </div>

          {sessionSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sessionSuccess}</span>
            </div>
          )}

          <div className="space-y-3">
            {profile?.sessions && profile.sessions.length > 0 ? (
              profile.sessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    sess.isCurrent
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-gray-50/50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        sess.isCurrent
                          ? "bg-amber-500 text-gray-950 font-bold"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-brand-ink">
                          {sess.userAgent.includes("Mozilla") ? "Web Browser Session" : sess.userAgent}
                        </span>
                        {sess.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 font-bold text-[10px] border border-amber-500/30">
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-0.5">
                        <span>IP: {sess.ipAddress}</span>
                        <span>•</span>
                        <span>
                          Last active:{" "}
                          {new Date(sess.lastActive).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          ({new Date(sess.lastActive).toLocaleDateString()})
                        </span>
                      </div>
                    </div>
                  </div>

                  {sess.isCurrent ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Now
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-mono">Standby</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No active sessions found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
