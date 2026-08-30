import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "./types";

/**
 * Supabase middleware helper.
 * Refreshes the auth session on every request so server components
 * always see a valid (non-expired) session.
 *
 * Used inside src/proxy.ts — do not import in components.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Skip auth checks if env vars are missing or are the default placeholders (allows scaffold to boot)
  if (!supabaseUrl || supabaseUrl.includes("<your-project-ref>")) {
    return supabaseResponse;
  }

  const supabase = createSSRServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
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
  
  // Guard /admin/* — redirect unauthenticated users to /auth/login
  if (pathname.startsWith("/admin") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    const redirectRes = NextResponse.redirect(loginUrl);
    // Preserve any cookies updated by supabase.auth.getUser()
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value);
    });
    return redirectRes;
  }

  // Guard /auth/login — redirect authenticated users away from login
  if (pathname === "/auth/login" && user) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    const redirectRes = NextResponse.redirect(adminUrl);
    // Preserve any cookies updated by supabase.auth.getUser()
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value);
    });
    return redirectRes;
  }

  return supabaseResponse;
}
