import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase redirects users back here from the magic-link email.
 * We exchange the `code` for a session, then bounce to /admin (or `next`).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/admin";

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/admin/login?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
