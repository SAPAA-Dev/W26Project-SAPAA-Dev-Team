-- US 6.0.1: staging bucket for the Admin > Sites KML/KMZ import.
-- The browser uploads the file here directly, because a server action request body
-- is capped at 1 MB and a full SAPAA-Map export is about 15 MB. The import server
-- action then reads the object with the service role and removes it in a finally
-- block, so the bucket stays empty between imports.
-- Private bucket. Only approved admins can read from or write to it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kml-imports',
  'kml-imports',
  false,
  52428800, -- 50 MiB, well above the 14.8 MB SAPAA-Map files
  array[
    'application/vnd.google-earth.kml+xml',
    'application/vnd.google-earth.kmz',
    'application/xml',
    'text/xml',
    'application/zip',
    -- Browsers often send this for .kml and .kmz, so it must be allowed or the
    -- upload is rejected before the import action ever runs.
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The extension test is a plain regex instead of storage.extension(name), because
-- that helper is not available on every storage release.
drop policy if exists "Admins upload kml imports" on storage.objects;
create policy "Admins upload kml imports"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'kml-imports'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
    and lower(name) ~ '\.(kml|kmz)$'
  );

drop policy if exists "Admins read kml imports" on storage.objects;
create policy "Admins read kml imports"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'kml-imports'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
  );

drop policy if exists "Admins delete kml imports" on storage.objects;
create policy "Admins delete kml imports"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'kml-imports'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
  );
