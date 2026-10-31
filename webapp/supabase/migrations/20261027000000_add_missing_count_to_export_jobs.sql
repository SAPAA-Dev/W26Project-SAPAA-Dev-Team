-- The count of files that an export skipped because the object was missing from storage.
-- A human runs this file in the Supabase dashboard for production. Safe to run twice.

alter table public.export_jobs add column if not exists missing_count integer;

notify pgrst, 'reload schema';
