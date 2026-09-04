/**
 * Single source of truth for all Saroj Couture contact info and business details.
 * Never hardcode these values anywhere else in the codebase — always import from here.
 *
 * Phase 0 task 0.8
 */

// ─── Contact ──────────────────────────────────────────────────────────────
export const CONTACT = {
  whatsapp: "+917620364981",
  phone: "+917620364981",
  /** Fill in once domain + Zoho mailbox are created */
  email: "contact@sarojcouture.com",
  instagram: "https://www.instagram.com/saroj_couture",
  instagramHandle: "@saroj_couture",
} as const;

// ─── Business details ─────────────────────────────────────────────────────
export const BUSINESS = {
  name: "Saroj Couture",
  tagline: "Custom-stitched, made to your measure.",
  /** Locality only — never the full home address */
  locality: "Teka Naka, Kamptee Road",
  city: "Nagpur",
  state: "Maharashtra",
  /** Approximate postal code for Kamptee Road area — verify before go-live */
  postalCode: "440026",
  country: "IN",
  /** Fill in once trading hours are confirmed by the owner */
  openingHours: "Mo-Sa 10:00-19:00",
} as const;

// ─── Derived ──────────────────────────────────────────────────────────────
/** Google Maps search link for the boutique's locality — shared by the contact CTA and LocalBusiness schema. */
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${BUSINESS.name}, ${BUSINESS.locality}, ${BUSINESS.city}, ${BUSINESS.state} ${BUSINESS.postalCode}`
)}`;

// ─── SEO ──────────────────────────────────────────────────────────────────
export const SEO = {
  /** Site base URL — override with NEXT_PUBLIC_SITE_URL env var */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  defaultTitle: `${BUSINESS.name} — Designer Dresses & Custom Stitching, ${BUSINESS.city}`,
  defaultDescription:
    `${BUSINESS.name} offers bespoke women's designer wear and custom stitching in ` +
    `${BUSINESS.locality}, ${BUSINESS.city}. Sarees, ghagra choli, kurtis, gowns and more.`,
  keywords: [
    "boutique in Nagpur",
    "designer dresses Nagpur",
    "boutique Kamptee Road",
    "ladies tailor Teka Naka",
    "custom stitching Nagpur",
    "saree blouse stitching Nagpur",
  ],
} as const;

// ─── Storage buckets ──────────────────────────────────────────────────────
export const STORAGE = {
  garmentImages: "garment-images",
  categoryCovers: "category-covers",
} as const;

// ─── Admin ────────────────────────────────────────────────────────────────
export const ADMIN = {
  /** The "Uncategorised" category slug is reserved and must not be deletable via UI */
  uncategorisedSlug: "uncategorised",
  maxImagesPerGarment: 6,
  descriptionMaxLength: 500,
} as const;
