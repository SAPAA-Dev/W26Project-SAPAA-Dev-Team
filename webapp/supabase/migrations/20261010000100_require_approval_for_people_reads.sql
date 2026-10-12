-- M6: only approved accounts read people, socials and site_stewards.
-- Before this, the select policies were `using (true)`, so a new account that an admin had not
-- approved yet could read every steward's name, contact details and site assignments.
-- Approval is app_metadata.authenticated = true, the same check as 20261005020000_gallery_read_policies.sql.
-- A user still reads their own people and socials rows, because PATCH /api/profile updates and
-- upserts them with the signed-in client and needs to read the row back.
--
-- A human must run this file in the Supabase dashboard for production, after
-- 20261004000000_create_user_model.sql and 20261005010000_create_socials.sql.
-- Every step is safe to run twice.

drop policy if exists "people are visible to signed-in users" on public.people;
drop policy if exists "people are visible to approved users and the owner" on public.people;
create policy "people are visible to approved users and the owner"
  on public.people for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
    or auth_user_id = (select auth.uid())
  );

drop policy if exists "socials are visible to signed-in users" on public.socials;
drop policy if exists "socials are visible to approved users and the owner" on public.socials;
create policy "socials are visible to approved users and the owner"
  on public.socials for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
    or person_id in (select id from public.people where auth_user_id = (select auth.uid()))
  );

drop policy if exists "site stewards are visible to signed-in users" on public.site_stewards;
drop policy if exists "site stewards are visible to approved users" on public.site_stewards;
create policy "site stewards are visible to approved users"
  on public.site_stewards for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true');

notify pgrst, 'reload schema';
