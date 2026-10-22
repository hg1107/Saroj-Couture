/**
 * Rebuilds every public WebP rendition from the stored originals — e.g. after
 * changing the sizes/quality in lib/utils/image-processing.ts. Originals are
 * never touched.
 *
 *   npm run images:regenerate
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { STORAGE_ROOT, isUuid } from "../lib/storage/index.ts";
import { regenerateVariants } from "../lib/utils/image-processing.ts";

const originalsRoot = path.join(STORAGE_ROOT, "private", "originals");
let done = 0;
let failed = 0;

for (const kind of ["garments", "categories"] as const) {
  const owners = await readdir(path.join(originalsRoot, kind)).catch(() => [] as string[]);
  for (const ownerId of owners.filter(isUuid)) {
    const ids = await readdir(path.join(originalsRoot, kind, ownerId)).catch(() => [] as string[]);
    for (const id of ids.filter(isUuid)) {
      try {
        await regenerateVariants(kind, ownerId, id);
        done++;
        if (done % 50 === 0) console.log(`${done} images regenerated…`);
      } catch (err) {
        failed++;
        console.error(`Failed ${kind}/${ownerId}/${id}:`, err);
      }
    }
  }
}

console.log(`Done: ${done} regenerated, ${failed} failed.`);
if (failed) process.exitCode = 1;
