-- Production: a human must run this once in the Supabase SQL editor, after
-- 20261009000000_archive_site_inspection_reports.sql (it adds archived_at).
-- First check for a hand-made policy:
--   select policyname from pg_policies where tablename = 'form_responses';
-- Safe to run more than once.
--
-- The gallery and site image routes join attachments to form_responses with the
-- signed-in user's client to hide archived reports. RLS is on for form_responses
-- and no policy allowed reads, so the inner join dropped every image.
-- Approved users can read current report rows. Archived reports are admin-only, as in the
-- app (getAllSiteReports). No one can add, change or delete rows through this policy.

drop policy if exists "Authenticated users can read form responses" on public.form_responses;
grant select on public.form_responses to authenticated;
create policy "Authenticated users can read form responses"
  on public.form_responses for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
    and (archived_at is null or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );
