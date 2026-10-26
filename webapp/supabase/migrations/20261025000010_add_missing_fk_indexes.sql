-- Foreign keys with no index on the referencing column force a full table scan on
-- every delete check, every dashboard aggregate, and every report write that touches
-- the parent row. This file indexes the columns the app and the delete paths hit:
--   answers.response_id            scanned by the report delete impact function
--   answers.question_id            scanned by the question delete (ON DELETE RESTRICT)
--   attachments.response_id        scanned by the report delete impact function
--   attachments.question_id        scanned by the question delete (ON DELETE SET NULL)
--   attachments.site_id            scanned by the site delete impact
--   form_responses.site_id         scanned by the site delete check (ON DELETE RESTRICT)
--   form_responses.user_id         scanned by the inspected site count on every profile view
--   homepage_image_uploads.site_id scanned by the site delete impact
--   gpx_tracks.user_id             scanned when a login is deleted (ON DELETE CASCADE)
--   S26_pdf_jobs.created_by        scanned when a login is deleted (ON DELETE CASCADE)
--   sites_pa.archived_at           filtered by every active and archived site list
-- A human runs this file in the Supabase dashboard for production. Safe to run twice.
-- Each build takes a SHARE lock on its table for the build time: run it outside peak
-- use. If a table grows past roughly 100k rows, build its index with
-- create index concurrently outside a transaction instead.
--
-- Not added on purpose: unique (response_id, question_id) on answers. A multi-select
-- question stores one answers row per selected option, and the report code joins those
-- rows with '; ', so the pair is not unique by design. Duplicate Q31 rows are handled in
-- 20261025000020_count_one_naturalness_answer_per_report.sql instead.

create index if not exists answers_response_id_idx on public.answers (response_id);
create index if not exists answers_question_id_idx on public.answers (question_id);
create index if not exists attachments_response_id_idx on public.attachments (response_id);
create index if not exists attachments_question_id_idx on public.attachments (question_id);
create index if not exists attachments_site_id_idx on public.attachments (site_id);
create index if not exists form_responses_site_id_idx on public.form_responses (site_id);
create index if not exists form_responses_user_id_idx on public.form_responses (user_id);
create index if not exists homepage_image_uploads_site_id_idx
  on public.homepage_image_uploads (site_id);
create index if not exists gpx_tracks_user_id_idx on public.gpx_tracks (user_id);
create index if not exists s26_pdf_jobs_created_by_idx on public."S26_pdf_jobs" (created_by);
create index if not exists sites_pa_archived_at_idx on public.sites_pa (archived_at);

notify pgrst, 'reload schema';
