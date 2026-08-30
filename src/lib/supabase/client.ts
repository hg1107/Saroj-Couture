import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Browser-side Supabase client.
 * Use in Client Components ("use client") only.
 * Creates a singleton per call — safe to call at module level.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Session cookie lifetime — 30 days.
      cookieOptions: { maxAge: 60 * 60 * 24 * 30 },
    }
  );
}
