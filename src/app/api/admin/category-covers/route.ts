import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/storage";
import {
  InvalidImageError,
  MAX_UPLOAD_BYTES,
  removeOtherImages,
  storeImage,
} from "@/lib/utils/image-processing";

// sharp needs the Node.js runtime (native bindings) — never edge.
export const runtime = "nodejs";

/**
 * Sets a category's cover photo. A route handler rather than a Server Action
 * because Server Action bodies are capped at 1MB, far below a full-size photo.
 * Each upload gets a fresh id/URL (so the year-long immutable cache on /media
 * is always correct), then the previous cover is deleted.
 */
export async function POST(request: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData   = await request.formData();
  const file       = formData.get("file");
  const categoryId = String(formData.get("categoryId") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!isUuid(categoryId)) {
    return NextResponse.json({ error: "Missing or invalid categoryId" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Image is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  const [category] = await sql`SELECT id FROM categories WHERE id = ${categoryId}`;
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  let stored;
  try {
    stored = await storeImage("categories", categoryId, Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    if (err instanceof InvalidImageError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("Category cover upload failed:", err);
    return NextResponse.json({ error: "Could not save this image. Please try again." }, { status: 500 });
  }

  await sql`UPDATE categories SET cover_image_url = ${stored.url} WHERE id = ${categoryId}`;
  await removeOtherImages("categories", categoryId, stored.id);

  revalidatePath("/", "layout");
  return NextResponse.json({ url: stored.url });
}
