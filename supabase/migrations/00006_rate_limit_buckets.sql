-- =============================================================================
-- 00006_rate_limit_buckets.sql
-- Saroj Couture — durable, cross-instance login/reset rate limiting
--
-- src/lib/utils/rate-limit.ts previously kept its counters in a plain
-- in-memory Map. That only throttles a single Node process — on a
-- multi-instance deployment (e.g. several serverless invocations) each
-- instance has its own counters, so a distributed brute-force attempt isn't
-- actually capped. check_rate_limit() moves the counting into Postgres so
-- every instance shares the same buckets.
--
-- Only the service-role client (which bypasses RLS) ever touches this —
-- RLS is enabled with no policies, so anon/authenticated get nothing, and
-- the function itself is granted to service_role only. The app falls back
-- to the in-memory limiter if this migration hasn't been applied yet or the
-- call fails for any reason (see rate-limit.ts) — applying this migration
-- upgrades login/reset throttling in place, nothing else to wire up.
-- =============================================================================

CREATE TABLE rate_limit_buckets (
    key      text        PRIMARY KEY,
    count    integer     NOT NULL DEFAULT 0,
    reset_at timestamptz NOT NULL
);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- No policies — every role except service_role (which bypasses RLS) gets
-- zero rows and zero access, by default-deny.

-- Atomically records one more attempt against `p_key` and reports whether
-- it's still within `p_limit` for a `p_window_seconds` fixed window,
-- resetting the window once it's elapsed. The INSERT ... ON CONFLICT ...
-- DO UPDATE runs as a single statement, so concurrent callers for the same
-- key can't race each other into under-counting.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key text,
    p_limit int,
    p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now   timestamptz := now();
    v_count integer;
BEGIN
    INSERT INTO rate_limit_buckets (key, count, reset_at)
    VALUES (p_key, 1, v_now + make_interval(secs => p_window_seconds))
    ON CONFLICT (key) DO UPDATE
        SET count    = CASE WHEN rate_limit_buckets.reset_at <= v_now
                             THEN 1
                             ELSE rate_limit_buckets.count + 1 END,
            reset_at = CASE WHEN rate_limit_buckets.reset_at <= v_now
                             THEN v_now + make_interval(secs => p_window_seconds)
                             ELSE rate_limit_buckets.reset_at END
    RETURNING count INTO v_count;

    RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;
