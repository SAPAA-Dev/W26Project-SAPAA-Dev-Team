-- permanently_delete_site was written before site_page_fields (20261008000000) and
-- gpx_tracks (20261020000000) existed. Both reference sites_pa with ON DELETE CASCADE,
-- so a permanent site delete removes them with the site row, but the impact JSON did
-- not report them and the function comment did not name them. This file redefines both
-- functions with the complete list. A human runs this file in the Supabase dashboard
-- for production, after 20261020000000_create_gpx_tracks.sql. Safe to run twice.

-- Complete impact list for the admin confirmation dialog. gpxTrackCount and
-- sitePageFieldCount name the rows that cascade away with the site row.
create or replace function public.get_site_delete_impact(p_site_id bigint)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  -- One JSON object keeps the site identity and all counts in one database response.
  select jsonb_build_object(
    'siteId', sites.id,
    'siteName', sites.namesite,
    -- Count the inspection reports that belong directly to the selected site.
    'inspectionCount', (
      select count(*)
      from public.form_responses responses
      where responses.site_id = sites.id
    ),
    -- Answers belong to reports, so the report join identifies the site's answers.
    'answerCount', (
      select count(*)
      from public.answers answers
      join public.form_responses responses
        on responses.id = answers.response_id
      where responses.site_id = sites.id
    ),
    -- An attachment can identify its site directly or through its inspection report.
    'attachmentCount', (
      select count(*)
      from public.attachments attachments
      where attachments.site_id = sites.id
         or exists (
           select 1
           from public.form_responses responses
           where responses.id = attachments.response_id
             and responses.site_id = sites.id
         )
    ),
    -- Homepage images belong directly to the site and are separate from report attachments.
    'homepageImageCount', (
      select count(*)
      from public.homepage_image_uploads images
      where images.site_id = sites.id
    ),
    -- Deleting an assignment must not delete the steward's person or login record.
    'siteStewardCount', (
      select count(*)
      from public.site_stewards stewards
      where stewards.site_id = sites.id
    ),
    -- GPX track rows cascade away with the site row. The files stay in the bucket,
    -- so every deleted row leaves an unreferenced object.
    'gpxTrackCount', (
      select count(*)
      from public.gpx_tracks tracks
      where tracks.site_id = sites.id
    ),
    -- Page field rows cascade away with the site row.
    'sitePageFieldCount', (
      select count(*)
      from public.site_page_fields fields
      where fields.site_id = sites.id
    )
  )
  from public.sites_pa sites
  where sites.id = p_site_id;
$$;

-- Permanently deletes one archived site. The sites_pa row is deleted, and every row
-- that references it by ON DELETE CASCADE goes with it: site_stewards (site_id is that
-- table's primary key and cannot be null), site_page_fields, and gpx_tracks.
-- Reports, answers, attachments, and homepage images stay in the database with
-- site_id set to null (disconnected). The steward's people row is not touched.
-- S3 objects are not deleted: the files stay with their disconnected records, and
-- a gpx file whose track row is deleted keeps its object with no row pointing at it.
create or replace function public.permanently_delete_site(p_site_id bigint)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  delete_impact jsonb;
begin
  -- Lock the site so another request cannot change it during this transaction.
  perform 1
  from public.sites_pa
  where id = p_site_id
  for update;

  if not found then
    raise exception 'Site % does not exist', p_site_id
      using errcode = 'P0002';
  end if;

  -- Permanent deletion is only offered for archived sites in the archived sites UI.
  if not exists (
    select 1
    from public.sites_pa
    where id = p_site_id
      and archived_at is not null
  ) then
    raise exception 'Site % must be archived before it can be permanently deleted', p_site_id;
  end if;

  -- Capture the connected-record counts while the site and its rows still exist.
  select public.get_site_delete_impact(p_site_id)
  into delete_impact;

  -- Disconnect the records that must survive. Answers stay connected to their
  -- reports, and attachments that belong to a report keep their response_id.
  update public.form_responses
  set site_id = null
  where site_id = p_site_id;

  update public.attachments
  set site_id = null
  where site_id = p_site_id;

  update public.homepage_image_uploads
  set site_id = null
  where site_id = p_site_id;

  -- The parent site is deleted last. site_stewards, site_page_fields, and gpx_tracks
  -- rows cascade away with it; every other child row no longer references the site.
  delete from public.sites_pa
  where id = p_site_id;

  return delete_impact;
end;
$$;

-- Direct browser callers cannot run either function; only the server service role can.
revoke all on function public.get_site_delete_impact(bigint)
  from public, anon, authenticated;
revoke all on function public.permanently_delete_site(bigint)
  from public, anon, authenticated;

grant execute on function public.get_site_delete_impact(bigint)
  to service_role;
grant execute on function public.permanently_delete_site(bigint)
  to service_role;

notify pgrst, 'reload schema';
