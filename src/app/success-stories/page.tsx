import React from "react";
import prisma from "@/lib/prisma";
import { SuccessStoriesClient } from "./SuccessStoriesClient";
import { DEFAULT_FEATURED_STORIES, FeaturedStory } from "@/lib/storyTypes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reader Stories & Verified Reviews | Noveraile Publishing",
  description:
    "Explore authentic reviews and reader outcomes across professional certification guides, contemporary literature, and travel route guides from Noveraile Publishing.",
};

export default async function SuccessStoriesPage() {
  let stories: FeaturedStory[] = DEFAULT_FEATURED_STORIES;

  try {
    const record = await prisma.platformSetting.findUnique({
      where: { key: "featured_stories_json" },
    });

    if (record?.value) {
      const parsed = JSON.parse(record.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        stories = parsed.slice(0, 4);
      }
    }
  } catch (error) {
    console.error("Failed to load featured stories from db:", error);
  }

  return <SuccessStoriesClient initialStories={stories} />;
}
