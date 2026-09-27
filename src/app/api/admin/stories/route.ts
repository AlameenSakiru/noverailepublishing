import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_FEATURED_STORIES, FeaturedStory } from "@/lib/storyTypes";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const SETTING_KEY = "featured_stories_json";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Editor privileges required." },
        { status: 403 }
      );
    }

    const record = await prisma.platformSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    let stories: FeaturedStory[] = DEFAULT_FEATURED_STORIES;
    if (record?.value) {
      try {
        const parsed = JSON.parse(record.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          stories = parsed;
        }
      } catch {
        // Fallback to default
      }
    }

    // Also get the list of existing books for the book selection dropdown
    const books = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({
      success: true,
      stories,
      availableBooks: books,
    });
  } catch (error) {
    console.error("Failed to load featured stories:", error);
    return NextResponse.json(
      { error: "Failed to load featured stories" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Editor privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { stories } = body;

    if (!Array.isArray(stories) || stories.length === 0) {
      return NextResponse.json(
        { error: "Invalid data: stories must be an array." },
        { status: 400 }
      );
    }

    // Enforce exactly 4 stories
    const sanitizedStories: FeaturedStory[] = stories.slice(0, 4).map((s, idx) => ({
      id: s.id || `story-${idx + 1}`,
      name: String(s.name || "").trim() || `Reader ${idx + 1}`,
      role: String(s.role || "").trim(),
      location: String(s.location || "").trim(),
      category: s.category || "fiction",
      categoryLabel: String(s.categoryLabel || "").trim() || "Reader Review",
      bookTitle: String(s.bookTitle || "").trim() || "Featured Publication",
      bookSlug: String(s.bookSlug || "").trim() || "the-retired-dragon-slayer-teaches-pottery",
      rating: Math.max(1, Math.min(5, Number(s.rating) || 5)),
      date: String(s.date || "").trim() || "Recently",
      scoreHighlight: s.scoreHighlight ? String(s.scoreHighlight).trim() : undefined,
      prepDuration: s.prepDuration ? String(s.prepDuration).trim() : undefined,
      quote: String(s.quote || "").trim(),
      detailedReview: String(s.detailedReview || "").trim(),
      verifiedType: s.verifiedType || "Verified Reader",
    }));

    await prisma.platformSetting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: JSON.stringify(sanitizedStories),
      },
      create: {
        key: SETTING_KEY,
        value: JSON.stringify(sanitizedStories),
      },
    });

    // Revalidate public success-stories page
    try {
      revalidatePath("/success-stories");
    } catch {
      // Ignored in non-edge contexts
    }

    return NextResponse.json({
      success: true,
      message: "Successfully updated 4 featured reader stories!",
      stories: sanitizedStories,
    });
  } catch (error) {
    console.error("Failed to save featured stories:", error);
    return NextResponse.json(
      { error: "Failed to update featured stories" },
      { status: 500 }
    );
  }
}
