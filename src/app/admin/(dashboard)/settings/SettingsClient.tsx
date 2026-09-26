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
} from "lucide-react";

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

export function SettingsClient({ initialSettings }: { initialSettings: SettingsData }) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [activeTab, setActiveTab] = useState<"PAYMENTS" | "EMAIL" | "STOREFRONT" | "SECURITY">("PAYMENTS");

  // Editable Form States
  const [siteName, setSiteName] = useState(settings.site.name);
  const [siteTagline, setSiteTagline] = useState(settings.site.tagline);
  const [contactEmail, setContactEmail] = useState(settings.site.contactEmail);
  const [currency, setCurrency] = useState(settings.site.currency);

  const [stripePublishableKey, setStripePublishableKey] = useState(settings.payment.publishableKey);
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");

  // Action states
  const [copied, setCopied] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [cleaningCodes, setCleaningCodes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(settings.payment.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
        setStripePublishableKey(data.settings.payment.publishableKey);
      }
    } finally {
      setRefreshing(false);
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
          stripePublishableKey: stripePublishableKey || undefined,
          stripeSecretKey: stripeSecretKey.trim() || undefined,
          stripeWebhookSecret: stripeWebhookSecret.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionAlert({ success: true, message: data.message || "Settings updated successfully!" });
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
            Configure payment gateways, transactional email, storefront metadata, and security policies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-2xs transition-colors"
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
            className="text-xs font-bold hover:underline opacity-70"
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
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "PAYMENTS"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <CreditCard className={`w-3.5 h-3.5 ${activeTab === "PAYMENTS" ? "text-amber-400" : "text-gray-400"}`} />
          <span>Payment Gateways</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("EMAIL")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
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
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-950">Active Checkout Engine</h2>
                  <p className="text-xs text-gray-500">How customers pay for digital publications</p>
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                    settings.payment.isStripeConfigured
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      settings.payment.isStripeConfigured ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {settings.payment.isStripeConfigured
                    ? `Live Stripe (${settings.payment.stripeMode})`
                    : "Sandbox Mode (Instant 1-Click Simulation)"}
                </span>
              </div>
            </div>

            {/* Explanation Box */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>How Noveraile Checkout Works:</span>
              </div>
              <p>
                • <strong>Sandbox Mode (Current Default)</strong>: When Stripe API keys are empty, the platform lets you test the complete reader purchasing flow with simulated 1-click checkouts without spending real money.
              </p>
              <p>
                • <strong>Live Stripe Mode</strong>: Enter your Stripe API credentials below to accept real Credit/Debit cards, Apple Pay, and Google Pay worldwide.
              </p>
            </div>
          </div>

          {/* Stripe Configuration Form */}
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Stripe API Credentials</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Obtain these keys from your{" "}
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-ink underline"
                >
                  Stripe Dashboard (API Keys)
                </a>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Stripe Publishable Key
                </label>
                <input
                  type="text"
                  value={stripePublishableKey}
                  onChange={(e) => setStripePublishableKey(e.target.value)}
                  placeholder="pk_live_... or pk_test_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Stripe Secret Key (Private)
                </label>
                <input
                  type="password"
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  placeholder={
                    settings.payment.secretKeyMasked
                      ? `Currently set (${settings.payment.secretKeyMasked}). Leave blank to keep.`
                      : "sk_live_... or sk_test_..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Stripe Webhook Signing Secret (Optional for local testing, required for production)
                </label>
                <input
                  type="password"
                  value={stripeWebhookSecret}
                  onChange={(e) => setStripeWebhookSecret(e.target.value)}
                  placeholder={
                    settings.payment.webhookSecretMasked
                      ? `Currently set (${settings.payment.webhookSecretMasked}). Leave blank to keep.`
                      : "whsec_..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                />
              </div>
            </div>

            {/* Webhook Endpoint Box */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Your Webhook Endpoint URL
                </span>
                <span className="text-[11px] text-amber-700 font-medium">Event: checkout.session.completed</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono text-xs text-gray-900 truncate select-all">
                  {settings.payment.webhookUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy URL"}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
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
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-ink"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="NGN">NGN (₦) - Nigerian Naira</option>
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
              className="px-6 py-2.5 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
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
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
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
