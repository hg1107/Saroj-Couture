/**
 * Server-side image processing pipeline for garment photos.
 * Uses `sharp` (native Node module) — import this only from a Route Handler
 * or other server-only code, never from a Client Component.
 */
import sharp from "sharp";

const FULL_MAX_PX      = 1200; // max dimension for the full-size image
const THUMB_MAX_PX     = 400;  // max dimension for the thumbnail
const FULL_BYTE_BUDGET = 300 * 1024; // ~300KB target for the full-size image
const QUALITY_STEPS    = [80, 70, 60, 50, 40, 30] as const;

export interface ProcessedImage {
  full: Buffer;
  thumbnail: Buffer;
}

/**
 * Auto-orients using the EXIF orientation tag, then re-encodes as WebP.
 * sharp's output never carries EXIF/ICC/GPS metadata unless `.withMetadata()`
 * is called — which it isn't here — so this strips all of it by construction.
 * The full-size render is compressed by stepping down quality until it fits
 * FULL_BYTE_BUDGET (a 6MB phone photo should land comfortably under it).
 */
export async function processGarmentImage(input: Buffer): Promise<ProcessedImage> {
  const oriented = sharp(input).rotate();

  const full = await encodeUnderBudget(
    oriented.clone().resize({ width: FULL_MAX_PX, height: FULL_MAX_PX, fit: "inside", withoutEnlargement: true }),
    FULL_BYTE_BUDGET
  );
  const thumbnail = await encodeUnderBudget(
    oriented.clone().resize({ width: THUMB_MAX_PX, height: THUMB_MAX_PX, fit: "inside", withoutEnlargement: true }),
    FULL_BYTE_BUDGET
  );

  return { full, thumbnail };
}

async function encodeUnderBudget(pipeline: ReturnType<typeof sharp>, maxBytes: number): Promise<Buffer> {
  let smallest: Buffer | null = null;
  for (const quality of QUALITY_STEPS) {
    const buf = await pipeline.clone().webp({ quality }).toBuffer();
    if (!smallest || buf.byteLength < smallest.byteLength) smallest = buf;
    if (buf.byteLength <= maxBytes) return buf;
  }
  // Already at the lowest usable quality — return the smallest we managed.
  return smallest!;
}
