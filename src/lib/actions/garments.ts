"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { slugify, uniqueSlug } from "@/lib/utils/slug";

export interface GarmentFormState {
  error?: string;
  success?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

async function db(): Promise<AnySupabase> {
  return (await createServerClient()) as AnySupabase;
}

// ─── Images ─────────────────────────────────────────────────────────────────
// Photos are uploaded (and processed into full + thumbnail WebP renditions)
// server-side by /api/admin/garment-images as soon as they're picked in the
// form — by the time the garment is saved, each already-uploaded image's id
// (which doubles as its Storage path segment), full URL, and thumbnail URL
// arrive as parallel hidden-field arrays, in the order the owner arranged
// them (index 0 = cover). Each save replaces the garment's image rows with
// that submitted set, reusing the same ids the Storage objects were written
// under so a later edit can still resolve their paths (e.g. to delete them).

async function saveGarmentImages(
  supabase: AnySupabase,
  garmentId: string,
  formData: FormData
): Promise<string | undefined> {
  const ids          = formData.getAll("image_ids").map(String);
  const urls         = formData.getAll("image_urls").map(String);
  const thumbnailUrls = formData.getAll("image_thumbnail_urls").map(String);

  const { error: delError } = await supabase.from("images").delete().eq("garment_id", garmentId);
  if (delError) return delError.message;
  if (ids.length === 0) return undefined;

  const rows = ids.map((id, i) => ({
    id,
    garment_id: garmentId,
    url: urls[i],
    thumbnail_url: thumbnailUrls[i],
    display_order: i,
    alt_text: null as string | null,
  }));
  const { error: insError } = await supabase.from("images").insert(rows);
  return insError?.message;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createGarment(
  _prev: GarmentFormState | undefined,
  formData: FormData
): Promise<GarmentFormState> {
  const supabase    = await db();
  const presetId    = String(formData.get("garment_id") ?? "") || undefined;
  const title       = String(formData.get("title") ?? "").trim();
  const categoryId  = String(formData.get("category_id") ?? "");
  const fabric      = String(formData.get("fabric") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceType   = String(formData.get("price_type") ?? "fixed");
  const priceRaw    = formData.get("price");
  const price       = priceType === "on_enquiry" || !priceRaw ? null : Number(priceRaw);
  const isFeatured  = formData.get("is_featured") === "on";
  const status      = formData.get("status") === "on" ? "published" : "hidden";

  if (!title || !categoryId) return { error: "Title and category are required." };

  const slug = await uniqueSlug(slugify(title), async (candidate) => {
    const { data } = await supabase.from("garments").select("id").eq("slug", candidate).maybeSingle();
    return !!data;
  });
  // Reuse the id the browser pre-generated for the photo-upload Storage path
  // (falls back to the DB default if it's somehow missing).
  const row = { id: presetId, title, slug, category_id: categoryId, fabric, description, price, price_type: priceType, is_featured: isFeatured, status };

  const { data: garment, error } = await supabase
    .from("garments")
    .insert(row)
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (garment?.id) {
    const imgError = await saveGarmentImages(supabase, garment.id, formData);
    if (imgError) return { error: imgError };
  }

  revalidatePath("/");
  revalidatePath("/admin/garments");
  return { success: true };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateGarment(
  id: string,
  _prev: GarmentFormState | undefined,
  formData: FormData
): Promise<GarmentFormState> {
  const supabase   = await db();
  const priceType  = String(formData.get("price_type") ?? "fixed");
  const priceRaw   = formData.get("price");
  const price      = priceType === "on_enquiry" || !priceRaw ? null : Number(priceRaw);
  const updates    = {
    title:       String(formData.get("title") ?? "").trim() || undefined,
    category_id: String(formData.get("category_id") ?? "") || undefined,
    fabric:      String(formData.get("fabric") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    price_type:  priceType,
    price,
    is_featured: formData.get("is_featured") === "on",
    status:      formData.get("status") === "on" ? "published" : "hidden",
  };
  const { error } = await supabase.from("garments").update(updates).eq("id", id);
  if (error) return { error: error.message };

  const imgError = await saveGarmentImages(supabase, id, formData);
  if (imgError) return { error: imgError };

  revalidatePath("/");
  revalidatePath(`/admin/garments/${id}`);
  revalidatePath("/admin/garments");
  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteGarment(id: string): Promise<GarmentFormState> {
  const supabase = await db();
  const { error } = await supabase.from("garments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/garments");
  return { success: true };
}

// ─── Toggle status ────────────────────────────────────────────────────────────

export async function toggleGarmentStatus(id: string, current: string): Promise<GarmentFormState> {
  const supabase = await db();
  const next     = current === "published" ? "hidden" : "published";
  const { error } = await supabase.from("garments").update({ status: next }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/garments");
  return { success: true };
}

// ─── Toggle featured ──────────────────────────────────────────────────────────

export async function toggleGarmentFeatured(id: string, current: boolean): Promise<GarmentFormState> {
  const supabase = await db();
  const { error } = await supabase.from("garments").update({ is_featured: !current }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/garments");
  return { success: true };
}
