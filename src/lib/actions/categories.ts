"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processCoverImage } from "@/lib/utils/image-processing";
import { STORAGE } from "@/lib/utils/constants";

export interface CategoryFormState {
  error?: string;
  success?: boolean;
  id?: string;
}

const MAX_COVER_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB ceiling, same as garment photos

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uploadCoverImage(categoryId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file isn't an image");
  }
  if (file.size > MAX_COVER_UPLOAD_BYTES) {
    throw new Error("Image is too large (max 20MB)");
  }

  // Never trust the client's Content-Type/filename for what gets stored —
  // re-encode through sharp so only a real, decoded image (as WebP, with
  // EXIF/GPS metadata stripped) ever reaches public Storage.
  let processed: Buffer;
  try {
    processed = await processCoverImage(Buffer.from(await file.arrayBuffer()));
  } catch {
    throw new Error("Could not process this image — is it a valid photo?");
  }

  const admin = createAdminClient();
  const path  = `categories/${categoryId}/cover.webp`;
  const { error } = await admin.storage
    .from(STORAGE.categoryCovers)
    .upload(path, processed, { contentType: "image/webp", upsert: true });
  if (error) throw new Error(`Cover upload failed: ${error.message}`);

  const { data } = admin.storage.from(STORAGE.categoryCovers).getPublicUrl(path);
  return data.publicUrl;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

async function db() {
  return (await createServerClient()) as AnySupabase;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCategory(
  _prev: CategoryFormState | undefined,
  formData: FormData
): Promise<CategoryFormState> {
  const supabase      = await db();
  const name          = String(formData.get("name") ?? "").trim();
  const isVisible     = formData.get("is_visible") !== "off";
  const displayOrder  = formData.has("display_order") ? Number(formData.get("display_order")) : 0;
  if (!name) return { error: "Category name is required." };
  const slug = toSlug(name);

  const { data: cat, error } = await supabase
    .from("categories")
    .insert({ name, slug, is_visible: isVisible, display_order: displayOrder })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const r2 = await supabase
        .from("categories")
        .insert({ name, slug: `${slug}-${Date.now().toString().slice(-4)}`, is_visible: isVisible, display_order: displayOrder })
        .select("id")
        .single();
      if (r2.error) return { error: r2.error.message };
      await applyCoverImage(supabase, r2.data?.id, formData);
      revalidatePath("/");
      revalidatePath("/admin/categories");
      return { success: true, id: r2.data?.id };
    } else {
      return { error: error.message };
    }
  } else {
    await applyCoverImage(supabase, cat?.id, formData);
  }

  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true, id: cat?.id };
}

async function applyCoverImage(supabase: AnySupabase, id: string | undefined, formData: FormData) {
  if (!id) return;
  const coverFile = formData.get("cover_image") as File | null;
  if (coverFile && coverFile.size > 0) {
    try {
      const url = await uploadCoverImage(id, coverFile);
      await supabase.from("categories").update({ cover_image_url: url }).eq("id", id);
    } catch (err) {
      console.error("Cover image upload error:", err);
    }
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateCategory(
  id: string,
  _prev: CategoryFormState | undefined,
  formData: FormData
): Promise<CategoryFormState> {
  const supabase = await db();

  // Only touch fields actually present in the submission — e.g. a rename-only
  // call must not silently flip is_visible back on, and vice versa.
  const updates: Record<string, unknown> = {};

  const name = String(formData.get("name") ?? "").trim();
  if (name) updates.name = name;

  if (formData.has("is_visible")) {
    updates.is_visible = formData.get("is_visible") !== "off";
  }

  const coverFile = formData.get("cover_image") as File | null;
  if (coverFile && coverFile.size > 0) {
    try {
      updates.cover_image_url = await uploadCoverImage(id, coverFile);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Cover upload failed.";
      return { error: message };
    }
  }

  if (Object.keys(updates).length === 0) return { success: true };

  const { error } = await supabase.from("categories").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Deletes a category and reassigns its garments to "Uncategorised" in a
 * single database transaction (see migration 00003) — never delete the
 * garments, and never leave garments pointing at a deleted category.
 */
export async function deleteCategory(id: string): Promise<CategoryFormState> {
  const supabase = await db();
  const { error } = await supabase.rpc("delete_category_reassign", { p_category_id: id });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}

// ─── Toggle visibility ────────────────────────────────────────────────────────

export async function toggleCategoryVisibility(
  id: string,
  current: boolean
): Promise<CategoryFormState> {
  const supabase = await db();
  const { error } = await supabase.from("categories").update({ is_visible: !current }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderCategories(orderedIds: string[]): Promise<CategoryFormState> {
  const supabase = await db();
  const results  = await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from("categories").update({ display_order: i }).eq("id", id)
    )
  );
  const firstError = results.find((r: AnySupabase) => r.error)?.error;
  if (firstError) return { error: firstError.message };
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}
