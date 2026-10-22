/**
 * Database row types — hand-maintained to match db/migrations/*.sql.
 * Update these whenever a migration changes a table's columns.
 */

export type PriceType = "fixed" | "starting_from" | "on_enquiry";
export type GarmentStatus = "published" | "hidden";

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  cover_image_url: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Garment {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  fabric: string | null;
  description: string | null;
  price: number | null;
  price_type: PriceType;
  is_featured: boolean;
  status: GarmentStatus;
  created_at: string;
  updated_at: string;
}

export interface GarmentImage {
  id: string;
  garment_id: string;
  /** Largest public rendition — next/image's loader swaps in a smaller one by width. */
  url: string;
  thumbnail_url: string;
  /** Original pixel size (after EXIF rotation). */
  width: number;
  height: number;
  original_format: string;
  original_bytes: number;
  alt_text: string | null;
  display_order: number;
  created_at: string;
}

// Garment with joined category name — used in public pages
export type GarmentWithCategory = Garment & {
  categories: Pick<Category, "name" | "slug"> | null;
};

// Garment with its images — used on the detail page
export type GarmentWithImages = Garment & {
  images: GarmentImage[];
  categories: Pick<Category, "name" | "slug"> | null;
};

// Garment with joined category + cover images — used in list views
export type GarmentListItem = GarmentWithCategory & {
  images: Pick<GarmentImage, "id" | "url" | "thumbnail_url" | "alt_text" | "display_order" | "width" | "height">[];
};
