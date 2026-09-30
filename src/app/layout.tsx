import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SupportWidget } from "@/components/SupportWidget";
import { CookieBanner } from "@/components/CookieBanner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { StorefrontProvider } from "@/context/StorefrontContext";
import { getStorefrontSettings } from "@/lib/settings";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSettings();
  const siteName = settings.siteName || siteConfig.name;
  const tagline = settings.siteTagline || siteConfig.tagline;
  const description = settings.siteSubTagline || siteConfig.subTagline;
  const siteUrl = siteConfig.url;

  return {
    title: {
      default: `${siteName} | ${tagline}`,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [
      "digital publishing",
      "exam prep books",
      "PTCB study guide",
      "NCLEX practice questions",
      "independent bookstore",
      "protected online reader",
      siteName.toLowerCase(),
    ],
    authors: [{ name: siteName, url: siteUrl }],
    creator: siteName,
    publisher: siteName,
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      title: `${siteName} — ${tagline}`,
      description,
      siteName,
      images: [
        {
          url: "/logo-square.png",
          width: 1024,
          height: 1024,
          alt: siteName,
        },
      ],
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
        { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
        { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: tagline,
    },
    verification: {
      google: "WNk5Oc4mfX_vzXBxGGKaA-ibTfUgOTwwLTFRheM5YNs",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storefrontSettings = await getStorefrontSettings();

  return (
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-T40Y4VFKPX"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
              });
              gtag('js', new Date());
              gtag('config', 'G-T40Y4VFKPX');
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen antialiased bg-[#fbfaf8] text-brand-ink selection:bg-brand-200 selection:text-brand-900" suppressHydrationWarning>
        <AuthProvider>
          <StorefrontProvider initialSettings={storefrontSettings}>
            <CartProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <SupportWidget />
              <CookieBanner />
            </CartProvider>
          </StorefrontProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
