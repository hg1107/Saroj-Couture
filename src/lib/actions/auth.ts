"use server";
/**
 * Auth server actions — login, logout, password reset.
 * Phase 1 task 1.6
 */
// TODO: implement login, logout, resetPassword actions
export async function login(_formData: FormData) {
  // Phase 1: implement with createServerClient().auth.signInWithPassword()
  throw new Error("Not implemented yet — Phase 1");
}

export async function logout() {
  // Phase 1: implement with createServerClient().auth.signOut()
  throw new Error("Not implemented yet — Phase 1");
}

export async function resetPassword(_email: string) {
  // Phase 1: implement with createServerClient().auth.resetPasswordForEmail()
  throw new Error("Not implemented yet — Phase 1");
}
