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

  // Load saved stories from PlatformSetting
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

  // Load available books for the dropdown
  const books = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
    },
    orderBy: { title: "asc" },
  });

  return (
    <StoriesAdminClient
      initialStories={initialStories}
      availableBooks={books}
    />
  );
}
