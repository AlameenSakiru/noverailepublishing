import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const books = await prisma.book.findMany();
  console.log(`Found ${books.length} books in database.`);

  for (const book of books) {
    console.log(`Book: "${book.title}"`);
    console.log("Current description snippet:", book.description?.slice(0, 100));

    // If description is simple plain text without bullet points or headings, enhance it into Amazon format
    if (!book.description.includes("•") && !book.description.includes("<ul>") && !book.description.includes("<h3>")) {
      const amazonFormattedDescription = `<h3>An Epic Tale of Second Chances, Peaceful Art, and Untamed Magic</h3>

${book.description}

<h4>Inside this captivating narrative, readers will experience:</h4>
• A Legendary Past: The untold triumphs and burdens of the realm's most feared dragon hunter.
• The Art of the Wheel: Finding inner serenity, purpose, and mastery in the tactile world of clay and fire.
• Unbreakable Bonds: A community of quirky villagers and apprentices who see the man beneath the legend.
• Looming Shadows: Old enemies and mythical beasts that test whether peace can truly endure.

<h4>Why Readers Love This Publication:</h4>
• Richly textured fantasy worldbuilding with heartwarming character arcs.
• A refreshing blend of cozy slice-of-life warmth and high-stakes adventure.
• Perfect for fans of Legends & Lattes, The Name of the Wind, and Travis Baldree.

<em>"A breathtaking masterpiece of quiet triumph and gentle wisdom." — Noveraile Editorial Review</em>`;

      await prisma.book.update({
        where: { id: book.id },
        data: {
          description: amazonFormattedDescription,
        },
      });

      console.log(`✅ Updated "${book.title}" with Amazon-style rich description & bullet points.`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
