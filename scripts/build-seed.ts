/**
 * Phase 0: transforms data/raw/*.csv into data/organizations.json.
 *
 * - Applies sector_mapping.csv overrides
 * - Merges dupes (id 31 -> 4 Harvard LIL, id 32 -> 12 Stanford BLN)
 * - Normalizes capability + dataset_domain vocab to SPEC §3.4
 * - Backfills engagement_status = "active"
 * - Runs partner auto-extraction (SPEC §3.5)
 *
 * Run: npm run build:seed
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import type {
  Organization,
  Sector,
  Capability,
  DatasetDomain,
  OrganizationType,
} from "../src/lib/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const rawPath = (f: string) => path.join(ROOT, "data/raw", f);
const outPath = path.join(ROOT, "data/organizations.json");

const CAPABILITY_MAP: Record<string, Capability> = {
  "archives and/or mirrors": "Archives and/or Mirrors",
  "surfaces priority datasets": "Surfaces Priority Datasets",
  "assesses risk to datasets": "Assesses Risk to Datasets",
  "proposes or generates proxy/ alternative datasets":
    "Proposes Proxy / Alternative Datasets",
  "proposes proxy / alternative datasets":
    "Proposes Proxy / Alternative Datasets",
  "repository hosting": "Repository Hosting",
  "standards & governance": "Standards & Governance",
  convening: "Convening",
  "policy & advocacy": "Policy & Advocacy",
};

const DOMAIN_MAP: Record<string, DatasetDomain> = {
  climate: "Climate",
  environmental: "Environmental",
  ghg: "Greenhouse Gas",
  "greenhouse gas": "Greenhouse Gas",
  government: "Government",
  "social science": "Social Science",
  "earth observation": "Earth Observation",
};

const MERGE_INTO: Record<string, string> = {
  "31": "4",
  "32": "12",
};

function stripWrappingQuotes(s: string): string {
  if (s && s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  return s;
}

function normalize<T extends string>(
  values: string[],
  map: Record<string, T>,
  label: string,
): T[] {
  const out: T[] = [];
  for (const raw of values) {
    const key = raw.trim().toLowerCase();
    const mapped = map[key];
    if (!mapped) {
      console.warn(`[warn] unmapped ${label}: "${raw}"`);
      continue;
    }
    if (!out.includes(mapped)) out.push(mapped);
  }
  return out;
}

interface RawOrg {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  is_verified: string;
  created_at: string;
  contact_email: string;
  contact_name: string;
  tags: string;
  logo_url: string;
  organization_type: string;
  datasets: string;
  ongoing_initiatives: string;
  last_updated: string;
}

interface SectorMappingRow {
  id: string;
  name: string;
  current_category: string;
  proposed_sector: string;
  confidence: string;
  note: string;
}

function parseJsonArray(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function main() {
  const orgsCsv = fs.readFileSync(rawPath("organizations.csv"), "utf8");
  const mappingCsv = fs.readFileSync(rawPath("sector_mapping.csv"), "utf8");

  const orgsResult = Papa.parse<RawOrg>(orgsCsv, {
    header: true,
    skipEmptyLines: true,
  });
  const mappingResult = Papa.parse<SectorMappingRow>(mappingCsv, {
    header: true,
    skipEmptyLines: true,
  });

  if (orgsResult.errors.length) console.warn("orgs parse errors:", orgsResult.errors);
  if (mappingResult.errors.length) console.warn("mapping parse errors:", mappingResult.errors);

  const sectorById = new Map<string, Sector>();
  for (const row of mappingResult.data) {
    if (!row.id) continue;
    sectorById.set(row.id, row.proposed_sector as Sector);
  }

  const transformed: Organization[] = [];

  for (const raw of orgsResult.data) {
    if (!raw.id) continue;
    if (MERGE_INTO[raw.id]) {
      console.log(`[dedupe] dropping id ${raw.id} (merged into ${MERGE_INTO[raw.id]})`);
      continue;
    }

    const tags = parseJsonArray(raw.tags);
    const datasets = parseJsonArray(raw.datasets);

    const sector = sectorById.get(raw.id);
    if (!sector) {
      console.warn(`[warn] no sector mapping for id ${raw.id} (${raw.name}) — skipping`);
      continue;
    }

    const org: Organization = {
      id: raw.id,
      name: raw.name,
      url: raw.url,
      description: raw.description,
      sector,
      organization_type: (raw.organization_type || "independent") as OrganizationType,
      engagement_status: "active",
      capabilities: normalize<Capability>(tags, CAPABILITY_MAP, "capability"),
      dataset_domains: normalize<DatasetDomain>(datasets, DOMAIN_MAP, "dataset_domain"),
      partners: [],
      datasets_of_focus: [],
      contact_name: raw.contact_name || null,
      contact_email: raw.contact_email || null,
      logo_url: raw.logo_url || null,
      is_verified: raw.is_verified === "true",
      created_at: stripWrappingQuotes(raw.created_at),
      last_updated: stripWrappingQuotes(raw.last_updated),
    };

    transformed.push(org);
  }

  // Partner auto-extraction (SPEC §3.5)
  const PARTNER_TRIGGERS = [
    /\bkey\s+partners?:\s*([^.]+)/i,
    /\bpartners?:\s*([^.]+)/i,
    /\bpartnered\s+with\s+([^.]+)/i,
    /\bpartner\s+to\s+([^.]+)/i,
  ];

  const nameLookup = new Map<string, string>();
  for (const o of transformed) {
    nameLookup.set(o.name.toLowerCase(), o.id);
    const abbrMatch = o.name.match(/\(([A-Za-z0-9+]{2,})\)/);
    if (abbrMatch) nameLookup.set(abbrMatch[1].toLowerCase(), o.id);
  }

  for (const o of transformed) {
    const partnerIds = new Set<string>();
    for (const trigger of PARTNER_TRIGGERS) {
      const m = o.description.match(trigger);
      if (!m) continue;
      const tail = m[1];
      const candidates = tail.split(/,|\sand\s|&/).map((s) => s.trim());
      for (const c of candidates) {
        const cleaned = c.toLowerCase().replace(/[.()]/g, "").trim();
        if (!cleaned) continue;
        const matchedId = nameLookup.get(cleaned);
        if (matchedId && matchedId !== o.id) partnerIds.add(matchedId);
      }
    }
    o.partners = Array.from(partnerIds);
  }

  transformed.sort((a, b) => Number(a.id) - Number(b.id));

  fs.writeFileSync(outPath, JSON.stringify(transformed, null, 2) + "\n");
  console.log(
    `Wrote ${transformed.length} organizations to ${path.relative(ROOT, outPath)}`,
  );
}

main();
