/**
 * Local-disk file storage for photos (server-only).
 *
 * Layout under STORAGE_DIR (default ./storage):
 *
 *   private/originals/garments/<garmentId>/<imageId>/original.<ext>   untouched upload
 *   private/originals/garments/<garmentId>/<imageId>/meta.json        size/format info
 *   public/garments/<garmentId>/<imageId>/{thumb,medium,large}.webp   served at /media/...
 *
 *   (category covers use the same shape with categories/<categoryId>/<coverId>)
 *
 * Originals are never served publicly — they keep the camera's EXIF data
 * (which can include GPS) — but they're the master copy: every public
 * rendition can be regenerated from them at any time (scripts/regenerate-images.ts).
 *
 * Every path is built from validated UUIDs + fixed names, and resolve() refuses
 * anything that would land outside the storage root.
 */
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const STORAGE_ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? "storage");
const PUBLIC_ROOT = path.join(STORAGE_ROOT, "public");
const PRIVATE_ROOT = path.join(STORAGE_ROOT, "private", "originals");

/** URL prefix the public tree is served under (see app/media/[...path]/route.ts). */
export const MEDIA_URL_PREFIX = "/media";

export type OwnerKind = "garments" | "categories";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

function resolveUnder(root: string, ...segments: string[]): string {
  const full = path.resolve(root, ...segments);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Path escapes storage root");
  }
  return full;
}

function assertIds(...ids: string[]) {
  for (const id of ids) if (!isUuid(id)) throw new Error(`Invalid id: ${id}`);
}

/** Absolute path of a file in the public tree, from its /media URL segments. */
export function publicFilePath(segments: string[]): string {
  return resolveUnder(PUBLIC_ROOT, ...segments);
}

export function publicDir(kind: OwnerKind, ownerId: string, fileId?: string): string {
  assertIds(ownerId, ...(fileId ? [fileId] : []));
  return resolveUnder(PUBLIC_ROOT, kind, ownerId, ...(fileId ? [fileId] : []));
}

export function privateDir(kind: OwnerKind, ownerId: string, fileId?: string): string {
  assertIds(ownerId, ...(fileId ? [fileId] : []));
  return resolveUnder(PRIVATE_ROOT, kind, ownerId, ...(fileId ? [fileId] : []));
}

export function publicUrl(kind: OwnerKind, ownerId: string, fileId: string, file: string): string {
  assertIds(ownerId, fileId);
  return `${MEDIA_URL_PREFIX}/${kind}/${ownerId}/${fileId}/${file}`;
}

/** Writes via a temp file + rename, so a crash never leaves a half-written file in place. */
export async function writeFileAtomic(filePath: string, data: Buffer | string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, filePath);
}

export async function removeDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

/** Removes both the public renditions and the private original of one file (or a whole owner). */
export async function removeStored(kind: OwnerKind, ownerId: string, fileId?: string): Promise<void> {
  await Promise.all([
    removeDir(publicDir(kind, ownerId, fileId)),
    removeDir(privateDir(kind, ownerId, fileId)),
  ]);
}

export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}
