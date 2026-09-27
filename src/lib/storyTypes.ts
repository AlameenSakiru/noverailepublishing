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

export const DEFAULT_FEATURED_STORIES: FeaturedStory[] = [
  {
    id: "story-1",
    name: "Sarah Jenkins, BSN",
    role: "Registered Nurse & NCLEX Candidate",
    location: "Columbus, OH",
    category: "exam-prep",
    categoryLabel: "Healthcare & Licensure",
    bookTitle: "NCLEX-RN Ultimate Mastery Guide",
    bookSlug: "nclex-rn-ultimate-mastery-guide",
    rating: 5,
    date: "August 2026",
    scoreHighlight: "Passed First Attempt • 85 Questions",
    prepDuration: "5 Weeks Focused Study",
    quote: "The NextGen clinical judgment unfolding cases taught me how to think under pressure rather than just memorizing facts.",
    detailedReview:
      "Balancing prep with 12-hour hospital shifts was overwhelming until I switched to this guide. The case studies and hemodynamic rationales were spot-on with the actual testing screen. The computerized exam shut off at 85 questions. Passed on my first try!",
    verifiedType: "Licensure Verified",
  },
  {
    id: "story-2",
    name: "Marcus Vance",
    role: "Book Club Moderator & Fiction Enthusiast",
    location: "Seattle, WA",
    category: "fiction",
    categoryLabel: "Contemporary & Literary Fiction",
    bookTitle: "The Retired Dragon Slayer Teaches Pottery",
    bookSlug: "the-retired-dragon-slayer-teaches-pottery",
    rating: 5,
    date: "September 2026",
    scoreHighlight: "Book Club Selection of the Month",
    prepDuration: "Read over a Weekend",
    quote: "Warm, witty, and deeply poignant. The distraction-free browser reader felt like opening an exquisite private print edition.",
    detailedReview:
      "Our monthly reading circle selected this on a whim, and it turned into one of our most lively discussions of the year. The prose has genuine heart, and reading directly on the cloud reader without having to download extra e-reader apps made it accessible for everyone in our group.",
    verifiedType: "Verified Reader",
  },
  {
    id: "story-3",
    name: "Clara & Henrik Lind",
    role: "Overland Expeditions & Route Planners",
    location: "Inverness, Scotland",
    category: "travel",
    categoryLabel: "Travel & Expeditions",
    bookTitle: "Highlands & Islands Campervan Route Guide",
    bookSlug: "highlands-campervan-route-guide",
    rating: 5,
    date: "July 2026",
    scoreHighlight: "1,200km Route Tested",
    prepDuration: "Field Tested Over 3 Weeks",
    quote: "Accurate passing-place etiquette, realistic vehicle clearances, and genuine respect for local communities.",
    detailedReview:
      "Most digital travel guides are recycled tourist blogs. Noveraile's route guide gave us exact gradient warnings for steep coastal passes, legal overnight spots with fresh water, and single-track etiquette that saved our clutch. Truly indispensable.",
    verifiedType: "Field Tested",
  },
  {
    id: "story-4",
    name: "David K. Okonjo",
    role: "Studio Director & Technology Lead",
    location: "Toronto, Canada",
    category: "business",
    categoryLabel: "Business & Digital Strategy",
    bookTitle: "Principled Leadership in the Digital Age",
    bookSlug: "principled-leadership-digital-age",
    rating: 5,
    date: "June 2026",
    scoreHighlight: "Adopted for Team Leadership",
    prepDuration: "Executive Implementation",
    quote: "Cuts through modern management hype with practical frameworks for ethical leadership and sustainable team craft.",
    detailedReview:
      "Recommended by a colleague, this book helped us realign our product design workflow without exhausting our creative team. Every chapter pairs thoughtful philosophy with actionable checklists you can put into practice on Monday morning.",
    verifiedType: "Verified Reader",
  },
];
