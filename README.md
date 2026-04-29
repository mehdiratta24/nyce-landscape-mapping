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
- **Phase 2** — Supabase backend, edit proposals, admin auth, review queue, bulk upload ✓
- **Phase 3** — dataset landscape pages (planned)

See `SPEC.md` for full scope.

## Phase 2 setup (Supabase)

The app falls back to the static JSON seed if Supabase env vars are not present, so Phase 1 keeps working out of the box. To enable edit proposals, admin auth, and bulk upload:

1. **Create a project** at https://supabase.com (free tier is fine).
2. **Apply the schema.** Open Supabase dashboard → SQL Editor → paste the contents of `supabase/migrations/0001_init.sql` → Run.
3. **Add admin emails.** In the SQL editor:
   ```sql
   insert into public.admin_users (email) values ('you@nyclimateexchange.org');
   ```
4. **Configure env vars.** Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (only needed for the seed step below — keep secret)
5. **Seed the database** with the Phase 0 organizations:
   ```bash
   npm run seed:supabase
   ```
6. **Restart the dev server.** The app will now read/write through Supabase.

### Vercel env vars

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — public, safe in the client bundle
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, safe in the client bundle
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**. Used by admin server actions to bypass RLS. Set in Vercel without `NEXT_PUBLIC_` prefix; do not log or expose.

Optional:
- `AUTH_ENABLED` — `false` (default) opens admin pages to any visitor; `true` requires Supabase magic-link sign-in. Flip to `true` once email delivery is set up.

### Magic-link redirect URLs

In the Supabase dashboard → Authentication → URL Configuration, add:
- `http://localhost:3000/admin/auth/callback` (dev)
- `https://your-prod-domain/admin/auth/callback` (prod)
