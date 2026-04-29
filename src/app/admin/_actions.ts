"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuthEnabled } from "@/lib/supabase/env";

export async function signOutAction() {
  if (!isAuthEnabled()) {
    // No-op: there's no real session to clear when auth is bypassed.
    redirect("/");
  }
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
