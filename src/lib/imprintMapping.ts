/**
 * Intelligently maps book categories to their designated Noveraile Publishing Imprints.
 * 
 * Rules:
 * - Exam Preparation, Healthcare, Nursing, IT & Certification -> Scholarforge ED.
 * - Travel & Exploration, Field Guides -> Noveraile Meridian
 * - Business, Leadership, Fiction, Self-Help & General Editorial -> Noveraile Publishing
 */
export function getAutoImprintId(
  categoryId: string,
  categories: { id: string; name: string; slug?: string }[],
  imprints: { id: string; name: string; slug?: string }[]
): string {
  if (!categoryId || !categories.length || !imprints.length) {
    return imprints[0]?.id || "";
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  if (!selectedCategory) return imprints[0]?.id || "";

  const name = selectedCategory.name.toLowerCase();
  const slug = (selectedCategory.slug || "").toLowerCase();

  // 1. Exam Prep, Healthcare, Nursing, IT & Licensure -> Scholarforge ED.
  if (
    slug.includes("exam") ||
    slug.includes("health") ||
    slug.includes("nurs") ||
    slug.includes("cyber") ||
    name.includes("exam") ||
    name.includes("pharmacy") ||
    name.includes("nursing") ||
    name.includes("certif") ||
    name.includes("prep") ||
    name.includes("technician")
  ) {
    const scholar = imprints.find(
      (i) => i.name.toLowerCase().includes("scholarforge") || (i.slug && i.slug.includes("scholarforge"))
    );
    if (scholar) return scholar.id;
  }

  // 2. Travel & Exploration -> Noveraile Meridian
  if (
    slug.includes("travel") ||
    name.includes("travel") ||
    name.includes("exploration") ||
    name.includes("guide") ||
    name.includes("route")
  ) {
    const meridian = imprints.find(
      (i) => i.name.toLowerCase().includes("meridian") || (i.slug && i.slug.includes("meridian"))
    );
    if (meridian) return meridian.id;
  }

  // 3. Business, Fiction, Self-Help & General -> Noveraile Publishing (Flagship)
  const flagship = imprints.find(
    (i) => i.name.toLowerCase() === "noveraile publishing" || (i.slug && i.slug.includes("noveraile-publishing"))
  );
  if (flagship) return flagship.id;

  return imprints[0]?.id || "";
}
