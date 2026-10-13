-- Postgres grants EXECUTE on a new function to PUBLIC, and Supabase also grants it to anon and
-- authenticated, so anyone with the anon key could call these through /rest/v1/rpc.
-- 20261005000000_profile_distinct_site_count.sql and 20261009130000_get_max_inspection_number.sql
-- only granted service_role and never revoked the defaults. Both callers use the service role
-- (app/api/profile/route.ts and getNextFormInspectionNumber in utils/supabase/queries.ts).
-- A human runs this same file in the Supabase dashboard for production. Safe to run twice.

set search_path = public;

revoke execute on function public.get_distinct_inspected_site_count(uuid)
  from public, anon, authenticated;
revoke execute on function public.get_max_inspection_number(integer)
  from public, anon, authenticated;

grant execute on function public.get_distinct_inspected_site_count(uuid) to service_role;
grant execute on function public.get_max_inspection_number(integer) to service_role;

notify pgrst, 'reload schema';
