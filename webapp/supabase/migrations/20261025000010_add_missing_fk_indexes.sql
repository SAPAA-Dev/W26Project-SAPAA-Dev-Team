-- Foreign keys with no index on the referencing column force a full table scan on
-- every delete check, every dashboard aggregate, and every report write that touches
-- the parent row. These are the five hot paths the review found:
--   answers.response_id      scanned by the report delete and archive functions
--   attachments.response_id scanned by the report delete and archive functions
--   form_responses.site_id   scanned by the site delete check (ON DELETE RESTRICT)
--   form_responses.user_id   scanned by the inspected site count on every profile view
--   homepage_image_uploads.site_id scanned by the site delete impact
-- A human runs this file in the Supabase dashboard for production. Safe to run twice.
-- Each build takes a SHARE lock on its table for the build time: run it outside peak
-- use. If a table grows past roughly 100k rows, build its index with
-- create index concurrently outside a transaction instead.

create index if not exists answers_response_id_idx on public.answers (response_id);
create index if not exists attachments_response_id_idx on public.attachments (response_id);
create index if not exists form_responses_site_id_idx on public.form_responses (site_id);
create index if not exists form_responses_user_id_idx on public.form_responses (user_id);
create index if not exists homepage_image_uploads_site_id_idx
  on public.homepage_image_uploads (site_id);

notify pgrst, 'reload schema';
