/**
 * Phase 0 v2: read the latest landscape Excel and produce data/organizations.json
 * matching the new schema.
 *
 * Key changes from v1:
 *  - Capabilities vocabulary expanded (17 categories, one column per capability,
 *    cell value "Yes" means the org has it)
 *  - Dataset domains vocabulary changed (7 new values, comma-separated in cell)
 *  - Sectors are now MULTI-VALUED (comma-separated in cell)
 *  - Org types are recased ("Non Profit", "Academia", "Government", "Private")
 *  - engagement_status derived from "On Website?": Yes→active, New→in_contact, No→deprioritized
 *  - Partners parsed from "Coordinates with" column (newline or comma separated)
 *
 * IDs are preserved across the schema change: if an Excel row's name matches
 * a current organization (case-insensitive), it reuses that id. New rows get
 * incremented ids starting from the next available number.
 *
 * Run:  npm run import:excel
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "data/raw/landscape-2026-05-15.xlsx");
const EXISTING_JSON = path.join(ROOT, "data/organizations.json");
const OUT_PATH = path.join(ROOT, "data/organizations.json");

// New controlled vocab (also exported below for constants.ts to mirror).
const CAPABILITIES = [
  "Data Platform",
  "Data Usability & Access",
  "Prioritizing Data",
  "Innovation",
  "Stakeholders: Community & Civic",
  "Stakeholders: Research",
  "Stakeholders: Private Sector",
  "Alternative, Proxy Datasets",
  "Domain & Data Expertise",
  "Data Quality & Governance",
  "Coordination",
  "Advocacy & Lobbying",
  "Legal Protection & Litigation",
  "Data Collection & Observing Systems",
  "Data Tools, Products & Models",
  "Integration with Other Data Sources",
] as const;

const DATASET_DOMAINS = [
  "Climate & Earth Science",
  "Greenhouse Gas & Emissions",
  "Energy",
  "Extreme Weather & Hazards",
  "Environmental Health & Justice",
  "Geospatial & Remote Sensing",
  "Socioeconomic",
] as const;

const SECTORS = [
  "data_producer",
  "preservation_effort",
  "data_platform",
  "academia_research",
] as const;
type Sector = (typeof SECTORS)[number];

const SECTOR_FROM_EXCEL: Record<string, Sector> = {
  "data producer": "data_producer",
  "preservation effort": "preservation_effort",
  "data platform (repositories and portals)": "data_platform",
  "academia and research": "academia_research",
};

const ORG_TYPES = ["nonprofit", "academic", "company", "government"] as const;
type OrgType = (typeof ORG_TYPES)[number];

const ORG_TYPE_FROM_EXCEL: Record<string, OrgType> = {
  "Non Profit": "nonprofit",
  Academia: "academic",
  Private: "company",
  Government: "government",
};

const ENGAGEMENT_FROM_WEBSITE: Record<string, "active" | "in_contact" | "deprioritized"> = {
  Yes: "active",
  New: "in_contact",
  No: "deprioritized",
};

interface OutOrg {
  id: string;
  name: string;
  url: string;
  description: string;
  sectors: Sector[];
  organization_type: OrgType;
  engagement_status: "active" | "in_contact" | "deprioritized";
  capabilities: string[];
  dataset_domains: string[];
  partners: string[];
  datasets_of_focus: string[];
  contact_name: string | null;
  contact_email: string | null;
  logo_url: string | null;
  is_verified: boolean;
  created_at: string;
  last_updated: string;
}

function cleanCell(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function splitList(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,;]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function main() {
  const wb = XLSX.readFile(XLSX_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  // Normalize column names by stripping surrounding whitespace.
  const rows = rawRows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) out[k.trim()] = v;
    return out;
  });

  // Load existing JSON for ID + sector continuity. The May 15 Excel dropped
  // the "Sector" column, so we backfill sectors from the previous import
  // when a name matches.
  const existing: Array<{ id: string; name: string; sectors?: Sector[] }> = fs.existsSync(
    EXISTING_JSON,
  )
    ? (JSON.parse(fs.readFileSync(EXISTING_JSON, "utf8")) as Array<{
        id: string;
        name: string;
        sectors?: Sector[];
      }>)
    : [];
  // Normalize curly quotes / dashes / whitespace so a renamed-with-a-curly-apostrophe
  // row still matches its predecessor.
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[‘’ʼ]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  const existingByName = new Map<string, string>();
  const existingSectorsByName = new Map<string, Sector[]>();
  for (const o of existing) {
    const key = normalize(o.name);
    existingByName.set(key, o.id);
    if (o.sectors && o.sectors.length) existingSectorsByName.set(key, o.sectors);
  }
  const usedIds = new Set(existing.map((o) => o.id));
  let nextNewId = (() => {
    const nums = existing.map((o) => Number(o.id)).filter((n) => Number.isFinite(n));
    return (nums.length ? Math.max(...nums) : 100) + 1;
  })();

  const now = new Date().toISOString();
  const out: OutOrg[] = [];
  const unmatchedPartners: { org: string; raw: string }[] = [];

  // First pass — build org records without resolving partners.
  for (const row of rows) {
    const name = cleanCell(row["name"]);
    if (!name) continue;

    // Sectors (multi-valued). The May 15 Excel removed this column, so we
    // first try to read it from the row; if absent or empty, fall back to
    // whatever the org had in the previous import.
    const sectorRaw = cleanCell(row["Sector"]);
    let sectors: Sector[] = splitList(sectorRaw)
      .map((s) => SECTOR_FROM_EXCEL[s.toLowerCase()])
      .filter((x): x is Sector => Boolean(x));
    if (sectors.length === 0) {
      sectors = existingSectorsByName.get(normalize(name)) ?? [];
    }

    // Org type
    const typeRaw = cleanCell(row["Organization Type"]);
    const organization_type = ORG_TYPE_FROM_EXCEL[typeRaw] ?? "nonprofit";

    // Engagement
    const onWebsite = cleanCell(row["On Website?"]);
    const engagement_status = ENGAGEMENT_FROM_WEBSITE[onWebsite] ?? "in_contact";

    // Capabilities (one column per cap, cell value "Yes" = present)
    const capabilities: string[] = CAPABILITIES.filter(
      (cap) => cleanCell(row[cap]).toLowerCase() === "yes",
    );

    // Dataset domains
    const dataset_domains = splitList(cleanCell(row["Data Domains"])).filter((d) =>
      DATASET_DOMAINS.includes(d as (typeof DATASET_DOMAINS)[number]),
    );

    // ID continuity
    const key = normalize(name);
    let id = existingByName.get(key);
    if (!id) {
      while (usedIds.has(String(nextNewId))) nextNewId++;
      id = String(nextNewId++);
      usedIds.add(id);
    }

    out.push({
      id,
      name,
      url: cleanCell(row["url"]),
      description: cleanCell(row["description"]),
      sectors,
      organization_type,
      engagement_status,
      capabilities,
      dataset_domains,
      partners: [],
      datasets_of_focus: [],
      contact_name: cleanCell(row["contact_name"]) || null,
      contact_email: cleanCell(row["contact_email"]) || null,
      logo_url: null,
      is_verified: false,
      created_at: now,
      last_updated: now,
    });
  }

  // Second pass — partner resolution (after all IDs assigned)
  const idByLower = new Map<string, string>();
  const idByAbbrev = new Map<string, string>();
  for (const o of out) {
    idByLower.set(o.name.toLowerCase(), o.id);
    const ab = o.name.match(/\(([^)]+)\)/);
    if (ab) idByAbbrev.set(ab[1].toLowerCase().trim(), o.id);
  }
  // Also handle short forms appearing in "Coordinates with"
  const aliases: Record<string, string> = {
    pedp: "Public Environmental Data Partners (PEDP)",
    agu: "American Geophysical Union (AGU)",
    grqd: "Group on Reference Quality Data sets (GRQDs)",
    grqds: "Group on Reference Quality Data sets (GRQDs)",
    nasem: "National Academies (NASEM) Earth Obs Workshop",
    nyce: "New York Climate Exchange (NYCE)",
    cdan: "Climate-Ocean Data Action Network (CDAN)",
    kcf: "Keeling Curve Foundation (KCF)",
    agci: "Aspen Global Change Institute",
    "data foundation": "Data Foundation - Climate Data Collaborative",
    cornerstone: "Cornerstone Data Initiative",
    "impact project": "The Impact Project",
    "the impact project": "The Impact Project",
  };
  for (const [alias, canonical] of Object.entries(aliases)) {
    const id = idByLower.get(canonical.toLowerCase());
    if (id) idByLower.set(alias, id);
  }

  for (const o of out) {
    const rawRow = rows.find((r) => cleanCell(r["name"]) === o.name);
    if (!rawRow) continue;
    const partnerRaw = cleanCell(rawRow["Coordinates with (Landscape Analysis - Climate Data Orgs_v2)"]);
    if (!partnerRaw) continue;
    const candidates = splitList(partnerRaw);
    const matched = new Set<string>();
    for (const c of candidates) {
      const key = c.toLowerCase().replace(/\.$/, "").trim();
      const id = idByLower.get(key) ?? idByAbbrev.get(key);
      if (id && id !== o.id) matched.add(id);
      else unmatchedPartners.push({ org: o.name, raw: c });
    }
    o.partners = Array.from(matched);
  }

  // Sort by id (numeric where possible)
  out.sort((a, b) => Number(a.id) - Number(b.id));

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${out.length} organizations to ${path.relative(ROOT, OUT_PATH)}`);
  console.log(
    `  active=${out.filter((o) => o.engagement_status === "active").length} ` +
      `in_contact=${out.filter((o) => o.engagement_status === "in_contact").length} ` +
      `deprioritized=${out.filter((o) => o.engagement_status === "deprioritized").length}`,
  );
  if (unmatchedPartners.length) {
    console.log(`\n[partner extraction] ${unmatchedPartners.length} unmatched references:`);
    for (const u of unmatchedPartners.slice(0, 30)) {
      console.log(`  ${u.org} → "${u.raw}"`);
    }
    if (unmatchedPartners.length > 30) {
      console.log(`  ... and ${unmatchedPartners.length - 30} more`);
    }
  }
}

main();
