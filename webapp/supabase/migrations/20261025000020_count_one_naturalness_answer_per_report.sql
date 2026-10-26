-- The naturalness chart counted answers rows, not reports. If a report ever holds two
-- Q31_Naturalness rows (for example after a failed save that was retried), the same report
-- was counted twice. This redefines the function to count each report once per score.
-- A unique (response_id, question_id) constraint is not used instead: a multi-select
-- question stores one answers row per selected option, so that pair is not unique by design.
-- create or replace keeps the existing grants. A human runs this file in the Supabase
-- dashboard for production, after 20261009000000_archive_site_inspection_reports.sql.
-- Safe to run twice.

create or replace function public.get_naturalness_distribution()
returns table (naturalness_score text, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select answers.obs_value, count(distinct responses.id)
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

notify pgrst, 'reload schema';
