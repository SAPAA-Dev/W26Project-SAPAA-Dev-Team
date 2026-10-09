-- A report must go to the archive before an admin can delete it forever.
-- Archiving hides the report but keeps its answers and images for a possible restore.
-- Permanent deletion removes the saved report data first. The server then removes
-- the image files from storage.

-- A blank archive date means that the report is still in normal use.
alter table public.form_responses
  add column if not exists archived_at timestamptz;

create index if not exists form_responses_archived_at_idx
  on public.form_responses (archived_at);

-- These counts tell the admin what the archive or delete action will affect.
create or replace function public.get_site_inspection_report_delete_impact(
  p_response_id bigint
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'responseId', responses.id,
    'inspectionNo', responses.inspection_no,
    'inspectionDate', responses.inspection_date,
    'siteName', sites.namesite,
    'answerCount', (
      select count(*)
      from public.answers
      where response_id = responses.id
    ),
    'attachmentCount', (
      select count(*)
      from public.attachments
      where response_id = responses.id
    )
  )
  from public.form_responses responses
  left join public.sites_pa sites on sites.id = responses.site_id
  where responses.id = p_response_id;
$$;

-- Archiving only sets a date. It does not remove answers or images.
create or replace function public.archive_site_inspection_report(
  p_response_id bigint
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  response_row public.form_responses%rowtype;
  archive_time timestamptz := now();
begin
  select * into response_row
  from public.form_responses
  where id = p_response_id
  for update;

  if not found then
    raise exception 'Site Inspection Report % does not exist', p_response_id
      using errcode = 'P0002';
  end if;

  if response_row.archived_at is not null then
    raise exception 'Site Inspection Report % is already archived', p_response_id;
  end if;

  update public.form_responses
  set archived_at = archive_time
  where id = p_response_id;

  return jsonb_build_object(
    'responseId', response_row.id,
    'archivedAt', archive_time
  );
end;
$$;

-- Restoring clears the archive date and makes the report visible again.
create or replace function public.restore_site_inspection_report(
  p_response_id bigint
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  response_row public.form_responses%rowtype;
begin
  select * into response_row
  from public.form_responses
  where id = p_response_id
  for update;

  if not found then
    raise exception 'Site Inspection Report % does not exist', p_response_id
      using errcode = 'P0002';
  end if;

  if response_row.archived_at is null then
    raise exception 'Site Inspection Report % is not archived', p_response_id;
  end if;

  update public.form_responses
  set archived_at = null
  where id = p_response_id;

  return jsonb_build_object(
    'responseId', response_row.id
  );
end;
$$;

-- Permanent deletion is allowed only for a report that is already archived.
-- All database deletes finish together. If one delete fails, none of them are saved.
create or replace function public.permanently_delete_site_inspection_report(
  p_response_id bigint
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  response_row public.form_responses%rowtype;
  delete_impact jsonb;
  storage_keys text[];
begin
  select * into response_row
  from public.form_responses
  where id = p_response_id
  for update;

  if not found then
    raise exception 'Site Inspection Report % does not exist', p_response_id
      using errcode = 'P0002';
  end if;

  if response_row.archived_at is null then
    raise exception 'Site Inspection Report % must be archived before it can be permanently deleted', p_response_id;
  end if;

  select public.get_site_inspection_report_delete_impact(p_response_id)
  into delete_impact;

  -- Keep the image locations so the server can delete the files after this work succeeds.
  select coalesce(
    array_agg(attachments.storage_key order by attachments.storage_key),
    array[]::text[]
  )
  into storage_keys
  from public.attachments
  where response_id = p_response_id;

  -- Child records must be removed before their report can be removed.
  delete from public.attachments
  where response_id = p_response_id;

  delete from public.answers
  where response_id = p_response_id;

  delete from public.form_responses
  where id = p_response_id;

  return delete_impact || jsonb_build_object(
    'storageKeys', to_jsonb(storage_keys)
  );
end;
$$;

-- Archived reports stay saved, but they must not change current totals.
create or replace function public.get_naturalness_distribution()
returns table (naturalness_score text, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select answers.obs_value, count(*)
  from public.answers as answers
  join public.questions as questions on questions.id = answers.question_id
  join public.form_responses as responses on responses.id = answers.response_id
  where questions."question key" = 'Q31_Naturalness'
    and responses.is_active
    and responses.archived_at is null
    and answers.obs_value is not null
  group by answers.obs_value
  order by answers.obs_value;
$$;

create or replace function public.get_top_sites_distribution()
returns table (namesite text, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select sites.namesite, count(*)
  from public.form_responses as responses
  join public.sites_pa as sites on sites.id = responses.site_id
  where responses.is_active
    and responses.archived_at is null
  group by sites.namesite
  order by count(*) desc, sites.namesite
  limit 5;
$$;

create or replace function public.get_distinct_inspected_site_count(p_user_id uuid)
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select count(distinct responses.site_id)
  from public.form_responses as responses
  where responses.user_id = p_user_id
    and responses.is_active
    and responses.archived_at is null
    and responses.site_id is not null;
$$;

-- Only trusted server code can use the report archive and delete functions.
revoke all on function public.get_site_inspection_report_delete_impact(bigint)
  from public, anon, authenticated;
revoke all on function public.archive_site_inspection_report(bigint)
  from public, anon, authenticated;
revoke all on function public.restore_site_inspection_report(bigint)
  from public, anon, authenticated;
revoke all on function public.permanently_delete_site_inspection_report(bigint)
  from public, anon, authenticated;

grant execute on function public.get_site_inspection_report_delete_impact(bigint)
  to service_role;
grant execute on function public.archive_site_inspection_report(bigint)
  to service_role;
grant execute on function public.restore_site_inspection_report(bigint)
  to service_role;
grant execute on function public.permanently_delete_site_inspection_report(bigint)
  to service_role;
grant execute on function public.get_naturalness_distribution()
  to service_role;
grant execute on function public.get_top_sites_distribution()
  to service_role;
grant execute on function public.get_distinct_inspected_site_count(uuid)
  to service_role;

-- Tell the API about the new functions without a restart.
notify pgrst, 'reload schema';
