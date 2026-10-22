/**
 * Category query functions — server-side data fetching.
 * Public queries call connection() so pages render per request (always
 * showing current data) instead of being prerendered at build time, when
 * no database is available.
 *
 * Public queries filter out hidden categories explicitly; admin queries
 * check the owner session first.
 */
import { connection } from "next/server";
import { sql } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import type { Category } from "@/lib/db/types";

/** Public: visible categories ordered by display_order. */
export async function getCategories(): Promise<Category[]> {
  await connection();
  return sql<Category[]>`
    SELECT * FROM categories WHERE is_visible ORDER BY display_order ASC
  `;
}

/** Public: single visible category by slug. Returns null if not found / hidden. */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  await connection();
  const rows = await sql<Category[]>`
    SELECT * FROM categories WHERE slug = ${slug} AND is_visible
  `;
  return rows[0] ?? null;
}

/** Admin: all categories including hidden ones, ordered by display_order. */
export async function getAllCategoriesAdmin(): Promise<Category[]> {
  await requireOwner();
  return sql<Category[]>`SELECT * FROM categories ORDER BY display_order ASC`;
}

/**
 * Admin: garment count per category.
 * Returns a map of category_id → count.
 */
export async function getCategoryGarmentCounts(): Promise<Record<string, number>> {
  await requireOwner();
  const rows = await sql<{ category_id: string; count: number }[]>`
    SELECT category_id, count(*)::int AS count FROM garments GROUP BY category_id
  `;
  return Object.fromEntries(rows.map((r) => [r.category_id, r.count]));
}
