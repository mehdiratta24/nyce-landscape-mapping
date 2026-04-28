-- Phase 2 fix #2: simplify the anon-insert policy on edit_proposals.
-- The previous version restricted via `to anon, authenticated`. Some Supabase
-- projects appear to evaluate RLS without that role match the way we expect,
-- which results in valid inserts being blocked. Dropping the role clause
-- and applying to public (all roles) — the WITH CHECK still enforces the
-- email requirement.

drop policy if exists "proposals_anon_insert" on public.edit_proposals;

create policy "proposals_anon_insert"
  on public.edit_proposals
  for insert
  to public
  with check (
    proposer_email is not null and length(proposer_email) > 3
  );
