export type Sector =
  | "federal_producer"
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
  | "Archives and/or Mirrors"
  | "Surfaces Priority Datasets"
  | "Assesses Risk to Datasets"
  | "Proposes Proxy / Alternative Datasets"
  | "Repository Hosting"
  | "Standards & Governance"
  | "Convening"
  | "Policy & Advocacy";

export type DatasetDomain =
  | "Climate"
  | "Environmental"
  | "Greenhouse Gas"
  | "Government"
  | "Social Science"
  | "Earth Observation";

export interface Organization {
  id: string;
  name: string;
  url: string;
  description: string;
  sector: Sector;
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
