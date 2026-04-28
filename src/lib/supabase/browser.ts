"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requiredEnv } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (client) return client;
  const { url, anonKey } = requiredEnv();
  client = createBrowserClient(url, anonKey);
  return client;
}
