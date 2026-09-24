# NOVERAILE PUBLISHING
> **Digital Publishing House & Direct-to-Reader Platform**  
> *Domain: noverailepublishing.com*  
> *Core Brand Headline: "Books built for where you're going next."*

---

## 1. System Overview

**Noveraile Publishing** is a production-grade digital publishing platform engineered for an independent multi-niche publisher selling directly to readers. Customers discover books through a high-performance editorial storefront, preview permitted sample pages, purchase access, and immediately read through an authenticated browser-based **Protected Cloud Reader** across desktop, tablet, and mobile.

### Core Value & Business Architecture
- **Direct-to-Reader Direct Sales**: No third-party marketplace dependencies or Amazon requirements.
- **Protected Cloud Reader (No Raw PDF URLs)**: Books are rendered in a secure browser application with dynamic user watermarking (`Licensed to customer@email.com • Order #...`), copy/print protections, server-side entitlement checks, and automated reading progress synchronization.
- **Initial Exam Preparation Growth Niche**: First-class support for licensure exams (`PTCB`, `NCLEX-RN`, `Security+`, etc.) with blueprint domain weights, clinical rationales, and official independent disclaimers.
- **Multi-Category Scalability**: Ready for unlimited future categories (Fiction, Travel, Self-Help, Business, Technology) and multi-imprint publishing (`Noveraile Publishing`, `Scholarforge ED.`, `Noveraile Meridian`).
- **Flexible Dual Payments**: Production Stripe Checkout + Webhook verification, with an automatic Sandbox Checkout mode for instant local testing without live API keys.

---

## 2. File & Directory Structure

```
├── prisma/
│   ├── schema.prisma        # Relational schema (Users, Books, Entitlements, Orders, etc.)
│   └── seed.ts              # Idempotent seed script with realistic demo catalog
├── scripts/
│   └── test-flows.js        # Automated API & security verification test script
├── src/
│   ├── app/
│   │   ├── (public pages)
│   │   │   ├── page.tsx               # Editorial Homepage
│   │   │   ├── books/page.tsx         # Full Catalog with search & category filters
│   │   │   ├── books/[slug]/page.tsx  # Book Landing Page with JSON-LD SEO structured data
│   │   │   ├── exam-prep/page.tsx     # Dedicated Exam Prep Authority Hub
│   │   │   ├── categories/page.tsx    # Category Directory
│   │   │   ├── categories/[slug]/     # Specific Category Hubs
│   │   │   ├── authors/page.tsx       # Author Directory & Individual Profiles
│   │   │   ├── about/page.tsx         # About Noveraile & Imprints
│   │   │   ├── help/page.tsx          # Help Center & Reader FAQ
│   │   │   ├── contact/page.tsx       # Customer Service Desk
│   │   │   ├── refunds/page.tsx       # Refund & Revocation Policy
│   │   │   ├── terms/page.tsx         # Terms of Service
│   │   │   ├── privacy/page.tsx       # Privacy Policy
│   │   │   ├── accessibility/page.tsx # Accessibility Statement
│   │   │   ├── robots.ts              # Dynamic robots.txt
│   │   │   └── sitemap.ts             # Dynamic XML sitemap
│   │   ├── (ecommerce & library)
│   │   │   ├── cart/page.tsx          # Shopping Cart & Coupon Discount Entry
│   │   │   ├── checkout/success/      # Order Confirmation ("Your book is ready")
│   │   │   ├── my-library/page.tsx    # Customer Cloud Bookshelf with Progress Bars
│   │   │   └── reader/[bookSlug]/     # Protected Online Reader (Canvas, Zoom, TOC)
│   │   ├── (auth)
│   │   │   ├── login/page.tsx         # Sign In with demo account buttons
│   │   │   └── register/page.tsx      # Reader Account Registration
│   │   ├── (admin console)
│   │   │   ├── admin/layout.tsx       # Role-Guarded Admin Console Layout
│   │   │   ├── admin/page.tsx         # Revenue & Order Analytics
│   │   │   ├── admin/books/           # Book Manager & Ingestion Modal
│   │   │   ├── admin/categories/      # Category Hierarchy Manager
│   │   │   └── admin/customers/       # Customer Entitlements (Grant / Revoke)
│   │   └── api/
│   │       ├── auth/                  # Register, Login, Logout, Me
│   │       ├── cart/                  # Coupon validation
│   │       ├── checkout/              # Session creation, sandbox complete, Stripe webhook
│   │       ├── reader/                # Protected page streaming & Reading progress
│   │       ├── reviews/               # Verified purchase customer reviews
│   │       ├── newsletter/            # Voluntary subscriber capture
│   │       └── admin/                 # Admin book, category, and entitlement APIs
│   ├── components/
│   │   ├── Header.tsx                 # Top ribbon, brand wordmark, mega-nav, cart badge
│   │   ├── Footer.tsx                 # Editorial footer, disclaimers, newsletter
│   │   ├── BookCard.tsx               # 3D book spine shadow card with quick add
│   │   ├── PreviewModal.tsx           # Free sample reader modal
│   │   └── DynamicWatermark.tsx       # Diagonal & header customer watermark overlay
│   ├── context/
│   │   ├── AuthContext.tsx            # Global user authentication session
│   │   └── CartContext.tsx            # Persistent cart state & coupon engine
│   └── lib/
│       ├── prisma.ts                  # Prisma Client singleton
│       ├── auth.ts                    # bcrypt password hashing, JWT sessions, cookies
│       ├── security.ts                # Server-side entitlement checks, rate limits, token signing
│       ├── stripe.ts                  # Stripe SDK & sandbox session creator
│       ├── storage.ts                 # Modular private file storage adapter
│       └── config.ts                  # Centralized branding and domain configuration
```

---

## 3. Quick Start & Local Development

### Prerequisites
- Node.js 18+ (tested on Node.js v22.16.0)
- npm 10+

### Setup Commands
```bash
# 1. Install dependencies
npm install

# 2. Push database schema (creates local dev.db SQLite database)
npx prisma db push

# 3. Seed demo books, categories, imprints, and reader accounts
npm run prisma:seed

# 4. Start local development server
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## 4. Default Demo Accounts

For immediate testing, two pre-configured accounts are provided in the database seed:

| Account | Email | Password | Role / Access |
|---|---|---|---|
| **Reader** | `reader@example.com` | `ReaderPass2026!` | Customer account with pre-licensed books (*PTCB Exam Prep 2027* at 60% progress) |
| **Admin** | `admin@noveraile.com` | `AdminPass2026!` | Editorial Director with full access to `/admin` |

---

## 5. End-to-End Acceptance Workflows

### A. Customer Journey: Browse, Sample, Buy & Read
1. Navigate to **`http://localhost:3000/`**.
2. Click on **PTCB Pharmacy Technician Exam Prep 2027**.
3. Click **"Read Free Sample"** to preview permitted pages without buying.
4. Click **"Add to Cart"** and proceed to **`/cart`**.
5. Apply discount code **`PASS2026`** (15% off) or **`WELCOME10`** (10% off).
6. Enter an email address and click **"Proceed to Secure Checkout"**.
7. The checkout completes and redirects to **`/checkout/success`** with **"Your digital book is ready."**
8. Click **"Start Reading Now"** to open the **Protected Cloud Reader**.
9. Use the **Next/Previous** controls, jump via the **Table of Contents**, switch to **Sepia** or **Dark** mode, and notice the personalized user watermark (`Licensed to customer@email.com`).
10. Return to **`/my-library`** to see your reading progress saved and updated.

### B. Security & DRM Verification
- Non-authenticated requests to `/api/reader/page?bookId=...&pageNumber=4` return `403 Forbidden` (`ACCESS_DENIED`).
- Only permitted preview pages (`[1, 2, 3]`) are publicly visible.
- No direct public PDF file directory exists.
- The reader canvas disables text selection, suppresses right-click context menus, and overrides print stylesheets with copyright warnings.

### C. Website Owner / Admin Workflow
1. Sign in with `admin@noveraile.com` / `AdminPass2026!`.
2. Visit **`/admin`** to view real-time revenue, completed orders, and active reader counts.
3. Visit **`/admin/books`** and click **"+ Add New Publication"** to ingest a new book, set prices, define preview pages, and attach exam certification metadata.
4. Visit **`/admin/customers`** to manually provision or revoke digital book access for any reader account.

---

## 6. Payment & Production Configuration

In `.env`, configure your live Stripe credentials when deploying to production:

```env
# Stripe Live Keys
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```
*Note: When `STRIPE_SECRET_KEY` is omitted or empty, the platform automatically utilizes its built-in Sandbox Checkout mode, enabling zero-config instant end-to-end testing.*

---

## 7. PostgreSQL Production Deployment

To switch from the local SQLite database to PostgreSQL (e.g. Supabase, Neon, AWS RDS):
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set your production connection string in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/noveraile?schema=public"
   ```
3. Run `npx prisma db push` and `npm run prisma:seed`.

---

## 8. Brand Customization

The domain and brand name are centralized in `src/lib/config.ts` and can be customized via `.env`:
- `NEXT_PUBLIC_SITE_NAME="Noveraile Publishing"`
- `NEXT_PUBLIC_SITE_DOMAIN="noverailepublishing.com"`
- `NEXT_PUBLIC_SITE_TAGLINE="Books built for where you're going next."`
- `NEXT_PUBLIC_CONTACT_EMAIL="support@noverailepublishing.com"`
