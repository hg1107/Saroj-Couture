/**
 * Garment query functions — server-side data fetching.
 * Public queries rely on anon RLS: only published garments in visible categories.
 */
import { createServerClient } from "@/lib/supabase/server";
import type { GarmentWithCategory, GarmentWithImages } from "@/lib/supabase/types";
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
  images ( id, url, alt_text, display_order )
`.trim();

/**
 * Public: featured garments (is_featured = true, published, visible category).
 * Returns garments with their cover image (display_order = 0).
 */
export async function getFeaturedGarments(): Promise<GarmentWithCategory[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("garments")
    .select(COVER_IMAGE_SELECT)
    .eq("is_featured", true)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getFeaturedGarments: ${error.message}`);
  return (data ?? []) as GarmentWithCategory[];
}

/**
 * Public: all published garments in a visible category (by category slug).
 */
export async function getGarmentsByCategory(
  categorySlug: string
): Promise<GarmentWithCategory[]> {
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
  return (data ?? []) as GarmentWithCategory[];
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
      images ( id, url, alt_text, display_order )
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
 * Admin: all garments with optional search and category filter.
 */
export async function getAllGarmentsAdmin(
  search?: string,
  categoryId?: string
): Promise<GarmentWithCategory[]> {
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
  return (data ?? []) as GarmentWithCategory[];
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
      images ( id, url, alt_text, display_order )
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


