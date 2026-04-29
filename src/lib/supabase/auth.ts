import "server-only";
import { createSupabaseServerClient } from "./server";
import { isAuthEnabled, isSupabaseConfigured } from "./env";

export interface SessionInfo {
  user: { id: string; email: string } | null;
  isAdmin: boolean;
  /** True when AUTH_ENABLED=false. Surfaces a banner / hides sign-out UI. */
  authBypassed: boolean;
}

/**
 * Reads the current session and admin status from Supabase.
 *
 * - When AUTH_ENABLED=false, returns a synthesized "open admin" session
 *   so admin pages render without requiring sign-in. Admin actions still
 *   use the service-role client to perform writes.
 * - When AUTH_ENABLED=true, checks the cookie session and the admin_users
 *   allow-list via the is_admin() RPC.
 */
export async function getSession(): Promise<SessionInfo> {
  if (!isAuthEnabled()) {
    return {
      user: { id: "auth-disabled", email: "auth disabled" },
      isAdmin: true,
      authBypassed: true,
    };
  }

  if (!isSupabaseConfigured()) {
    return { user: null, isAdmin: false, authBypassed: false };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { user: null, isAdmin: false, authBypassed: false };

  const { data: isAdminRow } = await supabase.rpc("is_admin");
  return {
    user: { id: user.id, email: user.email },
    isAdmin: Boolean(isAdminRow),
    authBypassed: false,
  };
}
