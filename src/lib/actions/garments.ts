"use server";

import { revalidatePath } from "next/cache";
import { sql, type Tx } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { slugify, uniqueSlug } from "@/lib/utils/slug";
import { isUuid, publicUrl, removeStored } from "@/lib/storage";
import { readStoredMeta, type StoredImageMeta } from "@/lib/utils/image-processing";
import { ADMIN } from "@/lib/utils/constants";

export interface GarmentFormState {
  error?: string;
  success?: boolean;
}

// ─── Images ─────────────────────────────────────────────────────────────────
// Photos are uploaded (original kept + WebP renditions rendered) by
// /api/admin/garment-images as soon as they're picked in the form — by the
// time the garment is saved, each already-uploaded image's id arrives as a
// hidden-field array, in the order the owner arranged them (index 0 = cover).
// Each save replaces the garment's image rows with that submitted set.

interface ImageToSave {
  id: string;
  meta: StoredImageMeta;
}

/** Validates the submitted image ids against what's actually on disk. */
async function collectImages(garmentId: string, formData: FormData): Promise<ImageToSave[] | string> {
  const ids = formData.getAll("image_ids").map(String);
  if (ids.length > ADMIN.maxImagesPerGarment) return `At most ${ADMIN.maxImagesPerGarment} photos per garment.`;
  if (ids.some((id) => !isUuid(id))) return "Invalid image id.";

  const images: ImageToSave[] = [];
  for (const id of ids) {
    const meta = await readStoredMeta("garments", garmentId, id);
    if (!meta) return "One of the photos is missing on the server — please remove it and upload it again.";
    images.push({ id, meta });
  }
  return images;
}

async function replaceGarmentImages(tx: Tx, garmentId: string, images: ImageToSave[]) {
  await tx`DELETE FROM images WHERE garment_id = ${garmentId}`;
  if (images.length === 0) return;

  // URLs are derived server-side from the id — never taken from the client.
  const rows = images.map(({ id, meta }, i) => ({
    id,
    garment_id: garmentId,
    url: publicUrl("garments", garmentId, id, "large.webp"),
    thumbnail_url: publicUrl("garments", garmentId, id, "thumb.webp"),
    width: meta.width,
    height: meta.height,
    original_format: meta.format,
    original_bytes: meta.bytes,
    display_order: i,
  }));
  await tx`INSERT INTO images ${tx(rows)}`;
}

function readGarmentFields(formData: FormData) {
  const priceType = String(formData.get("price_type") ?? "fixed");
  const priceRaw  = String(formData.get("price") ?? "").trim();
  const price     = priceType === "on_enquiry" || !priceRaw ? null : Math.round(Number(priceRaw));
  return {
    title:       String(formData.get("title") ?? "").trim(),
    category_id: String(formData.get("category_id") ?? ""),
    fabric:      String(formData.get("fabric") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    price_type:  priceType,
    price,
    is_featured: formData.get("is_featured") === "on",
    status:      formData.get("status") === "on" ? "published" : "hidden",
  };
}

function validateGarmentFields(f: ReturnType<typeof readGarmentFields>): string | undefined {
  if (!f.title || !f.category_id) return "Title and category are required.";
  if (!isUuid(f.category_id)) return "Invalid category.";
  if (!["fixed", "starting_from", "on_enquiry"].includes(f.price_type)) return "Invalid price type.";
  if (f.price !== null && (!Number.isFinite(f.price) || f.price < 0)) return "Price must be a positive number.";
  if (f.description && f.description.length > ADMIN.descriptionMaxLength) {
    return `Description must be at most ${ADMIN.descriptionMaxLength} characters.`;
  }
  return undefined;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createGarment(
  _prev: GarmentFormState | undefined,
  formData: FormData
): Promise<GarmentFormState> {
  await requireOwner();
  const fields = readGarmentFields(formData);
  const invalid = validateGarmentFields(fields);
  if (invalid) return { error: invalid };

  // Reuse the id the browser pre-generated for the photo upload folder.
  const presetId = String(formData.get("garment_id") ?? "");
  const id = isUuid(presetId) ? presetId : crypto.randomUUID();

  const images = await collectImages(id, formData);
  if (typeof images === "string") return { error: images };

  const slug = await uniqueSlug(slugify(fields.title) || "garment", async (candidate) => {
    const rows = await sql`SELECT 1 FROM garments WHERE slug = ${candidate}`;
    return rows.length > 0;
  });

  try {
    await sql.begin(async (tx) => {
      await tx`INSERT INTO garments ${tx({ id, slug, ...fields })}`;
      await replaceGarmentImages(tx, id, images);
    });
  } catch (err) {
    console.error("createGarment failed:", err);
    return { error: "Could not save this garment. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateGarment(
  id: string,
  _prev: GarmentFormState | undefined,
  formData: FormData
): Promise<GarmentFormState> {
  await requireOwner();
  if (!isUuid(id)) return { error: "Invalid garment." };
  const fields = readGarmentFields(formData);
  const invalid = validateGarmentFields(fields);
  if (invalid) return { error: invalid };

  const images = await collectImages(id, formData);
  if (typeof images === "string") return { error: images };

  try {
    await sql.begin(async (tx) => {
      await tx`UPDATE garments SET ${tx(fields)} WHERE id = ${id}`;
      await replaceGarmentImages(tx, id, images);
    });
  } catch (err) {
    console.error("updateGarment failed:", err);
    return { error: "Could not save this garment. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteGarment(id: string): Promise<GarmentFormState> {
  await requireOwner();
  if (!isUuid(id)) return { error: "Invalid garment." };

  await sql`DELETE FROM garments WHERE id = ${id}`; // images rows cascade
  // Removes every photo under this garment — including any uploaded but never saved.
  await removeStored("garments", id).catch((err) =>
    console.error("Failed to clean up garment image files:", err)
  );

  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Toggle status ────────────────────────────────────────────────────────────

export async function toggleGarmentStatus(id: string, current: string): Promise<GarmentFormState> {
  await requireOwner();
  if (!isUuid(id)) return { error: "Invalid garment." };
  const next = current === "published" ? "hidden" : "published";
  await sql`UPDATE garments SET status = ${next} WHERE id = ${id}`;
  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Toggle featured ──────────────────────────────────────────────────────────

export async function toggleGarmentFeatured(id: string, current: boolean): Promise<GarmentFormState> {
  await requireOwner();
  if (!isUuid(id)) return { error: "Invalid garment." };
  await sql`UPDATE garments SET is_featured = ${!current} WHERE id = ${id}`;
  revalidatePath("/", "layout");
  return { success: true };
}
