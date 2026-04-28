import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Organization } from "./types";

const SEED_PATH = path.join(process.cwd(), "data", "organizations.json");

let cache: Organization[] | null = null;

function load(): Organization[] {
  if (!cache) {
    cache = JSON.parse(fs.readFileSync(SEED_PATH, "utf8")) as Organization[];
  }
  return cache;
}

/**
 * Public view omits `deprioritized` orgs per SPEC §1 / §4.2.
 * Admin callers pass `{ includeAll: true }`.
 */
export function getAllOrganizations(opts: { includeAll?: boolean } = {}): Organization[] {
  const all = load();
  return opts.includeAll ? all : all.filter((o) => o.engagement_status !== "deprioritized");
}

export function getOrganizationById(
  id: string,
  opts: { includeAll?: boolean } = {},
): Organization | null {
  const match = load().find((o) => o.id === id) ?? null;
  if (!match) return null;
  if (!opts.includeAll && match.engagement_status === "deprioritized") return null;
  return match;
}
