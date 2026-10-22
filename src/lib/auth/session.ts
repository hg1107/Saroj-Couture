/**
 * Server-side sessions for the single owner account.
 *
 * The browser holds a random 256-bit token in an httpOnly cookie; the DB holds
 * only its SHA-256, plus the owner id and an expiry. Every admin page, Server
 * Action, and API route calls getCurrentUser()/requireOwner() — the proxy's
 * redirect is a convenience, not the security boundary.
 */
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";

export const SESSION_COOKIE = "sc_session";
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

export interface AdminUser {
  id: string;
  email: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Looks a raw cookie token up in the DB. Also used by src/proxy.ts. */
export async function getUserForToken(token: string | undefined): Promise<AdminUser | null> {
  if (!token || token.length > 128) return null;
  const rows = await sql<AdminUser[]>`
    SELECT u.id, u.email
      FROM sessions s
      JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = ${hashToken(token)}
       AND s.expires_at > now()
  `;
  return rows[0] ?? null;
}

/** The signed-in owner for this request, or null. Memoised per request. */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const store = await cookies();
  return getUserForToken(store.get(SESSION_COOKIE)?.value);
});

/** For Server Components and Server Actions: redirects to login when signed out. */
export async function requireOwner(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await sql`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, now() + make_interval(secs => ${SESSION_MAX_AGE_S}))
  `;
  // Opportunistic cleanup — there's only ever one user, so this stays tiny.
  await sql`DELETE FROM sessions WHERE expires_at <= now()`;

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  store.delete(SESSION_COOKIE);
}

/** Signs out every other device — used after a password change. */
export async function destroyOtherSessions(userId: string): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value ?? "";
  await sql`DELETE FROM sessions WHERE user_id = ${userId} AND token_hash <> ${hashToken(token)}`;
}
