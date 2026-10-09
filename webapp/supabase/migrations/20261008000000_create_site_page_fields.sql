-- US 2.0.5: fields an admin shows or hides on a site page, from a fixed list in
-- webapp/lib/sitePageFields.ts. A hidden field keeps its value (AT3). A human runs this
-- same file in the Supabase dashboard for production. Safe to run twice.

create table if not exists public.site_page_fields (
  site_id bigint not null references public.sites_pa (id) on delete cascade,
  field_key text not null,
  -- Only http and https links, so a stored link can never be a javascript: URL.
  value text check (value is null or value ~* '^https?://[^[:space:]]+$'),
  is_visible boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (site_id, field_key)
);

alter table public.site_page_fields enable row level security;

drop policy if exists "site page fields are visible to signed-in users" on public.site_page_fields;
create policy "site page fields are visible to signed-in users"
  on public.site_page_fields for select to authenticated using (true);
-- No insert, update or delete policy: only admin server actions write site_page_fields.

notify pgrst, 'reload schema';
