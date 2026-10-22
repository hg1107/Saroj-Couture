# Saroj Couture — Website

Bespoke women's designer wear and custom stitching. Teka Naka, Kamptee Road, Nagpur.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL**.
Fully self-hosted: our own PostgreSQL database for garment details, and photos
stored on our own disk (see [DEPLOY.md](../DEPLOY.md) for the server setup).

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 24 |
| npm | ≥ 10 |
| Docker (for the local database) | any recent |

---

## Setup

### 1. Clone & install

```bash
git clone <repo-url> couture
cd couture/src
npm install
```

### 2. Start the database

From the repo root, create `.env` from `.env.example` (only `POSTGRES_PASSWORD`
matters locally), then start PostgreSQL:

```bash
cd ..
cp .env.example .env        # set POSTGRES_PASSWORD
docker compose up -d db     # Postgres on 127.0.0.1:5432
cd src
```

### 3. Create your environment file

```bash
cp .env.local.example .env.local
```

Set `DATABASE_URL` to use the same password as `POSTGRES_PASSWORD`.

### 4. Create the tables and the owner login

```bash
npm run db:migrate            # applies db/migrations/*.sql
npm run owner:set-password    # creates the admin account (also resets a forgotten password)
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin is at `/admin`.

---

## How photos are stored

Every upload is kept **byte-for-byte** as a private original (never served,
because it keeps the camera's EXIF/GPS data). Three WebP copies are also
made for the website:

| Size | Long edge | Quality | Used for |
|---|---|---|---|
| `thumb` | 800px | 82 | grids, admin lists |
| `medium` | 1800px | 88 | phone/laptop detail view |
| `large` | up to 4096px (full resolution) | 92 | big/high-DPI screens, zoom |

`next/image` picks the smallest copy that is still sharp for each screen
(`lib/image-loader.ts`). Files live under `STORAGE_DIR` (default `./storage`):

```
storage/
├── private/originals/garments/<garmentId>/<imageId>/original.jpg + meta.json
└── public/garments/<garmentId>/<imageId>/{thumb,medium,large}.webp   → served at /media/...
```

To change the sizes or quality later, edit `VARIANTS` in
`lib/utils/image-processing.ts` and run `npm run images:regenerate`. It
rebuilds every web copy from the originals, so no quality is ever lost.

---

## Project structure

```
couture/
├── docker-compose.yml           # Postgres + app + Caddy (HTTPS)
├── Caddyfile                    # HTTPS reverse proxy config
├── DEPLOY.md                    # Server setup, backups
├── GUI/                         # Stitch design exports (reference only)
├── boutique-website-prd.md      # Product Requirements Document
├── PLAN.md                      # Original implementation plan (pre-dates the self-hosted DB)
└── src/                         # ← Next.js app lives here
    ├── app/                     # Routes (App Router)
    │   ├── media/[...path]/     # Serves photo files from disk
    │   ├── api/admin/           # Photo upload routes (garments, category covers)
    │   └── admin/               # Owner admin (auth-guarded)
    ├── db/migrations/           # SQL schema, applied by `npm run db:migrate`
    ├── scripts/                 # migrate, owner:set-password, images:regenerate
    ├── components/
    ├── lib/
    │   ├── db/                  # Postgres connection + row types
    │   ├── auth/                # Password hashing + sessions
    │   ├── storage/             # On-disk photo storage
    │   ├── actions/             # Server Actions (all check the owner session)
    │   ├── queries/             # Server-side data fetchers
    │   └── utils/               # slug, whatsapp, image-processing, constants
    └── proxy.ts                 # CSP + /admin redirect
```

---

## Checks

```bash
npm run build   # type-check + production build (no database needed)
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
| 6 | Polish + deploy (see DEPLOY.md) |

---

## Contact

WhatsApp: +91 76203 64981 · Instagram: [@saroj_couture](https://www.instagram.com/saroj_couture)
