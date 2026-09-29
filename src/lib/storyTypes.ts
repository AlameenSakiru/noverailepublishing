export interface FeaturedStory {
  id: string;
  name: string;
  role: string;
  location: string;
  category: "exam-prep" | "travel" | "business" | "fiction";
  categoryLabel: string;
  bookTitle: string;
  bookSlug: string;
  rating: number;
  date: string;
  scoreHighlight?: string;
  prepDuration?: string;
  quote: string;
  detailedReview: string;
  verifiedType: "Verified Reader" | "Licensure Verified" | "Field Tested";
}

export const DEFAULT_FEATURED_STORIES: FeaturedStory[] = [];

