# Landscape Mapping Tool — Build Spec

**Source inputs:** NYCE Landscape Analysis deliverable (April 2026) + seed data in `organizations.csv` (31 rows, 29 after dedupe).
**Goal:** A collaborative web platform that maps organizations working on climate data preservation, rescue, and stewardship. Public-facing directory + admin-moderated editing + dataset-specific landscape pages as a demonstrable pattern.

---

## 0. Resolved Decisions (reference)

| # | Decision |
|---|---|
| Sector migration | Use `sector_mapping.csv` (companion file). 29 of 31 rows mapped; 2 are duplicates to merge. |
| Engagement status in public view | Public view shows only `active` and `in_contact`. `deprioritized` is admin-only. |
| Admin auth | Supabase magic link. Multi-user (NYCE team), not single-admin. |
| Anonymous edits | Edit proposals require proposer email. |
| Partner links | Auto-extracted from description prose at ingest / on update. |
| Overlap Map fidelity | Capability × Dataset-Domain matrix heatmap for v1. Force-directed graph deferred to v2. |
| Dataset landscape scope | GHGRP is a pilot / pattern demo. Not expected to scale up at launch. |
| Content ownership | NYCE admin group (not a single person). |

---

## 1. Users & Roles

| Role | Can do | Auth |
|---|---|---|
| Public visitor | Browse, search, filter, export CSV, view org detail, view dataset landscape pages. Sees only `active` and `in_contact` orgs. | None |
| Contributor | Propose edits to existing orgs or submit new orgs. Email required. Proposal enters review queue. | Email on submission |
| NYCE Admin | Approve/reject proposed edits, bulk-upload CSV, create/edit/publish dataset landscape pages, manage resources, see all engagement statuses including `deprioritized`. | Supabase magic link |

---

## 2. Information Architecture

```
/                             Home — initiative description, user guide, entry points
/directory                    Organization Directory (Grid | Table | Overlap Map)
/directory/:id                Org detail page
/directory/:id/edit           Propose edits to an org
/directory/new                Propose a new org
/datasets                     Index of dataset landscape pages
/datasets/:slug               Dataset landscape view (GHGRP is the launch example)
/resources                    Key Resource Links (grouped)
/admin                        [auth] Dashboard
/admin/queue                  [auth] Pending edit proposals
/admin/bulk-upload            [auth] CSV upload with diff preview
/admin/datasets               [auth] Create/edit dataset landscape pages
```

---

## 3. Data Model

### 3.1 `Organization`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable identifier |
| `name` | string | Display name |
| `url` | string | Homepage |
| `description` | text | 1–3 sentence summary |
| `sector` | enum | `federal_producer` \| `preservation_effort` \| `data_platform` \| `academia_research` |
| `organization_type` | enum | `nonprofit` \| `academic` \| `company` \| `government` \| `independent` |
| `engagement_status` | enum | `active` \| `in_contact` \| `deprioritized` — **`deprioritized` hidden from public routes** |
| `capabilities` | string[] | Controlled list — see §3.4 |
| `dataset_domains` | string[] | Controlled list — see §3.4 |
| `partners` | string[] | Array of `Organization.id` references. Auto-extracted from description on create/update (see §3.5), admin-editable. |
| `datasets_of_focus` | string[] | Named datasets (e.g., `GHGRP`, `CJEST`, `FEMA Flood Zone`) — powers dataset landscape pages |
| `contact_name` | string? | |
| `contact_email` | string? | |
| `logo_url` | string? | |
| `is_verified` | boolean | Admin-confirmed record |
| `created_at` | timestamp | |
| `last_updated` | timestamp | |

### 3.2 `EditProposal`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `target_org_id` | string? | Null if this is a new-org proposal |
| `proposed_payload` | json | Full new-org record or diff against the current org |
| `proposer_email` | string | **Required** |
| `rationale` | text? | Optional note |
| `status` | enum | `pending` \| `approved` \| `rejected` |
| `admin_note` | text? | Written on approve/reject |
| `reviewed_by` | string? | Admin user ID |
| `created_at` | timestamp | |
| `resolved_at` | timestamp? | |

### 3.3 `DatasetLandscape`

| Field | Type | Notes |
|---|---|---|
| `slug` | string | URL segment, e.g., `ghgrp` |
| `name` | string | e.g., "Greenhouse Gas Reporting Program (GHGRP)" |
| `description` | text | |
| `producing_agency` | string? | e.g., "EPA" |
| `resource_links` | json[] | `{label, url, note}` tuples |
| `is_published` | boolean | Unpublished pages are admin-only |

Orgs are linked by `Organization.datasets_of_focus` containing the dataset slug/name.

### 3.4 Controlled vocabularies

**Capabilities** (multi-select):
- Archives and/or Mirrors
- Surfaces Priority Datasets
- Assesses Risk to Datasets
- Proposes Proxy / Alternative Datasets
- Repository Hosting
- Standards & Governance
- Convening
- Policy & Advocacy

**Dataset Domains** (multi-select):
- Climate
- Environmental
- Greenhouse Gas
- Government
- Social Science
- Earth Observation

### 3.5 Partner auto-extraction

On org create/update, run the description through an extraction pass:
1. Look for phrases like `"Partners:"`, `"Key partners:"`, `"Partnered with"`, `"Partner:"`, `"Partner to"`
2. Split the tail on commas / `"and"` / `"&"`
3. Fuzzy-match each candidate string against `Organization.name` (case-insensitive, handles abbreviations — e.g., "PEDP" → "Public Environmental Data Partners (PEDP)")
4. Populate `partners` with matched IDs; unmatched candidates logged for admin review

Admin can always override auto-extracted partners in the admin UI.

---

## 4. Pages

### 4.1 Home `/`

- Initiative description (copy drawn from PDF talking points)
- Four-quadrant diagram (from slide 2) as a visual anchor — each quadrant clickable, filters `/directory` by sector
- User Guide panel — explains the three view modes, how to propose edits, how to read engagement status
- CTA buttons: "Browse Directory", "View GHGRP Landscape", "Propose an Organization"

### 4.2 Organization Directory `/directory`

Layout matches slide 3 of the deliverable.

**Top bar:**
- Search input (matches `name`, `description`, `contact_name`, `datasets_of_focus`)
- Filter dropdowns: Sector, Organization Type, Capabilities (multi), Dataset Domains (multi), Engagement Status (admin sees all three values; public sees the control but only `active`/`in_contact`)
- Action buttons: `+ Propose Organization` | `Bulk Upload (CSV)` [admin only] | `Export CSV`
- View-mode toggle: **Grid** | **Table** | **Overlap Map**

**Filter state lives in the URL** (query params) so views are shareable.

**Public query default:** backend filters out `engagement_status = deprioritized` on any non-admin request.

### 4.3 Org Detail `/directory/:id`

- Header: name, logo, sector color stripe, engagement status chip (admin only for `deprioritized`), type tag, verified badge
- Description, URL, contact info
- Tag clusters: Capabilities, Dataset Domains
- Partners: chips linking to other org detail pages
- Datasets of Focus: chips linking to `/datasets/:slug` if a landscape page exists
- `Request Edit` button → `/directory/:id/edit`
- `Last updated X ago`, `Created X ago`

Public route returns 404 if `engagement_status = deprioritized`.

### 4.4 Propose Edit `/directory/:id/edit` and New Org `/directory/new`

- Form pre-filled with current values (edit) or blank (new)
- Side panel shows "what's changing" as a live diff (for edits)
- **Required:** proposer email
- Optional: rationale
- Submit → creates `EditProposal` with `status: pending`
- Confirmation page: "Thanks — we'll email you at [email] when the Exchange team reviews this."

### 4.5 Dataset Landscape Page `/datasets/:slug`

Launch content: **GHGRP only**, as a pilot / pattern demonstration.

Page structure:
- Dataset description + producing agency
- Key resource links (curated — PEDP Harvard Dataverse entry, Climate Program Portal, etc.)
- Capability matrix: rows = orgs whose `datasets_of_focus` includes this dataset, columns = capabilities, cells = ✓
- Grid of relevant org cards below the matrix

The page is designed so that adding more dataset landscape pages later (CJEST, FEMA Flood Zone, whatever) is a content action, not a code change.

### 4.6 Resources `/resources`

Grouped link list, admin-editable. Groups:
- Preservation Networks
- Data Platforms & Repository Hosts
- Portals (Climate Program Portal, PEDP Harvard Dataverse, etc.)
- Federal Agencies (NASA, NOAA, EPA, NCAR)

### 4.7 Admin `/admin`

- **Queue** (`/admin/queue`): list of pending `EditProposal`s. Each row expandable to show diff. Approve / Reject buttons. Approval applies the diff, updates `last_updated`, records `reviewed_by`. Reject prompts for a note which is emailed to proposer.
- **Bulk Upload** (`/admin/bulk-upload`): CSV upload → validation → diff preview (adds / updates / conflicts / invalid) → confirm. All-or-nothing commit.
- **Dataset Pages** (`/admin/datasets`): create/edit/publish/unpublish dataset landscape pages.
- **Resource Links** (`/admin/resources`): edit the grouped link list on `/resources`.

Any NYCE admin can approve/reject — no single-person bottleneck.

---

## 5. View Modes (Directory)

### 5.1 Grid (default)
Card = sector color stripe, type tag, engagement status chip (suppressed if `deprioritized`, but that org won't render publicly anyway), name, 1-line description, up to 3 capability tags (+N overflow), "Updated X ago", contact name. Matches slide 3 screenshot.

### 5.2 Table
Sortable columns: Name, Sector, Type, Engagement Status, Capabilities (count), Dataset Domains, Partners (count), Last Updated. Click a row → org detail.

### 5.3 Overlap Map — **Capability × Dataset Domain matrix heatmap**

- **Rows:** the 8 capabilities
- **Columns:** the 6 dataset domains
- **Cell value:** count of orgs in the currently filtered result set that have that capability AND work on that dataset domain
- **Color intensity:** scaled to the cell value (darker = more orgs)
- **Empty cells:** visually distinct (light neutral) — these represent ecosystem gaps
- **Click a cell:** opens a side panel listing every org in that intersection, with links to detail pages
- **Hover a cell:** tooltip with count and top 3 org names
- **Respects all active filters** — so filtering by sector shows the matrix for just that sector, etc.

Why not the force-directed partner graph: partner data will be auto-extracted from prose and noisy at launch. A matrix makes coverage and gaps immediately legible; the graph can be added in v2 once partner data is clean.

---

## 6. Search & Filter

- Search: client-side fuzzy match on the loaded result set (Fuse.js or similar)
- Filters combine with AND across fields, OR within a multi-select field
- "Clear all" button when any filter is active
- Active filter chips visible below the bar
- All filter state serialized to URL query params

---

## 7. Collaborative Editing Flow

```
Visitor → clicks "Request Edit" on org card or "+ Propose Organization"
  → /directory/:id/edit or /directory/new
  → submits (email required, rationale optional)
  → EditProposal saved (status: pending)
  → NYCE admins see it in /admin/queue
     → Approve: apply diff, update org.last_updated, record reviewer
     → Reject: mark rejected with note
  → Email sent to proposer on resolution (approved or rejected)
```

---

## 8. Bulk Upload & Export (CSV)

**Export CSV** (public): downloads the currently filtered result set. Schema matches §3.1 exactly. Multi-value fields (capabilities, dataset_domains, partners, datasets_of_focus) serialized as JSON arrays in the cell. **`deprioritized` orgs are not exported in public requests.**

**Bulk Upload CSV** (admin):
1. Upload file
2. Validation pass — row-by-row. Report: N adds / N updates / N conflicts / N invalid
3. Diff preview — admin sees exactly what will change
4. Confirm or cancel. Commits are all-or-nothing.
5. Matching rule: `id` if present, else `name` case-insensitive

---

## 9. Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind
- **Backend / DB:** Supabase (Postgres + magic-link auth + row-level security)
- **Auth model:** public can read non-deprioritized orgs; admin role can read/write all
- **CSV:** `papaparse`
- **Search:** Fuse.js (client-side fuzzy)
- **Overlap Map:** plain HTML table + CSS grid with computed cell intensities; no graph library needed
- **Email (proposal notifications):** Resend or Supabase's built-in SMTP
- **Deploy:** Vercel

---

## 10. Build Phases

**Phase 0 — Data prep** (before any code)
- Apply `sector_mapping.csv` overrides from Megs
- Dedupe id 31 into id 4 (Harvard LIL) and id 32 into id 12 (Stanford BLN)
- Backfill `engagement_status` for all rows (default `active` unless specified)
- Normalize `tags` → `capabilities` and `datasets` → `dataset_domains`

**Phase 1 — Read-only directory**
Data model + seed import, Home, Directory Grid + Table views, Org Detail, Resources page, Export CSV. Ship this first — it's useful standalone.

**Phase 2 — Contribution loop**
Propose Edit / New Org flows, admin auth, Review Queue, Bulk Upload, proposal email notifications.

**Phase 3 — Overlap Map + Dataset Landscape**
Capability × Dataset-Domain matrix, GHGRP pilot landscape page, dataset page admin UI.
