-- M20: return the highest inspection number for a year in SQL. Reading the rows in JavaScript
-- stops at the PostgREST 1000-row limit, so a year with more reports could reuse a number.
-- A human runs this same file in the Supabase dashboard for production. Safe to run twice.

create or replace function public.get_max_inspection_number(p_year integer)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(max(split_part(responses.inspection_no, '-', 2)::integer), 0)
  from public.form_responses as responses
  where responses.inspection_no like p_year::text || '-%'
    and split_part(responses.inspection_no, '-', 2) ~ '^[0-9]{1,9}$';
$$;

grant execute on function public.get_max_inspection_number(integer) to service_role;

notify pgrst, 'reload schema';
