-- US 2.0.9: GPX track uploads by stewards on a site page (#185). The browser
-- uploads the .gpx file to this private bucket directly; the saveGpxTrack
-- server action reads the object with the service role and keeps it for
-- read-back. A human runs this file by hand in the Supabase dashboard. Safe
-- to run twice.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gpx-tracks',
  'gpx-tracks',
  false,
  52428800, -- 50 MiB, the maximum accepted GPX file size
  array[
    'application/gpx+xml',
    'application/xml',
    'text/xml',
    -- Browsers often send this for a .gpx file, so it must be allowed or the
    -- upload is rejected before the server action ever runs.
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.gpx_tracks (
  id bigint generated always as identity primary key,
  site_id bigint not null references public.sites_pa (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Object key: <user id>/<upload id>/<file name>.gpx, with no bucket-name
  -- prefix. The first folder names the uploader.
  storage_path text not null,
  original_file_name text not null,
  track_point_count integer not null,
  created_at timestamptz not null default now()
);

create index if not exists gpx_tracks_site_id_idx on public.gpx_tracks (site_id);

alter table public.gpx_tracks enable row level security;

drop policy if exists "Approved users read gpx tracks" on public.gpx_tracks;
create policy "Approved users read gpx tracks"
  on public.gpx_tracks for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('steward', 'admin')
    and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
  );

drop policy if exists "Approved users insert their own gpx tracks" on public.gpx_tracks;
create policy "Approved users insert their own gpx tracks"
  on public.gpx_tracks for insert to authenticated
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('steward', 'admin')
    and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
    and user_id = auth.uid()
  );

drop policy if exists "Owners and admins delete gpx tracks" on public.gpx_tracks;
create policy "Owners and admins delete gpx tracks"
  on public.gpx_tracks for delete to authenticated
  using (
    user_id = auth.uid()
    or (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
    )
  );

-- No update policy: a saved track never changes.

-- The extension test is a plain regex instead of storage.extension(name), because
-- that helper is not available on every storage release.

drop policy if exists "Approved users upload gpx track objects" on storage.objects;
create policy "Approved users upload gpx track objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'gpx-tracks'
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('steward', 'admin')
    and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
    and lower(name) ~ '\.gpx$'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Approved users read gpx track objects" on storage.objects;
create policy "Approved users read gpx track objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'gpx-tracks'
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('steward', 'admin')
    and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
  );

-- The first path folder is the uploader, so owner_id is not used here.
drop policy if exists "Owners and admins delete gpx track objects" on storage.objects;
create policy "Owners and admins delete gpx track objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'gpx-tracks'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
      )
    )
  );

notify pgrst, 'reload schema';
