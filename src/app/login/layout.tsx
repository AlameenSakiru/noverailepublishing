import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Noveraile Publishing reader account to open your cloud library and continue reading.",
  alternates: {
    canonical: `${siteConfig.url}/login`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
