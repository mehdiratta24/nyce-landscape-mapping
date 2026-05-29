/**
 * One-off: apply Andel Koester's review edits (May 2026 track-changes + comments)
 * to data/organizations.json.
 *
 * - Per-org capability add/remove
 * - Add "Data Platform" capability to every data-platform-sector org
 * - Stakeholder adds
 * - Domain + description + contact tweaks
 * - Drop Stanford WaterShed (merged into Cornerstone)
 * - Clear all partners ("coordinates with") site-wide
 *
 * Run: npm run apply:andel
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Capability, DatasetDomain, Organization } from "../src/lib/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const JSON_PATH = path.join(ROOT, "data/organizations.json");

interface Edit {
  add?: Capability[];
  remove?: Capability[];
  addDomains?: DatasetDomain[];
  removeDomains?: DatasetDomain[];
  description?: string;
  contactName?: string;
}

const EDITS: Record<string, Edit> = {
  "AGCI's SHIP initiative": {
    remove: ["Prioritizing Data", "Data Quality & Governance", "Advocacy & Lobbying"],
  },
  "America's Essential Data": {
    remove: ["Data Usability & Access", "Data Quality & Governance"],
  },
  "American Geophysical Union (AGU)": {
    remove: ["Data Usability & Access", "Stakeholders: Community & Civic", "Advocacy & Lobbying"],
  },
  AWS: {
    remove: ["Data Tools, Products & Models", "Integration with Other Data Sources"],
  },
  "Climate Central": { add: ["Stakeholders: Private Sector"] },
  "Climate READi": {
    remove: ["Data Usability & Access", "Prioritizing Data", "Data Quality & Governance"],
    add: ["Stakeholders: Community & Civic"],
    removeDomains: ["Climate & Earth Science"],
  },
  "CODE (Center for Open Data Enterprise)": {
    remove: ["Data Usability & Access", "Data Quality & Governance", "Advocacy & Lobbying"],
  },
  "Cornerstone Data Initiative": {
    remove: ["Data Quality & Governance"],
    add: ["Data Tools, Products & Models"],
  },
  "Data Foundation - Climate Data Collaborative": {
    remove: ["Stakeholders: Research"],
    add: ["Stakeholders: Community & Civic", "Stakeholders: Private Sector"],
  },
  "Data Liberation Project": { remove: ["Advocacy & Lobbying"] },
  Dryad: { remove: ["Stakeholders: Community & Civic"] },
  "Earth Science Information Partners (ESIP)": { add: ["Stakeholders: Research"] },
  "Environmental Data & Governance Initiative (EDGI)": {
    add: ["Data Usability & Access", "Coordination"],
    remove: ["Legal Protection & Litigation"],
    contactName: "Gretchen Gerhke",
  },
  "Environmental Policy Innovation Center (EPIC)": {
    remove: ["Data Quality & Governance"],
    add: ["Innovation", "Domain & Data Expertise"],
  },
  ESRI: { add: ["Stakeholders: Community & Civic"] },
  "FracTracker (Federal Accountability)": { remove: ["Data Quality & Governance"] },
  Google: {
    add: ["Stakeholders: Community & Civic"],
    addDomains: ["Extreme Weather & Hazards"],
    description:
      "Private-sector technology company and cloud provider that hosts public-sector and government data infrastructure as well as its own public-facing data products using this data.",
  },
  "Group on Reference Quality Data sets (GRQDs)": { remove: ["Data Usability & Access"] },
  "Harvard's Library Innovation Lab Team": { remove: ["Innovation"] },
  Kaggle: { remove: ["Data Usability & Access"] },
  "Keeling Curve Foundation (KCF)": { remove: ["Data Usability & Access"] },
  "National Academies (NASEM)": { remove: ["Prioritizing Data"] },
  "New York Climate Exchange (NYCE)": { add: ["Stakeholders: Private Sector"] },
  "Open Environmental Data Project (OEDP)": {
    add: [
      "Stakeholders: Research",
      "Coordination",
      "Data Tools, Products & Models",
      "Integration with Other Data Sources",
    ],
    remove: ["Alternative, Proxy Datasets"],
  },
  PANGAEA: { remove: ["Domain & Data Expertise"] },
  "Policy Commons Open Collection": {
    remove: ["Data Usability & Access"],
    add: ["Domain & Data Expertise"],
  },
  "Public Environmental Data Partners (PEDP)": { add: ["Data Tools, Products & Models"] },
  "Reinsurance Industry Association": {
    remove: ["Data Usability & Access"],
    add: ["Prioritizing Data"],
  },
  "Silencing Science Tracker": {
    remove: ["Prioritizing Data", "Data Quality & Governance"],
  },
  "The Impact Project": {
    remove: [
      "Data Usability & Access",
      "Alternative, Proxy Datasets",
      "Data Tools, Products & Models",
      "Integration with Other Data Sources",
    ],
    add: ["Prioritizing Data", "Advocacy & Lobbying", "Legal Protection & Litigation"],
  },
  "The LGBTQ+ Archive": {
    remove: ["Data Usability & Access"],
    add: ["Domain & Data Expertise"],
  },
  "Urban Institute": {
    remove: ["Data Usability & Access", "Data Quality & Governance"],
    add: ["Domain & Data Expertise", "Coordination", "Stakeholders: Community & Civic"],
  },
  "UW Climate Risk Lab": {
    remove: ["Data Usability & Access", "Data Quality & Governance"],
  },
  Webrecorder: { remove: ["Data Usability & Access", "Innovation"] },
};

// Orgs dropped entirely (merged elsewhere).
const DROP = new Set<string>(["Stanford WaterShed"]);

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function main() {
  const orgs = JSON.parse(fs.readFileSync(JSON_PATH, "utf8")) as Organization[];
  const warnings: string[] = [];
  const seen = new Set<string>();

  const out = orgs
    .filter((o) => !DROP.has(o.name))
    .map((o) => {
      seen.add(o.name);
      const e = EDITS[o.name];
      let caps = [...o.capabilities];
      let domains = [...o.dataset_domains];

      // 1. Data Platform capability for every data-platform-sector org
      if (o.sectors.includes("data_platform") && !caps.includes("Data Platform")) {
        caps.unshift("Data Platform");
      }

      if (e) {
        if (e.remove) {
          for (const c of e.remove) {
            if (!caps.includes(c)) warnings.push(`${o.name}: remove "${c}" — not present`);
          }
          caps = caps.filter((c) => !e.remove!.includes(c));
        }
        if (e.add) {
          for (const c of e.add) {
            if (caps.includes(c)) warnings.push(`${o.name}: add "${c}" — already present`);
          }
          caps = uniq([...caps, ...e.add]);
        }
        if (e.removeDomains) {
          domains = domains.filter((d) => !e.removeDomains!.includes(d));
        }
        if (e.addDomains) {
          domains = uniq([...domains, ...e.addDomains]) as DatasetDomain[];
        }
        if (e.description) o.description = e.description;
        if (e.contactName && !o.contact_name) o.contact_name = e.contactName;
      }

      return {
        ...o,
        capabilities: caps,
        dataset_domains: domains,
        partners: [], // clear "coordinates with" site-wide
      };
    });

  // Report any EDITS keys that didn't match an org
  for (const name of Object.keys(EDITS)) {
    if (!seen.has(name)) warnings.push(`EDIT target not found: "${name}"`);
  }

  fs.writeFileSync(JSON_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${out.length} organizations (dropped ${orgs.length - out.length}).`);
  const platformCount = out.filter((o) => o.capabilities.includes("Data Platform")).length;
  console.log(`"Data Platform" capability applied to ${platformCount} orgs.`);
  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach((w) => console.log("  ⚠ " + w));
  }
}

main();
