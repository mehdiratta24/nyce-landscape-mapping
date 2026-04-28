"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface BulkRow {
  id?: string;
  name: string;
  url?: string;
  description?: string;
  sector: string;
  organization_type?: string;
  engagement_status?: string;
  capabilities: string[];
  dataset_domains: string[];
  partners?: string[];
  datasets_of_focus?: string[];
  contact_name?: string | null;
  contact_email?: string | null;
  is_verified?: boolean;
}

export interface CommitResult {
  ok: boolean;
  inserted: number;
  updated: number;
  errors: string[];
}

export async function commitBulkUploadAction(
  inserts: BulkRow[],
  updates: { id: string; row: BulkRow }[],
): Promise<CommitResult> {
  const supabase = createSupabaseServerClient();
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  // Inserts: assign new IDs server-side starting from max+1.
  if (inserts.length) {
    const { data: maxRow } = await supabase
      .from("organizations")
      .select("id")
      .order("id", { ascending: false })
      .limit(50);
    const numericIds = (maxRow ?? [])
      .map((r) => Number(r.id))
      .filter((n) => Number.isFinite(n));
    let next = (numericIds.length ? Math.max(...numericIds) : 100) + 1;

    const payload = inserts.map((row) => ({
      id: String(next++),
      name: row.name,
      url: row.url ?? "",
      description: row.description ?? "",
      sector: row.sector,
      organization_type: row.organization_type ?? "independent",
      engagement_status: row.engagement_status ?? "active",
      capabilities: row.capabilities,
      dataset_domains: row.dataset_domains,
      partners: row.partners ?? [],
      datasets_of_focus: row.datasets_of_focus ?? [],
      contact_name: row.contact_name ?? null,
      contact_email: row.contact_email ?? null,
      is_verified: row.is_verified ?? false,
    }));
    const { error } = await supabase.from("organizations").insert(payload);
    if (error) errors.push(`Insert batch failed: ${error.message}`);
    else inserted = payload.length;
  }

  // Updates: one by one (Postgres upsert by id would also work but we want clean diffs).
  for (const u of updates) {
    const { error } = await supabase
      .from("organizations")
      .update({
        name: u.row.name,
        url: u.row.url ?? "",
        description: u.row.description ?? "",
        sector: u.row.sector,
        organization_type: u.row.organization_type ?? "independent",
        engagement_status: u.row.engagement_status ?? "active",
        capabilities: u.row.capabilities,
        dataset_domains: u.row.dataset_domains,
        partners: u.row.partners ?? [],
        datasets_of_focus: u.row.datasets_of_focus ?? [],
        contact_name: u.row.contact_name ?? null,
        contact_email: u.row.contact_email ?? null,
        is_verified: u.row.is_verified ?? false,
      })
      .eq("id", u.id);
    if (error) errors.push(`Update id=${u.id} failed: ${error.message}`);
    else updated++;
  }

  revalidatePath("/directory");
  revalidatePath("/admin");
  return { ok: errors.length === 0, inserted, updated, errors };
}
