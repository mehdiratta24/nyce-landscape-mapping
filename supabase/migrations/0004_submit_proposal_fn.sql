-- Phase 2 fix #3: replace direct anon INSERT with a SECURITY DEFINER function.
--
-- We hit an RLS edge case where a valid WITH CHECK kept rejecting anon inserts.
-- Switching to a SECURITY DEFINER function moves the policy enforcement into
-- the function body, runs the insert as the function owner (postgres), and
-- avoids the RLS pathway entirely for proposal submission. The proposals
-- table still has RLS enabled for SELECT/UPDATE — those remain admin-only.

create or replace function public.submit_proposal(
  p_target_org_id  text,
  p_proposed_payload jsonb,
  p_proposer_email text,
  p_rationale      text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_proposer_email is null or length(trim(p_proposer_email)) < 4 then
    raise exception 'A valid proposer email is required';
  end if;
  if p_proposed_payload is null then
    raise exception 'Proposed payload is required';
  end if;

  insert into public.edit_proposals (
    target_org_id, proposed_payload, proposer_email, rationale
  ) values (
    p_target_org_id, p_proposed_payload, lower(trim(p_proposer_email)), p_rationale
  ) returning id into new_id;

  return new_id;
end $$;

grant execute on function public.submit_proposal(text, jsonb, text, text)
  to anon, authenticated;

-- Drop the now-redundant anon insert policy. RLS on edit_proposals still
-- restricts SELECT/UPDATE to admins.
drop policy if exists "proposals_anon_insert" on public.edit_proposals;
