import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StoriesAdminClient } from "./StoriesAdminClient";
import { DEFAULT_FEATURED_STORIES, FeaturedStory } from "@/lib/storyTypes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Featured Stories & Community Reviews | Noveraile Admin",
};

export default async function AdminStoriesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR")) {
    redirect("/admin/login?error=forbidden");
  }

  // 1. Load saved stories from PlatformSetting
  const record = await prisma.platformSetting.findUnique({
    where: { key: "featured_stories_json" },
  });

  let initialStories: FeaturedStory[] = DEFAULT_FEATURED_STORIES;
  if (record?.value) {
    try {
      const parsed = JSON.parse(record.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        initialStories = parsed;
      }
    } catch {
      // Use defaults
    }
  }

  // 2. Load available books for dropdown
  const books = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
    },
    orderBy: { title: "asc" },
  });

  // 3. Load all customer reviews from the database
  const customerReviews = await prisma.review.findMany({
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
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <StoriesAdminClient
      initialStories={initialStories}
      availableBooks={books}
      initialCustomerReviews={customerReviews}
    />
  );
}
