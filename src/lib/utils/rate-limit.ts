import { sql } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by the `rate_limit_buckets` table, so the
 * count is shared by every server process.
 *
 * Returns true if `key` is still within its allowance for this window, and
 * records one more attempt against it. Once `windowMs` has elapsed since the
 * first attempt, the counter resets. The single INSERT ... ON CONFLICT
 * statement is atomic, so concurrent callers can't race into under-counting.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const [row] = await sql<{ count: number }[]>`
    INSERT INTO rate_limit_buckets AS b (key, count, reset_at)
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT (key) DO UPDATE
      SET count    = CASE WHEN b.reset_at <= now() THEN 1 ELSE b.count + 1 END,
          reset_at = CASE WHEN b.reset_at <= now()
                          THEN now() + make_interval(secs => ${windowSeconds})
                          ELSE b.reset_at END
    RETURNING count
  `;
  return row.count <= limit;
}
