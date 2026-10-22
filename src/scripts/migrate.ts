/**
 * Applies any not-yet-applied db/migrations/*.sql files, in filename order,
 * each in its own transaction. Safe to run on every deploy (the Docker image
 * runs it before starting the server).
 *
 *   npm run db:migrate
 */
import postgres from "postgres";
import { readdir, readFile } from "node:fs/promises";

const MIGRATIONS_DIR = new URL("../db/migrations/", import.meta.url);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  // Stops two app containers starting at once from racing each other.
  await sql`SELECT pg_advisory_lock(727274)`;
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const applied = new Set((await sql<{ name: string }[]>`SELECT name FROM schema_migrations`).map((r) => r.name));
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const body = await readFile(new URL(file, MIGRATIONS_DIR), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
    console.log(`applied ${file}`);
    count++;
  }
  console.log(count ? `${count} migration(s) applied.` : "Database is up to date.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
