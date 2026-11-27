import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new password for your Noveraile Publishing reader account.",
  alternates: {
    canonical: `${siteConfig.url}/reset-password`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
