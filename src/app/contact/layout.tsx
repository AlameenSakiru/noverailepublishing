import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact & Reader Support Desk",
  description: "Direct publisher contact and reader assistance for digital publications, cloud library access, and editorial inquiries.",
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
  openGraph: {
    title: "Contact & Reader Support Desk | Noveraile Publishing",
    description: "Direct publisher contact and reader assistance for digital publications, cloud library access, and editorial inquiries.",
    url: `${siteConfig.url}/contact`,
    type: "website",
    images: [
      {
        url: "/logo-square.png",
        width: 1024,
        height: 1024,
        alt: "Noveraile Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact & Reader Support Desk | Noveraile Publishing",
    description: "Direct publisher contact and reader assistance for digital publications and editorial inquiries.",
    images: ["/logo-square.png"],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
