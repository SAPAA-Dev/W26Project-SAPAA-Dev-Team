-- 1.0.1 AT1: optional contact details for a person. One row per person, every field optional.
-- The same checks live in webapp/lib/socials.ts so the user gets a readable error first.
create table if not exists public.socials (
  person_id bigint primary key references public.people (id) on delete cascade,
  email text check (length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text check (length(phone) <= 30),
  -- Only https links, so a stored link can never be a javascript: URL.
  website text check (length(website) <= 300 and website ~* '^https://[^[:space:]]+$'),
  instagram text check (length(instagram) <= 300 and instagram ~* '^https://[^[:space:]]+$'),
  facebook text check (length(facebook) <= 300 and facebook ~* '^https://[^[:space:]]+$'),
  x text check (length(x) <= 300 and x ~* '^https://[^[:space:]]+$'),
  linkedin text check (length(linkedin) <= 300 and linkedin ~* '^https://[^[:space:]]+$'),
  updated_at timestamptz not null default now()
);

alter table public.socials enable row level security;

drop policy if exists "socials are visible to signed-in users" on public.socials;
create policy "socials are visible to signed-in users"
  on public.socials for select to authenticated using (true);

-- A user can add or change only the row for their own person record.
drop policy if exists "users add only their own socials" on public.socials;
create policy "users add only their own socials"
  on public.socials for insert to authenticated
  with check (person_id in (select id from public.people where auth_user_id = (select auth.uid())));

drop policy if exists "users update only their own socials" on public.socials;
create policy "users update only their own socials"
  on public.socials for update to authenticated
  using (person_id in (select id from public.people where auth_user_id = (select auth.uid())))
  with check (person_id in (select id from public.people where auth_user_id = (select auth.uid())));

-- RLS limits the rows. These grants limit the columns: a user cannot set updated_at.
-- person_id is in the update grant because an upsert writes it on conflict. The with check above
-- still pins it to the user's own person, and auth_user_id is unique, so it cannot move.
revoke all on public.socials from anon;
revoke insert, update, delete on public.socials from authenticated;
grant select on public.socials to authenticated;
grant insert (person_id, email, phone, website, instagram, facebook, x, linkedin) on public.socials to authenticated;
grant update (person_id, email, phone, website, instagram, facebook, x, linkedin) on public.socials to authenticated;

drop trigger if exists socials_set_updated_at on public.socials;
create trigger socials_set_updated_at
  before update on public.socials
  for each row execute function public.set_updated_at();
