/**
 * Server-side image pipeline for garment photos and category covers.
 * Uses `sharp` (native Node module) — import this only from server code.
 *
 * Quality policy:
 *  - The uploaded file is kept byte-for-byte as the private master copy.
 *    Nothing is ever lost; renditions can be rebuilt from it at any time.
 *  - The public site gets three WebP renditions at high quality. `large` keeps
 *    the photo's full resolution (up to 4096px on the long edge — beyond what
 *    any screen shows), so zooming in on fabric detail stays sharp. next/image
 *    picks the smallest rendition that fits each screen (lib/image-loader.ts).
 *  - Colours are converted to sRGB using the photo's embedded ICC profile, so
 *    what the owner shot is what visitors see. Chroma subsampling is "smart"
 *    to keep thin embroidery/zari lines crisp.
 *  - Public renditions carry no EXIF/GPS metadata (sharp strips it by default).
 */
import sharp, { type Metadata } from "sharp";
import path from "node:path";
import {
  type OwnerKind,
  privateDir,
  publicDir,
  publicUrl,
  readJson,
  removeStored,
  writeFileAtomic,
} from "../storage/index.ts";
import { readFile, readdir } from "node:fs/promises";

export const MAX_UPLOAD_BYTES = 80 * 1024 * 1024; // 80MB — room for large DSLR JPEGs/PNGs

// maxPx is the long edge. Garment photos are mostly 3:4 portrait, so thumb is
// ~600px wide and medium ~1350px wide — the cut-offs lib/image-loader.ts uses.
export const VARIANTS = [
  { name: "thumb",  maxPx: 800,  quality: 82 },
  { name: "medium", maxPx: 1800, quality: 88 },
  { name: "large",  maxPx: 4096, quality: 92 },
] as const;

export type VariantName = (typeof VARIANTS)[number]["name"];

/** Formats accepted as uploads, mapped to the extension the original is saved with. */
const ACCEPTED_FORMATS: Record<string, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
  heif: "heic",
  tiff: "tif",
};

export interface StoredImageMeta {
  format: string;
  ext: string;
  width: number;
  height: number;
  bytes: number;
  uploadedAt: string;
}

export interface StoredImage {
  id: string;
  url: string;          // large rendition
  thumbnailUrl: string; // thumb rendition
  meta: StoredImageMeta;
}

export class InvalidImageError extends Error {}

/** Validates the bytes really are a supported image (never trusts the client's Content-Type/filename). */
async function inspect(input: Buffer): Promise<Omit<StoredImageMeta, "uploadedAt" | "bytes">> {
  let info: Metadata;
  try {
    info = await sharp(input).metadata();
  } catch {
    throw new InvalidImageError("Could not read this image — is it a valid photo?");
  }
  const ext = info.format ? ACCEPTED_FORMATS[info.format] : undefined;
  if (!ext || !info.width || !info.height) {
    throw new InvalidImageError("Unsupported image format. Please upload a JPEG, PNG, WebP, AVIF or TIFF photo.");
  }
  // EXIF orientations 5–8 are rotated 90°, so the displayed width/height swap.
  const rotated = (info.orientation ?? 1) >= 5;
  return {
    format: info.format!,
    ext,
    width: rotated ? info.height : info.width,
    height: rotated ? info.width : info.height,
  };
}

async function renderVariants(input: Buffer, outDir: string): Promise<void> {
  const base = sharp(input, { limitInputPixels: 300_000_000 }).rotate();
  for (const v of VARIANTS) {
    const buf = await base
      .clone()
      .resize({ width: v.maxPx, height: v.maxPx, fit: "inside", withoutEnlargement: true })
      .webp({ quality: v.quality, smartSubsample: true, effort: 4 })
      .toBuffer();
    await writeFileAtomic(path.join(outDir, `${v.name}.webp`), buf);
  }
}

/**
 * Stores one upload: the untouched original (private) plus its public WebP
 * renditions. On any failure, whatever was written is removed again.
 */
export async function storeImage(
  kind: OwnerKind,
  ownerId: string,
  input: Buffer
): Promise<StoredImage> {
  const id = crypto.randomUUID();
  const info = await inspect(input);
  const meta: StoredImageMeta = { ...info, bytes: input.byteLength, uploadedAt: new Date().toISOString() };

  try {
    const origDir = privateDir(kind, ownerId, id);
    await writeFileAtomic(path.join(origDir, `original.${meta.ext}`), input);
    await writeFileAtomic(path.join(origDir, "meta.json"), JSON.stringify(meta, null, 2));
    await renderVariants(input, publicDir(kind, ownerId, id));
  } catch (err) {
    await removeStored(kind, ownerId, id).catch(() => {});
    throw err;
  }

  return {
    id,
    url: publicUrl(kind, ownerId, id, "large.webp"),
    thumbnailUrl: publicUrl(kind, ownerId, id, "thumb.webp"),
    meta,
  };
}

/** Reads back the metadata written at upload time, or null if the upload doesn't exist. */
export async function readStoredMeta(kind: OwnerKind, ownerId: string, id: string): Promise<StoredImageMeta | null> {
  return readJson<StoredImageMeta>(path.join(privateDir(kind, ownerId, id), "meta.json"));
}

/** Rebuilds the public renditions of one stored image from its original. */
export async function regenerateVariants(kind: OwnerKind, ownerId: string, id: string): Promise<void> {
  const meta = await readStoredMeta(kind, ownerId, id);
  if (!meta) throw new Error(`No original stored for ${kind}/${ownerId}/${id}`);
  const original = await readFile(path.join(privateDir(kind, ownerId, id), `original.${meta.ext}`));
  await renderVariants(original, publicDir(kind, ownerId, id));
}

/** Deletes every stored image under an owner except `keepId` (e.g. a replaced category cover). */
export async function removeOtherImages(kind: OwnerKind, ownerId: string, keepId: string): Promise<void> {
  for (const dir of [publicDir(kind, ownerId), privateDir(kind, ownerId)]) {
    const entries = await readdir(dir).catch(() => [] as string[]);
    for (const name of entries) {
      if (name !== keepId) await removeStored(kind, ownerId, name).catch(() => {});
    }
  }
}
