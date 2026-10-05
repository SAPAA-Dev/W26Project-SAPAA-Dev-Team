-- #78: count the distinct sites a steward inspected in SQL, instead of reading every inspection
-- row and counting them in JavaScript. A human runs this same file in the Supabase dashboard for
-- production, after 20261004000000_create_user_model.sql. Every step is safe to run twice.

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
    and responses.site_id is not null;
$$;

grant execute on function public.get_distinct_inspected_site_count(uuid) to service_role;

notify pgrst, 'reload schema';