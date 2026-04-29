/**
 * True when both env vars are set. Used to fall back to the static JSON
 * seed during local dev / before Supabase is provisioned.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Master flag for admin authentication.
 *
 * - `true`  → admin pages require Supabase magic-link sign-in (production mode)
 * - `false` → admin pages are open; no login required. Admin actions still
 *   need to write to the DB, so they switch to the service-role client.
 *
 * Default is `false` — set `AUTH_ENABLED=true` (server env) to flip on.
 *
 * Exposed to the client via `NEXT_PUBLIC_AUTH_ENABLED` so React layouts can
 * branch UI without an extra server round-trip.
 */
export function isAuthEnabled(): boolean {
  // Server-side check first; falls back to the public mirror for client code.
  const v = process.env.AUTH_ENABLED ?? process.env.NEXT_PUBLIC_AUTH_ENABLED;
  return v === "true";
}

export function requiredEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  return { url, anonKey };
}
