import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const covers = [
  {
    slug: "ptcb-exam-prep-2027",
    filename: "ptcb.jpg",
    url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "nclex-rn-ultimate-mastery-guide",
    filename: "nclex.jpg",
    url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "comptia-security-plus-exam-practice",
    filename: "security-plus.jpg",
    url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "the-architect-of-venice",
    filename: "venice.jpg",
    url: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "highlands-islands-campervan-route-guide",
    filename: "highlands.jpg",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "principled-leadership-in-the-digital-age",
    filename: "leadership.jpg",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
  },
];

async function main() {
  const dir = path.join(process.cwd(), "public", "covers");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const item of covers) {
    const filePath = path.join(dir, item.filename);
    const localUrl = `/covers/${item.filename}`;

    if (!fs.existsSync(filePath)) {
      console.log(`Downloading ${item.filename} from ${item.url}...`);
      try {
        const res = await fetch(item.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved ${item.filename} (${buffer.length} bytes)`);
      } catch (e) {
        console.error(`Failed to download ${item.filename}:`, e);
      }
    } else {
      console.log(`${item.filename} already exists locally.`);
    }

    // Update Book cover in database
    await prisma.book.updateMany({
      where: { slug: item.slug },
      data: { coverImage: localUrl },
    });
    console.log(`Updated database cover for ${item.slug} -> ${localUrl}`);
  }

  console.log("All covers cached locally in /public/covers/!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
