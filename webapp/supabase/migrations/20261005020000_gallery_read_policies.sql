drop policy if exists "Authenticated users can read attachments" on public.attachments;
grant select on public.attachments to authenticated;
create policy "Authenticated users can read attachments"
  on public.attachments for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true');

drop policy if exists "Authenticated users can read sites" on public.sites_pa;
grant select on public.sites_pa to authenticated;
create policy "Authenticated users can read sites"
  on public.sites_pa for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true');

drop policy if exists "Authenticated users can read homepage uploads" on public.homepage_image_uploads;
grant select on public.homepage_image_uploads to authenticated;
create policy "Authenticated users can read homepage uploads"
  on public.homepage_image_uploads for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true');

drop policy if exists "Authenticated users can delete attachments" on public.attachments;
drop policy if exists "Admins can delete attachments" on public.attachments;
grant delete on public.attachments to authenticated;
create policy "Admins can delete attachments"
  on public.attachments for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true');

drop policy if exists "Admins can delete homepage uploads" on public.homepage_image_uploads;
grant delete on public.homepage_image_uploads to authenticated;
create policy "Admins can delete homepage uploads"
  on public.homepage_image_uploads for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true');
