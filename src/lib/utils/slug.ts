/**
 * Slug generation utility.
 * Converts a title string to a URL-safe slug.
 * Phase 3 task 3.2
 */

/**
 * Convert a string to a URL-safe slug.
 * e.g. "Silk Organza Saree" → "silk-organza-saree"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove special chars
    .replace(/[\s_-]+/g, "-")   // collapse whitespace + underscores to hyphens
    .replace(/^-+|-+$/g, "");   // strip leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a numeric suffix if the base slug
 * already exists. Requires a checker function that returns true if the slug
 * is already taken.
 *
 * @param base     - Result of slugify(title)
 * @param exists   - Async fn that returns true if the slug is already in DB
 * @returns        - A unique slug (e.g. "silk-organza-saree-2")
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  if (!(await exists(base))) return base;

  let i = 2;
  while (await exists(`${base}-${i}`)) {
    i++;
  }
  return `${base}-${i}`;
}
