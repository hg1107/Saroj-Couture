/**
 * Client-side image processing pipeline.
 * PRD R5: EXIF strip + WebP conversion + resize before upload to Supabase Storage.
 *
 * Runs entirely in the browser using the Canvas API — no server compute cost.
 * Phase 3 task 3.1
 */

const FULL_MAX_PX = 1600;      // max dimension for full-size image
const THUMB_MAX_PX = 400;      // max dimension for thumbnail
const WEBP_QUALITY = 0.82;     // WebP quality (0–1)

export interface ProcessedImage {
  /** Full-size WebP Blob (~<300KB for a 6MB phone photo) */
  full: Blob;
  /** Thumbnail WebP Blob */
  thumbnail: Blob;
  /** Original filename without extension, for use in Storage path */
  baseName: string;
}

/**
 * Process a single image File:
 * - Strips EXIF (canvas re-draw removes all metadata including GPS)
 * - Resizes to fit within FULL_MAX_PX
 * - Converts to WebP
 * - Generates a thumbnail at THUMB_MAX_PX
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file);
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]/gi, "-");

  const full = await resizeAndEncode(bitmap, FULL_MAX_PX);
  const thumbnail = await resizeAndEncode(bitmap, THUMB_MAX_PX);
  bitmap.close();

  return { full, thumbnail, baseName };
}

async function resizeAndEncode(
  bitmap: ImageBitmap,
  maxPx: number
): Promise<Blob> {
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);

  // convertToBlob outputs WebP and strips all EXIF (canvas has no metadata)
  return canvas.convertToBlob({ type: "image/webp", quality: WEBP_QUALITY });
}
