export type Sector =
  | "data_producer"
  | "preservation_effort"
  | "data_platform"
  | "academia_research";

export type OrganizationType =
  | "nonprofit"
  | "academic"
  | "company"
  | "government"
  | "independent";

export type EngagementStatus = "active" | "in_contact" | "deprioritized";

export type Capability =
  | "Data Usability & Access"
  | "Prioritizing Data"
  | "Innovation"
  | "Stakeholders: Community & Civic"
  | "Stakeholders: Research"
  | "Stakeholders: Private Sector"
  | "Alternative, Proxy Datasets"
  | "Domain & Data Expertise"
  | "Data Quality & Governance"
  | "Coordination"
  | "Advocacy & Lobbying"
  | "Legal Protection & Litigation"
  | "Data Collection & Observing Systems"
  | "Data Tools, Products & Models"
  | "Integration with Other Data Sources";

export type DatasetDomain =
  | "Climate & Earth Science"
  | "Greenhouse Gas & Emissions"
  | "Energy"
  | "Extreme Weather & Hazards"
  | "Environmental Health & Justice"
  | "Geospatial & Remote Sensing"
  | "Socioeconomic";

export interface Organization {
  id: string;
  name: string;
  url: string;
  description: string;
  /**
   * Multi-valued — an organization can span more than one sector
   * (e.g. data_platform + data_producer). Empty array allowed; the first
   * element drives the primary color treatment in the UI.
   */
  sectors: Sector[];
  organization_type: OrganizationType;
  engagement_status: EngagementStatus;
  capabilities: Capability[];
  dataset_domains: DatasetDomain[];
  partners: string[];
  datasets_of_focus: string[];
  contact_name: string | null;
  contact_email: string | null;
  logo_url: string | null;
  is_verified: boolean;
  created_at: string;
  last_updated: string;
}
