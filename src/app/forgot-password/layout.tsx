import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a secure link to reset your Noveraile Publishing account password.",
  alternates: {
    canonical: `${siteConfig.url}/forgot-password`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
