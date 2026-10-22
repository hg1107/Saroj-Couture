import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, getUserForToken } from "@/lib/auth/session";

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
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

// Admin routes reachable without a session.
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

/**
 * Next.js proxy (formerly "middleware") — runs on every matched request.
 * 1. Generates a per-request CSP nonce and sets the Content-Security-Policy header
 *    (Next automatically applies the same nonce to its own inline bootstrap scripts).
 * 2. Redirects signed-out visitors from /admin/* to /admin/login, and signed-in
 *    ones from /admin/login to /admin/garments. This is a convenience only — the
 *    dashboard layout, every admin query/action, and every admin API route
 *    check the session themselves.
 *
 * In Next.js 16 the file is named proxy.ts, runs on the Node.js runtime, and the
 * export is `proxy` (or default).
 */
export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);
  const pathname = request.nextUrl.pathname;

  let redirectTo: string | null = null;
  if (pathname.startsWith("/admin")) {
    const user = await getUserForToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user && !PUBLIC_ADMIN_PATHS.includes(pathname)) redirectTo = "/admin/login";
    else if (user && pathname === "/admin/login") redirectTo = "/admin/garments";
  }

  let response: NextResponse;
  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.search = "";
    response = NextResponse.redirect(url);
  } else {
    // Forward the nonce so Server Components can read it via headers() if
    // they ever need to nonce a custom inline script.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

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
     * - api/          (JSON routes — no HTML to protect with a CSP, and the
     *                  proxy would otherwise buffer large photo uploads in memory)
     * - media/        (garment photos, served by app/media/[...path])
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|media/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
