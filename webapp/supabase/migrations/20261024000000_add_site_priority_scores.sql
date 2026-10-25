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

alter table public.sites_pa
  drop constraint if exists sites_pa_priority_scores_valid;

alter table public.sites_pa
  add constraint sites_pa_priority_scores_valid check (
    (priority_abuses is null and priority_biological is null and priority_time is null
      and priority_saved_at is null)
    or (priority_abuses between 0 and 5 and priority_biological between 0 and 5
      and priority_time between 0 and 5 and priority_saved_at is not null)
  );

comment on column public.sites_pa.priority_abuses is
  'Admin points for abuses, 0 to 5. Null with the other priority columns means not scored.';

-- Existing grants cover the new columns: authenticated reads, service role writes.
-- Only the admin server action writes them.
notify pgrst, 'reload schema';
