/**
 * Converts rich description text (HTML or Markdown, as pasted from KDP / Word)
 * into clean plain text for meta descriptions and structured data, where
 * formatting markers such as **bold** or <p> would otherwise show up literally.
 */
export function toPlainText(input: string | null | undefined, maxLength?: number): string {
  if (!input) return "";

  const text = input
    .replace(/<[^>]*>?/gm, " ") // HTML tags
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // Markdown headings
    .replace(/^\s{0,3}>\s?/gm, "") // Markdown blockquotes
    .replace(/\*+/g, "") // Markdown bold / italic markers
    .replace(/\s+/g, " ")
    .trim();

  if (!maxLength || text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?—-]+$/, "")}…`;
}
