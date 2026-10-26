-- US 2.0.12, 2.0.13: the three to-visit priority scores of a site, set by an Admin.
-- The priority itself is not stored. The server adds the three scores, so the same scores
-- always give the same priority. priority_saved_at drives the one-year reminder.
-- A site with no scores has null in all five columns. A human runs this file in the
-- Supabase dashboard for production. Safe to run twice.

alter table public.sites_pa
  add column if not exists priority_abuses smallint,
  add column if not exists priority_biological smallint,
  add column if not exists priority_time smallint,
  add column if not exists priority_saved_at timestamptz,
  add column if not exists priority_saved_by uuid references auth.users (id) on delete set null;

-- The constraint is only added when it does not exist, so a rerun does not repeat
-- the full-table validation scan under its ACCESS EXCLUSIVE lock.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sites_pa_priority_scores_valid'
      and conrelid = 'public.sites_pa'::regclass
  ) then
    alter table public.sites_pa
      add constraint sites_pa_priority_scores_valid check (
        (priority_abuses is null and priority_biological is null and priority_time is null
          and priority_saved_at is null)
        or (priority_abuses between 0 and 5 and priority_biological between 0 and 5
          and priority_time between 0 and 5 and priority_saved_at is not null)
      );
  end if;
end;
$$;

comment on column public.sites_pa.priority_abuses is
  'Admin points for abuses, 0 to 5. Null with the other priority columns means not scored.';

-- Existing grants cover the new columns: authenticated reads, service role writes.
-- Only the admin server action writes them.
notify pgrst, 'reload schema';
