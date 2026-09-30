import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/books", "/books/*", "/categories", "/categories/*", "/exam-prep", "/success-stories", "/about", "/help", "/cookies"],
        disallow: [
          "/admin",
          "/admin/*",
          "/reader/*",
          "/api/*",
          "/my-library",
          "/checkout/*",
          "/cart",
          "/cart/*",
          "/login",
          "/register",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/account",
          "/account/*",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
