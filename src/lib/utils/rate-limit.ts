import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fixed-window rate limiter, backed by the `check_rate_limit` Postgres
 * function (migration 00006) when it's reachable — shared across every
 * server instance, so it actually caps a distributed brute-force attempt.
 *
 * Falls back to an in-memory Map (this process only) if the DB call fails
 * for any reason: migration not yet applied, service-role env vars missing
 * in this environment, or a transient network error. Either way this layers
 * on top of (never replaces) Supabase Auth's own server-side sign-in
 * throttling.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function checkRateLimitInMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

let warnedFallback = false;

/**
 * Returns true if `key` is still within its allowance for this window,
 * and records one more attempt against it. Once the window (`windowMs`)
 * elapses since the first attempt, the counter resets.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    const admin = createAdminClient();
    // supabase-js's generated-types inference for .rpc() doesn't resolve
    // cleanly against this hand-maintained placeholder Database type (same
    // reason categories.ts casts to AnySupabase for delete_category_reassign)
    // — safe to bypass here since check_rate_limit's args/return are fixed above.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any).rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.ceil(windowMs / 1000),
    });
    if (error) throw error;
    return data as boolean;
  } catch (err) {
    if (!warnedFallback) {
      warnedFallback = true;
      console.warn(
        "checkRateLimit: DB-backed limiter unavailable, falling back to in-memory (per-instance only).",
        err
      );
    }
    return checkRateLimitInMemory(key, limit, windowMs);
  }
}
