-- Review finding on PR #309 (export all files): the insert policy on gpx_tracks checked the
-- role, the approval and user_id, but not the shape of storage_path. A steward could insert a
-- row straight through PostgREST with a path such as x\..\..\start.gpx or another user's folder,
-- and the export would then read and unpack it. The saveGpxTrack action already allows only
-- <user id>/<upload id>/<file name>.gpx. This policy makes the database enforce the same rule.
-- It applies to new rows only, so rows that exist stay as they are. A human runs this file in
-- the Supabase dashboard for production. Safe to run twice.

drop policy if exists "Approved users insert their own gpx tracks" on public.gpx_tracks;
create policy "Approved users insert their own gpx tracks"
  on public.gpx_tracks for insert to authenticated
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('steward', 'admin')
    and (auth.jwt() -> 'app_metadata' ->> 'authenticated') = 'true'
    and user_id = auth.uid()
    -- Three segments of A-Z, a-z, 0-9, dot, underscore and hyphen, and a .gpx name. No slash
    -- or backslash can be in a segment, so the key cannot hold a path.
    and storage_path ~* '^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\.gpx$'
    -- The first folder is the uploader, as the storage policies on gpx-tracks expect.
    and split_part(storage_path, '/', 1) = auth.uid()::text
    -- A segment of only dots (".." or "...") is not a name.
    and storage_path !~ '(^|/)\.+(/|$)'
    and length(storage_path) <= 400
  );

notify pgrst, 'reload schema';
