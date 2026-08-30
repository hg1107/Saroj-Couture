/**
 * Garment query functions — server-side data fetching.
 * Public queries rely on anon RLS: only published garments in visible categories.
 */
import { createServerClient } from "@/lib/supabase/server";
import type { GarmentWithImages, GarmentListItem } from "@/lib/supabase/types";
export { formatPrice } from "@/lib/utils/format";

const COVER_IMAGE_SELECT = `
  id,
  title,
  slug,
  category_id,
  fabric,
  description,
  price,
  price_type,
  is_featured,
  status,
  created_at,
  updated_at,
  categories ( name, slug ),
  images ( id, url, thumbnail_url, alt_text, display_order )
`.trim();

/**
 * Public: featured garments (is_featured = true, published, visible category).
 * Returns garments with their cover image (display_order = 0).
 */
export async function getFeaturedGarments(): Promise<GarmentListItem[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("garments")
    .select(COVER_IMAGE_SELECT)
    .eq("is_featured", true)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getFeaturedGarments: ${error.message}`);
  return (data ?? []) as GarmentListItem[];
}

/**
 * Public: all published garments across all visible categories (for Gallery page).
 */
export async function getAllPublishedGarmentsWithImages(): Promise<GarmentListItem[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("garments")
    .select(COVER_IMAGE_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllPublishedGarmentsWithImages: ${error.message}`);
  return (data ?? []) as GarmentListItem[];
}

/**
 * Public: all published garments in a visible category (by category slug).
 */
export async function getGarmentsByCategory(
  categorySlug: string
): Promise<GarmentListItem[]> {
  const supabase = await createServerClient();

  // First resolve the category id from slug
  const { data: catData, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .eq("is_visible", true)
    .single();

  const cat = catData as { id: string } | null;
  if (catError || !cat) return [];

  const { data, error } = await supabase
    .from("garments")
    .select(COVER_IMAGE_SELECT)
    .eq("category_id", cat.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getGarmentsByCategory: ${error.message}`);
  return (data ?? []) as GarmentListItem[];
}

/**
 * Public: single published garment with all images and category.
 */
export async function getGarmentBySlug(slug: string): Promise<GarmentWithImages | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("garments")
    .select(`
      *,
      categories ( name, slug ),
      images ( id, url, thumbnail_url, alt_text, display_order )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .order("display_order", { referencedTable: "images", ascending: true })
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getGarmentBySlug: ${error.message}`);
  }
  return data as GarmentWithImages;
}

/**
 * Admin: all garments regardless of status (published + hidden), with
 * optional search and category filter. Relies on the `auth_select_all_garments`
 * RLS policy (TO authenticated) — an anon/unauthenticated request only ever
 * gets back published garments in visible categories, never hidden ones.
 */
export async function getAllGarmentsAdmin(
  search?: string,
  categoryId?: string
): Promise<GarmentListItem[]> {
  const supabase = await createServerClient();
  let query = supabase
    .from("garments")
    .select(COVER_IMAGE_SELECT)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getAllGarmentsAdmin: ${error.message}`);
  return (data ?? []) as GarmentListItem[];
}

/**
 * Admin: single garment by id (any status).
 */
export async function getGarmentByIdAdmin(id: string): Promise<GarmentWithImages | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("garments")
    .select(`
      *,
      categories ( name, slug ),
      images ( id, url, thumbnail_url, alt_text, display_order )
    `)
    .eq("id", id)
    .order("display_order", { referencedTable: "images", ascending: true })
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getGarmentByIdAdmin: ${error.message}`);
  }
  return data as GarmentWithImages;
}

/**
 * Public: slug + updated_at for every published garment — used to build the
 * sitemap. Runs as anon, so RLS (`anon_select_published_garments`) also
 * excludes any garment sitting in a hidden category, exactly like the public
 * pages themselves.
 */
export async function getAllPublishedGarments(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("garments")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllPublishedGarments: ${error.message}`);
  return data ?? [];
}

