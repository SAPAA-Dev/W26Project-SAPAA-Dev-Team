-- Admin-chosen color for a boundary on the sites map.
-- A per-site color is written to one row. A per-type color is written to every row
-- that has the same area_type, so it replaces individual colors of that type.
-- The KML import upserts on (folder, fid) with a payload that does not include this
-- column, so an import keeps the color of an existing row. A human runs this file in
-- the Supabase dashboard for production. Safe to run twice.

alter table public.protected_areas
  add column if not exists boundary_color text;

alter table public.protected_areas
  drop constraint if exists protected_areas_boundary_color_format;

-- The constraint is only added when it does not exist, so a rerun does not
-- repeat the full-table validation scan under its SHARE ROW EXCLUSIVE lock.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'protected_areas_boundary_color_format'
      and conrelid = 'public.protected_areas'::regclass
  ) then
    alter table public.protected_areas
      add constraint protected_areas_boundary_color_format
      check (boundary_color is null or boundary_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;
end;
$$;

comment on column public.protected_areas.boundary_color is
  'Admin-chosen map color as #rrggbb. Null means the map default.';

-- Existing grants cover the new column: authenticated reads, service role writes.
notify pgrst, 'reload schema';
