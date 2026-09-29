import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { siteConfig } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  // Only index categories that have at least one published book and are not redirected
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      slug: { not: "exam-prep" },
      books: {
        some: {
          status: "PUBLISHED",
        },
      },
    },
    select: { slug: true, updatedAt: true },
  });

  // Check if exam-prep has books before including to avoid thin page penalties
  const examBooksCount = await prisma.book.count({
    where: {
      status: "PUBLISHED",
      OR: [
        { category: { slug: "exam-prep" } },
        { examMetadata: { isNot: null } },
      ],
    },
  });

  const baseUrl = siteConfig.url;
  const latestBookUpdate = books.length > 0
    ? books.reduce((latest, b) => (b.updatedAt > latest ? b.updatedAt : latest), books[0].updatedAt)
    : new Date("2026-09-25T12:00:00Z");

  const staticRoutes: { route: string; lastModified: Date; priority: number }[] = [
    { route: "", lastModified: latestBookUpdate, priority: 1.0 },
    { route: "/books", lastModified: latestBookUpdate, priority: 0.9 },
    ...(categories.length > 0
      ? [{ route: "/categories", lastModified: latestBookUpdate, priority: 0.8 }]
      : []),
    ...(examBooksCount > 0
      ? [{ route: "/exam-prep", lastModified: latestBookUpdate, priority: 0.8 }]
      : []),
    { route: "/success-stories", lastModified: new Date("2026-09-28T12:00:00Z"), priority: 0.7 },
    { route: "/about", lastModified: new Date("2026-09-26T10:00:00Z"), priority: 0.7 },
    { route: "/help", lastModified: new Date("2026-09-26T10:00:00Z"), priority: 0.6 },
    { route: "/contact", lastModified: new Date("2026-09-25T12:00:00Z"), priority: 0.5 },
    { route: "/refunds", lastModified: new Date("2026-09-25T12:00:00Z"), priority: 0.5 },
    { route: "/terms", lastModified: new Date("2026-09-25T12:00:00Z"), priority: 0.4 },
    { route: "/privacy", lastModified: new Date("2026-09-25T12:00:00Z"), priority: 0.4 },
    { route: "/accessibility", lastModified: new Date("2026-09-25T12:00:00Z"), priority: 0.4 },
  ];

  const staticPages = staticRoutes.map((item) => ({
    url: `${baseUrl}${item.route}`,
    lastModified: item.lastModified,
    changeFrequency: "weekly" as const,
    priority: item.priority,
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
