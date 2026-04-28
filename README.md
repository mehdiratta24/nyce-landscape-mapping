# Climate Data Landscape

A directory of organizations engaged in the preservation and stewardship of public climate data. Maintained by the New York Climate Exchange as part of the Climate Data Stewardship initiative.

> Working document · v0.1 · read-only preview

## What's in this repo

- **`src/app/`** — Next.js 14 App Router pages: home, directory (grid / table / coverage matrix views), org detail, resources.
- **`src/components/`** — `OrgCard`, `OrgTable`, `DirectoryView`, `OverlapMatrix`.
- **`src/lib/`** — types, controlled vocabularies, data layer.
- **`data/raw/`** — source CSVs (`organizations.csv`, `sector_mapping.csv`).
- **`data/organizations.json`** — canonical seed produced by the build script.
- **`scripts/build-seed.ts`** — Phase 0 data prep: applies sector mapping, merges duplicates, normalizes vocabulary, runs partner auto-extraction.
- **`SPEC.md`** — full build specification (phases 0–3).

## Running locally

```bash
npm install
npm run build:seed   # rebuild data/organizations.json from data/raw/*.csv
npm run dev          # start on http://localhost:3000
```

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Onest (display) · Inter (body) · JetBrains Mono — via `next/font/google`
- `papaparse` for CSV, `fuse.js` for client-side fuzzy search
- Static JSON seed for v0.1; Supabase wiring planned for Phase 2

## Build phases

- **Phase 0** — data prep ✓
- **Phase 1** — read-only directory ✓
- **Phase 2** — admin auth, edit-proposal queue, bulk upload (planned)
- **Phase 3** — dataset landscape pages (planned)

See `SPEC.md` for full scope.
