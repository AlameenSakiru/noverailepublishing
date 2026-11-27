import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the books in your cart, apply a discount code, and check out securely.",
  alternates: {
    canonical: `${siteConfig.url}/cart`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
