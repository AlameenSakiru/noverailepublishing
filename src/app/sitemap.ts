import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { siteConfig } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const authors = await prisma.author.findMany({
    select: { slug: true, updatedAt: true },
  });

  const baseUrl = siteConfig.url;

  const staticPages = [
    "",
    "/books",
    "/exam-prep",
    "/categories",
    "/success-stories",
    "/about",
    "/help",
    "/contact",
    "/privacy",
    "/terms",
    "/refunds",
    "/accessibility",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const bookPages = books.map((b) => ({
    url: `${baseUrl}/books/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const categoryPages = categories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...bookPages, ...categoryPages];
}
