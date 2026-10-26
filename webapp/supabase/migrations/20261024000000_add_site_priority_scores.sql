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

-- All four score columns are null (not scored), or all four are set with each score from
-- 0 to 5. num_nonnulls never returns null, so a partial row such as (3, null, null, now())
-- is rejected; a bare check on the nulls would pass it. priority_saved_by is left out on
-- purpose: it is set null when the saving login is deleted, which must stay allowed.
-- An older copy of the constraint is replaced once. A copy already on the num_nonnulls
-- rule is left alone, so a rerun does not repeat the full-table validation scan under its
-- ACCESS EXCLUSIVE lock.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'sites_pa_priority_scores_valid'
      and conrelid = 'public.sites_pa'::regclass
      and pg_get_constraintdef(oid) not like '%num_nonnulls%'
  ) then
    alter table public.sites_pa drop constraint sites_pa_priority_scores_valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'sites_pa_priority_scores_valid'
      and conrelid = 'public.sites_pa'::regclass
  ) then
    alter table public.sites_pa
      add constraint sites_pa_priority_scores_valid check (
        num_nonnulls(priority_abuses, priority_biological, priority_time, priority_saved_at) = 0
        or (
          num_nonnulls(priority_abuses, priority_biological, priority_time, priority_saved_at) = 4
          and priority_abuses between 0 and 5
          and priority_biological between 0 and 5
          and priority_time between 0 and 5
        )
      );
  end if;
end;
$$;

comment on column public.sites_pa.priority_abuses is
  'Admin points for abuses, 0 to 5. Null with the other priority columns means not scored.';

-- Existing grants cover the new columns: authenticated reads, service role writes.
-- Only the admin server action writes them.
notify pgrst, 'reload schema';
