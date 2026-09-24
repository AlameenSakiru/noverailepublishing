import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Noveraile Publishing database...");

  // 1. Clean existing records for idempotent seed
  await prisma.bookmark.deleteMany();
  await prisma.readingProgress.deleteMany();
  await prisma.entitlement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.couponUse.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.bookPageAsset.deleteMany();
  await prisma.examMetadata.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.imprint.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminPassword = await bcrypt.hash("AdminPass2026!", 10);
  const readerPassword = await bcrypt.hash("ReaderPass2026!", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@noveraile.com",
      passwordHash: adminPassword,
      name: "Editorial Director",
      role: "ADMIN",
      isEmailVerified: true,
      status: "ACTIVE",
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: "reader@example.com",
      passwordHash: readerPassword,
      name: "Elena Vance",
      role: "CUSTOMER",
      isEmailVerified: true,
      status: "ACTIVE",
    },
  });

  console.log("Created admin (admin@noveraile.com) and reader (reader@example.com)");

  // 3. Create Imprints
  const imprintMain = await prisma.imprint.create({
    data: {
      name: "Noveraile Publishing",
      slug: "noveraile-publishing",
      description: "Flagship editorial imprint delivering authoritative non-fiction, contemporary literature, and reference works.",
      websitePath: "/imprints/noveraile",
    },
  });

  const imprintScholar = await prisma.imprint.create({
    data: {
      name: "Scholarforge ED.",
      slug: "scholarforge-ed",
      description: "Rigorous professional licensing, certification, and high-stakes exam preparation manuals developed by subject experts.",
      websitePath: "/imprints/scholarforge",
    },
  });

  const imprintMeridian = await prisma.imprint.create({
    data: {
      name: "Noveraile Meridian",
      slug: "noveraile-meridian",
      description: "Curated travel literature, field routes, and deep cultural guides for thoughtful travelers.",
      websitePath: "/imprints/meridian",
    },
  });

  // 4. Create Hierarchical Categories
  const catExamPrep = await prisma.category.create({
    data: {
      name: "Exam Preparation",
      slug: "exam-prep",
      description: "Structured certification guides, diagnostic test banks, and comprehensive review systems for professional credentials.",
      icon: "GraduationCap",
      sortOrder: 1,
      isActive: true,
      seoTitle: "Professional Certification & Licensing Exam Prep Books | Noveraile",
      seoDesc: "Pass your certification with comprehensive study guides, clinical case studies, and realistic practice questions from Noveraile Publishing.",
    },
  });

  const catHealthcare = await prisma.category.create({
    data: {
      name: "Healthcare & Pharmacy",
      slug: "healthcare-pharmacy",
      description: "Pharmacy technician, laboratory, and allied health credential study manuals.",
      parentId: catExamPrep.id,
      sortOrder: 1,
    },
  });

  const catNursing = await prisma.category.create({
    data: {
      name: "Nursing & Critical Care",
      slug: "nursing",
      description: "NCLEX-RN, NCLEX-PN, and clinical triage certification resources.",
      parentId: catExamPrep.id,
      sortOrder: 2,
    },
  });

  const catCybersecurity = await prisma.category.create({
    data: {
      name: "IT & Cybersecurity",
      slug: "it-cybersecurity",
      description: "CompTIA, cloud engineering, and cybersecurity professional manuals.",
      parentId: catExamPrep.id,
      sortOrder: 3,
    },
  });

  const catFiction = await prisma.category.create({
    data: {
      name: "Fiction & Literature",
      slug: "fiction",
      description: "Immersive storytelling, compelling literary works, and crafted narrative prose.",
      icon: "BookOpen",
      sortOrder: 2,
      isActive: true,
      seoTitle: "Contemporary Literature & Fiction | Noveraile Publishing",
      seoDesc: "Explore finely crafted digital novels and literary works published directly by Noveraile.",
    },
  });

  const catTravel = await prisma.category.create({
    data: {
      name: "Travel & Exploration",
      slug: "travel",
      description: "Logistical road itineraries, off-grid camping guides, and cultural field handbooks.",
      icon: "Compass",
      sortOrder: 3,
      isActive: true,
    },
  });

  const catBusiness = await prisma.category.create({
    data: {
      name: "Business & Leadership",
      slug: "business",
      description: "Practical operating models, executive governance, and technology management frameworks.",
      icon: "TrendingUp",
      sortOrder: 4,
      isActive: true,
    },
  });

  const catSelfHelp = await prisma.category.create({
    data: {
      name: "Self-Help & Personal Growth",
      slug: "self-help",
      description: "Actionable frameworks for personal agency, cognitive resilience, and disciplined habits.",
      icon: "Sparkles",
      sortOrder: 5,
      isActive: true,
    },
  });

  // 5. Create Authors
  const authorAris = await prisma.author.create({
    data: {
      name: "Dr. Aris Thorne, PharmD, BCPS",
      slug: "dr-aris-thorne",
      bio: "Board-Certified Pharmacotherapy Specialist with fifteen years of clinical instruction and acute hospital pharmacy practice. Author of top-tier pharmacy review programs.",
      profileImage: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80",
    },
  });

  const authorMargaret = await prisma.author.create({
    data: {
      name: "Margaret Callahan, MSN, RN, CCRN",
      slug: "margaret-callahan",
      bio: "Critical care nurse educator and clinical consultant specializing in Next Generation NCLEX test development and critical clinical judgment.",
      profileImage: "https://images.unsplash.com/photo-1594824813501-48ac3a493a38?auto=format&fit=crop&w=400&q=80",
    },
  });

  const authorMarcus = await prisma.author.create({
    data: {
      name: "Marcus Vance, CISSP, CISM",
      slug: "marcus-vance",
      bio: "Chief Information Security Officer and veteran technical trainer with twenty years of hands-on security architecture experience.",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    },
  });

  const authorJulian = await prisma.author.create({
    data: {
      name: "Julian H. Sterling",
      slug: "julian-h-sterling",
      bio: "Novelist and essayist whose historical fiction explores architecture, political intrigue, and personal ambition in early modern Europe.",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    },
  });

  const authorMoreau = await prisma.author.create({
    data: {
      name: "Claire & Devon Moreau",
      slug: "claire-and-devon-moreau",
      bio: "Outdoor travel journalists and route scouts who have traversed over 120,000 miles throughout Europe and the British Isles.",
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    },
  });

  const authorElena = await prisma.author.create({
    data: {
      name: "Elena S. Rossi, MBA",
      slug: "elena-s-rossi",
      bio: "Advisor to Fortune 500 leadership teams on high-trust organizational culture and pragmatic AI transformation.",
      profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    },
  });

  // 6. Create Books & Page Assets
  // Book 1: PTCB Pharmacy Technician Exam Prep 2027
  const bookPtcb = await prisma.book.create({
    data: {
      title: "PTCB Pharmacy Technician Exam Prep 2027",
      subtitle: "Comprehensive Clinical Pharmacology, Math Formulas, Federal Law & 800 Verified Practice Questions",
      slug: "ptcb-pharmacy-technician-exam-prep-2027",
      isbn: "978-1-96428-101-4",
      edition: "2027 Fourth Edition",
      language: "English",
      pageCount: 10,
      coverImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
      description: `Prepare with confidence for the Pharmacy Technician Certification Exam (PTCE). Developed strictly according to the latest four-domain blueprint, this digital study manual provides systematic coverage of Pharmacology for Technicians, Pharmacy Law and Regulations, Sterile and Non-Sterile Compounding, and Medication Safety.\n\nFeaturing step-by-step alligation and dosage calculation methods, generic-to-brand cross references for the top 200 medications, and clinical rationale for every diagnostic practice question.`,
      shortDescription: "The definitive 2027 digital preparation manual for the PTCE with complete pharmacology tables and 800 exam-style practice questions.",
      keyBenefits: JSON.stringify([
        "Complete 2027 four-domain blueprint alignment covering all test objectives",
        "Top 200 drugs reference table with indications, interactions, and black box warnings",
        "Step-by-step pharmaceutical math drills: Alligations, IV drip rates, and unit conversions",
        "Sterile compounding standards updated for USP <797> and USP <800> hazardous handling",
        "Instant digital library access with automated reading progress and bookmarking"
      ]),
      whoIsThisFor: JSON.stringify([
        "Candidates preparing for the Pharmacy Technician Certification Board (PTCB) exam",
        "Pharmacy technicians seeking recertification or institutional hospital accreditation",
        "Pharmacy technology students seeking an authoritative digital reference desk manual"
      ]),
      tableOfContents: JSON.stringify([
        { chapter: 1, title: "Domain 1: Pharmacology for Technicians", startPage: 1 },
        { chapter: 2, title: "Top 200 Medications & Therapeutic Classes", startPage: 3 },
        { chapter: 3, title: "Domain 2: Pharmacy Law, Regulations & DEA Schedules", startPage: 5 },
        { chapter: 4, title: "Domain 3: Sterile Compounding & USP Standards", startPage: 7 },
        { chapter: 5, title: "Domain 4: Medication Safety & Quality Assurance", startPage: 9 }
      ]),
      specifications: JSON.stringify({
        "Format": "Protected Online Digital Publication",
        "Edition": "2027 Edition",
        "Pages": "480 equivalent pages (10 demo units)",
        "Language": "English",
        "Publisher": "Scholarforge ED. / Noveraile Publishing",
        "ISBN-13": "978-1-96428-101-4"
      }),
      faq: JSON.stringify([
        { q: "How do I access this book after purchase?", a: "Once purchased, this title is immediately available inside your personal Noveraile Library. You can read it directly in your web browser across any phone, tablet, or computer." },
        { q: "Is this book endorsed by the PTCB?", a: "Noveraile Publishing is an independent educational publisher. This study guide is not affiliated with, endorsed by, or sponsored by the Pharmacy Technician Certification Board (PTCB)." },
        { q: "Are sample practice questions included?", a: "Yes, over 800 practice questions with full diagnostic answer explanations are included throughout the study guide." }
      ]),
      price: 34.99,
      salePrice: 27.99,
      currency: "USD",
      status: "PUBLISHED",
      isFeatured: true,
      isBestseller: true,
      isComingSoon: false,
      previewPageNumbers: JSON.stringify([1, 2, 3]),
      seoTitle: "PTCB Pharmacy Technician Exam Prep 2027 - Study Guide & Practice Questions",
      seoDesc: "Pass the PTCE on your first attempt. Digital study guide with top 200 medications, pharmaceutical calculations, and USP compounding guidelines.",
      seoKeywords: "PTCB exam prep 2027, PTCE study guide, pharmacy technician test, top 200 drugs, pharmaceutical math",
      categoryId: catHealthcare.id,
      authorId: authorAris.id,
      imprintId: imprintScholar.id,
    },
  });

  // Attach Exam Metadata to Book 1
  await prisma.examMetadata.create({
    data: {
      bookId: bookPtcb.id,
      examName: "Pharmacy Technician Certification Exam",
      examAcronym: "PTCB / PTCE",
      examAuthority: "Pharmacy Technician Certification Board",
      profession: "Pharmacy / Healthcare",
      yearVersion: "2027",
      disclaimer: "Noveraile Publishing is an independent publisher and is not affiliated with or endorsed by the Pharmacy Technician Certification Board (PTCB).",
    },
  });

  // Pages for PTCB Book
  const ptcbPages = [
    {
      pageNumber: 1,
      title: "Domain 1: Foundations of Clinical Pharmacology",
      chapterTitle: "Chapter 1: Mechanism of Action & Drug Classes",
      contentHtml: `
        <div class="prose max-w-none">
          <p class="lead text-lg font-serif text-brand-slate">Pharmacology forms the single largest domain of the Pharmacy Technician Certification Exam, accounting for approximately 40% of the scored evaluation. Technicians must demonstrate mastery of drug classifications, mechanisms of action, standard adult dosages, adverse reactions, and contraindications.</p>
          
          <h2 class="text-2xl font-serif text-brand-ink mt-8 mb-4">1.1 Cardiovascular Agents: ACE Inhibitors vs. ARBs</h2>
          <p>Angiotensin-Converting Enzyme (ACE) Inhibitors block the conversion of angiotensin I to angiotensin II, a potent vasoconstrictor. This reduction in angiotensin II decreases systemic vascular resistance and aldosterone secretion, lowering blood pressure without significantly increasing heart rate.</p>
          
          <div class="my-6 p-4 rounded-lg bg-amber-50/70 border border-amber-200">
            <h4 class="font-semibold text-amber-900 flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-amber-600"></span>
              Key Exam Alert: ACE Inhibitor Cough & Angioedema
            </h4>
            <p class="text-sm text-amber-800 mt-1">Because ACE inhibitors also inhibit the degradation of bradykinin, up to 15% of patients experience a persistent dry, non-productive cough. When this occurs, physicians commonly switch the patient to an Angiotensin II Receptor Blocker (ARB) such as losartan or valsartan.</p>
          </div>

          <table class="w-full text-sm text-left my-6 border-collapse border border-gray-200">
            <thead class="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th class="p-3 border border-gray-200">Generic Name</th>
                <th class="p-3 border border-gray-200">Brand Name</th>
                <th class="p-3 border border-gray-200">Drug Class</th>
                <th class="p-3 border border-gray-200">Primary Indication</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-gray-200">
                <td class="p-3 font-mono font-medium">Lisinopril</td>
                <td class="p-3 italic">Prinivil, Zestril</td>
                <td class="p-3">ACE Inhibitor</td>
                <td class="p-3">Hypertension, Heart Failure</td>
              </tr>
              <tr class="border-t border-gray-200 bg-gray-50/40">
                <td class="p-3 font-mono font-medium">Losartan</td>
                <td class="p-3 italic">Cozaar</td>
                <td class="p-3">ARB</td>
                <td class="p-3">Hypertension, Diabetic Nephropathy</td>
              </tr>
              <tr class="border-t border-gray-200">
                <td class="p-3 font-mono font-medium">Amlodipine</td>
                <td class="p-3 italic">Norvasc</td>
                <td class="p-3">Dihydropyridine CCB</td>
                <td class="p-3">Hypertension, Angina</td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      wordCount: 380,
    },
    {
      pageNumber: 2,
      title: "1.2 Central Nervous System & Antidepressants",
      chapterTitle: "Chapter 1: Mechanism of Action & Drug Classes",
      contentHtml: `
        <div class="prose max-w-none">
          <h2 class="text-2xl font-serif text-brand-ink mb-4">Selective Serotonin Reuptake Inhibitors (SSRIs)</h2>
          <p>SSRIs represent the first-line pharmacotherapeutic category for major depressive disorder, generalized anxiety disorder, and obsessive-compulsive disorder. They selectively prevent the presynaptic reuptake of 5-HT (serotonin), thereby augmenting neurotransmission in the synaptic cleft.</p>

          <h3 class="text-xl font-serif text-brand-slate mt-6 mb-3">Critical Clinical Points for Technicians:</h3>
          <ul class="list-disc pl-5 space-y-2 text-brand-slate">
            <li><strong>Black Box Warning:</strong> Increased risk of suicidal ideation in children, adolescents, and young adults (ages 18–24) during initial therapy.</li>
            <li><strong>Discontinuation Syndrome:</strong> Abrupt cessation causes dizziness, electric shock sensations ('brain zaps'), anxiety, and nausea. Tapering is mandatory.</li>
            <li><strong>Serotonin Syndrome:</strong> Concomitant use with MAOIs, linezolid, triptans, or St. John's Wort can precipitate autonomic instability, hyperthermia, and rigidity.</li>
          </ul>

          <div class="my-6 p-4 rounded-lg bg-blue-50/80 border border-blue-200">
            <h4 class="font-semibold text-blue-900">Diagnostic Practice Question 1.1</h4>
            <p class="text-sm text-blue-800 mt-2">A patient arrives with a prescription for Fluoxetine 20 mg daily. The pharmacy profile reveals the patient is currently completing a course of Phenelzine (Nardil). What critical action must the technician take?</p>
            <p class="text-xs text-blue-700 mt-2 italic font-serif"><strong>Rationale:</strong> Phenelzine is a non-selective Monoamine Oxidase Inhibitor (MAOI). Co-administration with an SSRI requires a mandatory 14-day washout period to prevent lethal Serotonin Syndrome. Flag this prescription immediately for pharmacist review.</p>
          </div>
        </div>
      `,
      wordCount: 320,
    },
    {
      pageNumber: 3,
      title: "2.1 Pharmaceutical Mathematics: Alligation Alternate Method",
      chapterTitle: "Chapter 2: Compounding Math & Dosage Calculations",
      contentHtml: `
        <div class="prose max-w-none">
          <p class="lead text-lg font-serif text-brand-slate">The alligation alternate method is a calculation matrix used when mixing two different strengths of the same active drug to achieve a specified intermediate concentration.</p>

          <h3 class="text-xl font-serif text-brand-ink mt-6 mb-3">The Alligation Tic-Tac-Toe Grid</h3>
          <p>Place the highest available percentage concentration in the top left, the lowest available percentage in the bottom left, and the desired concentration in the center. Subtract diagonally to find the proportion of parts required.</p>

          <div class="my-6 p-5 bg-stone-50 border border-stone-200 rounded-lg font-mono text-sm">
            <div class="grid grid-cols-3 gap-4 text-center max-w-md mx-auto">
              <div class="p-2 border bg-white font-bold">Higher % (70%)</div>
              <div></div>
              <div class="p-2 border bg-white font-bold">Parts Higher (30)</div>
              
              <div></div>
              <div class="p-2 border bg-brand-100 font-bold text-brand-800">Target % (40%)</div>
              <div></div>

              <div class="p-2 border bg-white font-bold">Lower % (10%)</div>
              <div></div>
              <div class="p-2 border bg-white font-bold">Parts Lower (30)</div>
            </div>
          </div>

          <p class="text-brand-slate mt-4">Total parts = 30 + 30 = 60 parts. Therefore, equal volumes of the 70% solution and 10% solution are required to prepare any volume of 40% solution.</p>
        </div>
      `,
      wordCount: 280,
    },
    {
      pageNumber: 4,
      title: "2.2 Milliequivalents, Osmolarity & Drip Rate Calculations",
      chapterTitle: "Chapter 2: Compounding Math & Dosage Calculations",
      contentHtml: `
        <div class="prose max-w-none">
          <h2 class="text-2xl font-serif text-brand-ink mb-4">Intravenous Infusion Drip Rate Formula</h2>
          <p>IV drip rates measure flow in drops per minute (<span class="font-mono">gtts/min</span>). The standard formula required on the national examination is:</p>

          <div class="my-5 p-4 bg-gray-50 border border-gray-300 rounded text-center font-mono text-base font-semibold text-brand-navy">
            Flow Rate (gtts/min) = [ Total Volume (mL) / Infusion Time (minutes) ] × Drop Factor (gtts/mL)
          </div>

          <h3 class="text-xl font-serif text-brand-slate mt-6 mb-3">Worked Clinical Problem:</h3>
          <p class="text-brand-slate">An order reads: <em>Infuse 1,000 mL Normal Saline over 8 hours using a macro-drip administration set calibrated at 15 gtts/mL.</em></p>
          
          <ol class="list-decimal pl-5 space-y-2 mt-3 text-brand-slate">
            <li>Convert infusion time to minutes: 8 hours × 60 minutes = 480 minutes.</li>
            <li>Apply formula: (1,000 mL / 480 min) × 15 gtts/mL.</li>
            <li>Simplify: 2.083 mL/min × 15 = <strong>31.25 gtts/min</strong> (Round to 31 drops/min).</li>
          </ol>
        </div>
      `,
      wordCount: 240,
    },
    {
      pageNumber: 5,
      title: "3.1 Federal Controlled Substances Act & DEA Schedules",
      chapterTitle: "Chapter 3: Federal Pharmacy Regulations",
      contentHtml: `
        <div class="prose max-w-none">
          <h2 class="text-2xl font-serif text-brand-ink mb-4">Classification of Controlled Substances (Schedules I - V)</h2>
          <p>The Controlled Substances Act (CSA) of 1970 categorizes controlled medications based on medical utility, abuse potential, and physical or psychological dependence liability.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div class="p-4 border rounded bg-white shadow-sm">
              <h4 class="font-semibold text-brand-ink">Schedule II (C-II)</h4>
              <p class="text-xs text-brand-muted mt-1">High potential for abuse, severe dependence liability. Valid medical utility.</p>
              <p class="text-sm font-medium mt-2">Examples: Oxycodone, Morphine, Fentanyl, Methylphenidate, Adderall.</p>
              <p class="text-xs text-red-600 mt-2 font-semibold">Strict Rule: No refills permitted. Written or DEA EPCS required.</p>
            </div>
            <div class="p-4 border rounded bg-white shadow-sm">
              <h4 class="font-semibold text-brand-ink">Schedule III & IV (C-III / C-IV)</h4>
              <p class="text-xs text-brand-muted mt-1">Moderate to low potential for abuse relative to Schedule II.</p>
              <p class="text-sm font-medium mt-2">Examples: Acetaminophen with Codeine (C-III), Alprazolam, Zolpidem (C-IV).</p>
              <p class="text-xs text-blue-600 mt-2 font-semibold">Rule: Maximum 5 refills within 6 months from issue date.</p>
            </div>
          </div>
        </div>
      `,
      wordCount: 290,
    }
  ];

  for (const page of ptcbPages) {
    await prisma.bookPageAsset.create({
      data: {
        bookId: bookPtcb.id,
        pageNumber: page.pageNumber,
        title: page.title,
        chapterTitle: page.chapterTitle,
        contentHtml: page.contentHtml,
        wordCount: page.wordCount,
      },
    });
  }

  // Book 2: NCLEX-RN Ultimate Mastery
  const bookNclex = await prisma.book.create({
    data: {
      title: "NCLEX-RN Ultimate Mastery Guide",
      subtitle: "Next Generation Clinical Judgment, Pharmacology & Critical Care Case Studies",
      slug: "nclex-rn-ultimate-mastery-guide",
      isbn: "978-1-96428-102-1",
      edition: "2027 Clinical Edition",
      language: "English",
      pageCount: 8,
      coverImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
      description: `Structured exclusively around the NCSBN Clinical Judgment Measurement Model (NCJMM), this comprehensive digital preparation book arms registered nursing candidates with the exact diagnostic reasoning skills demanded by the Next Generation NCLEX (NGN).\n\nIncludes case studies with unfolding medical records, clinical lab panels, triage prioritization frameworks, and comprehensive rationales for right and wrong options.`,
      shortDescription: "Complete Next Generation NCLEX review focusing on clinical judgment, critical care case unfolding, and prioritization frameworks.",
      keyBenefits: JSON.stringify([
        "Full alignment with NCSBN Next Generation NCLEX (NGN) exam architecture",
        "Clinical triage matrices: Prioritizing ABCs, Maslow, and acute vs. chronic presentations",
        "Over 60 high-stakes pharmacology and hemodynamic case studies",
        "Diagnostic lab value cheat sheets: ABGs, electrolytes, cardiac biomarkers"
      ]),
      price: 39.99,
      salePrice: 29.99,
      currency: "USD",
      status: "PUBLISHED",
      isFeatured: true,
      isBestseller: true,
      previewPageNumbers: JSON.stringify([1, 2]),
      seoTitle: "NCLEX-RN Next Generation Clinical Judgment Guide | Noveraile",
      seoDesc: "Pass the NGN NCLEX-RN on your first attempt with clinical judgment case studies, critical care algorithms, and nursing prioritization frameworks.",
      categoryId: catNursing.id,
      authorId: authorMargaret.id,
      imprintId: imprintScholar.id,
    },
  });

  await prisma.examMetadata.create({
    data: {
      bookId: bookNclex.id,
      examName: "National Council Licensure Examination for Registered Nurses",
      examAcronym: "NCLEX-RN",
      examAuthority: "National Council of State Boards of Nursing (NCSBN)",
      profession: "Registered Nursing / Acute Care",
      yearVersion: "2027",
      disclaimer: "Noveraile Publishing is an independent publisher. NCLEX-RN is a registered trademark of the National Council of State Boards of Nursing, Inc., which does not endorse this publication.",
    },
  });

  // Pages for NCLEX Book
  await prisma.bookPageAsset.create({
    data: {
      bookId: bookNclex.id,
      pageNumber: 1,
      title: "NGN Clinical Judgment: Recognize Cues & Analyze Hypotheses",
      chapterTitle: "Chapter 1: The Six-Layer Clinical Judgment Model",
      contentHtml: `
        <div class="prose max-w-none">
          <p class="lead text-lg font-serif text-brand-slate">The Next Generation NCLEX tests not merely recall of facts, but the candidate's ability to recognize subtle pathophysiological cues, interpret trends in client data, and prioritize life-preserving nursing interventions.</p>
          <h2 class="text-2xl font-serif text-brand-ink mt-6 mb-3">Case Scenario 1.1: Unfolding Sepsis in Medical-Surgical</h2>
          <p class="text-brand-slate">A 68-year-old client postoperative day 2 following a laparoscopic cholecystectomy presents with new-onset confusion, temperature 38.9°C (102.0°F), HR 118 bpm, BP 88/54 mmHg, RR 26 breaths/min. Oxygen saturation is 91% on room air.</p>
          <div class="p-4 bg-red-50 border border-red-200 rounded my-4">
            <h4 class="font-bold text-red-900">Urgent Prioritization: Surviving Sepsis Bundle</h4>
            <p class="text-sm text-red-800 mt-1">Within the first 1 hour: Measure serum lactate, obtain blood cultures PRIOR to antibiotics, initiate 30 mL/kg crystalloid fluid bolus for hypotension or lactate ≥ 4 mmol/L.</p>
          </div>
        </div>
      `,
      wordCount: 260,
    },
  });

  await prisma.bookPageAsset.create({
    data: {
      bookId: bookNclex.id,
      pageNumber: 2,
      title: "Arterial Blood Gas (ABG) Interpretation Matrix",
      chapterTitle: "Chapter 2: Critical Care Hemodynamics & Labs",
      contentHtml: `
        <div class="prose max-w-none">
          <h2 class="text-2xl font-serif text-brand-ink mb-4">Stepwise ABG Analysis (ROME Method)</h2>
          <p class="text-brand-slate">Evaluate pH, PaCO2, and HCO3 in order. Remember: Respiratory Opposite, Metabolic Equal.</p>
          <ul class="list-disc pl-5 space-y-2 mt-4 text-brand-slate">
            <li><strong>Normal pH:</strong> 7.35 – 7.45 (< 7.35 = Acidosis, > 7.45 = Alkalosis)</li>
            <li><strong>Normal PaCO2:</strong> 35 – 45 mmHg (Respiratory parameter)</li>
            <li><strong>Normal HCO3:</strong> 22 – 26 mEq/L (Metabolic renal parameter)</li>
          </ul>
        </div>
      `,
      wordCount: 180,
    },
  });

  // Book 3: CompTIA Security+ SY0-701 Practice Manual
  const bookSec = await prisma.book.create({
    data: {
      title: "CompTIA Security+ SY0-701 Exam Practice",
      subtitle: "Complete Threats, Cryptography, Zero Trust Architecture & 650 Scenario-Based Questions",
      slug: "comptia-security-plus-sy0701-practice",
      isbn: "978-1-96428-103-8",
      edition: "SY0-701 Edition",
      language: "English",
      pageCount: 6,
      coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
      description: "Master modern cybersecurity defense. Fully updated for the SY0-701 exam blueprint with deep dives into cloud telemetry, identity governance, zero-trust network access (ZTNA), and threat hunting.",
      shortDescription: "Authoritative technical manual for CompTIA Security+ SY0-701 with scenario questions and architecture diagrams.",
      price: 32.99,
      salePrice: 24.99,
      currency: "USD",
      status: "PUBLISHED",
      isFeatured: false,
      isBestseller: true,
      previewPageNumbers: JSON.stringify([1]),
      seoTitle: "CompTIA Security+ SY0-701 Exam Practice Guide | Noveraile",
      seoDesc: "Prepare for CompTIA Security+ SY0-701 with realistic scenario questions, cryptography drills, and zero trust architecture guidelines.",
      categoryId: catCybersecurity.id,
      authorId: authorMarcus.id,
      imprintId: imprintScholar.id,
    },
  });

  await prisma.examMetadata.create({
    data: {
      bookId: bookSec.id,
      examName: "CompTIA Security+ Certification",
      examAcronym: "Security+ SY0-701",
      examAuthority: "CompTIA",
      profession: "Information Security & Infrastructure",
      yearVersion: "2027 / SY0-701",
      disclaimer: "CompTIA is a registered trademark of CompTIA. Noveraile Publishing is an independent publisher not affiliated with CompTIA.",
    },
  });

  await prisma.bookPageAsset.create({
    data: {
      bookId: bookSec.id,
      pageNumber: 1,
      title: "Threat Vectors & Enterprise Zero Trust Architecture",
      chapterTitle: "Domain 1: General Security Concepts",
      contentHtml: `
        <div class="prose max-w-none">
          <p class="lead text-lg font-serif text-brand-slate">Zero Trust Architecture (ZTA) operates on the core axiom: <em>Never trust, always verify</em>. Traditional perimeter security assumes everything inside the firewall is benign; modern enterprise resilience assumes breach from the outset.</p>
          <h3 class="text-xl font-serif text-brand-ink mt-6 mb-3">Key Tenets of NIST SP 800-207:</h3>
          <p class="text-brand-slate">Every access request is evaluated dynamically using continuous identity verification, device health posture, geolocation signals, and risk analytics before granting the least privilege necessary.</p>
        </div>
      `,
      wordCount: 210,
    },
  });

  // Book 4: The Architect of Venice (Fiction)
  const bookVenice = await prisma.book.create({
    data: {
      title: "The Architect of Venice",
      subtitle: "A Novel of Ambition, Stone and Shadows",
      slug: "the-architect-of-venice",
      isbn: "978-1-96428-104-5",
      edition: "First Edition",
      language: "English",
      pageCount: 5,
      coverImage: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=600&q=80",
      description: "Set against the backdrop of 16th-century Venice, an ambitious master builder confronts the doge's council, treacherous tides, and a clandestine guild determined to shape the city's future.",
      shortDescription: "An evocative literary novel tracing the rise and perilous secrets of a master builder in Renaissance Venice.",
      price: 18.99,
      salePrice: 14.99,
      currency: "USD",
      status: "PUBLISHED",
      isFeatured: true,
      isBestseller: false,
      previewPageNumbers: JSON.stringify([1]),
      seoTitle: "The Architect of Venice - A Novel by Julian H. Sterling",
      seoDesc: "Read The Architect of Venice, an evocative historical novel of ambition and stone by Julian H. Sterling.",
      categoryId: catFiction.id,
      authorId: authorJulian.id,
      imprintId: imprintMain.id,
    },
  });

  await prisma.bookPageAsset.create({
    data: {
      bookId: bookVenice.id,
      pageNumber: 1,
      title: "Part One: The Weight of Foundations",
      chapterTitle: "Chapter 1: Dawn at the Cannaregio",
      contentHtml: `
        <div class="prose max-w-none">
          <p class="lead text-lg font-serif text-brand-slate italic">"A city built on water is not conquered by stone; it is merely tolerated by the sea until the mortar tires."</p>
          <p class="text-brand-ink font-serif text-lg leading-relaxed mt-6">The fog lay across the lagoon like unspun wool, smelling of salt mud, damp larch wood, and the bitter almond residue of the glass kilns at Murano. Matteo adjusted the brass compass tucked inside his woolen cloak and stepped carefully onto the wet oak pontoon.</p>
          <p class="text-brand-ink font-serif text-lg leading-relaxed mt-4">Beneath him, eighty thousand pilings of Slovenian timber were driven into the subterranean clay, holding up the marble frontage of the palazzo like stubborn teeth in an ancient skull.</p>
        </div>
      `,
      wordCount: 220,
    },
  });

  // Book 5: Highlands & Islands Campervan Route Guide (Travel)
  const bookTravel = await prisma.book.create({
    data: {
      title: "Highlands & Islands Campervan Route Guide",
      subtitle: "Complete Off-Grid Logistics, Remote Pitches & North Coast 500 Itineraries",
      slug: "highlands-campervan-route-guide",
      isbn: "978-1-96428-105-2",
      edition: "2026 Edition",
      language: "English",
      pageCount: 5,
      coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
      description: "The definitive route and logistical manual for exploring Scotland by motorhome or campervan. Features detailed gradient profiles, single-track passing etiquette, off-grid water points, and quiet coastal spots.",
      shortDescription: "Expert logistical guide for campervan touring through the Scottish Highlands, Skye, and the Outer Hebrides.",
      price: 24.99,
      salePrice: 19.99,
      currency: "USD",
      status: "PUBLISHED",
      isFeatured: false,
      isBestseller: true,
      previewPageNumbers: JSON.stringify([1]),
      seoTitle: "Highlands Campervan Route Guide | Noveraile Travel",
      seoDesc: "Plan your off-grid campervan journey across Scotland with detailed route logistics, legal wild parking rules, and vehicle dimensions.",
      categoryId: catTravel.id,
      authorId: authorMoreau.id,
      imprintId: imprintMeridian.id,
    },
  });

  await prisma.bookPageAsset.create({
    data: {
      bookId: bookTravel.id,
      pageNumber: 1,
      title: "Planning Your Expedition: Vehicles, Seasons & Midges",
      chapterTitle: "Chapter 1: The Essential Highlands Primer",
      contentHtml: `
        <div class="prose max-w-none">
          <p class="lead text-lg font-serif text-brand-slate">Touring the Scottish Highlands requires both romantic patience and uncompromising logistical respect for narrow single-track tarmac and Atlantic squalls.</p>
          <h3 class="text-xl font-serif text-brand-ink mt-6 mb-3">Vehicle Dimensions and Clearance</h3>
          <p class="text-brand-slate">While sub-6-meter panel van conversions negotiate the Bealach na Bà with relative ease, coachbuilt motorhomes exceeding 7.2 meters will face severe underbody scrape risks and turn-out restrictions on steep coastal ascents.</p>
        </div>
      `,
      wordCount: 190,
    },
  });

  // Book 6: Principled Leadership in the Digital Age (Business)
  const bookBusiness = await prisma.book.create({
    data: {
      title: "Principled Leadership in the Digital Age",
      subtitle: "Governance, AI Strategy & Building High-Trust Organizations",
      slug: "principled-leadership-digital-age",
      isbn: "978-1-96428-106-9",
      edition: "First Edition",
      language: "English",
      pageCount: 5,
      coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
      description: "A pragmatic playbook for CEOs and technology leaders confronting the dual challenges of rapid generative AI adoption and maintaining long-term institutional trust.",
      shortDescription: "Executive governance and organizational strategy for leaders navigating artificial intelligence and high-trust team cultures.",
      price: 28.99,
      currency: "USD",
      status: "PUBLISHED",
      isFeatured: false,
      isBestseller: false,
      previewPageNumbers: JSON.stringify([1]),
      seoTitle: "Principled Leadership in the Digital Age - Elena S. Rossi",
      seoDesc: "Executive handbook on AI governance, technology ethics, and building high-trust enterprise organizations.",
      categoryId: catBusiness.id,
      authorId: authorElena.id,
      imprintId: imprintMain.id,
    },
  });

  await prisma.bookPageAsset.create({
    data: {
      bookId: bookBusiness.id,
      pageNumber: 1,
      title: "The Trust Equation in Autonomous Systems",
      chapterTitle: "Chapter 1: Institutional Velocity vs. Institutional Guardrails",
      contentHtml: `
        <div class="prose max-w-none">
          <p class="lead text-lg font-serif text-brand-slate">Speed without directional clarity is simply accelerated organizational drift. As generative decision systems enter core operational loops, leadership must establish auditable guardrails.</p>
          <h3 class="text-xl font-serif text-brand-ink mt-6 mb-3">The Accountability Paradox</h3>
          <p class="text-brand-slate">You cannot delegate fiduciary or ethical responsibility to an algorithm. Every executive decision aided by synthetic intelligence remains fundamentally human in its legal liability.</p>
        </div>
      `,
      wordCount: 175,
    },
  });

  // 7. Seed Initial Entitlements for the Customer reader@example.com
  // Grant customer access to PTCB book so "Continue Reading" works immediately!
  const demoOrder = await prisma.order.create({
    data: {
      orderNumber: "NOV-2026-10492",
      userId: customerUser.id,
      customerEmail: customerUser.email,
      totalAmount: 27.99,
      subtotal: 27.99,
      discountAmount: 0.0,
      currency: "USD",
      paymentStatus: "PAID",
      stripeSessionId: "cs_test_seed_demo_session",
      stripePaymentIntentId: "pi_test_seed_demo_intent",
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: demoOrder.id,
      bookId: bookPtcb.id,
      price: 27.99,
      bookTitle: bookPtcb.title,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: demoOrder.id,
      provider: "STRIPE",
      transactionId: "txn_demo_ptcb_purchase",
      status: "SUCCEEDED",
      amount: 27.99,
      currency: "USD",
      receiptUrl: "https://pay.stripe.com/receipts/demo_ptcb",
    },
  });

  await prisma.entitlement.create({
    data: {
      userId: customerUser.id,
      bookId: bookPtcb.id,
      orderId: demoOrder.id,
      status: "ACTIVE",
    },
  });

  // Initial Reading Progress: Customer is at Page 3 of 5 (60% complete)
  await prisma.readingProgress.create({
    data: {
      userId: customerUser.id,
      bookId: bookPtcb.id,
      currentPage: 3,
      totalPages: 5,
      progressPercent: 60.0,
      lastReadAt: new Date(),
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: customerUser.id,
      bookId: bookPtcb.id,
      pageNumber: 3,
      label: "Alligation alternate formula review",
    },
  });

  // 8. Seed Coupons
  await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10.0,
      minOrderAmount: 0.0,
      maxUses: 500,
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: "PASS2026",
      discountType: "PERCENTAGE",
      discountValue: 15.0,
      minOrderAmount: 25.0,
      maxUses: 1000,
      isActive: true,
    },
  });

  // 9. Verified Customer Reviews
  await prisma.review.create({
    data: {
      bookId: bookPtcb.id,
      userId: customerUser.id,
      rating: 5,
      title: "Extremely thorough pharmacology tables and alligation drills",
      comment: "The USP compounding chapter and the step-by-step math breakdowns made the difference on exam day. Passed on my first attempt!",
      isVerifiedPurchase: true,
      isApproved: true,
    },
  });

  console.log("Database seeded successfully with demo books, categories, imprints, and reading entitlements!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
