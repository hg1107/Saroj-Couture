/**
 * Shared TypeScript types / interfaces for the Saroj Couture app.
 * More specific DB types live in lib/supabase/types.ts.
 */

/** Price display variants — mirrors the DB price_type enum */
export type PriceType = "fixed" | "starting_from" | "on_enquiry";

/** Garment publish state */
export type GarmentStatus = "published" | "hidden";

/** Navigation item used in Header and mobile nav */
export interface NavItem {
  label: string;
  href: string;
}

/** Image upload preview (before upload, client-side only) */
export interface ImagePreview {
  id: string;          // temporary client-side ID
  objectUrl: string;   // URL.createObjectURL result
  file: File;
  isCover: boolean;
}
