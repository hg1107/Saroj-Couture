"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { sql } from "@/lib/db";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { MIN_PASSWORD_LENGTH, getDummyHash, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyOtherSessions, destroySession, requireOwner } from "@/lib/auth/session";

/** Generic message shown for any failed login — never reveals whether the
 * email exists, whether it's the password that's wrong, or any other detail. */
const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials. Please try again.";
const TOO_MANY_ATTEMPTS_MESSAGE = "Too many attempts. Please wait a few minutes and try again.";

const LOGIN_ATTEMPT_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "unknown";
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const email    = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Keyed by IP+email so one bad actor can't lock out a legitimate email
  // from a different IP, while still capping attempts per source.
  const key = `login:${await clientIp()}:${email}`;
  if (!(await checkRateLimit(key, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS))) {
    return { error: TOO_MANY_ATTEMPTS_MESSAGE };
  }

  const [user] = await sql<{ id: string; password_hash: string }[]>`
    SELECT id, password_hash FROM admin_users WHERE email = ${email}
  `;
  // Always run one scrypt verification so response time doesn't reveal
  // whether the email exists.
  const ok = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));
  if (!user || !ok) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  await createSession(user.id);
  redirect("/admin/garments");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
}

export async function changePasswordAction(
  _prev: ChangePasswordState | undefined,
  formData: FormData
): Promise<ChangePasswordState> {
  const owner           = await requireOwner();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password        = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!(await checkRateLimit(`change-password:${owner.id}`, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS))) {
    return { error: TOO_MANY_ATTEMPTS_MESSAGE };
  }

  const [row] = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM admin_users WHERE id = ${owner.id}
  `;
  if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
    return { error: "Current password is incorrect." };
  }

  await sql`UPDATE admin_users SET password_hash = ${await hashPassword(password)} WHERE id = ${owner.id}`;
  await destroyOtherSessions(owner.id);
  return { success: true };
}
