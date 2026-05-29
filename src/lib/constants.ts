import type {
  Sector,
  OrganizationType,
  EngagementStatus,
  Capability,
  DatasetDomain,
} from "./types";

export interface SectorDef {
  value: Sector;
  label: string;
  short: string;
  blurb: string;
  color: string;
  tint: string;
  gradient: string;
  chipClass: string;
}

export const SECTORS: SectorDef[] = [
  {
    value: "data_producer",
    label: "Data Producer",
    short: "Producer",
    blurb: "Agencies and bodies that originate, collect, and publish the federal climate datasets the rest of the ecosystem builds on.",
    color: "#15506C",
    tint: "#D9E7ED",
    gradient: "bg-sector-federal",
    chipClass: "bg-nyce-accentSoft text-nyce-accent",
  },
  {
    value: "preservation_effort",
    label: "Preservation Effort",
    short: "Preservation",
    blurb: "Networks, coalitions, and ad-hoc groups rescuing at-risk public data.",
    color: "#D79E00",
    tint: "#FFF3B8",
    gradient: "bg-sector-preservation",
    chipClass: "bg-nyce-yellowSoft text-[#7C5F00]",
  },
  {
    value: "data_platform",
    label: "Data Platform",
    short: "Platform",
    blurb: "Repositories and portals hosting or redistributing datasets at scale.",
    color: "#3E8896",
    tint: "#E1EEF1",
    gradient: "bg-sector-platform",
    chipClass: "bg-nyce-aquaSoft text-[#2A5E68]",
  },
  {
    value: "academia_research",
    label: "Academia & Research",
    short: "Research",
    blurb: "Universities, scholarly societies, and research collaboratives.",
    color: "#283B4A",
    tint: "#E3E7EB",
    gradient: "bg-sector-academia",
    chipClass: "bg-[#E3E7EB] text-nyce-slate",
  },
];

export const SECTOR_DEF: Record<Sector, SectorDef> = Object.fromEntries(
  SECTORS.map((s) => [s.value, s]),
) as Record<Sector, SectorDef>;

export const SECTOR_LABEL: Record<Sector, string> = Object.fromEntries(
  SECTORS.map((s) => [s.value, s.label]),
) as Record<Sector, string>;

export const SECTOR_COLOR: Record<Sector, string> = Object.fromEntries(
  SECTORS.map((s) => [s.value, s.color]),
) as Record<Sector, string>;

export const ORGANIZATION_TYPES: { value: OrganizationType; label: string }[] = [
  { value: "nonprofit", label: "Non Profit" },
  { value: "academic", label: "Academia" },
  { value: "company", label: "Private" },
  { value: "government", label: "Government" },
  { value: "independent", label: "Independent" },
];

export const ENGAGEMENT_STATUSES: { value: EngagementStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "in_contact", label: "In Contact" },
  { value: "deprioritized", label: "Deprioritized" },
];

export const CAPABILITIES: Capability[] = [
  "Data Platform",
  "Data Usability & Access",
  "Prioritizing Data",
  "Innovation",
  "Stakeholders: Public & Non Profit",
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
];

export const CAPABILITY_SHORT: Record<Capability, string> = {
  "Data Platform": "Platform",
  "Data Usability & Access": "Access",
  "Prioritizing Data": "Prioritize",
  Innovation: "Innovate",
  "Stakeholders: Public & Non Profit": "Public/NP",
  "Stakeholders: Research": "Research",
  "Stakeholders: Private Sector": "Private",
  "Alternative, Proxy Datasets": "Proxies",
  "Domain & Data Expertise": "Expertise",
  "Data Quality & Governance": "Quality",
  Coordination: "Coord.",
  "Advocacy & Lobbying": "Advocacy",
  "Legal Protection & Litigation": "Legal",
  "Data Collection & Observing Systems": "Collect",
  "Data Tools, Products & Models": "Tools",
  "Integration with Other Data Sources": "Integrate",
};

export const DATASET_DOMAINS: DatasetDomain[] = [
  "Climate & Earth Science",
  "Greenhouse Gas & Emissions",
  "Energy",
  "Extreme Weather & Hazards",
  "Environmental Health & Justice",
  "Geospatial & Remote Sensing",
  "Socioeconomic",
];

export const DOMAIN_SHORT: Record<DatasetDomain, string> = {
  "Climate & Earth Science": "Climate",
  "Greenhouse Gas & Emissions": "GHG",
  Energy: "Energy",
  "Extreme Weather & Hazards": "Weather",
  "Environmental Health & Justice": "Health/EJ",
  "Geospatial & Remote Sensing": "Geo",
  Socioeconomic: "Socio",
};

/**
 * Pick the primary sector for color/banner treatment when an org has multiple.
 * Returns the first sector if any, falling back to a sensible default.
 */
export function primarySector(org: { sectors?: Sector[] }): Sector {
  return org.sectors?.[0] ?? "data_platform";
}
