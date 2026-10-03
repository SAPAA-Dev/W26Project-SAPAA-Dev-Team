-- #72: the first migration created this constraint unquoted, so Postgres stored it
-- lowercase. The app embeds W26_form_sections with the hint
-- `W26_questions_section_id_fkey` (queries.ts), and PostgREST matches hints
-- case-sensitively, so those queries failed with PGRST200 on local databases.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'w26_questions_section_id_fkey'
      and conrelid = 'public."W26_questions"'::regclass
  ) then
    alter table public."W26_questions"
      rename constraint w26_questions_section_id_fkey to "W26_questions_section_id_fkey";
  end if;
end $$;

notify pgrst, 'reload schema';
