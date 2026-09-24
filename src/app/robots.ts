import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/books", "/books/*", "/categories", "/categories/*", "/exam-prep", "/success-stories", "/about", "/help"],
        disallow: ["/admin", "/admin/*", "/reader/*", "/api/*", "/my-library", "/checkout/*"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
