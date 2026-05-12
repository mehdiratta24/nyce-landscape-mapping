import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Organization } from "./types";
import { isSupabaseConfigured } from "./supabase/env";
import { createSupabaseServerClient } from "./supabase/server";

const SEED_PATH = path.join(process.cwd(), "data", "organizations.json");

let jsonCache: Organization[] | null = null;

function loadJson(): Organization[] {
  if (!jsonCache) {
    jsonCache = JSON.parse(fs.readFileSync(SEED_PATH, "utf8")) as Organization[];
  }
  return jsonCache;
}

function dbRowToOrg(row: Record<string, unknown>): Organization {
  // Backward-compat: legacy schema had `sector` (single value); new schema
  // has `sectors` (text[]). Prefer sectors, fall back to wrapping sector.
  const sectorsArr = (row.sectors as Organization["sectors"] | undefined) ?? null;
  const legacySector = row.sector as Organization["sectors"][number] | undefined;
  const sectors: Organization["sectors"] = sectorsArr && sectorsArr.length > 0
    ? sectorsArr
    : legacySector
    ? [legacySector]
    : [];

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    url: String(row.url ?? ""),
    description: String(row.description ?? ""),
    sectors,
    organization_type: row.organization_type as Organization["organization_type"],
    engagement_status: row.engagement_status as Organization["engagement_status"],
    capabilities: ((row.capabilities as string[]) ?? []) as Organization["capabilities"],
    dataset_domains: ((row.dataset_domains as string[]) ?? []) as Organization["dataset_domains"],
    partners: ((row.partners as string[]) ?? []),
    datasets_of_focus: ((row.datasets_of_focus as string[]) ?? []),
    contact_name: (row.contact_name as string | null) ?? null,
    contact_email: (row.contact_email as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    is_verified: Boolean(row.is_verified),
    created_at: String(row.created_at ?? ""),
    last_updated: String(row.last_updated ?? ""),
  };
}

export async function getAllOrganizations(
  opts: { includeAll?: boolean } = {},
): Promise<Organization[]> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("organizations")
      .select("*")
      .order("name", { ascending: true });
    if (!opts.includeAll) {
      // RLS filters this for anon; harmless to also constrain here.
      query = query.neq("engagement_status", "deprioritized");
    }
    const { data, error } = await query;
    if (error) {
      console.error("[data] getAllOrganizations error:", error.message);
      return [];
    }
    return (data ?? []).map(dbRowToOrg);
  }

  const all = loadJson();
  return opts.includeAll ? all : all.filter((o) => o.engagement_status !== "deprioritized");
}

export async function getOrganizationById(
  id: string,
  opts: { includeAll?: boolean } = {},
): Promise<Organization | null> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[data] getOrganizationById error:", error.message);
      return null;
    }
    if (!data) return null;
    const org = dbRowToOrg(data as Record<string, unknown>);
    if (!opts.includeAll && org.engagement_status === "deprioritized") return null;
    return org;
  }

  const match = loadJson().find((o) => o.id === id) ?? null;
  if (!match) return null;
  if (!opts.includeAll && match.engagement_status === "deprioritized") return null;
  return match;
}
