# PLAN.md — Saroj Couture Website Implementation Plan

## 1. Folder Structure

```
couture/
├── GUI/                              # Stitch design exports (already present)
│   ├── atelier_heritage/DESIGN.md    # Design tokens & brand guidelines
│   ├── homepage_mobile/
│   ├── category_page_mobile/
│   ├── garment_detail_mobile/
│   ├── admin_dashboard_mobile/
│   ├── admin_login_mobile/
│   ├── add_garment_form_mobile/
│   └── category_management_mobile/
│
├── boutique-website-prd.md           # PRD (already present)
│
├── src/                              # ← Next.js 15 App Router project root
│   │
│   ├── app/
│   │   ├── layout.tsx                # Root layout: fonts, metadata, WhatsApp FAB, Footer
│   │   ├── page.tsx                  # Homepage: hero, featured grid, category strip, about strip, contact block
│   │   ├── globals.css               # Tailwind directives + design-token CSS custom properties
│   │   ├── not-found.tsx             # Custom 404
│   │   ├── robots.ts                 # Dynamic robots.txt (Next.js metadata API)
│   │   ├── sitemap.ts                # Dynamic sitemap.xml (Next.js metadata API)
│   │   │
│   │   ├── category/
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Public category gallery page
│   │   │
│   │   ├── garment/
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Public garment detail page
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Admin layout: auth guard, admin nav, logout
│   │   │   ├── page.tsx              # Dashboard: redirect to /admin/garments
│   │   │   ├── garments/
│   │   │   │   ├── page.tsx          # Garment list (search, filter, status dots)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Add garment form
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # Edit garment form
│   │   │   └── categories/
│   │   │       └── page.tsx          # Category management (drag-reorder, visibility, CRUD)
│   │   │
│   │   └── auth/
│   │       ├── login/
│   │       │   └── page.tsx          # Login page (email + password)
│   │       └── callback/
│   │           └── route.ts          # Supabase auth callback (for password reset flow)
│   │
│   ├── components/
│   │   ├── ui/                       # Primitive UI components (design-system level)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── TextArea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── RadioGroup.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Chip.tsx
│   │   │   └── Skeleton.tsx          # Loading skeleton
│   │   │
│   │   ├── layout/                   # Structural / layout components
│   │   │   ├── Header.tsx            # Public site header (logo + hamburger nav)
│   │   │   ├── Footer.tsx            # Footer: brand, address, hours, links
│   │   │   ├── MobileNav.tsx         # Slide-out mobile nav drawer
│   │   │   ├── AdminHeader.tsx       # Admin header (hamburger + title + logout)
│   │   │   ├── AdminSidebar.tsx      # Admin sidebar nav (Garments / Categories)
│   │   │   └── WhatsAppFAB.tsx       # Floating WhatsApp button
│   │   │
│   │   ├── home/                     # Homepage-specific sections
│   │   │   ├── HeroSection.tsx       # Full-bleed hero image + tagline + CTA
│   │   │   ├── FeaturedGrid.tsx      # Featured garments masonry/grid
│   │   │   ├── CategoryStrip.tsx     # Horizontally scrollable category cards
│   │   │   ├── AboutStrip.tsx        # Locality-rich about blurb (SEO copy)
│   │   │   └── ContactBlock.tsx      # WhatsApp, Call, Email, Instagram links
│   │   │
│   │   ├── garment/                  # Garment-related components
│   │   │   ├── GarmentCard.tsx       # Card used in grids (image, title, price)
│   │   │   ├── GarmentGallery.tsx    # Image carousel on detail page (swipeable)
│   │   │   ├── GarmentMeta.tsx       # Fabric, category, price display
│   │   │   ├── RelatedGarments.tsx   # "More from this category" strip
│   │   │   └── PriceDisplay.tsx      # Handles fixed / starting-from / on-enquiry
│   │   │
│   │   ├── category/
│   │   │   ├── CategoryNav.tsx       # Horizontal scrollable category tabs
│   │   │   └── EmptyCategory.tsx     # Empty state for zero-garment category
│   │   │
│   │   ├── admin/                    # Admin-specific components
│   │   │   ├── GarmentForm.tsx       # Shared form for add/edit garment
│   │   │   ├── ImageUploader.tsx     # Multi-select upload with preview, reorder, cover badge
│   │   │   ├── CategoryForm.tsx      # Add/edit category modal
│   │   │   ├── CategoryList.tsx      # Drag-reorder category list with visibility toggle
│   │   │   ├── GarmentListItem.tsx   # Row in garment list (thumbnail, title, status dot, kebab)
│   │   │   ├── DeleteConfirm.tsx     # Confirmation modal (shows garment count for categories)
│   │   │   └── SearchFilter.tsx      # Search + category filter bar
│   │   │
│   │   └── seo/
│   │       ├── LocalBusinessJsonLd.tsx   # Schema.org LocalBusiness JSON-LD
│   │       └── ProductJsonLd.tsx         # Schema.org Product JSON-LD
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client (createBrowserClient)
│   │   │   ├── server.ts             # Server Supabase client (createServerClient with cookies)
│   │   │   ├── middleware.ts          # Supabase auth middleware helper
│   │   │   ├── admin.ts              # Service-role client for image processing (server only)
│   │   │   └── types.ts              # Generated TypeScript types from Supabase schema
│   │   │
│   │   ├── actions/                  # Next.js Server Actions
│   │   │   ├── garments.ts           # CRUD for garments
│   │   │   ├── categories.ts         # CRUD for categories (with reorder, safe delete)
│   │   │   ├── images.ts             # Upload, reorder, delete images
│   │   │   └── auth.ts               # Login, logout, password reset
│   │   │
│   │   ├── queries/                  # Data-fetching functions (server-side)
│   │   │   ├── garments.ts           # getGarments, getGarmentBySlug, getFeatured
│   │   │   ├── categories.ts         # getCategories, getCategoryBySlug
│   │   │   └── images.ts             # getImagesByGarment
│   │   │
│   │   ├── utils/
│   │   │   ├── slug.ts               # Slug generation from title
│   │   │   ├── image-processing.ts   # Client-side EXIF strip + WebP conversion + resize
│   │   │   ├── whatsapp.ts           # Build WhatsApp deep link with pre-filled text
│   │   │   └── constants.ts          # Contact info, business details, SEO keywords
│   │   │
│   │   └── hooks/
│   │       ├── useMediaQuery.ts
│   │       └── useDragReorder.ts     # Hook for drag-to-reorder (categories, images)
│   │
│   ├── middleware.ts                 # Next.js middleware: Supabase session refresh + admin route guard
│   │
│   └── types/
│       └── index.ts                  # Shared app-level TypeScript types/interfaces
│
├── public/
│   ├── favicon.ico
│   ├── og-default.jpg               # Default Open Graph image
│   └── icons/                        # WhatsApp, call, email, Instagram SVG icons
│
├── supabase/
│   ├── migrations/
│   │   └── 00001_initial_schema.sql  # Full schema: tables, RLS policies, indexes, triggers
│   ├── seed.sql                      # Seed data: demo categories + sample garments
│   └── config.toml                   # Supabase local dev config
│
├── next.config.ts
├── tailwind.config.ts                # Design tokens from atelier_heritage/DESIGN.md
├── tsconfig.json
├── postcss.config.mjs
├── package.json
├── .env.local.example                # Template for env vars
└── .gitignore
```

---

## 2. Supabase Schema

### Table: `categories`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PK`, `DEFAULT gen_random_uuid()` | |
| `name` | `text` | `NOT NULL` | Display name, e.g. "Ghagra Choli" |
| `slug` | `text` | `NOT NULL`, `UNIQUE` | URL-safe, e.g. "ghagra-choli" |
| `display_order` | `integer` | `NOT NULL`, `DEFAULT 0` | Lower = first; used for drag-reorder |
| `cover_image_url` | `text` | `NULLABLE` | Supabase Storage public URL |
| `is_visible` | `boolean` | `NOT NULL`, `DEFAULT true` | Hidden categories don't show publicly |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | |
| `updated_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Updated via trigger |

**Indexes:**
- `UNIQUE` on `slug`
- `btree` on `display_order` (for ordered listing)
- `btree` on `is_visible` (for public queries filtering visible categories)

---

### Table: `garments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PK`, `DEFAULT gen_random_uuid()` | |
| `title` | `text` | `NOT NULL` | e.g. "Silk Organza Saree" |
| `slug` | `text` | `NOT NULL`, `UNIQUE` | URL-safe, auto-generated from title |
| `category_id` | `uuid` | `NOT NULL`, `FK → categories.id` | `ON DELETE` → see note below |
| `fabric` | `text` | `NULLABLE` | e.g. "Pure Georgette" |
| `description` | `text` | `NULLABLE` | Short description, ~300 chars recommended |
| `price` | `integer` | `NULLABLE` | Price in INR (whole rupees). NULL when price_type = 'on_enquiry' |
| `price_type` | `text` | `NOT NULL`, `DEFAULT 'fixed'`, `CHECK (price_type IN ('fixed', 'starting_from', 'on_enquiry'))` | Determines display logic |
| `is_featured` | `boolean` | `NOT NULL`, `DEFAULT false` | Shown in homepage featured section |
| `status` | `text` | `NOT NULL`, `DEFAULT 'published'`, `CHECK (status IN ('published', 'hidden'))` | Hidden garments are invisible publicly |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | |
| `updated_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Updated via trigger |

**Foreign key behaviour for `category_id`:**
- `ON DELETE RESTRICT` — the app handles the "move to Uncategorised" workflow in application code before allowing deletion. A category with garments cannot be deleted at the database level until the garments are reassigned. This is safer than `ON DELETE SET NULL` because it prevents accidental orphaning. The admin UI enforces the PRD rule: warn the user, then move garments to "Uncategorised" category, then delete.

**Indexes:**
- `UNIQUE` on `slug`
- `btree` on `category_id` (for category page queries)
- `btree` on `status` (for public vs hidden filtering)
- `btree` on `is_featured` (for homepage featured query)
- `btree` on `created_at` (for ordering by newest)
- Composite: `(status, category_id, created_at DESC)` for the most common public query

---

### Table: `images`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PK`, `DEFAULT gen_random_uuid()` | |
| `garment_id` | `uuid` | `NOT NULL`, `FK → garments.id ON DELETE CASCADE` | When garment is deleted, its images go too |
| `url` | `text` | `NOT NULL` | Supabase Storage public URL (full-size WebP) |
| `thumbnail_url` | `text` | `NOT NULL` | Supabase Storage public URL (thumbnail WebP, ~400px wide) |
| `alt_text` | `text` | `NULLABLE` | Owner-editable; defaults to `"<title> — <category> — boutique in Nagpur"` |
| `display_order` | `integer` | `NOT NULL`, `DEFAULT 0` | Lower = first; image at order 0 is the "cover" |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | |

**Indexes:**
- `btree` on `garment_id` (for fetching all images of a garment)
- Composite: `(garment_id, display_order)` for ordered image retrieval

---

### Supporting infrastructure

**Storage buckets:**
- `garment-images` — public bucket for garment photos (full-size + thumbnails)
- `category-covers` — public bucket for category cover images

**Database triggers:**
- `set_updated_at` — before-update trigger on `categories` and `garments` that sets `updated_at = now()`

**"Uncategorised" seed:**
- A row in `categories` with `name = 'Uncategorised'`, `slug = 'uncategorised'`, `is_visible = false`, `display_order = 999999`. This is the "catch-all" target when a category is deleted. Protected from deletion in application code (not deletable via admin UI).

---

## 3. RLS Policy Design

### Guiding principles

1. **Anon (unauthenticated visitors)** can only `SELECT`. They never see hidden/unpublished data.
2. **Authenticated owner** can `SELECT`, `INSERT`, `UPDATE`, `DELETE` — unrestricted across all data rows.
3. Owner identity is checked via `auth.uid()` matching a known owner UID stored in an environment variable or a small `owner_config` table. Since the PRD specifies a single owner, the simplest approach is: any authenticated user = the owner (there is no public sign-up route, so only the manually-created Supabase user exists).

---

### `categories` table

| Operation | Who | Policy rule (English) |
|---|---|---|
| `SELECT` | `anon` | Allow reading rows where `is_visible = true`. Ordered by `display_order`. |
| `SELECT` | `authenticated` | Allow reading **all** rows (including hidden categories — needed for admin UI). |
| `INSERT` | `authenticated` | Allow. |
| `UPDATE` | `authenticated` | Allow. |
| `DELETE` | `authenticated` | Allow. (Application code prevents deleting the "Uncategorised" row; DB allows it as a safety net in case of manual intervention.) |

### `garments` table

| Operation | Who | Policy rule (English) |
|---|---|---|
| `SELECT` | `anon` | Allow reading rows where `status = 'published'` **and** whose `category_id` points to a category where `is_visible = true`. This prevents leaking garments from hidden categories via direct URL. |
| `SELECT` | `authenticated` | Allow reading **all** rows (including hidden garments — needed for admin UI). |
| `INSERT` | `authenticated` | Allow. |
| `UPDATE` | `authenticated` | Allow. |
| `DELETE` | `authenticated` | Allow. (Cascading image deletion handled by FK `ON DELETE CASCADE` on the `images` table.) |

### `images` table

| Operation | Who | Policy rule (English) |
|---|---|---|
| `SELECT` | `anon` | Allow reading rows whose parent `garment_id` corresponds to a published garment in a visible category. (Matches the garment policy — images inherit garment visibility.) |
| `SELECT` | `authenticated` | Allow reading **all** rows. |
| `INSERT` | `authenticated` | Allow. |
| `UPDATE` | `authenticated` | Allow (for editing alt_text, reordering). |
| `DELETE` | `authenticated` | Allow. |

### Storage policies (`garment-images` and `category-covers` buckets)

| Operation | Who | Policy rule (English) |
|---|---|---|
| `SELECT` (download/view) | `anon`, `authenticated` | Allow. These are public buckets — anyone can view images by URL. |
| `INSERT` (upload) | `authenticated` | Allow. |
| `UPDATE` (overwrite) | `authenticated` | Allow. |
| `DELETE` | `authenticated` | Allow. |

> [!NOTE]
> Since there is no public sign-up and the Supabase project is configured with sign-ups disabled, `authenticated` effectively means "the owner." If a second admin is ever needed, promote them to authenticated in Supabase and they automatically inherit all write access — a config change, not a code change (per PRD §3).

---

## 4. Routes / Pages

### Public routes

| Route | Page | Description |
|---|---|---|
| `/` | Homepage | Hero, featured grid, category strip, about strip (locality SEO copy), contact block. `LocalBusiness` JSON-LD. |
| `/category/[slug]` | Category gallery | Grid of published garments in this category. Horizontal category tabs to switch. Count label ("18 pieces"). Empty state for zero garments. |
| `/garment/[slug]` | Garment detail | Image carousel, title, price (respecting `price_type`), fabric, description, category. "Enquire on WhatsApp" CTA (pre-fills garment title). "More from this category" strip. `Product` JSON-LD. |
| `/auth/login` | Login page | Email + password. "Forgot password" link. Redirects to `/admin` on success. No sign-up link. |
| `/auth/callback` | Auth callback (API route) | Handles Supabase email confirmation / password-reset token exchange. |

### Admin routes (all behind auth guard)

| Route | Page | Description |
|---|---|---|
| `/admin` | Dashboard redirect | Redirects to `/admin/garments`. |
| `/admin/garments` | Garment list | Search bar, category filter dropdown. List of garments with thumbnail, title, category badge, status dot (published = filled, hidden = outlined), price, kebab menu (edit / delete / toggle status / toggle featured). FAB "+" to add new. |
| `/admin/garments/new` | Add garment | Full form: image uploader (multi-select, up to 6, drag-reorder, "cover" badge on first), title, category dropdown (+ "New category" inline shortcut), fabric, description (character counter, up to 500), price type radio (fixed / starting from / on enquiry), price input (disabled when "on enquiry"), featured toggle. Save / Cancel. |
| `/admin/garments/[id]/edit` | Edit garment | Same form as add, pre-populated. Can add/remove/reorder images. |
| `/admin/categories` | Category management | Drag-reorder list. Each row: drag handle, cover thumbnail, name, garment count, visibility toggle (eye icon), kebab menu (edit / delete). "+ Add Category" button. Delete triggers confirmation modal showing garment count. |

### Generated routes (Next.js metadata API)

| Route | Type | Description |
|---|---|---|
| `/sitemap.xml` | `sitemap.ts` | Auto-generated from all published garments and visible categories. |
| `/robots.txt` | `robots.ts` | Allows all crawlers, links to `/sitemap.xml`, disallows `/admin/*` and `/auth/*`. |

---

## 5. Build Order

Each phase depends on the one before it. Within a phase, items can be built in parallel.

### Phase 0 — Project scaffold

> **Goal:** An empty Next.js 15 app that builds, with all config in place.

| # | Task | Depends on | Output |
|---|---|---|---|
| 0.1 | Init Next.js 15 App Router + TypeScript (`npx create-next-app@latest`) | — | `package.json`, `tsconfig.json`, `next.config.ts` |
| 0.2 | Install Tailwind CSS v4 (if Next.js init doesn't include it), configure `tailwind.config.ts` with design tokens from `DESIGN.md` | 0.1 | `tailwind.config.ts`, `postcss.config.mjs`, `globals.css` |
| 0.3 | Set up Google Fonts (Libre Caslon Text, Karla) via `next/font` | 0.1 | Fonts loaded in `layout.tsx` |
| 0.4 | Create `.env.local.example` with all Supabase env vars | — | `.env.local.example` |
| 0.5 | Install `@supabase/supabase-js`, `@supabase/ssr` | 0.1 | Updated `package.json` |
| 0.6 | Create Supabase client helpers (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `admin.ts`) | 0.5 | Supabase clients ready |
| 0.7 | Create `middleware.ts` (session refresh + admin route guard) | 0.6 | Auth guard functional |
| 0.8 | Create `lib/utils/constants.ts` (contact info, business details) | — | Single source of truth for WhatsApp, phone, email, Instagram |

---

### Phase 1 — Database & Auth

> **Goal:** Supabase schema, RLS, storage buckets, and auth working. Owner can log in.

| # | Task | Depends on | Output |
|---|---|---|---|
| 1.1 | Write `supabase/migrations/00001_initial_schema.sql` — all three tables, indexes, triggers, RLS policies | 0.4 | Schema SQL |
| 1.2 | Run migration on Supabase project (local or remote) | 1.1 | Tables live in Postgres |
| 1.3 | Create storage buckets (`garment-images`, `category-covers`) with public read + authenticated write policies | 1.2 | Storage ready |
| 1.4 | Create the owner user in Supabase Auth (email + password, manually via dashboard or CLI) | 1.2 | Owner can authenticate |
| 1.5 | Seed the "Uncategorised" category row | 1.2 | Safety-net category exists |
| 1.6 | Build `/auth/login` page + `/auth/callback` route + `lib/actions/auth.ts` | 0.6, 0.7 | Login/logout/reset working |
| 1.7 | Generate TypeScript types from Supabase schema (`supabase gen types`) | 1.2 | `lib/supabase/types.ts` |

---

### Phase 2 — UI primitives & Layout

> **Goal:** All reusable UI components and layout shells are built. Pages can be assembled from these.

| # | Task | Depends on | Output |
|---|---|---|---|
| 2.1 | Build `components/ui/*` — Button, Input, TextArea, Select, RadioGroup, Toggle, Badge, Card, Modal, Chip, Skeleton | 0.2 | Design-system components |
| 2.2 | Build `components/layout/Header.tsx` + `MobileNav.tsx` | 2.1 | Public header |
| 2.3 | Build `components/layout/Footer.tsx` | 2.1, 0.8 | Public footer with locality copy |
| 2.4 | Build `components/layout/WhatsAppFAB.tsx` | 0.8 | Floating WhatsApp button |
| 2.5 | Build `app/layout.tsx` — root layout with fonts, header, footer, WhatsApp FAB | 2.2, 2.3, 2.4 | Root layout shell |
| 2.6 | Build `components/layout/AdminHeader.tsx` + `AdminSidebar.tsx` | 2.1 | Admin layout components |
| 2.7 | Build `app/admin/layout.tsx` — admin layout with auth guard, sidebar, header | 2.6, 1.6 | Admin shell |
| 2.8 | Build `app/not-found.tsx` | 2.1 | Custom 404 |

---

### Phase 3 — Admin CRUD (write path)

> **Goal:** The owner can manage categories and garments from the admin UI. This comes before public pages because the public pages need data to render.

| # | Task | Depends on | Output |
|---|---|---|---|
| 3.1 | Build `lib/utils/image-processing.ts` — client-side EXIF strip, WebP conversion, thumbnail generation | — | Image pipeline utility |
| 3.2 | Build `lib/utils/slug.ts` — slug generator | — | Utility |
| 3.3 | Build `lib/actions/categories.ts` — create, update, reorder, delete (with garment-move logic) | 1.7, 2.7 | Category server actions |
| 3.4 | Build `components/admin/CategoryForm.tsx` + `CategoryList.tsx` + `DeleteConfirm.tsx` | 2.1, 3.3 | Category management UI |
| 3.5 | Build `app/admin/categories/page.tsx` | 3.4 | Category admin page |
| 3.6 | Build `lib/actions/images.ts` — upload to storage, create image rows, reorder, delete | 1.3, 1.7, 3.1 | Image server actions |
| 3.7 | Build `components/admin/ImageUploader.tsx` | 2.1, 3.6 | Multi-image upload component |
| 3.8 | Build `lib/actions/garments.ts` — create, update, delete, toggle status/featured | 1.7, 3.2, 3.6 | Garment server actions |
| 3.9 | Build `components/admin/GarmentForm.tsx` | 2.1, 3.7, 3.8 | Add/edit garment form |
| 3.10 | Build `components/admin/GarmentListItem.tsx` + `SearchFilter.tsx` | 2.1 | Garment list UI pieces |
| 3.11 | Build `app/admin/garments/page.tsx` | 3.10, 3.8 | Garment list admin page |
| 3.12 | Build `app/admin/garments/new/page.tsx` | 3.9 | Add garment page |
| 3.13 | Build `app/admin/garments/[id]/edit/page.tsx` | 3.9 | Edit garment page |
| 3.14 | Build `app/admin/page.tsx` (redirect to `/admin/garments`) | 2.7 | Dashboard redirect |
| 3.15 | Seed 15–20 sample garments across 4–6 categories via admin UI or `seed.sql` | 3.12, 3.5 | Test data for public pages |

---

### Phase 4 — Public pages (read path)

> **Goal:** All public-facing pages render, SEO metadata is in place.

| # | Task | Depends on | Output |
|---|---|---|---|
| 4.1 | Build `lib/queries/categories.ts` + `lib/queries/garments.ts` + `lib/queries/images.ts` | 1.7 | Server-side data fetchers |
| 4.2 | Build `components/garment/PriceDisplay.tsx` | 2.1 | Price rendering (fixed/starting/enquiry) |
| 4.3 | Build `components/garment/GarmentCard.tsx` | 2.1, 4.2 | Card for grids |
| 4.4 | Build `lib/utils/whatsapp.ts` | 0.8 | WhatsApp link builder |
| 4.5 | Build `components/home/HeroSection.tsx` | 2.1 | Homepage hero |
| 4.6 | Build `components/home/FeaturedGrid.tsx` | 4.3, 4.1 | Featured garments section |
| 4.7 | Build `components/home/CategoryStrip.tsx` | 2.1, 4.1 | Horizontal category cards |
| 4.8 | Build `components/home/AboutStrip.tsx` | 0.8 | Locality-rich SEO copy section |
| 4.9 | Build `components/home/ContactBlock.tsx` | 0.8, 4.4 | Contact section |
| 4.10 | Build `components/seo/LocalBusinessJsonLd.tsx` | 0.8 | Schema.org LocalBusiness |
| 4.11 | Build `app/page.tsx` (homepage) | 4.5–4.10 | Homepage |
| 4.12 | Build `components/category/CategoryNav.tsx` + `EmptyCategory.tsx` | 2.1 | Category page components |
| 4.13 | Build `app/category/[slug]/page.tsx` | 4.1, 4.3, 4.12 | Category gallery page |
| 4.14 | Build `components/garment/GarmentGallery.tsx` (swipeable carousel) | 2.1 | Image carousel |
| 4.15 | Build `components/garment/GarmentMeta.tsx` | 4.2 | Garment metadata display |
| 4.16 | Build `components/garment/RelatedGarments.tsx` | 4.3, 4.1 | "More from this category" |
| 4.17 | Build `components/seo/ProductJsonLd.tsx` | — | Schema.org Product |
| 4.18 | Build `app/garment/[slug]/page.tsx` | 4.14, 4.15, 4.16, 4.17, 4.4 | Garment detail page |

---

### Phase 5 — SEO & Performance

> **Goal:** All SEO requirements met. Lighthouse scores hit targets.

| # | Task | Depends on | Output |
|---|---|---|---|
| 5.1 | Build `app/sitemap.ts` — dynamic sitemap from published garments + visible categories | 4.1 | `/sitemap.xml` |
| 5.2 | Build `app/robots.ts` — disallow `/admin/*`, `/auth/*` | — | `/robots.txt` |
| 5.3 | Add per-page `generateMetadata` to all public route pages (title, description, OG tags) | 4.11, 4.13, 4.18 | SEO metadata |
| 5.4 | Add alt text defaults to images ("`<title>` — `<category>` — boutique in Nagpur") | 4.18 | Accessible images |
| 5.5 | Configure `next/image` with Supabase Storage CDN domains in `next.config.ts` | 0.1 | Image optimisation |
| 5.6 | Verify: Lighthouse Performance ≥ 85, SEO ≥ 95, LCP < 2.5s | 5.1–5.5 | Scores passing |
| 5.7 | Verify: Rich Results Test passes for LocalBusiness + Product | 5.3 | Structured data valid |

---

### Phase 6 — Polish & Deploy

> **Goal:** Production-ready, deployed on Vercel.

| # | Task | Depends on | Output |
|---|---|---|---|
| 6.1 | Test all admin flows on mobile (add/edit/delete garment, manage categories) | Phase 3 complete | Mobile admin verified |
| 6.2 | Test all public flows on mobile (browse, navigate categories, garment detail, WhatsApp) | Phase 4 complete | Mobile public verified |
| 6.3 | Test 404 page, hidden garment direct URL returns 404, hidden category returns 404 | 4.13, 4.18 | Security verified |
| 6.4 | Create production Supabase project, run migration, create owner user | Phase 1 SQL | Production DB ready |
| 6.5 | Deploy to Vercel, configure env vars, connect custom domain | 6.4 | Site live |
| 6.6 | Submit sitemap to Google Search Console | 6.5 | Indexing started |

---

## 6. PRD Ambiguities & Decisions Needed

> [!IMPORTANT]
> The following items need your decision before coding begins. Defaults are suggested — say "go with defaults" if you agree with all of them, or call out any you want changed.

### 6.1 Hero image source

The PRD doesn't specify where the hero banner image comes from. The Stitch mockup shows a full-bleed model photo.

- **Option A (recommended):** Hard-code a static hero image in the repo for now. The owner can later swap it via a simple file replacement or an admin field.
- **Option B:** Make the hero image an admin-editable "site settings" row in Supabase (adds complexity for v1).

### 6.2 Slug collision handling

What happens when two garments have the same title (e.g., two "Silk Organza Saree")?

- **Default decision:** Auto-append a numeric suffix (`silk-organza-saree-2`). This is handled in `slug.ts` with a uniqueness check against the database before insert.

### 6.3 Garment detail page URL — by slug or by ID?

The PRD says `/garment/<slug>`. Slugs are human-readable but require uniqueness enforcement and renaming complexity.

- **Default decision:** URL uses slug (`/garment/silk-organza-saree`). If the owner edits the title, a new slug is generated and the old URL returns 404. Redirect history is a P2 concern.

### 6.4 Category deletion workflow — exact UX

The PRD says: "warn about garments inside, garments move to Uncategorised." Two possible flows:

- **Option A (recommended):** Delete button → modal says "This category has 12 garments. They will be moved to Uncategorised." → Confirm → garments reassigned → category deleted. Single action.
- **Option B:** Two-step: first move garments manually, then delete the (now empty) category.

### 6.5 Image processing — client-side vs server-side

The PRD requires EXIF stripping + WebP conversion + resize. Two approaches:

- **Option A (recommended):** Client-side in the browser using Canvas API before upload. Pros: no server compute cost, works on Vercel serverless with no timeout risk for large images. Cons: slightly slower on low-end phones.
- **Option B:** Server-side using Sharp in a Next.js API route. Pros: guaranteed quality. Cons: Vercel serverless function timeout (10s on free tier) could fail on 6 concurrent 6MB uploads.

### 6.6 Description character limit

The PRD says "~300 chars" but the Stitch mockup shows a 0/500 counter.

- **Default decision:** Use 500 chars (match the mockup). The PRD's "~300" reads as a recommendation to the owner, not a hard limit.

### 6.7 Price currency display

The Stitch mockup shows `$1,250` but the PRD specifies INR.

- **Default decision:** Display as `₹45,000` (rupee symbol + Indian number formatting with commas: 1,00,000 style for lakhs). The mockup was placeholder.

### 6.8 Garment page — "More from this category" count

The Stitch mockup shows a horizontal strip. How many related garments to show?

- **Default decision:** Show up to 6 related garments, excluding the current one, ordered by newest first.

### 6.9 Multiple images per garment — carousel style

The Stitch mockup shows dots indicating a swipeable carousel on the garment detail page.

- **Default decision:** Touch-swipeable horizontal carousel with dot indicators. First image = cover. Use a lightweight library (e.g., `embla-carousel-react`) rather than building from scratch.

### 6.10 Admin — Garment list default sort

- **Default decision:** Newest first (`created_at DESC`). Search filters by title substring. Category filter dropdown.

### 6.11 `next/image` vs Supabase Storage CDN for image delivery

The PRD mentions "Next.js `<Image>` + Supabase Storage CDN" and optionally Cloudinary.

- **Default decision:** Use `next/image` with Supabase Storage as the source. This gives automatic WebP serving, responsive `srcset`, and lazy loading via Vercel's image optimisation layer at no extra cost on the free tier. Skip Cloudinary — it adds a dependency for no clear benefit at this scale.

### 6.12 Opening hours for Schema.org

The PRD says to include `openingHours` in the `LocalBusiness` JSON-LD but doesn't specify hours.

- **Decision needed:** What are the boutique's operating hours? (e.g., "Mon–Sat 10 AM – 7 PM"). I'll put a placeholder in `constants.ts` that you fill in.

### 6.13 Tailwind CSS version

The Stitch exports use Tailwind via CDN (`cdn.tailwindcss.com`). Next.js 15 currently ships with Tailwind v4 by default.

- **Default decision:** Use Tailwind CSS v4 (the Next.js 15 default). The Stitch HTML exports will be used as visual reference — their class names will be translated to v4 equivalents rather than copy-pasted verbatim.

### 6.14 "About strip" content

The PRD (R7) says to work "Teka Naka" and "Kamptee Road" into visible body copy for SEO. The homepage needs an About section.

- **Default decision:** Include a short 2–3 sentence "About strip" on the homepage with locality keywords. Exact copy to be written during implementation, but it will mention "Teka Naka, Kamptee Road, Nagpur" as natural body text, not just metadata.

### 6.15 Favicon and OG image

The PRD doesn't specify a favicon or default Open Graph image.

- **Default decision:** Generate a simple text-based favicon ("SC" monogram in the brand serif font). Use a generated OG image with the brand name + tagline for social sharing. Both can be refined later.
