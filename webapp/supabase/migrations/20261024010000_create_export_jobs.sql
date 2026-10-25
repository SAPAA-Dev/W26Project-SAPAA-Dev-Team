-- US 3.0.3: one row for each "export all files" run by an Admin. The job zips every stored
-- image, GPX file and finished PDF export, puts the zip in the S3 bucket and records its key.
-- Only the server writes this table, with the service role, after it checks that the caller
-- is an approved Admin. A person reads only the jobs that they started. A human runs this
-- file in the Supabase dashboard for production. Safe to run twice.

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'complete', 'failed')),
  -- S3 key of the zip, set when the job is complete.
  storage_path text,
  -- A message that an Admin can read. It never holds a stack trace or a bucket name.
  error text,
  file_count integer,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists export_jobs_created_by_idx on public.export_jobs (created_by, created_at desc);

alter table public.export_jobs enable row level security;

drop policy if exists "Users read their export jobs" on public.export_jobs;
create policy "Users read their export jobs"
  on public.export_jobs for select to authenticated
  using (created_by = (select auth.uid()));
-- No insert, update or delete policy: only the export server code writes export_jobs.

revoke all on public.export_jobs from anon;
revoke insert, update, delete on public.export_jobs from authenticated;
grant select on public.export_jobs to authenticated;

notify pgrst, 'reload schema';
