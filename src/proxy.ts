import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

/**
 * Next.js proxy (formerly "middleware") — runs at the edge on every matched request.
 * 1. Refreshes the Supabase auth session (required for Server Components).
 * 2. Guards /admin/* routes — redirects unauthenticated users to /admin/login.
 * 3. Redirects authenticated users away from /admin/login back to /admin/garments.
 *
 * In Next.js 16 the file is named proxy.ts and the export is `proxy` (or default).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
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
