import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Supabase service-role (admin) client.
 * Bypasses RLS — use ONLY in server-side code for privileged operations
 * (e.g., uploading/deleting files from Storage on behalf of the owner).
 *
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 * This file must only be imported in Server Actions or API routes.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
