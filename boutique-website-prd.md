# PRD — Saroj Couture (Designer Dresses, Nagpur)

**Business:** Saroj Couture — home-based women's designer wear and custom stitching
**Locality:** Teka Naka, Kamptee Road, Nagpur (locality published; full address withheld)
**WhatsApp:** +91 76203 64981
**Instagram:** [@saroj_couture](https://www.instagram.com/saroj_couture)
**Email:** contact@<domain> — to be created once the domain is purchased
**Domain:** not yet purchased (see Open Questions)
**Version:** 1.1
**Status:** Draft for build
**Build method:** AI-assisted (Claude CLI + Antigravity IDE), UI from Google Stitch

---

## 1. Problem Statement

The boutique operates from home and currently has no online presence. Discovery depends entirely on word of mouth, so people in Nagpur searching "boutique in Nagpur" or "designer dresses Nagpur" never find it, and there is no way to show past work to a prospective customer without sending photos manually over WhatsApp.

Cost of not solving: every month of no online presence is lost enquiries to competitors who rank on Google Maps and Instagram, and repeated manual effort re-sending the same portfolio photos.

---

## 2. Goals

1. **Be findable** — rank on page 1 of Google for "boutique in Nagpur", "designer dresses Nagpur", "ladies tailor Nagpur" and appear on Google Maps within 90 days of launch.
2. **Show the work** — a browsable, categorised portfolio of stitched garments with photo, fabric, description and price.
3. **Convert to conversation** — every page gives a one-tap route to WhatsApp, call, email or Instagram.
4. **Owner-managed** — the owner can add, edit, delete garments and categories from her phone with no developer involvement.
5. **Locked down** — visitors can only view. No public write access anywhere in the system.

---

## 3. Non-Goals (v1)

| Not building | Why |
|---|---|
| Online payments / checkout | Custom-stitched garments are priced per order; enquiry-first is the real sales flow. |
| Customer accounts / login | Nothing for a customer to log into. Adds attack surface for zero value. |
| Measurement submission forms | Measurements are taken in person or over WhatsApp. Premature. |
| Blog / articles | Content burden the owner will not sustain. Revisit only if SEO stalls. |
| Multi-language (Hindi/Marathi) | English + Google auto-translate is sufficient for v1. Design should not block it later. |
| Multiple admin users | Single owner. Auth designed so a second admin is a config change, not a rewrite. |

---

## 4. Users

**Persona A — Prospective customer (Nagpur, 20–50, mobile, 4G).**
Finds the site via Google search or Instagram bio. Wants to judge quality fast and message the owner. Will spend under 90 seconds on the site.

**Persona B — The owner (admin, mobile-first).**
Shoots photos on her phone after a delivery. Wants to upload them in under a minute, tag the category, add fabric/price, and be done.

---

## 5. User Stories

### Customer
1. As a woman searching for a boutique in Nagpur, I want the site to appear in Google results so that I can discover this boutique at all.
2. As a visitor, I want to see a gallery of stitched work on the homepage so that I can judge quality within seconds.
3. As a visitor, I want to filter by attire type (saree, ghagra choli, jeans, kurti, gown…) so that I only see what I am looking for.
4. As a visitor, I want to tap a photo and see fabric, description and price so that I know what I am asking about.
5. As a visitor, I want to message on WhatsApp with the garment already referenced so that I do not have to describe which dress I mean.
6. As a visitor on a slow connection, I want images to load progressively so that the page does not appear broken.
7. As a visitor, I want to see the boutique's area/locality and contact details so that I know it is genuinely local.

### Owner (Admin)
8. As the owner, I want to log in securely from my phone so that only I can change the site.
9. As the owner, I want to upload one or many photos and attach fabric, description and price so that a new piece goes live immediately.
10. As the owner, I want to create, rename, reorder and delete categories so that the site matches whatever I am stitching this season.
11. As the owner, I want to edit or delete a garment I posted so that mistakes and sold-out pieces are handled.
12. As the owner, I want to mark a garment as "featured" so that my best work sits at the top of the homepage.
13. As the owner, I want deleting a category to warn me about the garments inside it so that I do not wipe out work by accident.

---

## 6. Requirements

### P0 — Must have

**R1. Public gallery**
- Homepage: hero, featured grid, category strip, contact block.
- Category pages at `/category/<slug>` (e.g. `/category/ghagra-choli`).
- Garment detail page at `/garment/<slug>` showing photo(s), title, fabric, description, price.
- Acceptance:
  - [ ] Given a visitor on any device, when they open the homepage, then a responsive grid of garment photos renders.
  - [ ] Given a category with zero garments, when a visitor opens it, then an empty state is shown, not a broken/blank page.
  - [ ] Given a visitor, when they attempt any URL under `/admin`, then they are redirected to login.

**R2. Dynamic categories**
- Categories are database rows, not hardcoded. Fields: name, slug, display order, cover image, visible (bool).
- Acceptance:
  - [ ] Owner can add a category and it appears in site navigation without a redeploy.
  - [ ] Owner can reorder categories and the public order updates.
  - [ ] Deleting a category prompts a confirmation naming how many garments it holds; garments are moved to "Uncategorised", not deleted.

**R3. Garment records**
- Fields: title, category (FK), fabric, short description (max ~300 chars), price (number, INR), price type (fixed / starting from / on enquiry), images (1–6), featured (bool), status (published/hidden), created date.
- Acceptance:
  - [ ] A garment with status `hidden` is not reachable publicly, including by direct URL.
  - [ ] Price type "on enquiry" hides the numeric price on the public page.

**R4. Admin authentication**
- Single owner account, email + password, session-based. No public sign-up route.
- Acceptance:
  - [ ] Given a logged-out user, when they POST to any admin API, then the request is rejected server-side (not just hidden in the UI).
  - [ ] Sessions expire after 30 days; logout works.
  - [ ] Password reset via email link.

**R5. Image upload pipeline**
- Upload from phone camera roll, multi-select. Auto-compress and convert to WebP, generate thumbnail + full sizes, strip EXIF (removes GPS location from phone photos).
- Acceptance:
  - [ ] A 6 MB phone photo is served to visitors at under 300 KB.
  - [ ] Uploaded images are served from a CDN.
  - [ ] EXIF GPS data is not present in the delivered file.

**R6. Contact channels — WhatsApp, Call, Email, Instagram**
- Persistent floating WhatsApp button on mobile. Contact block in footer on every page.
- WhatsApp: `https://wa.me/917620364981?text=Hi%20Saroj%20Couture,%20I'm%20interested%20in%20<garment%20title>`
- Call: `tel:+917620364981`
- Email: `mailto:contact@<domain>` — mailbox created after domain purchase
- Instagram: `https://www.instagram.com/saroj_couture` (strip the `?igsi=` tracking parameter)
- All four values live in one config/env file, never hardcoded across components.
- Acceptance:
  - [ ] Tapping WhatsApp on a garment page opens WhatsApp with that garment's name pre-filled.
  - [ ] `tel:` and `mailto:` links work on Android and iOS.
  - [ ] Instagram link opens in a new tab.

**R7. SEO + local discovery**
- Per-page `<title>`, meta description, Open Graph tags. Descriptive alt text on every image (owner-editable, defaults to "<title> — <category> — boutique in Nagpur").
- `sitemap.xml` and `robots.txt`, auto-updated when garments/categories change.
- Schema.org JSON-LD: `LocalBusiness` on the homepage — name "Saroj Couture", `addressLocality` "Teka Naka, Kamptee Road", `addressRegion` "Maharashtra", `postalCode` for Kamptee Road, `telephone` +917620364981, `areaServed` "Nagpur", opening hours, `sameAs` pointing to the Instagram profile. `Product` schema on garment pages.
- Target keyword set: "boutique in Nagpur", "designer dresses Nagpur", "boutique Kamptee Road", "ladies tailor Teka Naka", "custom stitching Nagpur", "saree blouse stitching Nagpur". Work "Teka Naka" and "Kamptee Road" into the homepage About strip and footer as real body copy — locality keywords in visible text matter more than meta tags.
- Google Search Console verified; sitemap submitted.
- **Google Business Profile created and verified** — this drives Maps results and is separate from the website itself, but it is the single highest-impact item for "boutique in Nagpur".
- Acceptance:
  - [ ] Lighthouse SEO score ≥ 95.
  - [ ] Rich Results Test passes for LocalBusiness and Product.
  - [ ] Every public page has a unique title and description.

**R8. Performance**
- Acceptance:
  - [ ] Lighthouse mobile Performance ≥ 85 on a simulated 4G connection.
  - [ ] Largest Contentful Paint under 2.5 s on the homepage.
  - [ ] Images lazy-load below the fold.

### P1 — Should have (fast follow)

- **Featured / "New arrivals"** section driven by the `featured` flag.
- **Bulk upload** — select 10 photos, assign the same category in one action.
- **Instagram embed** of the latest posts in the footer.
- **Basic analytics** (Google Analytics 4 or Vercel Analytics) to see which categories get traffic.
- **About / Our Work page** with owner photo, story, years of experience, area served — strong local SEO signal.
- **Testimonials** — 3–6 short quotes with customer first name.
- **Enquiry form** (name, phone, message, optional reference photo upload) as a fallback for visitors who do not use WhatsApp.

### P2 — Future considerations (design for, do not build)

- Multiple admin accounts with roles.
- Hindi/Marathi language toggle — keep all UI strings in one file so translation is not a rewrite.
- Customer-uploaded reference images against an enquiry.
- Appointment booking for fittings.
- Price ranges and filter-by-price on category pages.

---

## 7. Recommended Technical Stack

Chosen for: AI-generatable, free at this traffic level, and no server for the owner to maintain.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Server-side rendering — essential for Google indexing. A pure React SPA will hurt your SEO goal. |
| Styling | **Tailwind CSS** | Stitch exports map to it cleanly. |
| Database + Auth + Storage | **Supabase** (free tier) | Postgres + row-level security + auth + file storage in one. RLS enforces "public read, owner write" at the database layer, not just in UI code. |
| Image delivery | **Next.js `<Image>` + Supabase Storage CDN** (or Cloudinary free tier if you want auto-crop) | Handles WebP conversion and responsive sizes automatically. |
| Hosting | **Vercel** (free tier) | Git push to deploy, free SSL, global CDN. |
| Domain | Namecheap / GoDaddy / Hostinger — approx ₹700–1,200/year | A `.com` or `.in` with the boutique name. Do not launch on a `vercel.app` subdomain; it weakens SEO and trust. |
| Forms/email (P1) | Resend or Formspree free tier | Only needed for the enquiry form. |

**Other resources you asked about:**
- **Google Business Profile** — free, mandatory for Maps. Set it up on day one; verification by post can take 1–2 weeks.
- **Google Search Console** — free, submit the sitemap here.
- **Squoosh / TinyPNG** — only if you want to pre-compress before upload; the pipeline should handle it anyway.
- **v0.dev** — useful second opinion alongside Stitch for individual React components.
- **PageSpeed Insights** — verify R8 before you call it done.

**Data model sketch**

```
categories: id, name, slug, display_order, cover_image_url, is_visible, created_at
garments:   id, title, slug, category_id → categories.id, fabric, description,
            price, price_type, is_featured, status, created_at
images:      id, garment_id → garments.id, url, alt_text, display_order
```

Supabase RLS policies: `SELECT` allowed to `anon` where `status = 'published'`; `INSERT/UPDATE/DELETE` restricted to the authenticated owner's UID.

---

## 8. Success Metrics

**Leading (first 30 days)**
- Site indexed by Google — all pages appearing in Search Console coverage report. Target: 100%.
- Owner uploads without help. Target: 10+ garments added by the owner alone in month 1.
- WhatsApp click-through rate. Target: ≥ 8% of visitors tap a contact button.
- Mobile Lighthouse Performance ≥ 85, SEO ≥ 95.

**Lagging (90 days)**
- Ranking on page 1 for "boutique in Nagpur" or "designer dresses Nagpur".
- Google Business Profile appears in the local Maps pack.
- Enquiries attributed to the website. Target: 5+ per month by month 3.
- Organic sessions. Target: 300+/month by month 3.

**How to measure:** Google Search Console (rankings, impressions), GA4 or Vercel Analytics (sessions, contact clicks), and the owner asking new customers "how did you find us?".

---

## 9. Open Questions

**Blocking**
- **Domain not yet purchased.** Needed before Google Search Console, the email mailbox, and Google Business Profile. Buy this first — everything else waits on it.
  - Candidates: `sarojcouture.com`, `sarojcouture.in`, `saroj-couture.com`. Prefer `.com`; `.in` is an acceptable second.
  - Where: Hostinger or Namecheap, roughly ₹700–1,200/year. Enable WHOIS privacy — it is usually free and keeps the home address off public registrar records.
  - Email: use Zoho Mail free tier for `contact@sarojcouture.com`. Google Workspace works too but costs ~₹150/user/month.

**Resolved**
- Name: Saroj Couture. WhatsApp: +91 76203 64981. Instagram: @saroj_couture.
- Address: publish **locality only** — "Teka Naka, Kamptee Road, Nagpur". No house number, no plot number, anywhere on the site. On Google Business Profile, register as a **service-area business** so the pin appears for Nagpur without exposing the home address publicly. Note: Google still requires the real address during verification, but it stays hidden on the listing.

**Non-blocking**
- How many photos per garment, realistically? (Affects gallery UI on detail pages.)
- Are prices shown publicly, or mostly "on enquiry"? (Affects whether price filtering is worth building in P2.)
- Do the photos feature customers' faces? If yes, get consent before publishing, and consider crop-to-garment framing.
- Approximate number of existing photos to migrate at launch.

---

## 10. Phasing

**Phase 0 — Before any code (do today)**
Buy the domain. Create the Zoho mailbox. Submit Google Business Profile as a service-area business for Nagpur. Make sure the Instagram bio links to the domain once it is live.

**Phase 1 — Launch (week 1–2)**
R1, R2, R3, R4, R5, R6, R7, R8. 15–20 garments seeded across 4–6 categories.

**Phase 2 — Grow (week 3–5)**
About page, testimonials, featured section, bulk upload, analytics, Instagram embed.

**Phase 3 — Optimise (month 2–3)**
Review Search Console data, add category pages for whatever people actually search, enquiry form, consider language toggle.

**Dependency note:** Google Business Profile verification can take 1–2 weeks by post. Start it before you write any code.
