/**
 * Category query functions — server-side data fetching.
 * All public-facing queries use the anon client (RLS filters hidden categories).
 * Admin queries use the same client but are called from authenticated contexts.
 */
import { createServerClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/supabase/types";

/** Public: visible categories ordered by display_order (anon RLS applies). */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_visible", true)
    .order("display_order", { ascending: true });

  if (error) throw new Error(`getCategories: ${error.message}`);
  return data ?? [];
}

/** Public: single visible category by slug. Returns null if not found / hidden. */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`getCategoryBySlug: ${error.message}`);
  }
  return data;
}

/** Admin: all categories including hidden ones, ordered by display_order. */
export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error(`getAllCategoriesAdmin: ${error.message}`);
  return data ?? [];
}

/**
 * Admin: garment count per category.
 * Returns a map of category_id → count.
 */
export async function getCategoryGarmentCounts(): Promise<Record<string, number>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("garments")
    .select("category_id");

  if (error) throw new Error(`getCategoryGarmentCounts: ${error.message}`);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { category_id: string }[]) {
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}
