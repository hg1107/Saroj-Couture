"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

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
  const email    = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // Keyed by IP+email so one bad actor can't lock out a legitimate email
  // from a different IP, while still capping attempts per source.
  const key = `login:${await clientIp()}:${email.toLowerCase()}`;
  if (!checkRateLimit(key, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS)) {
    return { error: TOO_MANY_ATTEMPTS_MESSAGE };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  redirect("/admin/garments");
}

/** Alias for backward compat */
export const login = loginAction;

export async function logoutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Alias */
export const logout = logoutAction;

type ResetRequestState = { error?: string; success: boolean };

const RESET_ATTEMPT_LIMIT = 5;
const RESET_WINDOW_MS = 15 * 60 * 1000;

export async function requestPasswordResetAction(
  _prev: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "");

  // Returns the same success response either way, same as below — this
  // just caps how many reset emails one source can trigger.
  const key = `reset:${await clientIp()}:${email.toLowerCase()}`;
  if (!checkRateLimit(key, RESET_ATTEMPT_LIMIT, RESET_WINDOW_MS)) {
    return { success: true };
  }

  const supabase = await createServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/admin/reset-password`,
  });

  // Always report success, whether or not the email exists — Supabase itself
  // doesn't leak account existence here, and neither should we.
  return { success: true };
}

/** Alias for backward compat */
export const resetPassword = requestPasswordResetAction;

export async function updatePasswordAction(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Could not update password. Please request a new reset link." };
  }

  redirect("/admin/garments");
}
