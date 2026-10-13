-- Postgres grants EXECUTE on a new function to PUBLIC, and Supabase also grants it to anon and
-- authenticated. 20261009000000_archive_site_inspection_reports.sql redefines
-- get_naturalness_distribution and get_top_sites_distribution and only grants service_role, so a
-- signed-out caller with the anon key can still call them through /rest/v1/rpc.
-- The web app calls both with the service role (getNaturalnessDistribution and
-- getTopSitesDistribution in utils/supabase/queries.ts). The StewardLog admin dashboard
-- (FNR/src/screens/DashboardScreen.tsx and AnalyticsScreen.tsx) calls both with the anon key
-- client after the admin signs in, so it runs as authenticated. For this reason authenticated
-- keeps EXECUTE. Both functions are security invoker, so row level security still applies to it.
-- A human runs this same file in the Supabase dashboard for production. Safe to run twice.

set search_path = public;

revoke execute on function public.get_naturalness_distribution() from public, anon;
revoke execute on function public.get_top_sites_distribution() from public, anon;

grant execute on function public.get_naturalness_distribution() to authenticated, service_role;
grant execute on function public.get_top_sites_distribution() to authenticated, service_role;

notify pgrst, 'reload schema';
