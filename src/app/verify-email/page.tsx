import { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailClient } from "./VerifyEmailClient";

export const metadata: Metadata = {
  title: "Verify Email Address | Noveraile Publishing",
  description: "Enter your 6-digit verification code to complete your reader registration.",
};

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-brand-muted">Loading verification...</div>}>
        <VerifyEmailClient />
      </Suspense>
    </div>
  );
}
