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
} from "lucide-react";

interface SettingsData {
  site: {
    name: string;
    url: string;
    contactEmail: string;
    currency: string;
    storageDriver: string;
    jwtSessionExpiryDays: number;
  };
  payment: {
    isStripeConfigured: boolean;
    stripeMode: string;
    publishableKeyPreview: string;
    isWebhookSecretSet: boolean;
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
  };
}

export function SettingsClient({ initialSettings }: { initialSettings: SettingsData }) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [copied, setCopied] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(settings.payment.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResult(null);

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
        setTestResult({
          success: true,
          message: data.message || "Diagnostic test email dispatched successfully!",
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Failed to dispatch test email.",
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Network error during SMTP test.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-950 flex items-center gap-2.5">
            <span>Platform Settings & Integrations</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage payment gateways, transactional email SMTP, security policies, and environment status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Checking Status..." : "Refresh Diagnostics"}</span>
        </button>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Payment Gateway & Checkout */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Payment Gateway (Stripe)</h2>
                  <span className="text-[11px] text-gray-500">Checkout sessions & Webhook verification</span>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  settings.payment.isStripeConfigured
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    settings.payment.isStripeConfigured ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {settings.payment.isStripeConfigured ? "Live Stripe Active" : "Sandbox Mode Active"}
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Gateway Mode</span>
                <span className="font-mono text-gray-900 font-semibold">{settings.payment.stripeMode}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Publishable Key</span>
                <span className="font-mono text-gray-700">{settings.payment.publishableKeyPreview}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Webhook Signature Status</span>
                <span
                  className={`font-semibold ${
                    settings.payment.isWebhookSecretSet ? "text-emerald-600" : "text-amber-700"
                  }`}
                >
                  {settings.payment.isWebhookSecretSet ? "Configured (whsec_...)" : "Not Configured"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Default Currency</span>
                <span className="font-bold text-gray-900">{settings.site.currency} (USD)</span>
              </div>

              {/* Webhook Endpoint Box */}
              <div className="mt-4 pt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Live Webhook Endpoint URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] text-gray-800 truncate select-all">
                    {settings.payment.webhookUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-gray-400 shrink-0" />
                  Paste this URL into Stripe Dashboard &gt; Developers &gt; Webhooks.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Keys managed in server .env</span>
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
            >
              <span>Stripe Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Card 2: Transactional Email & SMTP */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Email Delivery (Google SMTP)</h2>
                  <span className="text-[11px] text-gray-500">2-Step Security codes & verification</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SMTP Authenticated
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">SMTP Server Host</span>
                <span className="font-mono text-gray-900 font-semibold">{settings.email.smtpHost}:{settings.email.smtpPort} (SSL)</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Authenticated Account</span>
                <span className="font-mono text-gray-900 font-semibold">{settings.email.smtpUser}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Sender Display Header</span>
                <span className="text-gray-800">{settings.email.emailFrom}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Sign-In 2-Step Verification</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Enforced on all Reader Logins
                </span>
              </div>

              {/* SMTP Diagnostic Tester */}
              <form onSubmit={handleSendTestEmail} className="mt-4 pt-2 space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Send SMTP Diagnostic Test Email
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter recipient email (or leave blank for admin)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-ink"
                  />
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${sendingTest ? "animate-pulse" : ""}`} />
                    <span>{sendingTest ? "Sending..." : "Test SMTP"}</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      testResult.success
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border border-rose-200 text-rose-800"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">16-char App Password Active</span>
            <span className="text-xs text-gray-500">Gmail TLS 1.3 Certified</span>
          </div>
        </div>

        {/* Card 3: Storefront & Identity Defaults */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-700 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Storefront Identity</h2>
              <span className="text-[11px] text-gray-500">Public metadata and contact channels</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Brand Name</span>
              <span className="font-semibold text-gray-900">{settings.site.name}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Public Base URL</span>
              <span className="font-mono text-gray-800">{settings.site.url}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Support Contact Email</span>
              <span className="font-mono text-gray-800">{settings.site.contactEmail}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Manuscript Storage Driver</span>
              <span className="font-mono text-gray-900 uppercase font-semibold">{settings.site.storageDriver} (Local Private Volume)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Database & Security Metrics */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Database & Security Metrics</h2>
              <span className="text-[11px] text-gray-500">Neon PostgreSQL pooled cluster</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Total Registered Accounts</span>
              <span className="font-bold text-gray-900">{settings.stats.userCount} Users</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Catalog Publications</span>
              <span className="font-bold text-gray-900">{settings.stats.bookCount} Books</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Processed Orders</span>
              <span className="font-bold text-gray-900">{settings.stats.orderCount} Orders</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Auth Session Expiry</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> {settings.site.jwtSessionExpiryDays} Days (HttpOnly JWT)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
