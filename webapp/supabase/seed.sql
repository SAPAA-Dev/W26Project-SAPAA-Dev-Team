do $seed$
begin
insert into public."ab_counties" (county)
values ('Local demo county')
on conflict (county) do nothing;

insert into public."sites_pa" (namesite, ab_county, is_active)
values (
  'Local Supabase demo site',
  (select id from public."ab_counties" where county = 'Local demo county'),
  true
)
on conflict (namesite) do update
set ab_county = excluded.ab_county,
    is_active = excluded.is_active;

insert into public."form_sections" (title, description, header)
values
  ('Visit details', 'Basic details about this local development inspection.', 'Visit details'),
  ('Site observations', 'Record observations for the demo site.', 'Site observations')
on conflict (title) do update
set description = excluded.description,
    header = excluded.header;

insert into public."question_keys" (category, "question key", comment, definition)
values
  ('2', 'Q21_Date_Of_Visit', true, 'Date of visit'),
  ('3', 'Q31_Naturalness', true, 'Naturalness score'),
  ('3', 'Q32_Natural_Comm', true, 'Naturalness details'),
  ('1', 'Q13_FirstandLastNameForGuests', true, 'Steward name')
on conflict ("question key") do update
set category = excluded.category,
    comment = excluded.comment,
    definition = excluded.definition;

insert into public."questions" (
  "question key", question_key_id, section_id, form_question, subtext,
  question_type, is_required, is_active, formorder, obs_value, obs_comm
)
values
  (
    'Q21_Date_Of_Visit',
    (select id from public."question_keys" where "question key" = 'Q21_Date_Of_Visit'),
    (select id from public."form_sections" where title = 'Visit details'),
    'Date of visit (Q21)', 'Choose the date of the inspection.', 'date', true, true, 1, true, false
  ),
  (
    'Q31_Naturalness',
    (select id from public."question_keys" where "question key" = 'Q31_Naturalness'),
    (select id from public."form_sections" where title = 'Site observations'),
    'Naturalness score (Q31)', 'Select the naturalness score.', 'option', false, true, 2, true, true
  ),
  (
    'Q32_Natural_Comm',
    (select id from public."question_keys" where "question key" = 'Q32_Natural_Comm'),
    (select id from public."form_sections" where title = 'Site observations'),
    'Naturalness details (Q32)', 'Add notes about the naturalness score.', 'text', false, true, 3, false, true
  ),
  (
    'Q13_FirstandLastNameForGuests',
    (select id from public."question_keys" where "question key" = 'Q13_FirstandLastNameForGuests'),
    (select id from public."form_sections" where title = 'Visit details'),
    'Steward name (Q13)', 'Enter the name of the person completing the inspection.', 'text', true, true, 4, false, true
  )
on conflict ("question key") do update
set question_key_id = excluded.question_key_id,
    section_id = excluded.section_id,
    form_question = excluded.form_question,
    subtext = excluded.subtext,
    question_type = excluded.question_type,
    is_required = excluded.is_required,
    is_active = excluded.is_active,
    formorder = excluded.formorder,
    obs_value = excluded.obs_value,
    obs_comm = excluded.obs_comm;

insert into public."question_options" (question_id, option_text, is_active, position)
values
  ((select id from public."questions" where "question key" = 'Q31_Naturalness'), 'Excellent', true, 0),
  ((select id from public."questions" where "question key" = 'Q31_Naturalness'), 'Good', true, 1),
  ((select id from public."questions" where "question key" = 'Q31_Naturalness'), 'Fair', true, 2),
  ((select id from public."questions" where "question key" = 'Q31_Naturalness'), 'Poor', true, 3)
on conflict (question_id, option_text) do update
set is_active = excluded.is_active,
    position = excluded.position;

insert into public."form_responses" (site_id, inspection_no, inspection_date, is_active)
values (
  (select id from public."sites_pa" where namesite = 'Local Supabase demo site'),
  extract(year from current_date)::text || '-000',
  current_date,
  true
)
on conflict (inspection_no) do update
set site_id = excluded.site_id,
    inspection_date = excluded.inspection_date,
    is_active = excluded.is_active;

insert into public."answers" (response_id, question_id, obs_value, obs_comm)
select responses.id, questions.id, 'Good', null
from public."form_responses" as responses
join public."sites_pa" as sites on sites.id = responses.site_id
join public."questions" as questions on questions."question key" = 'Q31_Naturalness'
where sites.namesite = 'Local Supabase demo site'
  and responses.inspection_no = extract(year from current_date)::text || '-000'
  and not exists (
    select 1 from public."answers" as answers
    where answers.response_id = responses.id and answers.question_id = questions.id
  );

insert into public."answers" (response_id, question_id, obs_value, obs_comm)
select responses.id, questions.id, null, 'Seeded local example inspection.'
from public."form_responses" as responses
join public."sites_pa" as sites on sites.id = responses.site_id
join public."questions" as questions on questions."question key" = 'Q32_Natural_Comm'
where sites.namesite = 'Local Supabase demo site'
  and responses.inspection_no = extract(year from current_date)::text || '-000'
  and not exists (
    select 1 from public."answers" as answers
    where answers.response_id = responses.id and answers.question_id = questions.id
  );

insert into public.sites_list_fnr (namesite, inspectno, inspectdate, naturalness_score, naturalness_details)
values (
  'Local Supabase demo site',
  extract(year from current_date)::text || '-000',
  current_date,
  'Good',
  'Seeded local example inspection.'
)
on conflict (inspectno) do update
set namesite = excluded.namesite,
    inspectdate = excluded.inspectdate,
    naturalness_score = excluded.naturalness_score,
    naturalness_details = excluded.naturalness_details;

insert into public.sites_detail_fnr_test (
  namesite, _type, county, _naregion, inspectdate, naturalness_score, naturalness_details, notes
)
select
  sites.namesite,
  'Local demo',
  counties.county,
  'Local development',
  current_date,
  'Good',
  'Seeded local example inspection.',
  'Sample data for local Supabase development.'
from public."sites_pa" as sites
join public."ab_counties" as counties on counties.id = sites.ab_county
where sites.namesite = 'Local Supabase demo site'
  and not exists (
    select 1 from public.sites_detail_fnr_test as existing
    where existing.namesite = sites.namesite
      and existing.inspectdate = current_date
  );

insert into public.sites_report_fnr_test (namesite)
select 'Local Supabase demo site'
where not exists (
  select 1 from public.sites_report_fnr_test
  where namesite = 'Local Supabase demo site'
);
end;
$seed$;
