-- Schema change: organizations.sector (single enum) → sectors text[]
-- An organization can now belong to multiple sectors. Backfills the new
-- column from the old one before dropping it.

-- 1. Add new array column
alter table public.organizations
  add column if not exists sectors text[] not null default '{}';

-- 2. Backfill from the legacy `sector` column when present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'sector'
  ) then
    execute $sql$
      update public.organizations
      set sectors = array[sector::text]
      where (sectors is null or array_length(sectors, 1) is null)
        and sector is not null
    $sql$;
  end if;
end $$;

-- 3. Drop the legacy single-value column (safe — code no longer reads it).
alter table public.organizations drop column if exists sector;

-- 4. The sector_t enum can stay (harmless) but isn't referenced anywhere now.
