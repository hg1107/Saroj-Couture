import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid, removeStored } from "@/lib/storage";
import { InvalidImageError, MAX_UPLOAD_BYTES, storeImage } from "@/lib/utils/image-processing";

// sharp needs the Node.js runtime (native bindings) — never edge.
export const runtime = "nodejs";

// ─── Upload one image: keep the original, render the public WebP sizes ─────

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData  = await request.formData();
  const file      = formData.get("file");
  const garmentId = String(formData.get("garmentId") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!isUuid(garmentId)) {
    return NextResponse.json({ error: "Missing or invalid garmentId" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Image is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  try {
    const stored = await storeImage("garments", garmentId, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ id: stored.id, url: stored.url, thumbnailUrl: stored.thumbnailUrl });
  } catch (err) {
    if (err instanceof InvalidImageError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("Garment image upload failed:", err);
    return NextResponse.json({ error: "Could not save this image. Please try again." }, { status: 500 });
  }
}

// ─── Remove one already-uploaded image (before or after the garment is saved) ─

export async function DELETE(request: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const garmentId = body?.garmentId ? String(body.garmentId) : "";
  const imageId   = body?.imageId ? String(body.imageId) : "";

  if (!isUuid(garmentId) || !isUuid(imageId)) {
    return NextResponse.json({ error: "Missing or invalid garmentId or imageId" }, { status: 400 });
  }

  await removeStored("garments", garmentId, imageId);
  return NextResponse.json({ success: true });
}
