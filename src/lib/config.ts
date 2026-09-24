// Configuration for Noveraile Publishing Platform
// All branding and company metadata are centralized here for complete flexibility.

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Noveraile Publishing",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || "noverailepublishing.com",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || "Books built for where you're going next.",
  subTagline: "Discover professionally developed digital books across exam preparation, fiction, travel, self-development, business and more. Purchase once and read securely from your personal Noveraile library.",
  examPrepTagline: "Prepare. Practice. Pass.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@noverailepublishing.com",
  defaultCurrency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "USD",
  currencySymbol: "$",
  imprints: [
    { name: "Noveraile Publishing", slug: "noveraile-publishing", focus: "General & Literary" },
    { name: "Scholarforge ED.", slug: "scholarforge-ed", focus: "Professional Exam Prep & Education" },
    { name: "Noveraile Meridian", slug: "noveraile-meridian", focus: "Travel & Cultural Reference" },
  ],
  reader: {
    maxActiveSessionsPerUser: 5,
    tokenExpiryMinutes: 15,
    watermarkPrefix: "Licensed to",
  },
  disclaimer: {
    examPrep: "Noveraile Publishing is an independent publisher. Test names, acronyms, and certification titles are trademarks of their respective credentialing bodies, which do not sponsor or endorse our independent study publications.",
    copyright: "All digital books and materials are proprietary and protected under international copyright laws. Unauthorized reproduction, distribution, or scraping is strictly prohibited."
  }
};
