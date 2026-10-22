-- US 1.0.3: a report owner can hide an answer from other stewards.
-- A human runs this same file in the Supabase dashboard for production.
-- Safe to run more than once.

alter table public.answers
  add column if not exists is_hidden boolean not null default false;

notify pgrst, 'reload schema';
