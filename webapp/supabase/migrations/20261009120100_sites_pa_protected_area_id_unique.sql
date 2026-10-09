-- One protected area belongs to one site. The column stays nullable:
-- a site can have no protected area. A unique index in Postgres allows many nulls.
-- Stop if this file fails. Two sites already share one protected_area_id.
-- A human must remove the extra link before this constraint can be added.
-- A human runs this file in the Supabase dashboard. Do not run it from the app.

drop index if exists public.sites_pa_protected_area_id_idx;

alter table public.sites_pa
  drop constraint if exists sites_pa_protected_area_id_key;

alter table public.sites_pa
  add constraint sites_pa_protected_area_id_key unique (protected_area_id);

comment on column public.sites_pa.protected_area_id is
  'Optional protected_areas.id. Null when the site has no protected area. Unique, so one protected area links to one site.';

notify pgrst, 'reload schema';
