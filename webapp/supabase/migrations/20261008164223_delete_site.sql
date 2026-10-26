-- US 2.0.4: archive a site instead of hard deleting it.
-- Review on #160: the team does not want a hard delete. Deleting a site archives it:
-- sites_pa.archived_at is set and the site is hidden from the app. Reports, answers,
-- attachments, homepage images, and steward assignments stay connected to the site.
-- A human runs this same file in the Supabase dashboard for production. Safe to run twice.

-- Null means the site is visible. A timestamp means the site is archived.
alter table public.sites_pa add column if not exists archived_at timestamptz;

-- A permanent delete disconnects reports and homepage images instead of deleting them,
-- so their site_id columns must allow null. attachments.site_id is already nullable.
-- Both statements need an ACCESS EXCLUSIVE lock on the table: they queue behind running
-- queries and block new ones while they queue. Run this file outside peak use.
alter table public.form_responses alter column site_id drop not null;
alter table public.homepage_image_uploads alter column site_id drop not null;

--Gathers all site record and returns a count for the admin confirmation dialog
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
    )
  )
  from public.sites_pa sites
  where sites.id = p_site_id;
$$;

-- Remove the earlier hard-delete RPC if an environment already ran a previous
-- version of this migration.
drop function if exists public.delete_site_cascade(bigint);

-- Archives one site: sets archived_at and hides the site from the app.
-- No report, answer, attachment, homepage image, or steward assignment is changed.
create or replace function public.archive_site(p_site_id bigint)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  site_row public.sites_pa%rowtype;
begin
  -- Lock the site so another request cannot archive, restore, or delete it during this transaction.
  select * into site_row
  from public.sites_pa
  where id = p_site_id
  for update;

  if not found then
    raise exception 'Site % does not exist', p_site_id
      using errcode = 'P0002';
  end if;

  if site_row.archived_at is not null then
    raise exception 'Site % is already archived', p_site_id;
  end if;

  update public.sites_pa
  set archived_at = now()
  where id = p_site_id;

  return jsonb_build_object(
    'siteId', site_row.id,
    'siteName', site_row.namesite,
    'archivedAt', now()
  );
end;
$$;

-- Restores one archived site: clears archived_at so the site is visible again.
create or replace function public.restore_site(p_site_id bigint)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  site_row public.sites_pa%rowtype;
begin
  -- Lock the site so another request cannot archive, restore, or delete it during this transaction.
  select * into site_row
  from public.sites_pa
  where id = p_site_id
  for update;

  if not found then
    raise exception 'Site % does not exist', p_site_id
      using errcode = 'P0002';
  end if;

  if site_row.archived_at is null then
    raise exception 'Site % is not archived', p_site_id;
  end if;

  update public.sites_pa
  set archived_at = null
  where id = p_site_id;

  return jsonb_build_object(
    'siteId', site_row.id,
    'siteName', site_row.namesite
  );
end;
$$;

-- Permanently deletes one archived site. Only the sites_pa row is deleted.
-- Reports, answers, attachments, and homepage images stay in the database with
-- site_id set to null (disconnected). site_stewards rows are removed by the
-- ON DELETE CASCADE on site_stewards.site_id because site_id is that table's
-- primary key and cannot be null; the steward's people row is not touched.
-- S3 objects are not deleted: the files stay with their disconnected records.
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

  -- The parent site is deleted last. site_stewards rows cascade away with it;
  -- every other child row no longer references the site.
  delete from public.sites_pa
  where id = p_site_id;

  return delete_impact;
end;
$$;

-- Direct browser callers cannot run any of these; only the server service role can.
revoke all on function public.get_site_delete_impact(bigint)
  from public, anon, authenticated;
revoke all on function public.archive_site(bigint)
  from public, anon, authenticated;
revoke all on function public.restore_site(bigint)
  from public, anon, authenticated;
revoke all on function public.permanently_delete_site(bigint)
  from public, anon, authenticated;

grant execute on function public.get_site_delete_impact(bigint)
  to service_role;
grant execute on function public.archive_site(bigint)
  to service_role;
grant execute on function public.restore_site(bigint)
  to service_role;
grant execute on function public.permanently_delete_site(bigint)
  to service_role;

-- Refresh PostgREST so the new RPC functions are available without a service restart.
notify pgrst, 'reload schema';
