"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const email    = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/admin/garments");
}

/** Alias for backward compat */
export const login = loginAction;

export async function logoutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

/** Alias */
export const logout = logoutAction;

export async function resetPassword(email: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset`,
  });
  if (error) return { error: error.message };
  return { success: true };
}
