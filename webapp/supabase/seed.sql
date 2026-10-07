do $seed$
declare
  report_index integer;
begin
insert into public."ab_counties" (county)
values ('Quackatchewan')
on conflict (county) do nothing;

insert into public."sites_pa" (namesite, ab_county, is_active)
values (
  'Quackberry Duck Park',
  (select id from public."ab_counties" where county = 'Quackatchewan'),
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

-- 51 seeded inspections, so the bulk PDF export can be tested above the 50-report mark
for report_index in 0..50 loop
  insert into public."form_responses" (site_id, inspection_no, inspection_date, is_active)
  values (
    (select id from public."sites_pa" where namesite = 'Quackberry Duck Park'),
    extract(year from current_date)::text || '-' || lpad(report_index::text, 3, '0'),
    current_date - report_index,
    true
  )
  on conflict (inspection_no) do update
  set site_id = excluded.site_id,
      inspection_date = excluded.inspection_date,
      is_active = excluded.is_active;
end loop;

insert into public."answers" (response_id, question_id, obs_value, obs_comm)
select responses.id, questions.id, to_char(responses.inspection_date, 'YYYY-MM-DD'), null
from public."form_responses" as responses
join public."sites_pa" as sites on sites.id = responses.site_id
join public."questions" as questions on questions."question key" = 'Q21_Date_Of_Visit'
where sites.namesite = 'Quackberry Duck Park'
  and responses.inspection_no between extract(year from current_date)::text || '-000'
                                   and extract(year from current_date)::text || '-050'
  and not exists (
    select 1 from public."answers" as answers
    where answers.response_id = responses.id and answers.question_id = questions.id
  );

insert into public."answers" (response_id, question_id, obs_value, obs_comm)
select
  responses.id,
  questions.id,
  (array['Excellent', 'Good', 'Fair', 'Poor'])[1 + right(responses.inspection_no, 3)::integer % 4],
  null
from public."form_responses" as responses
join public."sites_pa" as sites on sites.id = responses.site_id
join public."questions" as questions on questions."question key" = 'Q31_Naturalness'
where sites.namesite = 'Quackberry Duck Park'
  and responses.inspection_no between extract(year from current_date)::text || '-000'
                                   and extract(year from current_date)::text || '-050'
  and not exists (
    select 1 from public."answers" as answers
    where answers.response_id = responses.id and answers.question_id = questions.id
  );

with duck_reports(report_index, detail) as (
  values
    (0, 'Counted 42 ducks. All 42 refused to be interviewed.'),
    (1, 'Duck volcano dormant. Feather ash within safe limits.'),
    (2, 'Bread crust deposited at the north shore. Ducks approve.'),
    (3, 'Pond level normal. Ducks report strong satisfaction with the puddles.'),
    (4, 'Duck parliament in session. Motion to migrate: defeated by snacks.'),
    (5, 'One goose spotted near the volcano. Ducks deny any involvement.'),
    (6, 'Duck volcano smouldering slightly. Only the pigeons are worried.'),
    (7, 'Reeds trimmed by the resident moorhen. Invoice still pending.'),
    (8, 'Duck day went well. Night ducks report similar success.'),
    (9, 'Moulting season has begun. The park is briefly airborne.'),
    (10, 'Quack echo test: the lake answered "quack". Test passed.'),
    (11, 'Ducks formed a jazz quartet. Noise complaint filed by the herons.'),
    (12, 'Duck volcano erupted confetti. Cause unknown. Cleanup ongoing.'),
    (13, 'Migration meeting ended early. All ducks agreed to stay for bread.'),
    (14, 'Swan patrol reports calm water. Ducks remain suspicious of swans.'),
    (15, 'Found one rubber duck. It outranked everyone present.'),
    (16, 'Puddle levels at a record high. Ducks declared a big puddle festival.'),
    (17, 'The duck volcano rumbled twice. Both rumbles were stomachs.'),
    (18, 'Duck choir practice at dawn. Attendance: every duck.'),
    (19, 'Bread audit complete. Ducks demand the results stay secret.'),
    (20, 'Heavy waddle traffic near the west shore. No incidents, many quacks.'),
    (21, 'Duck volcano status: sleepy. Alert level: feathered.'),
    (22, 'A duck escorted a lost tourist to the gate. The tip was paid in bread.'),
    (23, 'Cattail census complete: too many to count, too few to worry about.'),
    (24, 'The pond froze over. Ducks held figure skating tryouts.'),
    (25, 'The volcano near the duck park stayed silent. We watch. We wait.'),
    (26, 'Mosquito control praised. Ducks call it the buffet plan.'),
    (27, 'One duck attempted a backflip and landed it. The moorhen fainted.'),
    (28, 'Duck volcano advisory: the smoke is just a goose barbecue.'),
    (29, 'The park benches are repainted. The ducks said fine, but with attitude.'),
    (30, 'The rain committee cancelled the rain dance. It rained anyway. The committee takes credit.'),
    (31, 'Nesting season peak. Park staff are now aunts and uncles to 60 ducklings.'),
    (32, 'Duck volcano eruption drill a success. Ducks hid behind the moorhen.'),
    (33, 'Lost one hat to the pond. The pond denies everything.'),
    (34, 'Duck census found one extra duck. Nobody remembers inviting it.'),
    (35, 'Volcanic feathers found near the fountain. Investigation ongoing.'),
    (36, 'Duck yoga class is full. Participation is floating only.'),
    (37, 'Ice on the pond. The ducks filed it under new dance floor.'),
    (38, 'A sneaky heron was seen in the reeds. Ducks formed a neighbourhood watch.'),
    (39, 'Goose-volcano summit: the volcano refused to comment.'),
    (40, 'Bread referendum results: 100 percent in favour, 0 percent surprised.'),
    (41, 'The frog chorus is too loud. Ducks filed a complaint, then joined in.'),
    (42, 'All ducklings accounted for. Some are teenagers now. Condolences accepted.'),
    (43, 'Feather forecast: light fluff, scattered quacks, a chance of puddles.'),
    (44, 'The duck volcano applied for protected area status. We support it.'),
    (45, 'Picnic area audit: 3 fries lost, 2 fries found, 1 very happy gull.'),
    (46, 'The ducks announced a slow migration. They moved one puddle over.'),
    (47, 'Pond clarity improved. The ducks saw their reflections and are stunned.'),
    (48, 'Duck volcano dormant since 1972, or last Tuesday, whichever sounds safer.'),
    (49, 'Season report: every duck was counted. Several twice, on purpose.'),
    (50, 'Fifty-first inspection done. The ducks ask for more funding and fewer geese.')
)
insert into public."answers" (response_id, question_id, obs_value, obs_comm)
select responses.id, questions.id, null, duck_reports.detail
from public."form_responses" as responses
join public."sites_pa" as sites on sites.id = responses.site_id
join public."questions" as questions on questions."question key" = 'Q32_Natural_Comm'
join duck_reports on duck_reports.report_index = right(responses.inspection_no, 3)::integer
where sites.namesite = 'Quackberry Duck Park'
  and responses.inspection_no between extract(year from current_date)::text || '-000'
                                   and extract(year from current_date)::text || '-050'
  and not exists (
    select 1 from public."answers" as answers
    where answers.response_id = responses.id and answers.question_id = questions.id
  );

with duck_stewards(report_index, steward) as (
  values
    (0, 'Donald Quack'),
    (1, 'Quack Sparrow'),
    (2, 'Duck Norris'),
    (3, 'Sir Quacksalot'),
    (4, 'Lady Quackington'),
    (5, 'Quackie Chan'),
    (6, 'James Pond'),
    (7, 'Mallard Fillmore'),
    (8, 'Waddlesworth III'),
    (9, 'Feather Locklear'),
    (10, 'Quacklemore'),
    (11, 'Duckbert Einstein'),
    (12, 'Quackie Robinson'),
    (13, 'Ludwig Von Quack'),
    (14, 'Duckzilla'),
    (15, 'Quackston Churchill'),
    (16, 'Duck Holmes'),
    (17, 'Quack Adams'),
    (18, 'Penny Puddleworth'),
    (19, 'Waddles McGee'),
    (20, 'Quackimedes'),
    (21, 'Ducktor Who'),
    (22, 'Feathena'),
    (23, 'Quackston Martin'),
    (24, 'Duckworth'),
    (25, 'Quack Black'),
    (26, 'Puddle Duckington'),
    (27, 'Sir Paddlesworth'),
    (28, 'Quackie Fisher'),
    (29, 'Duck Levitt'),
    (30, 'Bill Quackston'),
    (31, 'Quackson Pollock'),
    (32, 'Duckie Quackers'),
    (33, 'Waddleton'),
    (34, 'Quack Johnson'),
    (35, 'Beak Holliday'),
    (36, 'Quackenzie'),
    (37, 'Duck Washington'),
    (38, 'Paddles McNabb'),
    (39, 'Featherstonehaugh'),
    (40, 'Quackimodo'),
    (41, 'Duck Vader'),
    (42, 'Quack Nightingale'),
    (43, 'Bill the Pondkeeper'),
    (44, 'Quackqueline'),
    (45, 'Duck Rogers'),
    (46, 'Mallard Miles'),
    (47, 'Ducktor Quack'),
    (48, 'Sir Quackington the Unruffled'),
    (49, 'Gordon Duckhay'),
    (50, 'The Duck Formerly Known As Prince')
)
insert into public."answers" (response_id, question_id, obs_value, obs_comm)
select responses.id, questions.id, null, duck_stewards.steward
from public."form_responses" as responses
join public."sites_pa" as sites on sites.id = responses.site_id
join public."questions" as questions on questions."question key" = 'Q13_FirstandLastNameForGuests'
join duck_stewards on duck_stewards.report_index = right(responses.inspection_no, 3)::integer
where sites.namesite = 'Quackberry Duck Park'
  and responses.inspection_no between extract(year from current_date)::text || '-000'
                                   and extract(year from current_date)::text || '-050'
  and not exists (
    select 1 from public."answers" as answers
    where answers.response_id = responses.id and answers.question_id = questions.id
  );

insert into public.sites_list_fnr (namesite, inspectno, inspectdate, naturalness_score, naturalness_details)
values (
  'Quackberry Duck Park',
  extract(year from current_date)::text || '-000',
  current_date,
  'Good',
  'Counted 42 ducks. All 42 refused to be interviewed.'
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
  'Duck demo',
  counties.county,
  'Duck volcanic zone',
  current_date,
  'Good',
  'Counted 42 ducks. All 42 refused to be interviewed.',
  'Sample duck data for local Supabase development.'
from public."sites_pa" as sites
join public."ab_counties" as counties on counties.id = sites.ab_county
where sites.namesite = 'Quackberry Duck Park'
  and not exists (
    select 1 from public.sites_detail_fnr_test as existing
    where existing.namesite = sites.namesite
      and existing.inspectdate = current_date
  );

insert into public.sites_report_fnr_test (namesite)
select 'Quackberry Duck Park'
where not exists (
  select 1 from public.sites_report_fnr_test
  where namesite = 'Quackberry Duck Park'
);

insert into public.attachments (
  site_id, response_id, question_id, storage_key, filename,
  content_type, file_size_bytes, caption, identifier, photographer, date
)
select
  seed_site.id,
  seed_response.id,
  seed_question.id,
  seed.storage_key,
  seed.filename,
  'image/jpeg',
  seed.file_size_bytes,
  seed.caption,
  seed.identifier,
  'Wikimedia Commons',
  current_date
from (
  values
    ('seed/ducks/duck01.jpg', 'duck01.jpg', 158364, 'Mallard pair', 'SeedDuck01'),
    ('seed/ducks/duck02.jpg', 'duck02.jpg', 150476, 'Male mallard', 'SeedDuck02'),
    ('seed/ducks/duck03.jpg', 'duck03.jpg', 119427, 'Resting female mallard', 'SeedDuck03'),
    ('seed/ducks/duck04.jpg', 'duck04.jpg', 189393, 'Mallard in Karlsruhe', 'SeedDuck04'),
    ('seed/ducks/duck05.jpg', 'duck05.jpg', 140597, 'Mallard chick', 'SeedDuck05')
) as seed(storage_key, filename, file_size_bytes, caption, identifier)
cross join (
  select id from public.sites_pa where namesite = 'Quackberry Duck Park'
) as seed_site
cross join (
  select id from public.form_responses
  where inspection_no = extract(year from current_date)::text || '-000'
) as seed_response
cross join (
  select id from public.questions where "question key" = 'Q31_Naturalness'
) as seed_question
where not exists (
  select 1 from public.attachments as existing
  where existing.storage_key = seed.storage_key
);

insert into public.homepage_image_uploads (
  site_id, storage_key, filename,
  content_type, file_size_bytes, caption, identifier, photographer, date
)
select
  seed_site.id,
  seed.storage_key,
  seed.filename,
  'image/jpeg',
  seed.file_size_bytes,
  seed.caption,
  seed.identifier,
  'Wikimedia Commons',
  current_date
from (
  values
    ('seed/ducks/duck06.jpg', 'duck06.jpg', 291637, 'Mallard pair portrait', 'SeedDuck06'),
    ('seed/ducks/duck07.jpg', 'duck07.jpg', 279163, 'Ducks on the embankment', 'SeedDuck07'),
    ('seed/ducks/duck08.jpg', 'duck08.jpg', 60621, 'Mallard specimen', 'SeedDuck08'),
    ('seed/ducks/duck09.jpg', 'duck09.jpg', 199884, 'Male mallard on the ground', 'SeedDuck09'),
    ('seed/ducks/duck10.jpg', 'duck10.jpg', 122374, 'Mallard with chicks', 'SeedDuck10')
) as seed(storage_key, filename, file_size_bytes, caption, identifier)
cross join (
  select id from public.sites_pa where namesite = 'Quackberry Duck Park'
) as seed_site
where not exists (
  select 1 from public.homepage_image_uploads as existing
  where existing.storage_key = seed.storage_key
);
end;
$seed$;
