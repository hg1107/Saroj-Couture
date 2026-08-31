/**
 * Shared helpers for garment-photo Storage paths.
 * Used by both the upload/delete API route and the save-garment server
 * action, so the two never drift on how an image id maps to a Storage
 * object key.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidImageId(id: string): boolean {
  return UUID_RE.test(id);
}

export function garmentImagePaths(garmentId: string, imageId: string) {
  return {
    fullPath: `garments/${garmentId}/${imageId}-full.webp`,
    thumbPath: `garments/${garmentId}/${imageId}-thumb.webp`,
  };
}
