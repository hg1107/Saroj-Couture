import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "./types";

/**
 * Supabase middleware helper.
 * Refreshes the auth session on every request so server components
 * always see a valid (non-expired) session.
 *
 * `nonce` is forwarded as an `x-nonce` request header so Server Components
 * can read it via `headers()` if they ever need to nonce a custom inline
 * script — Next also auto-applies it to its own bootstrap script once it
 * sees the matching value in the CSP response header (set by the caller).
 *
 * Used inside src/proxy.ts — do not import in components.
 */
export async function updateSession(request: NextRequest, nonce: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Skip auth checks if env vars are missing or are the default placeholders (allows scaffold to boot)
  if (!supabaseUrl || supabaseUrl.includes("<your-project-ref>")) {
    return supabaseResponse;
  }

  // Session cookie lifetime — 30 days.
  const THIRTY_DAYS = 60 * 60 * 24 * 30;

  const supabase = createSSRServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookieOptions: { maxAge: THIRTY_DAYS },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — required for Server Components to read auth state.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Admin routes reachable without a session (login + forgot-password).
  const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

  // Guard /admin/* — redirect unauthenticated users to /admin/login
  if (
    pathname.startsWith("/admin") &&
    !PUBLIC_ADMIN_PATHS.includes(pathname) &&
    !user
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    const redirectRes = NextResponse.redirect(loginUrl);
    // Preserve any cookies updated by supabase.auth.getUser()
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value);
    });
    return redirectRes;
  }

  // Guard /admin/login — redirect already-authenticated users away from login
  if (pathname === "/admin/login" && user) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin/garments";
    const redirectRes = NextResponse.redirect(adminUrl);
    // Preserve any cookies updated by supabase.auth.getUser()
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value);
    });
    return redirectRes;
  }

  return supabaseResponse;
}
