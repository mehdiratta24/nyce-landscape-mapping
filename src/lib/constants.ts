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
    value: "federal_producer",
    label: "Federal Producer",
    short: "Producer",
    blurb: "Agencies that originate and publish the federal datasets everyone else mirrors.",
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
  { value: "nonprofit", label: "Nonprofit" },
  { value: "academic", label: "Academic" },
  { value: "company", label: "Company" },
  { value: "government", label: "Government" },
  { value: "independent", label: "Independent" },
];

export const ENGAGEMENT_STATUSES: { value: EngagementStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "in_contact", label: "In Contact" },
  { value: "deprioritized", label: "Deprioritized" },
];

export const CAPABILITIES: Capability[] = [
  "Archives and/or Mirrors",
  "Surfaces Priority Datasets",
  "Assesses Risk to Datasets",
  "Proposes Proxy / Alternative Datasets",
  "Repository Hosting",
  "Standards & Governance",
  "Convening",
  "Policy & Advocacy",
];

export const CAPABILITY_SHORT: Record<Capability, string> = {
  "Archives and/or Mirrors": "Archives",
  "Surfaces Priority Datasets": "Surfaces",
  "Assesses Risk to Datasets": "Risk",
  "Proposes Proxy / Alternative Datasets": "Proxies",
  "Repository Hosting": "Hosting",
  "Standards & Governance": "Standards",
  "Convening": "Convening",
  "Policy & Advocacy": "Advocacy",
};

export const DATASET_DOMAINS: DatasetDomain[] = [
  "Climate",
  "Environmental",
  "Greenhouse Gas",
  "Government",
  "Social Science",
  "Earth Observation",
];

export const DOMAIN_SHORT: Record<DatasetDomain, string> = {
  Climate: "Climate",
  Environmental: "Env",
  "Greenhouse Gas": "GHG",
  Government: "Gov",
  "Social Science": "SocSci",
  "Earth Observation": "EarthObs",
};
