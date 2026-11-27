import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a free Noveraile Publishing reader account to buy books and read them securely in your browser.",
  alternates: {
    canonical: `${siteConfig.url}/register`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
