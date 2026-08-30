/**
 * Best-effort in-memory fixed-window rate limiter.
 *
 * This only throttles within a single server instance/process — on a
 * multi-instance deployment (e.g. several Vercel lambdas) each instance
 * keeps its own counters, so a determined attacker spread across instances
 * isn't fully stopped. It's still a real deterrent against a single-source
 * brute-force script, and layers on top of (never replaces) Supabase Auth's
 * own server-side sign-in throttling.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Returns true if `key` is still within its allowance for this window,
 * and records one more attempt against it. Once the window (`windowMs`)
 * elapses since the first attempt, the counter resets.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
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
