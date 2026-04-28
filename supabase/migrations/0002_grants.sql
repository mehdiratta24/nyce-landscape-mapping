-- Phase 2 fix: explicit table-level GRANTs for anon / authenticated.
-- Some Supabase setups don't auto-grant on tables created via the SQL Editor,
-- which causes RLS-style "new row violates row-level security policy" errors
-- even when the WITH CHECK clause should pass. This migration grants what RLS
-- expects to filter on top of.
--
-- Apply via Supabase dashboard → SQL Editor → paste → Run.

grant select on table public.organizations to anon, authenticated;
grant insert, update, delete on table public.organizations to authenticated;

grant insert on table public.edit_proposals to anon, authenticated;
grant select, update on table public.edit_proposals to authenticated;

grant select on table public.dataset_landscapes to anon, authenticated;
grant insert, update, delete on table public.dataset_landscapes to authenticated;

grant select on table public.admin_users to authenticated;
