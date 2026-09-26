"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Globe,
  Database,
  Lock,
  ExternalLink,
  RefreshCw,
  Info,
  Sliders,
  Sparkles,
  KeyRound,
  Trash2,
  Save,
  HelpCircle,
  ArrowRight,
  Zap,
  Radio,
  Smartphone,
  Building2,
  Eye,
  EyeOff,
  User,
  X,
} from "lucide-react";

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified?: boolean;
}

interface SettingsData {
  site: {
    name: string;
    url: string;
    tagline: string;
    contactEmail: string;
    currency: string;
    storageDriver: string;
    jwtSessionExpiryDays: number;
  };
  paystack: {
    isConfigured: boolean;
    mode: "LIVE" | "TEST" | "UNCONFIGURED";
    publicKey: string;
    secretKeyMasked: string;
    webhookUrl: string;
  };
  payment: {
    isStripeConfigured: boolean;
    stripeMode: "LIVE" | "TEST" | "SANDBOX";
    publishableKey: string;
    secretKeyMasked: string;
    webhookSecretMasked: string;
    webhookUrl: string;
    allowSandboxCheckout: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    emailFrom: string;
    isSmtpConfigured: boolean;
    twoFactorAuthEnabled: boolean;
  };
  stats: {
    userCount: number;
    bookCount: number;
    orderCount: number;
    reviewCount: number;
    activeCodesCount: number;
    dbLatencyMs: number;
  };
}

export function SettingsClient({
  initialSettings,
  initialAdminUser,
}: {
  initialSettings: SettingsData;
  initialAdminUser?: AdminUserData;
}) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [adminUser, setAdminUser] = useState<AdminUserData>(
    initialAdminUser || {
      id: "admin-1",
      name: "Company Administrator",
      email: "noverailepublishing@gmail.com",
      role: "ADMIN",
      isEmailVerified: true,
    }
  );
  const [activeTab, setActiveTab] = useState<"PAYMENTS" | "EMAIL" | "STOREFRONT" | "SECURITY">("PAYMENTS");

  // Admin Password Management State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState<{ success: boolean; message: string } | null>(null);

  // Editable Form States
  const [siteName, setSiteName] = useState(settings.site.name);
  const [siteTagline, setSiteTagline] = useState(settings.site.tagline);
  const [contactEmail, setContactEmail] = useState(settings.site.contactEmail);
  const [currency, setCurrency] = useState(settings.site.currency);

  // Paystack
  const [paystackPublicKey, setPaystackPublicKey] = useState(settings.paystack?.publicKey || "");
  const [paystackSecretKey, setPaystackSecretKey] = useState("");

  // Stripe
  const [stripePublishableKey, setStripePublishableKey] = useState(settings.payment.publishableKey);
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");

  // Action states
  const [copiedPaystackWebhook, setCopiedPaystackWebhook] = useState(false);
  const [copiedStripeWebhook, setCopiedStripeWebhook] = useState(false);
  const [testingPaystack, setTestingPaystack] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [cleaningCodes, setCleaningCodes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopyPaystackWebhook = () => {
    navigator.clipboard.writeText(settings.paystack.webhookUrl);
    setCopiedPaystackWebhook(true);
    setTimeout(() => setCopiedPaystackWebhook(false), 2500);
  };

  const handleCopyStripeWebhook = () => {
    navigator.clipboard.writeText(settings.payment.webhookUrl);
    setCopiedStripeWebhook(true);
    setTimeout(() => setCopiedStripeWebhook(false), 2500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setActionAlert(null);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        setSiteName(data.settings.site.name);
        setSiteTagline(data.settings.site.tagline);
        setContactEmail(data.settings.site.contactEmail);
        setCurrency(data.settings.site.currency);
        setPaystackPublicKey(data.settings.paystack?.publicKey || "");
        setStripePublishableKey(data.settings.payment.publishableKey);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestPaystack = async () => {
    setTestingPaystack(true);
    setActionAlert(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TEST_PAYSTACK" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionAlert({
          success: true,
          message: data.message || "Paystack connection is live and healthy!",
        });
      } else {
        setActionAlert({
          success: false,
          message: data.error || "Failed to verify Paystack connection. Please check your Secret Key.",
        });
      }
    } catch {
      setActionAlert({ success: false, message: "Network error during Paystack test." });
    } finally {
      setTestingPaystack(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionAlert(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_SETTINGS",
          siteName,
          siteTagline,
          contactEmail,
          currency,
          paystackPublicKey: paystackPublicKey || undefined,
          paystackSecretKey: paystackSecretKey.trim() || undefined,
          stripePublishableKey: stripePublishableKey || undefined,
          stripeSecretKey: stripeSecretKey.trim() || undefined,
          stripeWebhookSecret: stripeWebhookSecret.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionAlert({ success: true, message: data.message || "Settings updated successfully!" });
        setPaystackSecretKey("");
        setStripeSecretKey("");
        setStripeWebhookSecret("");
        await handleRefresh();
      } else {
        setActionAlert({ success: false, message: data.error || "Failed to update settings." });
      }
    } catch {
      setActionAlert({ success: false, message: "Network error while saving settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setActionAlert(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TEST_SMTP",
          testEmail: testEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionAlert({
          success: true,
          message: data.message || "Diagnostic test email dispatched successfully!",
        });
      } else {
        setActionAlert({
          success: false,
          message: data.error || "Failed to dispatch test email.",
        });
      }
    } catch {
      setActionAlert({
        success: false,
        message: "Network error during SMTP test.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleCleanExpiredCodes = async () => {
    setCleaningCodes(true);
    setActionAlert(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLEAN_EXPIRED_CODES" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionAlert({ success: true, message: data.message });
        await handleRefresh();
      } else {
        setActionAlert({ success: false, message: data.error || "Failed to purge codes." });
      }
    } finally {
      setCleaningCodes(false);
    }
  };

  // Password Security Strength Calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabels = ["Very Weak", "Weak", "Moderate", "Strong", "Very Secure"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-emerald-600"];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordAlert(null);

    if (newPassword.length < 8) {
      setPasswordAlert({ success: false, message: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordAlert({ success: false, message: "New passwords do not match." });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHANGE_ADMIN_PASSWORD",
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordAlert({
          success: true,
          message: data.message || "Administrator password updated successfully!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordAlert({
          success: false,
          message: data.error || "Failed to update administrator password.",
        });
      }
    } catch {
      setPasswordAlert({
        success: false,
        message: "Network error while updating password. Please try again.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const isPaystackActive = settings.paystack?.isConfigured;

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-950 flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-500" />
            <span>Platform Settings & Control Center</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure Paystack payment gateway, transactional email, storefront metadata, and security policies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Checking..." : "Refresh Diagnostics"}</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {actionAlert && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in ${
            actionAlert.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionAlert.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="text-xs font-bold hover:underline opacity-70 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("PAYMENTS")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "PAYMENTS"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <CreditCard className={`w-3.5 h-3.5 ${activeTab === "PAYMENTS" ? "text-amber-400" : "text-gray-400"}`} />
          <span>Payment Gateways (Paystack)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("EMAIL")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "EMAIL"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Mail className={`w-3.5 h-3.5 ${activeTab === "EMAIL" ? "text-amber-400" : "text-gray-400"}`} />
          <span>Email & 2-Step OTP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("STOREFRONT")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "STOREFRONT"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Globe className={`w-3.5 h-3.5 ${activeTab === "STOREFRONT" ? "text-amber-400" : "text-gray-400"}`} />
          <span>Storefront & Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SECURITY")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "SECURITY"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === "SECURITY" ? "text-amber-400" : "text-gray-400"}`} />
          <span>Security & Maintenance</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAYMENTS & CHECKOUT                                                */}
      {/* ========================================================================= */}
      {activeTab === "PAYMENTS" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Status Indicator Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-950">Paystack Checkout Engine</h2>
                  <p className="text-xs text-gray-500">Primary payment gateway for reader purchases</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                    isPaystackActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPaystackActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  {isPaystackActive
                    ? `Paystack Active (${settings.paystack.mode} Mode)`
                    : "Sandbox Mode (1-Click Simulation Active)"}
                </span>

                {isPaystackActive && (
                  <button
                    type="button"
                    onClick={handleTestPaystack}
                    disabled={testingPaystack}
                    className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingPaystack ? "animate-spin" : ""}`} />
                    <span>{testingPaystack ? "Testing..." : "Test Connection"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Accepted Channels Badges */}
            <div className="mt-5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Supported Customer Payment Channels (Auto-Enabled via Paystack)
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Debit / Credit Cards (Mastercard, Visa, Verve)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct Bank Transfer</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                  <span>USSD (*737#, *894#, etc.)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                  <Radio className="w-3.5 h-3.5 text-purple-600" />
                  <span>Apple Pay & Mobile Money</span>
                </span>
              </div>
            </div>
          </div>

          {/* Paystack Configuration Form */}
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Paystack API Credentials</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get your Public and Secret keys from the{" "}
                  <a
                    href="https://dashboard.paystack.com/#/settings/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Paystack Dashboard (Settings &gt; API Keys & Webhooks)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Paystack Public Key
                </label>
                <input
                  type="text"
                  name="paystack_pub_key_setting"
                  autoComplete="off"
                  value={paystackPublicKey}
                  onChange={(e) => setPaystackPublicKey(e.target.value)}
                  placeholder="pk_live_... or pk_test_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Client-safe identifier starting with <code>pk_live_</code> or <code>pk_test_</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Paystack Secret Key (Private)
                </label>
                <input
                  type="password"
                  name="paystack_sec_key_setting"
                  autoComplete="new-password"
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                  placeholder={
                    settings.paystack?.secretKeyMasked
                      ? `Currently set (${settings.paystack.secretKeyMasked}). Leave blank to keep.`
                      : "sk_live_... or sk_test_..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Never shared publicly. Used on the server to initialize checkout and verify charges.
                </p>
              </div>
            </div>


            {/* Paystack Webhook Configuration Box */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Paystack Webhook URL</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Event: charge.success (Instant Book Delivery)</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl font-mono text-xs text-gray-900 truncate select-all">
                  {settings.paystack.webhookUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyPaystackWebhook}
                  className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedPaystackWebhook ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedPaystackWebhook ? "Copied!" : "Copy Webhook"}</span>
                </button>
              </div>

              <div className="text-[11px] text-emerald-800 leading-relaxed pt-1">
                <strong>Setup Step:</strong> In your Paystack Dashboard, navigate to{" "}
                <em>Settings &gt; API Keys & Webhooks</em>, paste this URL into the <strong>Webhook URL</strong> field, and click Save.
              </div>
            </div>

            {/* Stripe Secondary Gateway (Collapsible or Optional) */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                Secondary Gateway: Stripe (Optional)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Stripe Publishable Key
                  </label>
                  <input
                    type="text"
                    value={stripePublishableKey}
                    onChange={(e) => setStripePublishableKey(e.target.value)}
                    placeholder="pk_live_... or pk_test_..."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Stripe Secret Key
                  </label>
                  <input
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    placeholder={
                      settings.payment.secretKeyMasked
                        ? `Currently set (${settings.payment.secretKeyMasked})`
                        : "sk_live_..."
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving Changes..." : "Save Payment Settings"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EMAIL DELIVERY & 2-STEP VERIFICATION                               */}
      {/* ========================================================================= */}
      {activeTab === "EMAIL" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Email Status Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-700 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-950">Google SMTP Delivery</h2>
                  <p className="text-xs text-gray-500">Official transactional & security OTP engine</p>
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live & Authenticated
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 uppercase text-[10px] font-bold block mb-0.5">Sender Email Address</span>
                <span className="font-mono font-bold text-gray-900">{settings.email.smtpUser}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 uppercase text-[10px] font-bold block mb-0.5">SMTP Host & Port</span>
                <span className="font-mono font-bold text-gray-900">{settings.email.smtpHost}:{settings.email.smtpPort} (SSL Encrypted)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 uppercase text-[10px] font-bold block mb-0.5">2-Step Security Verification</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Enforced for All Reader Sign-Ins
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 uppercase text-[10px] font-bold block mb-0.5">RFC Deliverability Headers</span>
                <span className="font-bold text-emerald-700">Auto-Submitted & Anti-Spam Active</span>
              </div>
            </div>
          </div>

          {/* Interactive Diagnostic Tester */}
          <form onSubmit={handleSendTestEmail} className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Send Real-Time SMTP Diagnostic Test</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Sends a live test email directly through <code>{settings.email.smtpUser}</code> to verify instant inbox delivery.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter recipient email address (or leave blank to send to yourself)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink"
              />
              <button
                type="submit"
                disabled={sendingTest}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center justify-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${sendingTest ? "animate-pulse" : ""}`} />
                <span>{sendingTest ? "Dispatching..." : "Send Test Email"}</span>
              </button>
            </div>
          </form>

          {/* App Password Help Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-gray-500" />
              <span>How to Generate a New Google App Password (If ever needed)</span>
            </h3>
            <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Log in to your Google Account (<code>noverailepublishing@gmail.com</code>).</li>
              <li>Go to <strong>Security &gt; 2-Step Verification &gt; App Passwords</strong>.</li>
              <li>Type app name <em>"Noveraile Publishing"</em> and click <strong>Create</strong>.</li>
              <li>Copy the 16-letter code into <code>SMTP_PASS</code> in your <code>.env</code> file.</li>
            </ol>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STOREFRONT & BRANDING                                              */}
      {/* ========================================================================= */}
      {activeTab === "STOREFRONT" && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-5 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-600" />
              <span>Storefront Identity & Localization</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Customize public branding, customer support email, and primary currency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Publisher Brand Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Noveraile Publishing"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Support / Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="support@noverailepublishing.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={siteTagline}
                onChange={(e) => setSiteTagline(e.target.value)}
                placeholder="Books built for where you're going next."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Default Storefront Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-ink"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="NGN">NGN (₦) - Nigerian Naira</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="GHS">GHS (₵) - Ghanaian Cedi</option>
                <option value="ZAR">ZAR (R) - South African Rand</option>
                <option value="KES">KES (KSh) - Kenyan Shilling</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Public Base URL
              </label>
              <input
                type="text"
                value={settings.site.url}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-500 bg-gray-50 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving Changes..." : "Save Storefront Settings"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SECURITY & SYSTEM MAINTENANCE                                      */}
      {/* ========================================================================= */}
      {activeTab === "SECURITY" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Administrator Credentials & Password Management Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                    <span>Company Administrator Credentials</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                      Super Admin
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    Primary administrative login email, password management, and 2-Step verification.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  2-Step Email PIN Active
                </span>
              </div>
            </div>

            {/* Admin Profile Overview Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  <span>Company Login Email</span>
                </div>
                <div className="font-mono text-sm font-bold text-gray-900 select-all">
                  {adminUser.email}
                </div>
                <p className="text-[11px] text-gray-500 pt-0.5">
                  Used to access the management console at <code>/admin/login</code>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>2-Step Verification Protection</span>
                </div>
                <div className="text-xs font-semibold text-amber-950">
                  Enforced on Every Sign-In & Sign-Up
                </div>
                <p className="text-[11px] text-amber-800/80 pt-0.5">
                  Requires 6-digit one-time security code sent to <code>{adminUser.email}</code>.
                </p>
              </div>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="pt-2 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>Change Administrator Security Password</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update your administrative password. Requires minimum 8 characters.
                  </p>
                </div>
              </div>

              {passwordAlert && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 animate-in fade-in ${
                    passwordAlert.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {passwordAlert.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-medium">{passwordAlert.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordAlert(null)}
                    className="text-[11px] font-bold hover:underline opacity-70 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {newPassword.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200/60 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-gray-700">
                      Password Security Strength: {strengthLabels[strengthScore]}
                    </span>
                    <span className="font-mono text-gray-400">{strengthScore}/4 requirements</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          strengthScore >= step ? strengthColors[strengthScore] : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] text-gray-500">
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

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={changingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className={`w-3.5 h-3.5 ${changingPassword ? "animate-pulse" : ""}`} />
                  <span>{changingPassword ? "Updating Password..." : "Update Admin Password"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security & Database Health */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-950">Neon PostgreSQL & Cluster Health</h2>
                  <p className="text-xs text-gray-500">Database connection pool and response latency</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {settings.stats.dbLatencyMs}ms Ping (Healthy)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Total Users</span>
                <span className="font-bold text-base text-gray-900">{settings.stats.userCount}</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Publications</span>
                <span className="font-bold text-base text-gray-900">{settings.stats.bookCount}</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Total Orders</span>
                <span className="font-bold text-base text-gray-900">{settings.stats.orderCount}</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Reader Reviews</span>
                <span className="font-bold text-base text-gray-900">{settings.stats.reviewCount}</span>
              </div>
            </div>
          </div>

          {/* Database Maintenance Action */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Purge Expired Verification OTP Codes</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Cleans temporary one-time password records that have passed their 15-minute expiry window.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCleanExpiredCodes}
              disabled={cleaningCodes}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-600" />
              <span>{cleaningCodes ? "Cleaning..." : "Purge Expired Codes"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

