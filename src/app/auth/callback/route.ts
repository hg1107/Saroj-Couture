import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Supabase auth callback — handles email confirmation and password-reset token exchange.
// Supabase redirects to this URL after the user clicks the email link.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to login with error param
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
