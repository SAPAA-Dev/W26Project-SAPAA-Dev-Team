-- US 6.0.1: match protected_areas to the SAPAA-Map export.
-- The export has no GlobalID and no OBJECTID, so a row is now identified by the KML
-- Folder name plus the FID that the description carries. The FID restarts in every
-- folder, so it is only unique together with the folder.
-- The columns the old Alberta Open Data export filled, and the sites_pa link, are
-- dropped. Nothing in webapp/ reads them and no site card is built from this table.

alter table public.protected_areas drop column if exists site_id;
alter table public.protected_areas drop column if exists global_id;
alter table public.protected_areas drop column if exists objectid;
alter table public.protected_areas drop column if exists pasites_id;
alter table public.protected_areas drop column if exists short_name;
alter table public.protected_areas drop column if exists shape_area;
alter table public.protected_areas drop column if exists shape_length;
alter table public.protected_areas drop column if exists label_point;

alter table public.protected_areas add column if not exists folder  text;
alter table public.protected_areas add column if not exists fid     bigint;
alter table public.protected_areas add column if not exists date_res date;
alter table public.protected_areas add column if not exists area_ha numeric;

-- Rows written by an older import have neither value. Give them a value before the
-- not null and the unique constraint go on. The id makes the backfilled fid unique
-- per row, and it is negative so it can never collide with a real FID (0 or higher).
update public.protected_areas set folder = 'Unknown' where folder is null;
update public.protected_areas set fid = -id where fid is null;

alter table public.protected_areas alter column folder set not null;
alter table public.protected_areas alter column fid    set not null;

alter table public.protected_areas drop constraint if exists protected_areas_folder_fid_key;
alter table public.protected_areas
  add constraint protected_areas_folder_fid_key unique (folder, fid);

comment on column public.protected_areas.folder is
  'Top-level KML Folder name the placemark came from. Half of the row identity.';
comment on column public.protected_areas.fid is
  'FID from the placemark description. Unique only inside one folder. -1 when the placemark has no FID.';

notify pgrst, 'reload schema';
