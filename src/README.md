# Saroj Couture — Website

Bespoke women's designer wear and custom stitching. Teka Naka, Kamptee Road, Nagpur.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase**.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| Supabase project | Free tier |

---

## Setup

### 1. Clone & install

```bash
git clone <repo-url> couture
cd couture/src
npm install
```

### 2. Create your environment file

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the three Supabase values from your [Supabase Dashboard → Settings → API](https://supabase.com/dashboard):

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → Project API keys → `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Project API keys → `service_role` ⚠️ Keep secret |

> **Important:** Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

### 3. Run database migrations

Once the Supabase schema migration file exists at `../supabase/migrations/00001_initial_schema.sql`:

```bash
# Using Supabase CLI (install: npm i -g supabase)
supabase db push

# Or run the SQL directly in the Supabase SQL Editor
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the placeholder homepage.

---

## Project structure

```
couture/
├── GUI/                         # Stitch design exports (reference only)
├── boutique-website-prd.md      # Product Requirements Document
├── PLAN.md                      # Full implementation plan
├── supabase/                    # DB migrations and seed data
└── src/                         # ← Next.js app lives here
    ├── app/                     # Routes (App Router)
    │   ├── page.tsx             # Homepage /
    │   ├── category/[slug]/     # Category gallery
    │   ├── garment/[slug]/      # Garment detail
    │   ├── admin/               # Owner admin (auth-guarded)
    │   └── auth/                # Login + callback
    ├── components/              # UI, layout, garment, admin, SEO components
    ├── lib/
    │   ├── supabase/            # Supabase clients + types
    │   ├── actions/             # Next.js Server Actions
    │   ├── queries/             # Server-side data fetchers
    │   └── utils/               # slug, whatsapp, image-processing, constants
    ├── middleware.ts             # Session refresh + /admin auth guard
    └── types/                   # Shared TypeScript types
```

---

## Verify the scaffold boots

```bash
cd src
npm run dev
```

Then check these routes all respond (no 500s):

| URL | Expected |
|---|---|
| `http://localhost:3000/` | "Coming soon — Homepage" |
| `http://localhost:3000/category/saree` | "Coming soon — Category: saree" |
| `http://localhost:3000/garment/silk-organza-saree` | "Coming soon — Garment: silk-organza-saree" |
| `http://localhost:3000/auth/login` | Login placeholder |
| `http://localhost:3000/admin` | Redirects → `/auth/login` (no env vars set) |
| `http://localhost:3000/sitemap.xml` | Basic sitemap XML |
| `http://localhost:3000/robots.txt` | robots.txt disallowing /admin |

TypeScript build check (no runtime needed):

```bash
npm run build
```

Lint:

```bash
npm run lint
```

---

## Build phases

See [PLAN.md](../PLAN.md) for the full phased build order.

| Phase | Focus |
|---|---|
| 0 (done ✓) | Scaffold — this state |
| 1 | Database schema + auth login |
| 2 | UI primitives + layout components |
| 3 | Admin CRUD (categories + garments + image upload) |
| 4 | Public pages (homepage, category, garment detail) |
| 5 | SEO (sitemap, metadata, JSON-LD, Lighthouse) |
| 6 | Polish + Vercel deploy |

---

## Contact

WhatsApp: +91 76203 64981 · Instagram: [@saroj_couture](https://www.instagram.com/saroj_couture)
