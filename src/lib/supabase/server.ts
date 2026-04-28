import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { requiredEnv } from "./env";

/**
 * Server-side Supabase client bound to the current request's cookie jar.
 * Use this in server components, server actions, and route handlers.
 */
export function createSupabaseServerClient() {
  const { url, anonKey } = requiredEnv();
  const store = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          store.set({ name, value, ...options });
        } catch {
          // Server components can't set cookies — middleware handles refresh.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          store.set({ name, value: "", ...options });
        } catch {
          // ignore — see above
        }
      },
    },
  });
}
