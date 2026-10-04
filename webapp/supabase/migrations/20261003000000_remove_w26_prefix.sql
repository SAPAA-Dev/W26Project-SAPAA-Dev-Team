-- #73: drop the "W26_" team prefix from table names. Hyphenated names become
-- snake_case so they no longer need quoting. A human runs this same file in the
-- Supabase dashboard for production; every step is safe to run twice.

alter table if exists public."W26_ab_counties"            rename to ab_counties;
alter table if exists public."W26_sites-pa"               rename to sites_pa;
alter table if exists public."W26_form_sections"          rename to form_sections;
alter table if exists public."W26_question_keys"          rename to question_keys;
alter table if exists public."W26_questions"              rename to questions;
alter table if exists public."W26_question_options"       rename to question_options;
alter table if exists public."W26_form_responses"         rename to form_responses;
alter table if exists public."W26_answers"                rename to answers;
alter table if exists public."W26_attachments"            rename to attachments;
alter table if exists public."W26_homepage-image-uploads" rename to homepage_image_uploads;

-- Constraints, indexes and sequences keep their old names after a table rename.
-- Rename them too, so PostgREST embed hints (questions_section_id_fkey) and
-- error messages show the new names.
do $$
declare r record;
begin
  for r in
    select conrelid::regclass as tbl, conname
    from pg_constraint
    where connamespace = 'public'::regnamespace and conname ilike 'w26\_%'
  loop
    execute format('alter table %s rename constraint %I to %I',
      r.tbl, r.conname, lower(replace(substr(r.conname, 5), '-', '_')));
  end loop;

  for r in
    select relname, case relkind when 'S' then 'sequence' else 'index' end as kind
    from pg_class
    where relnamespace = 'public'::regnamespace and relkind in ('S', 'i') and relname ilike 'w26\_%'
  loop
    execute format('alter %s public.%I rename to %I',
      r.kind, r.relname, lower(replace(substr(r.relname, 5), '-', '_')));
  end loop;
end $$;

-- SQL function bodies are stored as text, so they still name the old tables.
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
  group by sites.namesite
  order by count(*) desc, sites.namesite
  limit 5;
$$;

notify pgrst, 'reload schema';
