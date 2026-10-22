/**
 * Garment query functions — server-side data fetching.
 *
 * Public queries call connection() so pages render per request (always
 * showing current data) instead of being prerendered at build time, when
 * no database is available.
 *
 * Public queries must only ever return published garments in visible
 * categories — PUBLIC_FILTER enforces that in every one of them. Admin
 * queries check the owner session first.
 */
import { connection } from "next/server";
import { sql, type Fragment } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { isUuid } from "@/lib/storage";
import type { GarmentWithImages, GarmentListItem } from "@/lib/db/types";
export { formatPrice } from "@/lib/utils/format";

const PUBLIC_FILTER = sql`g.status = 'published' AND c.is_visible`;

/** Garment columns + category + compact image list, for grids and admin lists. */
function listSelect(where: Fragment) {
  return sql<GarmentListItem[]>`
    SELECT g.*,
           json_build_object('name', c.name, 'slug', c.slug) AS categories,
           COALESCE((
             SELECT json_agg(json_build_object(
                      'id', i.id, 'url', i.url, 'thumbnail_url', i.thumbnail_url,
                      'alt_text', i.alt_text, 'display_order', i.display_order,
                      'width', i.width, 'height', i.height
                    ) ORDER BY i.display_order)
               FROM images i
              WHERE i.garment_id = g.id
           ), '[]'::json) AS images
      FROM garments g
      JOIN categories c ON c.id = g.category_id
     WHERE ${where}
     ORDER BY g.created_at DESC
  `;
}

/** One garment with every image column, for the detail/edit pages. */
async function detailSelect(where: Fragment): Promise<GarmentWithImages | null> {
  const rows = await sql<GarmentWithImages[]>`
    SELECT g.*,
           json_build_object('name', c.name, 'slug', c.slug) AS categories,
           COALESCE((
             SELECT json_agg(i ORDER BY i.display_order)
               FROM images i
              WHERE i.garment_id = g.id
           ), '[]'::json) AS images
      FROM garments g
      JOIN categories c ON c.id = g.category_id
     WHERE ${where}
  `;
  return rows[0] ?? null;
}

/** Public: featured garments (is_featured = true, published, visible category). */
export async function getFeaturedGarments(): Promise<GarmentListItem[]> {
  await connection();
  return listSelect(sql`${PUBLIC_FILTER} AND g.is_featured`);
}

/** Public: all published garments across all visible categories (for Gallery page). */
export async function getAllPublishedGarmentsWithImages(): Promise<GarmentListItem[]> {
  await connection();
  return listSelect(PUBLIC_FILTER);
}

/** Public: all published garments in a visible category (by category slug). */
export async function getGarmentsByCategory(categorySlug: string): Promise<GarmentListItem[]> {
  await connection();
  return listSelect(sql`${PUBLIC_FILTER} AND c.slug = ${categorySlug}`);
}

/** Public: single published garment (in a visible category) with all images. */
export async function getGarmentBySlug(slug: string): Promise<GarmentWithImages | null> {
  await connection();
  return detailSelect(sql`${PUBLIC_FILTER} AND g.slug = ${slug}`);
}

/**
 * Admin: all garments regardless of status (published + hidden), with
 * optional search and category filter.
 */
export async function getAllGarmentsAdmin(
  search?: string,
  categoryId?: string
): Promise<GarmentListItem[]> {
  await requireOwner();
  const conditions: Fragment[] = [sql`TRUE`];
  if (search) {
    const escaped = search.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    conditions.push(sql`g.title ILIKE ${`%${escaped}%`}`);
  }
  if (categoryId && isUuid(categoryId)) conditions.push(sql`g.category_id = ${categoryId}`);
  const where = conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`);
  return listSelect(where);
}

/** Admin: single garment by id (any status). */
export async function getGarmentByIdAdmin(id: string): Promise<GarmentWithImages | null> {
  await requireOwner();
  if (!isUuid(id)) return null;
  return detailSelect(sql`g.id = ${id}`);
}

/**
 * Public: slug + updated_at for every published garment in a visible
 * category — used to build the sitemap.
 */
export async function getAllPublishedGarments(): Promise<{ slug: string; updated_at: string }[]> {
  await connection();
  return sql<{ slug: string; updated_at: string }[]>`
    SELECT g.slug, g.updated_at
      FROM garments g
      JOIN categories c ON c.id = g.category_id
     WHERE ${PUBLIC_FILTER}
     ORDER BY g.created_at DESC
  `;
}
