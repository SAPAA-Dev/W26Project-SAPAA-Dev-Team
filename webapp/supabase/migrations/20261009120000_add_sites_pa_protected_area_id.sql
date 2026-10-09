alter table public.sites_pa
  add column if not exists protected_area_id bigint
  references public.protected_areas (id) on delete set null;

create index if not exists sites_pa_protected_area_id_idx
  on public.sites_pa (protected_area_id);

comment on column public.sites_pa.protected_area_id is
  'Optional protected_areas.id. Null when the site has no protected area.';

notify pgrst, 'reload schema';
