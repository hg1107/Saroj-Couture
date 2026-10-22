import postgres from "postgres";

/**
 * Shared PostgreSQL connection pool (server-only).
 *
 * Connects lazily on the first query, so importing this at build time without
 * a DATABASE_URL is harmless. The pool is cached on globalThis so Next's dev
 * hot-reload doesn't open a fresh pool on every edit.
 *
 * Timestamps come back as ISO strings (not Date objects) so rows can be passed
 * straight to Client Components and match the string types in ./types.ts.
 */

function createPool() {
  return postgres(process.env.DATABASE_URL ?? "postgres://localhost:5432/couture", {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    idle_timeout: 30,
    types: {
      timestamptz: {
        to: 1184,
        from: [1184],
        serialize: (x: string | Date) => (x instanceof Date ? x.toISOString() : x),
        parse: (x: string) => new Date(x).toISOString(),
      },
    },
  });
}

const globalForDb = globalThis as unknown as { __coutureSql?: ReturnType<typeof createPool> };

export const sql = globalForDb.__coutureSql ?? createPool();

if (process.env.NODE_ENV !== "production") globalForDb.__coutureSql = sql;

/** A composable SQL fragment, e.g. a WHERE condition built with sql`...`. */
export type Fragment = postgres.Fragment;
/** The `sql` handle inside sql.begin(async (tx) => ...). */
export type Tx = postgres.TransactionSql<{ timestamptz: string }>;

/** Postgres error code for a unique-constraint violation. */
export const UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === UNIQUE_VIOLATION;
}
