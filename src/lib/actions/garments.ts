"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface GarmentFormState {
  error?: string;
  success?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

async function db(): Promise<AnySupabase> {
  return (await createServerClient()) as AnySupabase;
}

// ─── Image upload ─────────────────────────────────────────────────────────────

async function uploadGarmentImages(garmentId: string, files: File[]): Promise<string[]> {
  const admin = createAdminClient();
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext  = file.name.split(".").pop() ?? "jpg";
    const path = `garments/${garmentId}/${Date.now()}_${i}.${ext}`;
    const { error } = await admin.storage
      .from("garment-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data } = admin.storage.from("garment-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function handleImageUploads(garmentId: string, formData: FormData) {
  const files      = formData.getAll("images") as File[];
  const validFiles = files.filter((f) => f && f.size > 0);
  if (validFiles.length === 0) return;
  const urls     = await uploadGarmentImages(garmentId, validFiles);
  const supabase = await db();
  const rows     = urls.map((url, i) => ({
    garment_id: garmentId, url, display_order: i, alt_text: null as string | null,
  }));
  await supabase.from("images").insert(rows);
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createGarment(
  _prev: GarmentFormState | undefined,
  formData: FormData
): Promise<GarmentFormState> {
  const supabase    = await db();
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

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const row  = { title, slug, category_id: categoryId, fabric, description, price, price_type: priceType, is_featured: isFeatured, status };

  const { data: garment, error } = await supabase
    .from("garments")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const r2 = await supabase
        .from("garments")
        .insert({ ...row, slug: `${slug}-${Date.now().toString().slice(-4)}` })
        .select("id")
        .single();
      if (r2.error) return { error: r2.error.message };
      if (r2.data?.id) await handleImageUploads(r2.data.id, formData);
    } else {
      return { error: error.message };
    }
  } else if (garment?.id) {
    await handleImageUploads(garment.id, formData);
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
  await handleImageUploads(id, formData);
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
