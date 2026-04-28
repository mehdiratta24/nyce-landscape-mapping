import "server-only";
import { createSupabaseServerClient } from "./server";
import { isSupabaseConfigured } from "./env";

export interface SessionInfo {
  user: { id: string; email: string } | null;
  isAdmin: boolean;
}

/**
 * Reads the current session and admin status from Supabase.
 * Returns { user: null, isAdmin: false } when Supabase isn't configured
 * or no user is signed in.
 */
export async function getSession(): Promise<SessionInfo> {
  if (!isSupabaseConfigured()) return { user: null, isAdmin: false };

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { user: null, isAdmin: false };

  const { data: isAdminRow } = await supabase.rpc("is_admin");
  return {
    user: { id: user.id, email: user.email },
    isAdmin: Boolean(isAdminRow),
  };
}
