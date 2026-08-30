"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CategoryFormState {
  error?: string;
  success?: boolean;
  id?: string;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uploadCoverImage(categoryId: string, file: File): Promise<string> {
  const admin = createAdminClient();
  const ext   = file.name.split(".").pop() ?? "jpg";
  const path  = `categories/${categoryId}/cover.${ext}`;
  const { error } = await admin.storage
    .from("category-images")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(`Cover upload failed: ${error.message}`);
  const { data } = admin.storage.from("category-images").getPublicUrl(path);
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
  const supabase  = await db();
  const name      = String(formData.get("name") ?? "").trim();
  const isVisible = formData.get("is_visible") !== "off";
  if (!name) return { error: "Category name is required." };
  const slug = toSlug(name);

  const { data: cat, error } = await supabase
    .from("categories")
    .insert({ name, slug, is_visible: isVisible })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const r2 = await supabase
        .from("categories")
        .insert({ name, slug: `${slug}-${Date.now().toString().slice(-4)}`, is_visible: isVisible })
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
    const url = await uploadCoverImage(id, coverFile);
    await supabase.from("categories").update({ cover_image_url: url }).eq("id", id);
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateCategory(
  id: string,
  _prev: CategoryFormState | undefined,
  formData: FormData
): Promise<CategoryFormState> {
  const supabase = await db();
  const updates = {
    name:       String(formData.get("name") ?? "").trim() || undefined,
    is_visible: formData.get("is_visible") !== "off",
  };
  const coverFile = formData.get("cover_image") as File | null;
  if (coverFile && coverFile.size > 0) {
    Object.assign(updates, { cover_image_url: await uploadCoverImage(id, coverFile) });
  }
  const { error } = await supabase.from("categories").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteCategory(id: string): Promise<CategoryFormState> {
  const supabase = await db();
  const { data: fallback } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "uncategorised")
    .single();
  if (fallback?.id) {
    await supabase.from("garments").update({ category_id: fallback.id }).eq("category_id", id);
  }
  const { error } = await supabase.from("categories").delete().eq("id", id);
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
