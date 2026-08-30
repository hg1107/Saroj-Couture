import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Supabase auth callback — handles email confirmation and password-reset token exchange.
// Supabase redirects to this URL after the user clicks the email link.

/**
 * Only allow same-origin, path-relative redirect targets — reject anything
 * that could re-parse as an absolute URL when appended to `origin` (e.g. a
 * leading "//" or an "@" that turns the path into userinfo), which would
 * otherwise let `?next=` bounce the browser off this domain entirely.
 */
function isSafeNext(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//") && !/[\\@]/.test(next);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/admin/garments";
  const next = isSafeNext(requestedNext) ? requestedNext : "/admin/garments";

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to login with error param
  return NextResponse.redirect(`${origin}/admin/login?error=auth_callback_failed`);
}
