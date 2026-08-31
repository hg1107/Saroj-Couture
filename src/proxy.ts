import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets Next's own nonce'd bootstrap script load its
    // chunked scripts without listing every hash; falls back to the nonce
    // alone in browsers that don't support it. unsafe-eval is dev-only
    // (Turbopack HMR needs it; production builds don't).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline `style={{...}}` attributes (used throughout the admin UI) can
    // only be allowed via 'unsafe-inline' — nonces/hashes only cover <style>
    // elements, not the style="" attribute — so this one stays broad.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

/**
 * Next.js proxy (formerly "middleware") — runs at the edge on every matched request.
 * 1. Generates a per-request CSP nonce and sets the Content-Security-Policy header
 *    (Next automatically applies the same nonce to its own inline bootstrap scripts).
 * 2. Refreshes the Supabase auth session (required for Server Components).
 * 3. Guards /admin/* routes — redirects unauthenticated users to /admin/login.
 * 4. Redirects authenticated users away from /admin/login back to /admin/garments.
 *
 * In Next.js 16 the file is named proxy.ts and the export is `proxy` (or default).
 */
export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  const response = await updateSession(request, nonce);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico   (favicon)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
