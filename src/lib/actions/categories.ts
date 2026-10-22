"use server";

import { revalidatePath } from "next/cache";
import { isUniqueViolation, sql } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { isUuid, removeStored } from "@/lib/storage";
import { ADMIN } from "@/lib/utils/constants";

// Cover photos are uploaded through /api/admin/category-covers, not here —
// Server Action bodies are capped at 1MB.

export interface CategoryFormState {
  error?: string;
  success?: boolean;
  id?: string;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "category";
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCategory(
  _prev: CategoryFormState | undefined,
  formData: FormData
): Promise<CategoryFormState> {
  await requireOwner();
  const name         = String(formData.get("name") ?? "").trim();
  const isVisible    = formData.get("is_visible") !== "off";
  const displayOrder = formData.has("display_order") ? Number(formData.get("display_order")) || 0 : 0;
  if (!name) return { error: "Category name is required." };
  const slug = toSlug(name);

  const insert = (s: string) => sql<{ id: string }[]>`
    INSERT INTO categories (name, slug, is_visible, display_order)
    VALUES (${name}, ${s}, ${isVisible}, ${displayOrder})
    RETURNING id
  `;

  let id: string;
  try {
    [{ id }] = await insert(slug);
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    [{ id }] = await insert(`${slug}-${Date.now().toString().slice(-4)}`);
  }

  revalidatePath("/", "layout");
  return { success: true, id };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateCategory(
  id: string,
  _prev: CategoryFormState | undefined,
  formData: FormData
): Promise<CategoryFormState> {
  await requireOwner();
  if (!isUuid(id)) return { error: "Invalid category." };

  // Only touch fields actually present in the submission — e.g. a rename-only
  // call must not silently flip is_visible back on, and vice versa.
  const updates: { name?: string; is_visible?: boolean } = {};

  const name = String(formData.get("name") ?? "").trim();
  if (name) updates.name = name;

  if (formData.has("is_visible")) {
    updates.is_visible = formData.get("is_visible") !== "off";
  }

  if (Object.keys(updates).length === 0) return { success: true };

  await sql`UPDATE categories SET ${sql(updates)} WHERE id = ${id}`;
  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Deletes a category and reassigns its garments to "Uncategorised" in a
 * single transaction — never delete the garments, and never leave garments
 * pointing at a deleted category.
 */
export async function deleteCategory(id: string): Promise<CategoryFormState> {
  await requireOwner();
  if (!isUuid(id)) return { error: "Invalid category." };

  try {
    await sql.begin(async (tx) => {
      const [target] = await tx<{ slug: string }[]>`SELECT slug FROM categories WHERE id = ${id} FOR UPDATE`;
      if (!target) throw new Error("This category no longer exists.");
      if (target.slug === ADMIN.uncategorisedSlug) throw new Error("The Uncategorised category cannot be deleted.");

      const [fallback] = await tx<{ id: string }[]>`
        SELECT id FROM categories WHERE slug = ${ADMIN.uncategorisedSlug}
      `;
      if (!fallback) throw new Error("The Uncategorised category is missing.");

      await tx`UPDATE garments SET category_id = ${fallback.id} WHERE category_id = ${id}`;
      await tx`DELETE FROM categories WHERE id = ${id}`;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete this category." };
  }

  await removeStored("categories", id).catch((err) =>
    console.error("Failed to clean up category cover image:", err)
  );

  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Toggle visibility ────────────────────────────────────────────────────────

export async function toggleCategoryVisibility(
  id: string,
  current: boolean
): Promise<CategoryFormState> {
  await requireOwner();
  if (!isUuid(id)) return { error: "Invalid category." };
  await sql`UPDATE categories SET is_visible = ${!current} WHERE id = ${id}`;
  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderCategories(orderedIds: string[]): Promise<CategoryFormState> {
  await requireOwner();
  if (!Array.isArray(orderedIds) || !orderedIds.every((id) => typeof id === "string" && isUuid(id))) {
    return { error: "Invalid category list." };
  }

  await sql.begin(async (tx) => {
    for (const [i, id] of orderedIds.entries()) {
      await tx`UPDATE categories SET display_order = ${i} WHERE id = ${id}`;
    }
  });
  revalidatePath("/", "layout");
  return { success: true };
}
