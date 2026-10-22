import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { publicFilePath } from "@/lib/storage";

/**
 * Serves the public photo renditions from STORAGE_DIR/public.
 *
 * Every file lives under a fresh random id and is never overwritten in place
 * (a replaced photo gets a new id/URL), so responses are cached for a year as
 * immutable — browsers and any CDN in front (e.g. Cloudflare) only fetch each
 * file once.
 */
export const runtime = "nodejs";

// <kind>/<uuid>/<uuid>/<variant>.webp — nothing else is ever served.
const SEGMENT_RES = [
  /^(garments|categories)$/,
  /^[0-9a-f-]{36}$/,
  /^[0-9a-f-]{36}$/,
  /^(thumb|medium|large)\.webp$/,
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (segments.length !== SEGMENT_RES.length || !segments.every((s, i) => SEGMENT_RES[i].test(s))) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = publicFilePath(segments);
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) return new Response("Not found", { status: 404 });

  const etag = `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  const headers = new Headers({
    "Content-Type": "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
    "ETag": etag,
    "Last-Modified": info.mtime.toUTCString(),
    "X-Content-Type-Options": "nosniff",
  });

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  headers.set("Content-Length", String(info.size));
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, { headers });
}
