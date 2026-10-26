-- One protected area belongs to one site. The column stays nullable:
-- a site can have no protected area. A unique index in Postgres allows many nulls.
-- The check below stops the file with a readable error before the constraint fails
-- with a raw unique violation. A human must remove the extra link before this
-- constraint can be added. A human runs this file in the Supabase dashboard. Do not
-- run it from the app. ALTER TABLE ... ADD CONSTRAINT ... UNIQUE takes an ACCESS
-- EXCLUSIVE lock on sites_pa while the unique index builds: reads and writes wait for it,
-- so run it outside peak use.

do $$
declare
  duplicate_link record;
begin
  for duplicate_link in
    select protected_area_id, count(*) as site_count
    from public.sites_pa
    where protected_area_id is not null
    group by protected_area_id
    having count(*) > 1
  loop
    raise exception
      'Two or more sites link to protected area %: remove the extra link before this constraint can be added',
      duplicate_link.protected_area_id;
  end loop;
end;
$$;

drop index if exists public.sites_pa_protected_area_id_idx;

alter table public.sites_pa
  drop constraint if exists sites_pa_protected_area_id_key;

alter table public.sites_pa
  add constraint sites_pa_protected_area_id_key unique (protected_area_id);

comment on column public.sites_pa.protected_area_id is
  'Optional protected_areas.id. Null when the site has no protected area. Unique, so one protected area links to one site.';

notify pgrst, 'reload schema';
