-- #181 (US 6.0.1): link each site card to the KML boundary that belongs to it and
-- store the centre of that boundary on the site.
-- The KML holds NAME "Alexo" and TYPE "NA". The admin site card is "Alexo (NA)".
-- The match is the exact string name + ' (' + area_type + ')'.
-- This file does not fill any row. The match runs when an admin imports a KML/KMZ
-- or adds a site (utils/kml-import-actions.ts and utils/supabase/queries.ts). A site
-- save refreshes the centre only, so it cannot undo a link an admin cleared.
-- A human runs this same file in the Supabase dashboard for production. Safe to run twice.

alter table public.sites_pa
  add column if not exists centre_latitude double precision,
  add column if not exists centre_longitude double precision;

comment on column public.sites_pa.centre_latitude is
  'Latitude of the centre of the linked protected area bounding box. Null when no area is linked or the geometry has no position.';
comment on column public.sites_pa.centre_longitude is
  'Longitude of the centre of the linked protected area bounding box. Null when no area is linked or the geometry has no position.';

-- Drop the no-argument draft if a database already ran an earlier copy of this file.
drop function if exists public.link_sites_to_protected_areas();

create or replace function public.link_sites_to_protected_areas(p_link boolean default true)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  linked_count integer := 0;
  centred_count integer := 0;
begin
  -- A save may clear a link on purpose, so its caller sends false. Only an import or
  -- a new site asks the function to add links.
  if p_link then
    -- Strict name match. A site or an area with more than one candidate is left
    -- alone, so an admin can link it by hand.
    with candidates as (
      select site.id as site_id, area.id as area_id
      from public.sites_pa as site
      join public.protected_areas as area
        on site.namesite = area.name || ' (' || area.area_type || ')'
      where site.protected_area_id is null
        and site.archived_at is null
        and btrim(area.name) <> ''
        and btrim(area.area_type) <> ''
        and not exists (
          select 1
          from public.sites_pa as taken
          where taken.protected_area_id = area.id
        )
    ),
    one_area_for_site as (
      select site_id from candidates group by site_id having count(*) = 1
    ),
    one_site_for_area as (
      select area_id from candidates group by area_id having count(*) = 1
    )
    update public.sites_pa as site
    set protected_area_id = candidates.area_id
    from candidates
    join one_area_for_site on one_area_for_site.site_id = candidates.site_id
    join one_site_for_area on one_site_for_area.area_id = candidates.area_id
    where site.id = candidates.site_id
      and site.protected_area_id is null;

    get diagnostics linked_count = row_count;
  end if;

  -- The bounding box of every position in the linked MultiPolygon.
  -- GeoJSON positions are [longitude, latitude]. The aggregate always returns one
  -- row, so a site with no link or no usable position gets a null centre.
  with computed as (
    select site.id as site_id,
           (bounds.min_longitude + bounds.max_longitude) / 2 as centre_longitude,
           (bounds.min_latitude + bounds.max_latitude) / 2 as centre_latitude
    from public.sites_pa as site
    left join lateral (
      select
        min((point_value ->> 0)::double precision) as min_longitude,
        max((point_value ->> 0)::double precision) as max_longitude,
        min((point_value ->> 1)::double precision) as min_latitude,
        max((point_value ->> 1)::double precision) as max_latitude
      from public.protected_areas as area
      cross join lateral jsonb_array_elements(
        case
          when jsonb_typeof(area.geometry -> 'coordinates') = 'array'
            then area.geometry -> 'coordinates'
          else '[]'::jsonb
        end
      ) as polygons(polygon_value)
      cross join lateral jsonb_array_elements(
        case
          when jsonb_typeof(polygons.polygon_value) = 'array'
            then polygons.polygon_value
          else '[]'::jsonb
        end
      ) as rings(ring_value)
      cross join lateral jsonb_array_elements(
        case
          when jsonb_typeof(rings.ring_value) = 'array'
            then rings.ring_value
          else '[]'::jsonb
        end
      ) as points(point_value)
      where area.id = site.protected_area_id
        and jsonb_typeof(points.point_value -> 0) = 'number'
        and jsonb_typeof(points.point_value -> 1) = 'number'
    ) as bounds on true
    where site.archived_at is null
  )
  update public.sites_pa as site
  set centre_longitude = computed.centre_longitude,
      centre_latitude = computed.centre_latitude
  from computed
  where site.id = computed.site_id
    and (
      site.centre_longitude is distinct from computed.centre_longitude
      or site.centre_latitude is distinct from computed.centre_latitude
    );

  get diagnostics centred_count = row_count;

  return jsonb_build_object(
    'linked', linked_count,
    'centred', centred_count
  );
end;
$$;

revoke all on function public.link_sites_to_protected_areas(boolean) from public, anon, authenticated;
grant execute on function public.link_sites_to_protected_areas(boolean) to service_role;

notify pgrst, 'reload schema';
