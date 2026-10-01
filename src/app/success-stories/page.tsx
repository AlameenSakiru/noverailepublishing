import React from "react";
import prisma from "@/lib/prisma";
import { SuccessStoriesClient } from "./SuccessStoriesClient";
import { FeaturedStory } from "@/lib/storyTypes";

import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reader Stories & Verified Reviews",
  description:
    "Explore authentic reviews, reader outcomes, and our strict verified-purchaser review policy at Noveraile Publishing.",
  alternates: {
    canonical: `${siteConfig.url}/success-stories`,
  },
  openGraph: {
    title: "Reader Stories & Verified Reviews | Noveraile Publishing",
    description: "Explore authentic reviews and verified purchaser reflections from our readers.",
    url: `${siteConfig.url}/success-stories`,
    type: "website",
    images: [
      {
        url: "/logo-square.png",
        width: 1024,
        height: 1024,
        alt: "Noveraile Verified Reader Stories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reader Stories & Verified Reviews | Noveraile Publishing",
    description: "Explore authentic reviews and verified purchaser reflections from our readers.",
    images: ["/logo-square.png"],
  },
};

export default async function SuccessStoriesPage() {
  let stories: FeaturedStory[] = [];

  try {
    const record = await prisma.platformSetting.findUnique({
      where: { key: "featured_stories_json" },
    });

    if (record?.value) {
      const parsed = JSON.parse(record.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        stories = parsed;
      }
    }
  } catch (error) {
    console.error("Failed to load featured stories from db:", error);
  }

  // Also fetch real approved reviews from verified purchasers
  const verifiedReviews = await prisma.review.findMany({
    where: { isApproved: true },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <SuccessStoriesClient
      initialStories={stories}
      verifiedReviews={verifiedReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
        book: r.book,
      }))}
    />
  );
}
