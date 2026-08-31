import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processGarmentImage } from "@/lib/utils/image-processing";
import { STORAGE } from "@/lib/utils/constants";
import { garmentImagePaths as storagePaths } from "@/lib/utils/garment-image-paths";

// sharp needs the Node.js runtime (native bindings) — never edge.
export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB — generous ceiling above a typical phone photo

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireAuth() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Upload one image: process server-side, store both renditions ─────────

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData  = await request.formData();
  const file      = formData.get("file");
  const garmentId = String(formData.get("garmentId") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!garmentId || !UUID_RE.test(garmentId)) {
    return NextResponse.json({ error: "Missing or invalid garmentId" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "That file isn't an image" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 20MB)" }, { status: 400 });
  }

  let processed;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    processed = await processGarmentImage(inputBuffer);
  } catch {
    return NextResponse.json({ error: "Could not process this image — is it a valid photo?" }, { status: 422 });
  }

  const imageId = crypto.randomUUID();
  const { fullPath, thumbPath } = storagePaths(garmentId, imageId);
  const admin = createAdminClient();

  const [fullUpload, thumbUpload] = await Promise.all([
    admin.storage.from(STORAGE.garmentImages).upload(fullPath, processed.full, {
      contentType: "image/webp",
      upsert: false,
    }),
    admin.storage.from(STORAGE.garmentImages).upload(thumbPath, processed.thumbnail, {
      contentType: "image/webp",
      upsert: false,
    }),
  ]);

  if (fullUpload.error || thumbUpload.error) {
    // Best-effort cleanup of whichever half succeeded, so we don't leave an orphan.
    await admin.storage.from(STORAGE.garmentImages).remove([fullPath, thumbPath]);
    const message = fullUpload.error?.message ?? thumbUpload.error?.message ?? "Upload failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { data: fullUrl }  = admin.storage.from(STORAGE.garmentImages).getPublicUrl(fullPath);
  const { data: thumbUrl } = admin.storage.from(STORAGE.garmentImages).getPublicUrl(thumbPath);

  return NextResponse.json({
    id: imageId,
    url: fullUrl.publicUrl,
    thumbnailUrl: thumbUrl.publicUrl,
  });
}

// ─── Remove one already-uploaded image (before or after the garment is saved) ─

export async function DELETE(request: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const garmentId = body?.garmentId ? String(body.garmentId) : "";
  const imageId   = body?.imageId ? String(body.imageId) : "";

  if (!garmentId || !imageId || !UUID_RE.test(garmentId) || !UUID_RE.test(imageId)) {
    return NextResponse.json({ error: "Missing or invalid garmentId or imageId" }, { status: 400 });
  }

  const { fullPath, thumbPath } = storagePaths(garmentId, imageId);
  const admin = createAdminClient();
  const { error } = await admin.storage.from(STORAGE.garmentImages).remove([fullPath, thumbPath]);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });

  return NextResponse.json({ success: true });
}
