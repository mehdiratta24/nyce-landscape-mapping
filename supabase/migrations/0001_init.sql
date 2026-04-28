-- Climate Data Landscape — Phase 2 schema
-- Apply via Supabase dashboard → SQL Editor → paste this whole file → Run.
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────
-- enums
-- ──────────────────────────────────────────────────────────────────

do $$ begin
  create type sector_t as enum (
    'federal_producer',
    'preservation_effort',
    'data_platform',
    'academia_research'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type org_type_t as enum (
    'nonprofit', 'academic', 'company', 'government', 'independent'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type engagement_t as enum ('active', 'in_contact', 'deprioritized');
exception when duplicate_object then null; end $$;

do $$ begin
  create type proposal_status_t as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ──────────────────────────────────────────────────────────────────
-- tables
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.organizations (
  id                  text primary key,
  name                text not null,
  url                 text default '',
  description         text default '',
  sector              sector_t not null,
  organization_type   org_type_t not null default 'independent',
  engagement_status   engagement_t not null default 'active',
  capabilities        text[] not null default '{}',
  dataset_domains     text[] not null default '{}',
  partners            text[] not null default '{}',
  datasets_of_focus   text[] not null default '{}',
  contact_name        text,
  contact_email       text,
  logo_url            text,
  is_verified         boolean not null default false,
  created_at          timestamptz not null default now(),
  last_updated        timestamptz not null default now()
);

create index if not exists organizations_sector_idx
  on public.organizations (sector);
create index if not exists organizations_engagement_idx
  on public.organizations (engagement_status);

create table if not exists public.edit_proposals (
  id              uuid primary key default gen_random_uuid(),
  target_org_id   text references public.organizations(id) on delete set null,
  proposed_payload jsonb not null,
  proposer_email  text not null,
  rationale       text,
  status          proposal_status_t not null default 'pending',
  admin_note      text,
  reviewed_by     text,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

create index if not exists edit_proposals_status_idx
  on public.edit_proposals (status, created_at desc);

create table if not exists public.dataset_landscapes (
  slug              text primary key,
  name              text not null,
  description       text default '',
  producing_agency  text,
  resource_links    jsonb not null default '[]',
  is_published      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.admin_users (
  email       text primary key,
  added_at    timestamptz not null default now(),
  added_by    text
);

-- ──────────────────────────────────────────────────────────────────
-- helper: is the current authed user an admin?
-- ──────────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- last_updated bump trigger on organizations
-- ──────────────────────────────────────────────────────────────────

create or replace function public.bump_last_updated()
returns trigger language plpgsql as $$
begin
  new.last_updated := now();
  return new;
end $$;

drop trigger if exists organizations_bump_last_updated on public.organizations;
create trigger organizations_bump_last_updated
  before update on public.organizations
  for each row execute function public.bump_last_updated();

-- ──────────────────────────────────────────────────────────────────
-- row level security
-- ──────────────────────────────────────────────────────────────────

alter table public.organizations enable row level security;
alter table public.edit_proposals enable row level security;
alter table public.dataset_landscapes enable row level security;
alter table public.admin_users enable row level security;

-- organizations: public reads non-deprioritized; admins read all + write all
drop policy if exists "orgs_public_read" on public.organizations;
create policy "orgs_public_read" on public.organizations
  for select to anon, authenticated
  using (engagement_status <> 'deprioritized' or public.is_admin());

drop policy if exists "orgs_admin_write" on public.organizations;
create policy "orgs_admin_write" on public.organizations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- edit_proposals: anyone can submit (with email); admins read + update
drop policy if exists "proposals_anon_insert" on public.edit_proposals;
create policy "proposals_anon_insert" on public.edit_proposals
  for insert to anon, authenticated
  with check (
    proposer_email is not null and length(proposer_email) > 3
  );

drop policy if exists "proposals_admin_read" on public.edit_proposals;
create policy "proposals_admin_read" on public.edit_proposals
  for select to authenticated
  using (public.is_admin());

drop policy if exists "proposals_admin_update" on public.edit_proposals;
create policy "proposals_admin_update" on public.edit_proposals
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- dataset_landscapes: public sees published; admins manage all
drop policy if exists "landscapes_public_read" on public.dataset_landscapes;
create policy "landscapes_public_read" on public.dataset_landscapes
  for select to anon, authenticated
  using (is_published or public.is_admin());

drop policy if exists "landscapes_admin_write" on public.dataset_landscapes;
create policy "landscapes_admin_write" on public.dataset_landscapes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- admin_users: only admins can see (used for membership check)
drop policy if exists "admins_self_read" on public.admin_users;
create policy "admins_self_read" on public.admin_users
  for select to authenticated
  using (public.is_admin());

-- ──────────────────────────────────────────────────────────────────
-- bootstrap admin
-- replace with your email, then re-run this section. anyone in
-- public.admin_users can magic-link in to the admin pages.
-- ──────────────────────────────────────────────────────────────────

insert into public.admin_users (email, added_by)
values
  -- TODO: replace with your real NYCE admin emails before going live
  ('admin@example.com', 'system')
on conflict (email) do nothing;
