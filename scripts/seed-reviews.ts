import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking and seeding realistic verified reviews...");

  const books = await prisma.book.findMany();
  const users = await prisma.user.findMany();

  if (books.length === 0) {
    console.log("No books found.");
    return;
  }

  // Create reader accounts if needed
  let reader1 = users.find((u) => u.email === "sarah.jenkins@example.com");
  if (!reader1) {
    reader1 = await prisma.user.create({
      data: {
        email: "sarah.jenkins@example.com",
        passwordHash: "$2a$10$xyzplaceholderhash1234567890abcdef",
        name: "Dr. Sarah Jenkins, PharmD",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });
  }

  let reader2 = users.find((u) => u.email === "marcus.vance@example.com");
  if (!reader2) {
    reader2 = await prisma.user.create({
      data: {
        email: "marcus.vance@example.com",
        passwordHash: "$2a$10$xyzplaceholderhash1234567890abcdef",
        name: "Marcus Vance, MBA",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });
  }

  let reader3 = users.find((u) => u.email === "claire.thornton@example.com");
  if (!reader3) {
    reader3 = await prisma.user.create({
      data: {
        email: "claire.thornton@example.com",
        passwordHash: "$2a$10$xyzplaceholderhash1234567890abcdef",
        name: "Claire Thornton",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });
  }

  let reader4 = users.find((u) => u.email === "david.okafor@example.com");
  if (!reader4) {
    reader4 = await prisma.user.create({
      data: {
        email: "david.okafor@example.com",
        passwordHash: "$2a$10$xyzplaceholderhash1234567890abcdef",
        name: "David Okafor",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });
  }

  // Curated authentic reviews per book niche
  const sampleReviews: Record<string, { rating: number; title: string; comment: string; reviewerId: string }[]> = {
    "principled-leadership-in-the-digital-age": [
      {
        rating: 5,
        title: "Essential playbook for modern executive governance",
        comment: "This publication cuts straight through corporate buzzwords and provides concrete architectural frameworks for managing technological transformation without sacrificing human trust. The chapter on algorithmic accountability should be mandatory reading in every boardroom.",
        reviewerId: reader2.id,
      },
      {
        rating: 5,
        title: "Unmatched clarity and strategic depth",
        comment: "I read this during our organization's multi-cloud migration. The diagnostic decision matrices in Chapter 3 saved our leadership team months of trial and error. Reading directly in the browser with cloud bookmark sync was flawless.",
        reviewerId: reader1.id,
      },
      {
        rating: 4,
        title: "Rigorous and actionable, highly recommended",
        comment: "A refreshing perspective that balances technological innovation with ethical principles. The case studies are grounded in real enterprise realities.",
        reviewerId: reader4.id,
      },
    ],
    "ptcb-master-exam-manual-2027": [
      {
        rating: 5,
        title: "Passed on my first attempt! The formula drills are unmatched.",
        comment: "The 2027 blueprint alignment in this manual is 100% accurate. The pharmacology tables and pediatric dosage calculations gave me complete confidence going into testing day. Best exam prep investment I have made.",
        reviewerId: reader1.id,
      },
      {
        rating: 5,
        title: "Far superior to outdated physical study books",
        comment: "The in-browser reader allowed me to practice diagnostic questions during my hospital breaks on my phone. Detailed rationales for every practice item make studying painless.",
        reviewerId: reader3.id,
      },
      {
        rating: 5,
        title: "Worth every penny for the clinical pharmacy section",
        comment: "Comprehensive coverage of sterile compounding, federal regulations, and top 200 medications. The test-taking strategies alone are gold.",
        reviewerId: reader4.id,
      },
    ],
    "solo-campervan-odyssey": [
      {
        rating: 5,
        title: "The definitive guide to overland van living",
        comment: "Beautifully organized routes and electrical solar calculators. It prepared me for 3 months of off-grid travel through the Pacific Northwest without a hitch.",
        reviewerId: reader3.id,
      },
      {
        rating: 5,
        title: "Inspiring narrative paired with practical technical guidance",
        comment: "Captivating wilderness reflections and meticulous route coordinates. I keep this book open in my browser on my tablet while on the road.",
        reviewerId: reader2.id,
      },
    ],
    "echoes-of-the-highland-mist": [
      {
        rating: 5,
        title: "Atmospheric, evocative, and deeply moving literature",
        comment: "The prose is lyrical and historical details are meticulously researched. A truly gripping Scottish historical drama that stays with you long after the final chapter.",
        reviewerId: reader3.id,
      },
      {
        rating: 4,
        title: "A rich and layered historical novel",
        comment: "Rich character development and breathtaking descriptions of the 18th-century highlands. A standout work from Noveraile's fiction list.",
        reviewerId: reader4.id,
      },
    ],
  };

  for (const book of books) {
    const slug = book.slug.toLowerCase();
    let reviewsForBook: any[] = [];
    if (slug.includes("lead")) {
      reviewsForBook = sampleReviews["principled-leadership-in-the-digital-age"] || [];
    } else if (slug.includes("ptcb") || slug.includes("exam")) {
      reviewsForBook = sampleReviews["ptcb-master-exam-manual-2027"] || [];
    } else if (slug.includes("campervan") || slug.includes("odyssey")) {
      reviewsForBook = sampleReviews["solo-campervan-odyssey"] || [];
    } else if (slug.includes("mist") || slug.includes("echoes") || slug.includes("fiction")) {
      reviewsForBook = sampleReviews["echoes-of-the-highland-mist"] || [];
    }

    if (reviewsForBook && reviewsForBook.length > 0) {
      for (const r of reviewsForBook) {
        const existing = await prisma.review.findFirst({
          where: { bookId: book.id, userId: r.reviewerId },
        });

        if (!existing) {
          await prisma.review.create({
            data: {
              bookId: book.id,
              userId: r.reviewerId,
              rating: r.rating,
              title: r.title,
              comment: r.comment,
              isVerifiedPurchase: true,
              isApproved: true,
            },
          });
          console.log(`Added review for "${book.title}" by reviewer.`);
        }
      }
    }
  }

  console.log("Review seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
