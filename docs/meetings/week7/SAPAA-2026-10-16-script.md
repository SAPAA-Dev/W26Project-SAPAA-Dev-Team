# SIR-SAPAA weekly update, Fri Oct 16, 2026: talk track

Rules for Frank: one idea per slide, lead with the key line, business words, charter project first, short answers. Say "I don't know, I'll find out" when you don't know. Frank cares about what's next more than what was done, so keep section 1 short. Always give the reason for a decision. Frank's phrase is "don't surprise your users": say early what may slip, and say what is a proposal and what is a decision. Speak as "we". The presenter today is not Saumya.

Names used below: Sprint 3 teams are Red (Saumya, Chris), Blue (Aaron, Zanab, Abhinav) and Green (Alissa, Jayden). Sprint 2 teams were Alpha (Saumya, Aaron), Beta (Abhinav, Alissa) and Gamma (Zanab, Chris, Jayden). Scrum Master for Sprint 3 is Jayden, Product Owner is Aaron. GitHub handles map to first names as follows: snp05016 is Saumya, Aaronplayz14 is Aaron, abhinav-bhattarai8 is Abhinav, AlissaPepino is Alissa, Zanab-Akbar is Zanab, lamersc is Chris, jaydonos is Jayden. The mapping of lamersc to Chris is inferred from the Sprint 2 assignments.

Repo base: https://github.com/UAlberta-CMPUT401/F26project-SAPAA
Plan document used for every date below: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md
Frank's page behind slides 14 to 18: https://sapaastewards.com/2026/10/16/sir-sapaa-v4/ (title "SIR-SAPAA – Version 4, 5 & the Crown Lease", posted Oct 16, 2026)

How this script was checked: PR and issue facts were read from GitHub with `gh -R UAlberta-CMPUT401/F26project-SAPAA` on Oct 16, 2026, docs from `origin/main` (commit `ceb5188`, "merge sprint 2 into main"). Frank's page was read in full. His email itself was not available to this script, only its summary, so quotes from the email below come from that summary.

---

## 1. Cover

[Under 15 seconds.]
"Good afternoon, Frank. Version 1.1 went out on Tuesday, so today is mostly about what's next: the map in Sprint 3, and then your version 4 email, which you asked for a few minutes on at the end. Saumya is not here today, so we will cover it, and we will brief him."

The cover says "Saumya is not here. He is cooked." It is a joke on the title slide. If Frank asks, answer in one sentence and move on (see IF HE ASKS).

Behind this slide:
- Version 1.1 is Project 1 of your charter (the fix list and minor enhancements), plus the Project 2 work that shipped with it. It was released as "Sprint 2 Release", tag `sprint-2`, published Oct 13, 2026 at 21:56 UTC (3:56 pm Mountain), about four hours before the 8 pm deadline: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/releases/tag/sprint-2. The name "version 1.1" is the one used with Frank; the GitHub release title does not say 1.1.
- How it got there: PR #284 merged `sprint-2` into `main` (opened by Chris, merged 21:56:05Z) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/284, then PR #285 merged `main` into `release` (Saumya, 21:56:20Z) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/285. Both were merged with an administrator override because GitHub's automatic checks cannot run (see slide 4).
- Tracking issues: code freeze https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/96 (Jayden, closed Oct 13), release https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97 (Chris, closed Oct 13), Sprint 2 demo, review and retrospective https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/98 (Chris, closed today, Oct 16). Open docs PR with the Sprint 2 close-out: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/286.
- Frank's email (12:54 pm today) asks Saumya for a few minutes at the end of today's meeting. Saumya is not in the meeting, per the cover. The presenter covers it on slides 13 to 18 and offers a follow-up with Saumya if Frank wants one. Whether Frank knows Saumya is absent is unknown.
- IF HE ASKS about "Saumya is not here. He is cooked.": "That is a joke on the cover. Saumya is not in today's meeting. We have his notes, we will cover your email, and we will brief him afterwards." Do not give a reason for the absence: the reason is not recorded anywhere in the repo or the deck.
- IF HE ASKS whether Saumya can still have the few minutes: "Yes, if you want that. Tell us when and we will set it up." (The team has to confirm his availability. See the last section.)
- IF HE ASKS what version 1.1 is: "The Project 1 fix list from your charter, the profile and steward work from Project 2b, and the first map from Project 2c. All 16 Sprint 2 stories, 63 of 63 points."
- IF HE ASKS whether it is live: "Version 1.1 was released on Tuesday. For it to work, the live database needs the one-time updates, and we have not yet confirmed they were run. We will tell you as soon as we do." (Open: see the last section. Do not say "it is live" until the team confirms.)

## 2. Agenda: Three things

KEY LINE: "Three things. Most of our time goes to what's next and to your email."
[click] 1: "What's new is two slides."
[click] 2: "Sprint 3, the map you described."
[click] 3: "Your version 4 email. You asked for a few minutes on it, so it comes before the summary, near the end."
Footer, if needed: "Then what we need from you, questions from the team, and a summary."

Behind this slide:
- Order of slides: section 1 is slides 3 to 6, section 2 is slides 7 to 12, section 3 (the email) is slides 13 to 18, then open floor (19), summary (20), round table (21), backups (22 and 23).
- "What we need from you" is slide 17 (five decisions) and slide 18 (four older items).
- IF HE ASKS to skip ahead to the email: go to slide 13. If he asks to skip section 1: go to slide 7. Section 1 can be cut to one minute.
- IF HE ASKS how long this takes: the target is under 30 minutes, with slides 13 to 18 getting the most time.

## 3. Section 1: What's new since last Friday

"First, a short look at what changed."

Behind this slide:
- Window: Oct 9 to Oct 16. No issue or PR on this slide.
- Release facts for the window: Sprint 2 finished 63 of 63 points and 16 of 16 stories. The points by date were 30 on Oct 7, 51 on Oct 9 and 63 on Oct 11. The last 12 points were 2.0.6 (PR #241), 5.0.4 (PR #238) and 7.0.6 (PR #237). Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (Velocity re-estimate and Sprint 2 status).

## 4. Where your four projects stand

KEY LINE: "Each line is one of your charter projects."
Slide text for 2a reads "Two reviewers per change. 1,524 tests passed on our machines."
[click] Project 1: "Version 1.1 was released on Tuesday, October 13. All sixteen Sprint 2 stories are finished, 63 of 63 points."
[click] Project 2a: "Every change is reviewed by two teammates, and 1,524 tests passed on the release. Those ran on our machines. Our automatic cloud checks are not running at the moment because of a billing problem on the code host."
[click] Project 2b: "Profiles with inspection history, and the steward named on each site."
[click] Project 2c: "The map shows government boundaries and filters by county, type and name. The county filter is the one you asked for."
Footer: "All 16 Sprint 2 stories finished: 63 of 63 points."

Behind this slide:
- Project 1 (Fixes). Release PRs #284 and #285 (slide 1). Work merged after the Oct 9 meeting is listed on slide 5. Owner of the release: Gamma in Sprint 2 (Zanab, Chris, Jayden). Details of the stories are in backup slide 22.
- Project 2a (Testing and release process). Reviewer gate https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/124 (with two or more assignees, only they review and all must approve; with none, any two people). Release branch model https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/125 (documented in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/contributing.md). Test and CI work merged since Oct 9, all by Saumya: build, type check and lint in CI https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/235; end-to-end specs against a local database https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/257, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/282; tests for acceptance tests that had none https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/258; coverage gate https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/260; lint made blocking https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/262.
- The test number and where it comes from: the local run on `main` at `ceb5188` gives 111 suites, 1,524 tests passed, 5 skipped, 0 failed; coverage 85.06% statements, 74% branches, 78.61% functions, 87.56% lines (from PR #286's description and the plan). GitHub Actions cannot start jobs because the code host account has failed payments, so every PR shows failed or missing checks. The last run in which CI executed the tests was Oct 10 (96 suites, 1,235 tests). The two release PRs were merged by an administrator override. Say this plainly if asked. Do not say "CI is green".
- Project 2b (People). User model: PR #131 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131 (`people`, `site_stewards`; closes #75, Alpha), profile page and edit own profile PR #138 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138, contact details PR #142, steward on each site PRs #133, #134, #139, #140. New since Oct 9: profile history paged ten reports at a time and clearer sign-out errors, PR #255 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/255; profile save errors, approved-only reads and steward search, PR #238 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238. Design and reasons: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/user-model.md. One steward per site is how the table is keyed today.
- Project 2c (Maps). Base map PR #159 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159 (Abhinav). Government boundaries PR #161 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161 (Abhinav). Type and subtype filter plus name search PR #166 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/166 (Alissa, merged Oct 9). County and status filters, and a hand-made link from a site to its boundary, PR #167 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167 (Alissa, merged Oct 9). Search lists up to eight matching areas and zooms to the one you pick, PR #241 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241 (Saumya, merged Oct 10).
- Test gaps in finished stories, per https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/traceability-matrix.md: of 67 acceptance tests in the 16 Sprint 2 stories, 62 are fully covered and 5 are only partly tested (2.0.3 AT4, 2.0.4 AT3, 7.0.1 AT3, 7.0.5 AT1 and AT3).
- IF HE ASKS what "reviewed by two teammates" means: "Each change needs approval from two teammates before it goes in." Honest addition if asked about the release itself: "The two release merges used an administrator override, because the automatic checks cannot run. The checks were run by hand on our machines."
- IF HE ASKS whether the release was tested before it went live: "The tests ran on our machines: 1,524 passed, none failed. We do not have a separate shared test site." (No staging environment exists: item 25 in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/issues.md is open.)
- IF HE ASKS when the cloud checks come back: "They need the billing problem on the code host account fixed. We do not have a date. I'll find out who owns the account." (Open.)
- IF HE ASKS about the Supaview fix: see slide 6.

## 5. New in version 1.1

KEY LINE: "Eight things in version 1.1 that you did not have last Friday." (Slide items: county, type and name filters; add a site from the map list; show or hide site page fields; archive, restore and delete reports; form keeps your place; PDF export respects hidden fields; profile history, page by page; admin pages locked to admins.)
[click ×4, two items each]
- Items 1 and 2: "Map filters by county, type and name. Adding a site from the SAPAA map list, with a warning when a name is close to an existing one."
- Items 3 and 4: "Admins choose which fields a site page shows. Admins archive, restore and delete reports."
- Items 5 and 6: "The inspection form keeps your place. PDF export respects hidden fields."
- Items 7 and 8: "Profile history, page by page. Admin pages are locked to admins."
Then: "Five of these were still in review last Friday and are merged now: add-site suggestions, site page fields, report archive, the form, and map search. You said you will do the user testing yourself after the deployment. Thank you. Version 1.1 is released; please try it and tell us what you see. If anything surprises you, tell us and we will fix it. We are confirming that the live database update is finished, so if something fails, that is the first thing we will check."
Also done: "You asked on Oct 9 to show and hide site fields. Hidden values are kept, not deleted."

Behind this slide:
- Correction against the slide notes: the notes said everything on this slide was "in review or not built" on Oct 9. That is true for five items only. The PDF export fix, the profile paging and the admin locks are new fixes, and the PDF export with hidden fields was already merged on Oct 9 (PR #146). The spoken line above says only what is true.
- Map filters (P2c). County and status filters: PR #167 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167 (Alissa). Type, subtype and name search: PR #166 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/166. Search lists up to eight areas and zooms: PR #241. Story US 2.0.6 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/60. A protected area with no matching site shows as "Unknown county".
- Add a site (P1). PR #162 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/162 (Zanab, merged Oct 9, 23:07Z, part of story US 2.0.2 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/56). It warns when a new name contains, or is contained in, an existing name (the shorter name needs at least four characters, so "Elk" does not match many sites; case and extra spaces are ignored; the warning does not block saving), and it suggests areas from the SAPAA map that are not yet sites in SIR-SAPAA. Choosing the boundary by hand is in PR #167. The PR title says suggest; its description still said "to come", but the merged code contains `getSiteSuggestions` and tests for it.
- Site page fields (P1). PR #163 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/163 (Zanab; closes story US 2.0.5 #59 and task #80). New table `site_page_fields`, one row per field per site with a value and shown or hidden. The fixed field list today has three fields: SAPAA website, iNaturalist, designated steward. Admin only; only http and https links are saved. Acceptance tests 1 to 4 (admin can edit; non-admin refused; shown or hidden toggle; saving updates the page and hides hidden fields). Needs production migration `20261008000000_create_site_page_fields.sql`; until it is run, the site page cannot load or save these fields in production.
- Archive, restore, delete reports (P1). PR #165 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165 (Jayden; closes story US 7.0.8 #69; 34 files, 1,725 lines added). A report must be archived before it can be deleted for good. Permanent delete removes the report's answers and photo records in one database transaction, then removes the image files. Archived reports are hidden from lists, galleries, profiles, totals and PDF exports. Needs production migration `20261009000000_archive_site_inspection_reports.sql`.
- The form reopens (P1). PR #164 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/164 (Abhinav; closes task #87, part of story US 4.0.6 #63) and PR #236 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/236 (drafts restore reliably). The draft now stores the active section and the "steward verification accepted" flag with the answers. It covers the new-report form only, not the edit-report form. This is the River Lot 56 problem from Oct 2 (your place in the form was lost, not your answers).
- PDF export (P1). PR #237 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/237 (Saumya): export respects the fields an admin hid, no longer caps photos at 20 per report, uses WebP. It also reads past the 1,000-row database limit, which finishes story US 7.0.6 (export of more than 50 reports, #66). Admin-chosen hiding itself came from PR #146.
- Profile history (P2b). PR #255 (Saumya): ten reports per page with Previous and Next.
- Admin locks (P1). PR #240 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/240 (middleware, an open redirect in the OAuth callback, the admin layout check), PR #261 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/261 (admin-only checks on `/api/heatmap` and `/api/geocode`), PR #242 and PR #259 (report write and read actions check who is calling), PR #256 (users waiting for approval see the "Awaiting Admin Approval" screen).
- Also merged: gallery photos and safe image delete PR #234; archived and inactive sites consistent across pages PR #239.
- Still not verified: a warning for very large PDF exports (promised earlier); rotation of three Cypress test-account passwords that PR #240 says remain in git history.
- IF HE ASKS why the form is only fixed for new reports: "That is where the problem was reported. The edit form is not changed. I'll check it." (Open.)
- IF HE ASKS whether he can see it: "Version 1.1 is released. It needs the one-time update of the live database, and we are confirming that it is done. If the site page fields or archive buttons give an error, the likely cause is an update that has not been run, and we will tell you." (Do not say "it is live".)
- IF HE ASKS for the full field list: "Please send it. Today the list has three fields, and adding yours is a code change, not a database change."

## 6. What you asked us on Oct 9

KEY LINE: "Four things you asked for last Friday."
[click] Try version 1.1: "You said you would do the testing after the deployment. Version 1.1 is released, and the one-time update of the live database has to be finished for it to work. [CHECK with the team that it is, before saying more.] Please try it and tell us what you see."
[click] Map decision: "You asked how we will document the choice, and wanted a section in your Drive. We will write it up, with the options we compared, and put it in the repo and your Drive."
[click] Sample GPX: "You offered about a hundred files in a subfolder. (Slide text: we will handle many files at once from the start.) Thank you. Bulk upload was your suggestion and we agreed to support it from the start."
[click] Scoreboard: "You said we are going the right direction and added natural region, an all-time versus past-year view, and who has visited at least once in the last decade. We noted all three. Which should come first?"
Footer: "The scoreboard ideas are noted. Which should come first?"
Do not promise dates for these.

Behind this slide:
- Source for all four: Oct 9 transcript https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week6/2026_10_09_meeting_frank.txt (no speaker labels; the capture stops at line 673).
- Try version 1.1. Slide text: "Version 1.1 is released. Please try it and tell us what you see." The slide no longer says "live", on purpose: the live database update is unconfirmed. Frank, lines 57 to 59: "push user testing out after the deployment, and I'll take a look at it ... I'll do the testing." Lines 45 to 55: "don't surprise your users" ("a darn good way of the CIO getting phone calls from the VP of operations", as transcribed). Lines 500 to 503: "my trust bubble has gone up considerably. I still need to see the app after October 13th ... trust but verify it." There was no explicit sign-off on the release cadence; do not claim one.
- The Supaview exchange (same file, around lines 56 to 62): Frank asked "Will the supa-based superview thing be fixed in that release?" and the team answered that it would be ("we'll make sure to get it running by Tuesday"). Nothing in the repo confirms that the production database was renamed or that Supaview connects. Renaming PR: #129 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129 (removes the `W26_` prefix and hyphens; task #73 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/73, Alpha, closed Oct 10). Per PR #129, the live app breaks unless the rename SQL is run at deploy. UNKNOWN: whether it was run and whether Supaview connects. The spelling "Supaview" is ours; Frank says "Superview" in transcripts.
- Map decision. Frank, lines 219 to 240: "How are you going to document that decision? So that a year from now ... I can say, because the team at the time recommended it, and here is the document." He wants a section in his Drive now, "map selection, decision process or something like that", and a "project closed summary" by December (lines 229 to 233). The team answered that the document exists in Google Docs and would be pushed to the repository and his Drive. The repo has no map decision document yet. Frank did not approve or reject the choice of map. What the team said: Google blocks offline display of its maps in another app; Protomaps free tier of one million tile requests a month; data from OpenStreetMap; MapLibre as the viewer. Task #189 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/189 ("Choose the tile source and the offline tile cache", Red, due Oct 18) is where the offline cache and its limits get written down.
- Sample GPX. Frank's offer is at lines 583 to 584 and 601 to 603, bulk upload at 590 to 595. Plan: the upload action accepts several files in one upload and checks each on its own: task #192 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/192 (Red, due Oct 19) and #201 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/201 (upload control, Oct 21). The sample files are not in the repo. Whether Frank has sent them since Oct 9 is unknown.
- Scoreboard. Frank, lines 405 to 422: natural region ("6 big natural regions"), a time overlay (all-time versus past year), "who has visited at least once per the last decade". He did not name a first metric. What exists: inspection totals on the profile are US 1.0.4 #170 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/170 (Green, Sprint 3); activity points are US 1.0.5 (5 points, Sprint 4 in the plan, and moved later by slide 16). None of the three new ideas is in a story. Natural region needs region data that is not in the database today (backlog item 43 "Finish site classification by region and county" is open).
- Also from Oct 9: delete levels. Frank, lines 433 to 434: "Looks good. Make it happen." Built as archive (restorable) and delete for good (keeps reports and photos): sites PR #160 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160, reports PR #165. A separate "suppress" level below archive was asked in the Oct 9 deck; Frank did not address it. Deactivate and reactivate (PR #150) already exists.
- IF HE ASKS whether Supaview works: "We said it would be running by Tuesday. We have not confirmed it on your live database. I'll find out and tell you today." (Open. See the last section.)
- IF HE ASKS where the map decision document is: "It is a Google Doc we are moving into the repo and your Drive. It is not in the repo yet." Do not promise a date. (Open.)
- IF HE ASKS which scoreboard idea first: "We have no answer yet. Which one helps you most?" Note the data cost: region needs region data, past-year needs a date filter on counts, decade visits need a date filter on distinct sites.

## 7. Section 2: What's next

"Second, and where most of our time goes: what's next."

Behind this slide:
- Window: Oct 16 to Oct 23.
- Sprint 3 started on Oct 14 (plan). As of this afternoon there is no Sprint 3 pull request, merged or open. The `sprint-3` branch is identical to `main`. All Sprint 3 task issues (#181 to #218) are open: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (Sprint 3 > Tasks).
- Be ready to say this plainly (see slide 9).

## 8. What we'll do, project by project

KEY LINE: "Same four projects. Sprint 3 started on Wednesday, October 14."
[click] Project 1: "Safety information on site pages, such as the nearest hospital and known hazards, entered by admins. Stewards can edit their own past reports. A forgotten-password link on the sign-in page."
[click] Project 2a: "The Sprint 3 test plan, then tests for every new story."
[click] Project 2b: "On a profile, each past visit opens its report, and the profile shows activity totals."
[click] Project 2c: "The first task: link each site to its boundary from the Alberta government data, and store a centre point. Today an admin picks the boundary by hand when adding a site. Next the system matches them, and lists any it cannot match."

Behind this slide:
- Project 1, safety information: US 2.0.11 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/174 (5 points, Blue: Aaron, Zanab, Abhinav). Tasks: database fields with admin-only write access #186 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/186 (due Oct 17), admin form and server action #197 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/197 (Oct 20), safety section on the site page showing "not recorded" for empty values #202 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/202 (Oct 21). Done when 2.0.11 AT1 to AT4 pass.
- Project 1, edit past reports: US 4.0.4 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/176 (5 points, Blue). Tasks: open a past report in edit mode, checked on the server so that only its author can edit, #194 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/194 (Oct 19); block an edit that clears a required answer and list the missing questions #204 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/204 (Oct 21); show saved edits everywhere the report appears, including the site page, profile history and PDF export #210 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/210 (Oct 23). We do not know if this covers the "Edit Report" bug on your list (see slide 18).
- Project 1, password reset: US 5.0.2 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/179 (2 points, Green: Alissa, Jayden). Tasks: "Forgot password" link and reset email #188 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/188 (Oct 17), verify a code then set the new password with tests #199 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/199 (Oct 20). No admin step.
- Project 2a: Sprint 3 test plan #182 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/182 (Blue, due today, not done): name the test type (unit, integration, end-to-end) for each acceptance test of the Sprint 3 stories. Traceability matrix for Sprint 3 #214 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/214 (Blue, Oct 24). CI check that fails when a diagram image does not match its source #196 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/196 (Red, Oct 20). Schema review before each migration merges: #183 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/183 (Green, due today, not done).
- Project 2b: US 1.0.3 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/169 (2 points, Green): link each inspection in the profile history to its report #187 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/187 (Oct 17); hide the fields a steward chose to hide in their past reports #198 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/198 (Oct 20). US 1.0.4 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/170 (2 points, Green): activity aggregates on the profile, updated on a new report, #195 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/195 (Oct 19). Acceptance tests of 1.0.4 cover inspection count and "activities reported" only.
- Project 2c: US 6.0.1 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/180 (5 points, Blue). Task #181 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/181: link each site to its boundary from the Alberta government KML and store a centre point (database migration). It fills the link that PR #167 added; that link is empty until an admin sets it. Done when 6.0.1 AT1 (site geometry equals the source the SAPAA website uses) and AT2 (a site read from the database has a stored boundary and a centre point) pass and Green has reviewed the schema. Due today (Oct 16), not done. Next: match sites and list unmatched ones for an admin, #190 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/190 (Oct 18, AT3); cache geocoding results and stay under the OpenCage free limit of 2,500 requests per day, #193 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/193 (Oct 19, AT4). #181 gates the map page, #190, #193 and the iNaturalist observations (US 4.0.7).
- IF HE ASKS why the boundary link comes first: "The map, the site details view and the iNaturalist observations all need each site to have a boundary and a centre point."
- IF HE ASKS what data the boundaries use: "The Alberta government's open data, the same source your website uses. You told us the 2023 version leaves out one natural-area type, so we need your 2021 file before go-live."
- IF HE ASKS whether this week's work has started: "The three tasks due today are not finished. The plan dates on the next slide are the plan, and some may move. We will tell you before next Friday if they do."

## 9. What the plan has by next Friday

KEY LINE: "This is what the plan has between now and next Friday. These are plan dates and they are at risk. Three of them were due today and are late." (Notes originally said "Everything on this slide is due before we meet next Friday"; the slide now shows planned dates.)
[click] Oct 16: "Three tasks were due today and are late: linking each site to its boundary, the Sprint 3 test plan, and the review of the new database tables."
[click] Oct 17: "All sites with boundaries on one map, the storage for GPX files, the safety information fields, and the password reset link on the sign-in page."
[click] Oct 19: "A View on map link from each site, the checks on uploaded GPX files, and activity totals on the profile."
[click] Oct 20: "The admin form for safety information, the password reset form, and past reports opening from a profile."
[click] Oct 22: "Open a site's details from the map, draw uploaded GPX tracks, and download a map area for offline use."
Footer: "These are planned dates. The freeze is Sunday October 25 and the release is Tuesday October 27."
Say it plainly: "If any of these slips, we would rather tell you now than next Friday. Our plan has a fallback: if the map page and the GPX storage are not merged by October 20, the offline map tasks move to Sprint 4."

Behind this slide:
- All dates are the Sprint 3 plan: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (Sprint 3 > Tasks). Sprint 3 is 12 stories, 60 points committed (57 by the velocity re-estimate). Red 26, Blue 18, Green 16. As of this afternoon nothing in Sprint 3 is merged, and no Sprint 3 pull request exists.
- The slide notes in spec.js still describe the older version of this slide (an Oct 17 row for the three late tasks, and an Oct 23 row). This script follows the slide as it now reads. Check that the notes in the deck are updated.
- Oct 16 row (due today, late, no pull request, all open): #181 link each site to its boundary and store a centre point, Blue (Aaron, Zanab, Abhinav) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/181; #182 Sprint 3 test plan, Blue https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/182; #183 schema review of the site geometry columns, the GPX track table and the safety information fields, Green (Alissa, Jayden) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/183. #181 gates the map page #184, matching #190, the geocoding cache #193, and the iNaturalist observations (US 4.0.7). Acceptance tests for #181: US 6.0.1 AT1 (site geometry equals the source the SAPAA website uses) and AT2 (a site read from the database has a stored boundary and a centre point); Green must review the schema.
- Oct 17 row (plan date Oct 17, no branch yet): map page with all active sites and boundaries #184 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/184 (Red: Saumya, Chris; US 2.0.1 AT1); GPX track table and file storage with access rules #185 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/185 (Red; migration that must run on a clean local database and be reviewed by Green); safety information fields with admin-only write access #186 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/186 (Blue; US 2.0.11); "Forgot password" on the sign-in page and a reset link #188 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/188 (Green; US 5.0.2 AT1). Also due Oct 17 in the plan: link each inspection in the profile history to its report #187 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/187 (Green; US 1.0.3).
- Oct 19 row: "View on map" link and highlight only the selected site #191 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/191 (Red; US 2.0.1 AT3 and AT4); GPX upload server action #192 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/192 (Red; refuses a file without the .gpx extension, a file that is not valid GPX or has no track points, and a file above the stated maximum size; saves nothing when it refuses; accepts several files in one upload and checks each on its own; US 2.0.9 AT2, AT3, AT5, AT6); activity aggregates on the profile #195 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/195 (Green; US 1.0.4 AT1 and AT2: inspection count and activities reported). Also due Oct 19: matching and unmatched list #190 (Oct 18), geocoding cache #193 (Oct 19, OpenCage free tier of 2,500 requests a day), open a past report in edit mode #194 (Oct 19).
- Oct 20 row: admin form and server action to save safety information #197 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/197 (Blue; US 2.0.11 AT3 and AT4); password reset, verify a code then set the new password #199 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/199 (Green; US 5.0.2 AT1 to AT4, no admin step); "Past reports open" is the profile history item: #187 and hide-the-fields-a-steward-chose-to-hide #198 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/198 (Green; US 1.0.3). Editing a past report is a separate item (#194 Oct 19, #210 Oct 23). Also Oct 20: connect iNaturalist #200 (scope changed, slide 10), the mid-point check, and the CI diagram check #196.
- Oct 22 row: site detail view when a site is selected on the map #203 (Blue, Oct 21) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/203 and "View SIRs" link #208 (Oct 22) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/208 (US 2.0.8); draw the uploaded GPX tracks on the map #206 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/206 (Red; US 2.0.1 AT1 to AT4); download a map area for offline use and show its status #207 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/207 (Red; US 4.0.2 AT1).
- Not on the slide but in the plan: Oct 23 show downloaded tiles offline #209, show saved edits everywhere #210, iNaturalist photo picker #211 and site section #212; Oct 24 live tiles #213, traceability matrix #214, a PR for each task #215; Oct 25 code freeze #216; Oct 26 release notes and the Sprint 3 release by Red #217; Oct 27 20:00 deadline; Oct 28 lab demo #218. The plan has Red releasing on Oct 26 and keeps Oct 27 as spare; the slide's "release Tuesday, Oct 27" is the deadline.
- Fallback in the plan (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md, Velocity re-estimate): if Red has not merged the map page #184 and the GPX table #185 by Oct 20, the offline tasks #207, #209 and #213 (US 4.0.2, 13 points) move to Sprint 4, and Blue takes the GPX upload tasks #192 and #201. If the team is behind on Oct 20, US 4.0.7 moves to Sprint 4 first, then US 4.0.5. If both happen, Sprint 3 ends at 37 points and Sprint 4 gains 23. Red carries 13 points per person; Sprint 2's highest team result was 9.7.
- IF HE ASKS whether the dates will hold: "No promise. Three tasks due today are not done and nothing in Sprint 3 is merged yet. The first check is October 20. If the map page and the GPX storage are not merged by then, the offline map tasks move to Sprint 4. We will tell you before next Friday."
- IF HE ASKS what you would cut first: "The iNaturalist rows, then offline. Offline is not in your charter, but you told us you need it, so tell us if you would rather we protect it."
- IF HE ASKS why the release is Oct 27 and not earlier: "That is the course deadline at 8 pm. The plan has us releasing the day before."

## 10. Sprint 3: the map you described

KEY LINE: "Sprint 3 is the map you described: where the area is and what other stewards did there."
[click] Map: "Every active site drawn with its boundary, a View on map link from each site page, and a detail view when you select a site."
[click] Tracks: "Stewards upload a GPX file after a visit and it is drawn as a line. GPX only, as you asked. You warned us about dirty files and tracks that wander outside a boundary, so uploads are checked and refused if they are not valid GPX."
[click] Offline: "Download a map area and keep using it with no signal, on the web app. It is not in your charter, but you told us you need it."
[click] People: "Each past visit opens its report, and profiles show activity totals."
[click] Reports: "Stewards edit their own past reports, safety information on site pages, and password reset."
Footer on the slide: "iNaturalist: public observations only, no account link. Enough?" Say: "Our team found that we do not need a connected account to show public observations. That is simpler. Is it enough for you?"

Behind this slide:
- Sprint 3 stories, all due Tue Oct 27 (freeze Sun Oct 25), 12 stories, 60 points: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/user-stories.md.
- Map. US 2.0.1 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/171 (8 points, Red: Saumya, Chris) and US 2.0.8 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/172 (3 points, Blue). Depends on US 6.0.1 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/180 (boundary and centre point, Blue). Uses MapLibre GL and the Protomaps base map already in the app (PR #159).
- Tracks. US 2.0.9 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/173 (5 points, Red). Acceptance tests: a valid .gpx is saved and linked to the site and to the uploader; a non-.gpx extension is refused with a message; a .gpx that is not valid GPX or has no track points is refused and nothing is saved; the stored track reads back with the same points; a file above the stated maximum is refused with a message naming the limit. Trimming wandering tracks or stray lines is not in these tests. Frank's concerns (Oct 9, lines 545 to 580): tracks can stray outside the boundary, and a device left on adds stray lines. First version handles the clean case.
- Offline. US 4.0.2 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/175 (13 points, Red, the largest story). Charter project: "none (team request)", hence the "+" chip. Tasks: #189 choose the offline tile cache (Oct 18), #207 download an area (Oct 22), #209 show tiles offline and mark missing ones (Oct 23), #213 live tiles when online (Oct 24). Frank, Sept 25: "I definitely need offline capability, but on the web app." Whether the hosted Protomaps service allows saving tiles for offline use is unconfirmed (terms, cost and non-profit pricing also unconfirmed).
- People. US 1.0.3 #169 and US 1.0.4 #170 (2 points each, Green).
- Reports. US 4.0.4 #176 (5 points, Blue), US 2.0.11 #174 (5 points, Blue), US 5.0.2 #179 (2 points, Green). See slide 8.
- iNaturalist (charter label 3a in our stories document). US 4.0.5 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/177 and US 4.0.7 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/178 (5 points each, Green).
- The scope change behind the footer: task #200 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/200 ("Connect a user's iNaturalist account and read their observations", Green, due Oct 20). Today Alissa wrote on it that iNaturalist needs a registered application only for authenticated requests, that "we can't connect an iNaturalist account to SAPAA", and that the stories can be done with calls that need no authentication. So the title of #200 no longer describes the work, and no re-point of the issue is recorded. Consequence to know: acceptance test 1 of US 4.0.5 reads "User can upload an image inside their SIR by selecting images from their iNaturalist account". How a steward points at their own observations without connecting an account (for example by typing their iNaturalist username and reading public observations) is not decided. US 4.0.7 (top five public observations on a site, no iNaturalist account needed) is not affected. Frank on Oct 9, lines 99 to 100: "as long as I can add a URL, that's all I need".
- IF HE ASKS where GPX is: "It is Sprint 3. Nothing is built yet. First the storage table (Oct 17), then upload with validation (Oct 19), then the upload button on the site page (Oct 21), then drawing the track on the map (Oct 22)."
- IF HE ASKS about messy GPX files: "Our first version checks that the file is valid GPX with track points. Trimming the stray part is not in the Sprint 3 tests. You told us to start with the simple files and move to the ugly ones. Do you want trimming this term?"
- IF HE ASKS about FIT or KML uploads: "GPX only for now." (Oct 2: Frank asked to log an enhancement to accept or convert other formats; the repo has no record that it was logged. Open.)
- IF HE ASKS why offline when it is not in the charter: "You said on Sept 25 you definitely need it on the web app. It is our biggest story at 13 points, so tell us if you would rather we cut it."
- IF HE ASKS what the iNaturalist change means: "We cannot connect a SAPAA user to their iNaturalist account. We can show public observations for a site without one. For picking your own photos in a report, we are still working out how, and we will tell you."
- IF HE ASKS about mobile: "The app is set up so it can be reused in a mobile app later. No mobile work this term." Frank's page also says a phone app is not needed (web version works with a phone data plan).

## 11. The map, in your four layers

KEY LINE: "Your four layers, and where each stands." (Slide status: base map working; boundaries "Drawn. Linking next."; history Sprint 3; data views later.)
[click] Base map: "Working."
[click] Boundaries: "On the map now. Admins can pick a boundary by hand when adding or editing a site. The automatic link is this week's first task. You said to expect about ninety percent automatic and ten percent by hand, and that sites with the same or similar names are the hard part. We will list the sites we cannot match for an admin."
[click] History: "GPX tracks are Sprint 3."
[click] Data views: "Later."
Footer: "You reminded us that tracks can wander outside a boundary, and a device left running adds stray lines. We build the clean case first, then the messy ones."

Behind this slide:
- Frank's layers on Oct 2: base map, static layer (the polygons), history layer (GPS devices, his files), data visualization and communication layer. Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week5/2026_10_02%20_meeting_Frank.txt
- Base map: PR #159 (Abhinav). OpenStreetMap data, Protomaps tiles, MapLibre viewer. The hosted Protomaps tiles need an access key (`NEXT_PUBLIC_PROTOMAPS_API_KEY`) in the production environment; without it the map shows a setup card. Cost, non-profit terms and offline-caching terms of the hosted service are unconfirmed; #189 (Oct 18) decides the offline cache and records the limits.
- Boundaries: PR #161 (draw, hover, popup), import work PRs #132, #137, #152 (table `protected_areas`, KML and KMZ parser, admin upload), PR #167 (column `sites_pa.protected_area_id`, picker in Add and Edit Site, county and status filters). #167 gives a hand-made link only. It does not store a centre point, does not fill the link from the KML, has no list of unmatched sites and no geocoding cache. Those are #181, #190, #193. Frank's expectation, Oct 9 lines 655 to 663: "the 90% rule ... and then you got to deal with the 10% picky". The team's concern: site names carry a type suffix such as "Riverlot 56 (NA)" and some names are contained in others, so only fuzzy matching is possible.
- The migrations for #167 must be run in production in order: `20261009120000_add_sites_pa_protected_area_id.sql`, then `20261009120100_sites_pa_protected_area_id_unique.sql`. The second fails if two sites share one protected area; a human must fix that first.
- 2021 boundary file: Frank (Oct 2) says the 2023 government data leaves out one type ("protective notation"), that 2023 is fine for testing and he has the 2021 version, which is needed for go-live. Asked again on slide 18.
- History: Red, US 2.0.9 #173 and US 2.0.1 #171; tasks #185, #192, #201, #206.
- Data views: nothing planned. Sprint 4's activity points and priority score are not map views. Frank's added ideas (natural region, past-year overlay, decade visits) are not in any story.
- Plan versus code on the map library: the plan now says MapLibre GL and Protomaps (PR #159), but the architecture diagram and the sequence diagram for US 4.0.2 still say Leaflet. Leaflet remains only for the inherited admin heat map (documented in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/software-design.md). If Frank sees a diagram that says Leaflet: "That diagram is out of date; the app uses MapLibre." (See the last section.)
- IF HE ASKS how many sites are linked today: "Only the ones an admin linked by hand. The automatic link has not run." (Do not give a count: the repo does not record how many are linked in production.)
- IF HE ASKS what happens to sites we cannot match: "They go on a list for an admin to fix by hand. That is the ten percent you described."
- IF HE ASKS for a data views date: "Later. Nothing is planned yet."

## 12. Where we are on the calendar

KEY LINE: "Sprints one and two are done and released. We are in Sprint 3."
[click] Sprint 1: done (Sept 29, discovery and planning).
[click] Sprint 2: "Released October 13."
[click] Sprint 3: "Ends October 27. Maps and history."
[click] Sprint 4 and [click] Sprint 5: "These were your room. After your email, we want to use that room for the version 4 proof of concept. That is the last section."
Footer: "Sprints 4 and 5 may change. Your version 4 email is next."

Behind this slide:
- Dates (all releases at 20:00, freeze two days before): Sprint 1 Sept 29; Sprint 2 Oct 13 (freeze Oct 11); Sprint 3 Oct 27 (freeze Oct 25); Sprint 4 Nov 17 (freeze Nov 15); Sprint 5 Dec 1 (freeze Nov 29). Source: Milestones table in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md. The slide shows goals as "Maps and history" (Sprint 3) and "Room for your requests" (Sprints 4 and 5).
- What is in the plan for Sprints 4 and 5 (so the proposal on slide 16 can be compared): Sprint 4 runs Oct 28 to Nov 17, two working weeks (one of the three weeks is reading week). It has 29 committed points in five stories and 57 points of capacity, so 28 points are free: US 1.0.5 earn points (5), US 2.0.12 score a site for to-visit priority (8), US 2.0.13 flag points a year old (3), US 3.0.3 export all digital files (8), US 7.0.3 all-inspections summary (5). No Sprint 4 issues exist, on purpose. Sprint 5 runs Nov 18 to Dec 1: no stories, 57 points of capacity, about 30 for new client stories and the rest for deployment, polish and fixes from the December field test.
- Frank on Oct 9, lines 494 to 506: Sprints 4 and 5 "still yours"; he said he had "another 2 weeks before I need to get you those last 2 sprints". His Oct 16 page is one week later and may be what he meant. Slide 17 asks him.
- IF HE ASKS whether the dates can move: "They are fixed by the course. The work inside each sprint can change, and that is what the last section is about."
- IF HE ASKS about the field test: "Your page says December 2026. Sprint 5 ends with our last release on December 1, so a December field test falls at or after our last release. That is why the date matters. See slides 16 and 17."

## 13. Section 3: Your email on version 4

"Third: your email. You asked for a few minutes at the end, so this is our reading of it, and a proposal. You decide."

Behind this slide:
- Frank's email arrived at 12:54 pm today and says, in summary: the focus is organizations that manage sites, including the Riverlot 56 Society; "In many ways, we have come to the end of development for the individual volunteer visiting far flung sites"; the next big user group is organizations; it asks Saumya for a few minutes at the end of today's meeting; it went to the team, Mehrdad and Vishal, and gives "a glimpse into the road map". The page it points to: https://sapaastewards.com/2026/10/16/sir-sapaa-v4/
- The three words to keep in the presenter's head for slides 14 to 18: "our reading", "proposal", "you decide". Nothing on slides 14 to 18 is decided. Say that the first time and again on slide 16.
- Saumya is not here (cover). Offer: "Your email asked for a few minutes with Saumya. We will cover it today and brief him, and if you want time with him separately, tell us when."

## 14. What we read in your email and page

KEY LINE: "Here is what we took from your email and the roadmap page. Tell us where we got it wrong."
[click] Next users: "Organizations that hold a Crown Lease and manage a site, like the Riverlot 56 Society, Wagner and Clifford E. Lee. Your email says we have come to the end of development for the individual volunteer visiting far-flung sites."
[click] Version 3: "You wrote that we have come to the end of development for the individual volunteer. Your page says that for the traditional WAERNAHR natural areas, development should stop at version 3.0, and that version 3 could be the last if SAPAA kept to those lands. Version 3 is site management. Our reading, which you can correct: finish versions 2 and 3 well, and keep the rest to tweaks."
[click] Versions 4 and 5: "Asset tracking, more precise site condition reporting and tracking volunteer activity. (Slide: "Asset tracking, site condition and volunteer activity, hopefully in 2027.") You hope for version 4 in the Spring of 2027 and version 5 in the Fall of 2027; your page says "hopefully", so we treat those as hopes, not dates. The signage example is a mirror image: a visitor reports a sign they saw, and a lease holder needs to report a sign that is missing."
[click] This fall: "A proof of concept built this semester and field-tested in December, with an advisory panel of three to five people meeting two to four times between November 1 and January."
Footer: "The page also lists a road map to 2030."

Behind this slide:
- What the page says, closely paraphrased, so the presenter can check wording:
  - Version 2 has two parts: better Person Management ("critical as it improves the validity and trust associated with a report") and GIS information through Map Management. In the example, a volunteer can "include GPS tracks of where he went and GIS points to highlight what he saw", for example dropping a pin on a makeshift camp so other users can look for it.
  - Version 3, Site Management, "allows for management of site pages within the app. A newly designated site can be added, an area de-listed removed, and links and additional information updated."
  - "If SAPAA restricted itself to only WAERNAHR lands, SIR-SAPAA version 3 could be the final one." A phone app "might be handy", but the web version "works fine assuming the user has a phone data plan". "For the traditional WAERNAHR natural areas, development should stop at version 3.0."
  - Crown Lease: some WAERNAHR areas are managed under a Crown Lease held by nonprofits (examples: Wagner, Riverlot 56, Clifford E. Lee), who may create trails, post signs, and provide an outhouse, garbage collection or a parking lot. "Version 4 and possibly version 5 will support these organizations through asset tracking, more precise site condition reporting, and tracking volunteer activity." Signage: a SAPAA volunteer is asked whether they see signs; they are not asked to report a sign that should have been there and was not. "For a Crown Lease holder, NOT seeing a sign may indicate that it was vandalized, blew down, or was somehow lost. The absence of an observation may initiate an action, such as installing a new sign."
  - Timing: "Version 4 will hopefully launched in Spring of 2027 and Version 5 in the Fall of 2027. A proof of concept (PoC) for the application will be created in the Fall Semester of 2026."
  - The activities above "are expected to consume the remaining capacity of the Fall 2026 and Winter 2027 CMPT 401 teams." The road map to 2030 follows.
- Road map to 2030 on the page: WAERNAHR phase (versions 1 to 3, in progress; existing sites, legacy reports, "basic gamification", "integration to iNaturalist"); Site Management phase (versions 4 to about 5); Volunteer Capacity (safety and capacity tools, training and certificates such as chain saw or ATV operation); Connected for Conservation (links to iNaturalist, NatureWatch, eBird and others); Knowledge Keeper; Beyond Public Land (federal Crown land, land trusts); Beyond Alberta. Order "becomes less important as the bullets progress".
- Advisory panel: "3-5 interested SAPAA Members or organizations with relevant expertise"; the Government of Alberta "encouraged to send observers or be a full participant"; industry experts and student alumni may be asked. It meets "2-4 times between November 1, 2026 and January 2027", "under 5-6 hours in total", and a Version 4.0 committee may follow.
- Our reading is a reading. We had only the page and the email summary when we wrote it. The slide notes originally included a sentence that a volunteer for a lease-holding site "is more likely to visit a far-flung site on vacation"; that sentence is not on the page and was removed from the spoken line.
- Page typo to know about: the PoC plan step says the application covers "2 or business requirements"; the word after "or" is missing. Read as "two or more". Ask if he means at least two.
- Charter links: https://sapaastewards.com/2026/06/03/student-opportunities-2026-to-2027/ . Our assigned projects are 1, 2a, 2b and 2c. The charter lists Project 15 "SIR-SAPAA v3 – Site Management" with status "Available" (as of June 7, 2026), describing "updating existing content, adding new fields from a central control list, retiring existing Site Based fields" (examples: Designated Steward, links to the SAPAA website) and the deliverable "Build, convert, test, launch, and support the data store."
- IF HE ASKS is version 3 (site management, charter Project 15) still planned: "Your page says version 3 is being worked on this fall and is the last version for the traditional natural areas. Much of what the page describes for version 3 is already in version 1.1: admins add a site (PR #162, #153), edit site page fields from a fixed list (PR #163), deactivate (PR #150), archive and delete (PR #160). Those stories sit under Project 1 in our stories document, not under Project 15. What is not there: your full field list (we have three fields), and anything you want to add after you flesh out version 3. You told us on Oct 2 you would do that in October. Is version 3 still your plan, and is this what you meant by it?" (Open: what Frank counts as version 3.)
- IF HE ASKS about GPS pins: "Your page describes dropping a pin. Sprint 3 draws GPX tracks. It does not have pins or points of interest. That would be new work, and it is in the same family as the media, asset and GIS requirement on slide 15." (The page puts pins in version 2; the team's Sprint 3 stories have none. See the last section.)
- IF HE ASKS about the mobile app: "Your page says development should stop at the web version for the traditional areas. We are not doing mobile."
- IF HE ASKS where we got "the signage example": "From your page. A visitor reports a sign they saw, and a lease holder needs to report that a sign is missing." Then slide 15, data model row 4.

## 15. Your six needs, and what we have or plan

Slide column headers: "Your requirement", "What we have or plan", "What is missing". Say "plan" for anything from Sprint 3.

KEY LINE: "Your page lists six business requirements for versions 4 and 5. Here is what already exists."
Go row by row, short:
- Legal structure: "We have the government boundaries but no ownership or lease data."
- Tailored management: "Admins can already show or hide fields on a site page, but there are no per-lease rule sets."
- Person management: "We built people, roles and a steward per site, and your page says common roles across leases matter."
- Media, asset and GIS: "Photos, the map and GPX tracks are in Sprint 3. Asset records and installation notes are missing."
- Safety and work: "Safety information on a site is Sprint 3. Work orders and certified volunteers are missing."
- Biophysical monitoring: "We have inspection reports. Invasive-species and hazard checks are missing."
Footer: "We have not designed any of the missing parts. The proof of concept covers two of the six, so you choose which."

Behind this slide:
- The six requirements, as the page words them: 1) Legal Structure: a data structure to manage the legal ownership of a parcel, at first Alberta public land, but able to take federal Crown land, municipal parks, or publicly accessible private land such as a land trust's. 2) Tailored Management Experience: a baseline plus customization; for example one lease allows overnight camping, fires and infrastructure and another forbids them. 3) Person Management: select users get extra rights inside a Crown Lease's section of the app; below the super user, some can update the status of a site or "CRUD users"; "common roles across different Crown Lease sites is critical; provision of customized roles is discouraged except for when there is a compelling need." 4) Media, Asset, and GIS Management: what the sign looked like, where it was, how it was secured, when it was installed; some of this "can be done within the current version" (photos, map management), others need "specialized fields (work order and installation notes)". 5) Volunteer Safety and Work Management: nonprofits must show OHS compliance; safety "invisible to operations"; to re-install a sign the app creates a work order, a volunteer "picks" it, must be certified for the work, and when done the assignment closes and the app updates (for example a new photo of the sign). 6) In Depth Biophysical Monitoring: for example an invasive plant species highlighted and volunteers nearby nudged to note its extent, or an annual Fuel Hazard assessment by qualified volunteers.
- What exists today, in our code and docs:
  - Boundaries and sites: table `protected_areas` (government polygons) and `sites_pa` (our sites), linked by `sites_pa.protected_area_id` (PR #167, one boundary per site, optional). Nothing about who owns or leases a parcel.
  - Fields per site: `site_page_fields` (PR #163), one row per field per site (value, shown or hidden), from a fixed list in code.
  - People: `people` (display name, skills, focus areas, activity points), `site_stewards` (one steward per site, keyed by the site), `socials` (contact details). Roles are Admin and Steward, kept in the login service (PR #144), with an approval flag. Design and reasons: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/user-model.md (option D, a new `people` table with an optional login link, so a person without a login can be added later without a schema change).
  - Media and GIS: photos on reports, the map (PRs #159, #161), GPX tracks and storage in Sprint 3 (#185, US 2.0.9).
  - Safety: safety information per site in Sprint 3 (US 2.0.11): nearest hospital, known hazards and other safety information, admin-only write, "not recorded" when empty.
  - Monitoring: inspection reports are answers to a fixed set of questions per visit.
- What each requirement means for the data model. This is our reading; none of it is designed.
  - Legal structure: needs a parcel or tenure record (Crown, federal, municipal, land trust), an organization record, and a lease record linking an organization to one or more sites with dates. Page priority 6 (shared responsibility across several entities) implies many organizations per site. Today a site has one boundary and one steward.
  - Tailored management: needs rules per lease (for example camping allowed or not) rather than per site fields. `site_page_fields` shows or hides fields; it does not hold rules. A rule set per lease is new.
  - Person management: needs organization membership and roles scoped to an organization or lease, from a short fixed list of common roles (the page discourages custom roles). Today `site_stewards` is keyed by site, so only one steward per site; several people with roles on one lease is a change to that key, or a new table.
  - Media, asset and GIS: needs an asset register: asset type (sign, trail, gate, outhouse), location, installation date, how it was secured, photos linked to the asset, and installation notes. This is the largest new table family and builds on photos, the map and GPX.
  - Safety and work: needs work orders (open, picked, closed), certification records per person, and OHS compliance records. A work order is a task with a state, an assignee and a required certificate.
  - Biophysical monitoring: needs observation types beyond today's questions (invasive species with extent; fuel hazard assessments) and a way to nudge volunteers near a location.
  - The absence-of-a-sign observation ("mirror image"): today a report records what the visitor answers. A missing sign cannot be recorded unless the system knows a sign should be there. So it needs an expected-asset list per site (the register above) and an observation with a status such as present, damaged or missing. "Missing" can then open a work order. We have not designed this; we raise it because it is the example you gave.
  - Plain business answer: none of the six needs a rewrite of what exists. All six add new records that link to sites and people. The one that touches existing structure is person management (one steward per site).
- The middle column is now headed "What we have or plan". GPX tracks and safety information are Sprint 3 plans, not built. Biophysical row now reads "Invasive species, fuel hazards" in the last column.
- IF HE ASKS which requirements are hardest: "Safety and work, because work orders and certified volunteers need OHS expertise we do not have. Your page puts OHS expertise second in the PoC priority list. Legal structure is the foundation, and it is the one the others depend on."
- IF HE ASKS whether the missing parts are estimated: "No. We have not designed or estimated any of them. We would size the two you choose before Sprint 4 starts."
- IF HE ASKS why "Tailored management" is only partly there: "Admins can show or hide fields per site. A rule such as 'camping allowed' per lease is a different thing, and we have no lease record yet."

## 16. How we'd fit it into the term

KEY LINE: "This is a proposal, not a decision. Your page says the proof of concept should be tested in the field in December, and that this work should use the rest of this fall. Our calendar already has Sprints 4 and 5 as room for you."
[click] Sprint 3: "Finish the map and history as planned. Release October 27."
[click] Sprint 4: "Use it to build the proof of concept, covering at least two requirements from your list."
[click] Sprint 5: "Prepare the December field test, fix what we can, and hand over to the next team."
[click] If room runs out: "If we run out of room, the Sprint 4 items we planned, activity points, the priority score for which sites need a visit, and the all-reports summary, would move after the proof of concept. The one-click download of all photos and files, your Image Extract item, stays your call. On Sept 25 you said adding or dropping a deliverable needs a change request. Once you decide, we will send a short one."
Footer: "Our proposal. You decide. We'd send a short change request."
Do not oversell: the field test date and who tests are not settled.

Behind this slide:
- What would move if room runs out, and the arithmetic (our numbers, not in the plan): Sprint 4 now holds 29 committed points of 57 capacity. Moving, if needed, activity points US 1.0.5 (5), priority score US 2.0.12 (8) with its year-old reminder US 2.0.13 (3), and the all-reports summary US 7.0.3 (5) frees 21 points. US 3.0.3 export all digital files (8) stays unless Frank moves it. That leaves up to about 49 points of Sprint 4 capacity for the PoC, if Sprint 3 finishes. The PoC has no estimate yet. If the Sprint 3 fallback is used (slide 9), 23 points move into Sprint 4 and the room for the PoC falls to about 26.
- What stays in Sprint 3 from "gamification": inspection totals on profiles (US 1.0.4 #170). What moves: activity points (US 1.0.5). Frank's scoreboard ideas (natural region, past-year view, decade visits) are not scheduled.
- Where the proposal comes from: Frank's page says "Create a proof of concept application to be tested in the field in December 2026", covering 2 or more business requirements, with comments from an expert advisory panel used to "update requirements for the Winter 2027 build cycle". Our calendar: Sprint 4 Oct 28 to Nov 17, Sprint 5 Nov 18 to Dec 1. Frank said on Sept 25 that charter deliverables are "on the back of the contract" and that you can come back and "say, Frank, I think we can do more, Frank. Can we take it off?" and that "that's a change request process" (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week4/meeting_25th_frank_team.txt). Our Sept 25 minutes: "Adding or dropping a deliverable needs a change request." https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meeting-minutes.md
- Why it is a change request: the PoC for Crown Lease organizations is a new deliverable, and it moves planned items. It is not one of the charter projects we are assigned (1, 2a, 2b, 2c).
- IF HE ASKS: does this replace Sprint 4 and 5? "No, it uses them. The plan kept Sprints 4 and 5 free for your requests: Sprint 4 has 28 of 57 points uncommitted and Sprint 5 about 30. You said on Oct 9 that Sprints 4 and 5 are still ours to fill with your requests, and that you would send them in about two weeks. If your page is that request, this is how we would spend it. If you have more coming, we leave room. Sprint 3 does not change."
- IF HE ASKS: what happens to gamification? "Your page lists basic gamification in the first phase. We keep profile totals in Sprint 3. Activity points move after the proof of concept, because they are the least tied to your Crown Lease direction and the cheapest to defer. If basic gamification matters for version 3, tell us which part and we put it back." Reason to give: points need your answer on which actions earn points, which we do not have.
- IF HE ASKS: what happens to iNaturalist? "It stays in Sprint 3: top public observations on a site page, and the photo picker. Today we found we cannot connect a user's iNaturalist account, so the picker is being rethought and we ask on slide 10 whether public observations are enough. Your page lists a deeper iNaturalist integration under 'Connected for Conservation' later, and basic integration in the first phase. If Sprint 3 falls behind on Oct 20, the iNaturalist rows move first, into Sprint 4, and compete with the proof of concept." (Open: #200 scope change.)
- IF HE ASKS: why these items move and not others? "They are the ones that do not depend on Crown Lease users and are least tied to the six requirements. The all-reports summary serves SAPAA's reporting. The priority score is for deciding which sites need a visit. Image Extract is a backup, so it is your call."
- IF HE ASKS: what a change request contains? "Our Sept 25 minutes say a change request is needed to add or drop a deliverable, but our repo has no template. We would send one page: what is added and what is moved or dropped, with the charter project affected; why, pointing to your Oct 16 page; the effect on Sprint 4 and 5 points and dates; the acceptance tests for the two chosen requirements; the risks; and a line for your approval and date. Is that the right content, and who else needs to see it?" (Our proposal for the content; the recipients beyond Frank are not recorded. Open.)
- IF HE ASKS: how does the advisory panel fit our dates? "Our reading: the panel meets two to four times from November 1 to January, under five to six hours in total. Our dates are fixed: Sprint 3 release Oct 27, Sprint 4 Nov 17, Sprint 5 Dec 1. The first panel meeting falls inside Sprint 4, before the proof of concept exists, so it can shape what we build only if the chosen requirements are settled by Oct 28 and the panel gives early comments. A meeting after Nov 17 could see the Sprint 4 release. Meetings after Dec 1, and in January, come after our last planned release, so their feedback goes to the Winter 2027 team, as your page says. We would present at the panel if that helps. We need the meeting dates when you have them." The mismatch to avoid saying: do not promise that panel feedback will change what we build before Dec 1.
- IF HE ASKS: who tests in December? "We do not know yet. Your page says field-tested in December 2026. You said on Oct 9 you do user testing yourself after deployment. We need a date, a named tester at a Crown Lease organization (slide 17, decision 2), and test accounts. If the test is between Nov 17 and Dec 1, we can fix what we learn before the last release. A December test mostly falls at or after Dec 1, our last planned release, so those fixes would go to the Winter 2027 team in the handover." (Open: the date and the testers.)
- IF HE ASKS: the timing of the field test. "Sprint 5 ends with our last release on December 1. A December field test therefore falls at or after that release. So Sprint 5 prepares the test and fixes what we can before it, and what you find after the test goes to the next team in the handover notes. If you want fixes from us, the test would need to start in the last days of November, or we need to agree who fixes. Which do you prefer?" (Open. Do not say Sprint 5 contains the test and its fixes.)
- IF HE ASKS: is the field test real or a demo? "A field test needs a released version. Our Sprint 4 release on Nov 17 would be the version to test, which leaves two weeks to the end of Sprint 5."

## 17. Five decisions we need from you

KEY LINE: "Five decisions, so we can plan Sprint 4 before it starts on October 28."
[click] 1: "Which two of the six requirements. We would suggest media, assets and GIS, plus person roles, because they build on what we have: the map, photos, GPX tracks, people and roles. Your page lists a Crown Lease holder as the first priority, so we would model one."
[click] 2: "A contact at the Riverlot 56 Society, so we hear their needs first-hand."
[click] 3: "The December date, and who tests. You said earlier that you do the user testing yourself."
[click] 4: "Does anything leave Sprint 4 to make room?"
[click] 5: "Whether a short change request is the right way to record the new scope."
Footer: "Our suggestion, which you can change." (Slide footer text: "We'd suggest media, assets and GIS, plus person roles. They build on our map and people work." The slide eyebrow is "ON YOUR EMAIL".)

Behind this slide:
- Why Oct 28: Sprint 3 ends Oct 27, the Sprint 3 demo and review lab is Oct 28 (#218 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/218), and Sprint 4 starts after it. No Sprint 4 issues exist, on purpose, so Sprint 4 planning needs the answers before then. Sprint 4 release Nov 17.
- Why these two requirements (reasons to give): they build on what we have (the map and photos from Sprints 2 and 3, GPX tracks, people, roles and the steward link); the first priority on your page is a Crown Lease holder for a WAERNAHR property, and a lease holder's first need in your sign example is an asset record and a person with a role to act on it; they add the fewest new unknowns. The other four need more from outside: legal structure needs lease and ownership data we do not have, safety and work needs OHS expertise (your second priority), tailored management needs real lease rules to tailor to, and biophysical monitoring needs qualified volunteers. We can swap if the panel prefers another pair. The reasoning is ours; the page does not rank the six requirements, only the organizations the PoC should model.
- Page's PoC focus, in priority order: a Crown Lease holder for a WAERNAHR property; organizations with good OHS compliance expertise; one heavily used urban site and one remote site; a site with assets (trails, signage, gates, snow clear, track setting, buildings); an organization managing a non-Crown site such as a land trust; entities sharing responsibility for a site across several organizations. One organization may play several roles.
- The page's six-step PoC plan (business problem, how it is solved now, the question, results, next steps, future vision). Next steps: a proof of concept "to be tested in the field in December 2026"; "collect comments and feedback on the build from an expert advisory panel, update requirements for the Winter 2027 build cycle"; "decide next steps". Future vision includes three possibilities: the functionality lives in a third-party application that organizations license, a consortium forms to run SIR-SAPAA, or "the underlying business requirements are not the problem to be solved and/or the application fails to address them."
- Who is the contact at the Riverlot 56 Society: not in the repo. Decision 2 is a real question.
- Decision 3 depends on the Dec 1 release: Sprint 5 ends Dec 1, so a December test falls at or after our last release (slide 16, IF HE ASKS).
- Decision 4: the question is "Does anything leave Sprint 4 to make room?", not "what leaves". Our suggestion, only if room runs out, is the three items named on slide 16; US 3.0.3 (Image Extract, taken to be "export all digital files") is Frank's call. The mapping of "Image Extract" to US 3.0.3 comes from last week's script; Frank's list (BFE) is not in the repo.
- Decision 5: see "what a change request contains" on slide 16.
- Optional, not on the slide any more: offering to present at the advisory panel. Raise it only if Frank brings up the panel. Do not push if he does not want students on it.
- IF HE ASKS what we would model first: "One Crown Lease holder: an organization, a lease linking it to one site, a short list of common roles, and a register of assets on that site with photos and a location. A sign that is missing would show up as an asset with status 'missing'." (Our sketch, not a design.)
- IF HE ASKS what you get at the end of Sprint 4: "A working version on one site for one organization, covering two requirements, that your panel can try. Not a finished version 4."
- IF HE ASKS why not wait for the panel to choose: "Sprint 4 starts Oct 28 and the panel's first meeting is on or after Nov 1. We need a choice before then, and we can revise at the panel's first meeting before the freeze on Nov 15."
- IF HE ASKS what happens if he says no: "We keep the plan as it is: Sprint 4 builds the planned items plus whatever you send, and Sprint 5 stays open for your requests."

## 18. Four things from earlier weeks

KEY LINE: "Four items from earlier weeks. If you already sent one, tell us and we will find it."
[click] 1: "The 2021 boundary file. The 2023 government data leaves out one natural-area type; 2023 is fine for testing, and we need 2021 for go-live."
[click] 2: "Your full list of site-page fields. Admins can show, hide and edit three today: SAPAA website, iNaturalist and designated steward."
[click] 3: "A description of the Edit Report bug, or Harveer's contact. We still cannot find it on your list."
[click] 4: "Your GIS contact's name. You offered, and we will message them on LinkedIn, as you preferred."
Footer: "Skip any you've already sent. We may have missed it."
CHECK BEFORE PRESENTING: some of these may have been sent after Oct 9. Delete any that were.

Behind this slide:
- 1: 2021 boundary file. Needed before go-live. Frank (Oct 2): the 2023 open data "removed one type of natural area called a protective notation"; he has the 2021 version. The Sprint 3 acceptance test US 6.0.1 AT1 (site geometry equals the source the website uses) is checked against the file we have. The import code has a "notation" field with status codes (for example CNT and PNT); whether that is Frank's missing type is not confirmed.
- 2: Site-page field list. Field list is in `lib/sitePageFields.ts` (PR #163). Adding fields is a code change, not a database change. Page context: the charter's Project 15 describes "adding new fields from a central control list".
- 3: Edit Report bug. Oct 2: the BFE has an "edit report bug fix" item whose description the team cannot find; Harveer Deol was on the Winter 2026 team. Oct 9, line 137: Frank said it was "still cloudy". We do not know whether US 4.0.4 (#176, edit my previous inspections) covers it.
- 4: GIS contact. Oct 2: Frank offered an introduction to someone in industry; his preferred way is LinkedIn. Whether it was sent is unknown.
- Also pending from Frank, not on the slide (the slide would otherwise grow to five): the sample GPX files (about 100, in a subfolder, Oct 9), and the Oct 2 request to log a BFE enhancement to accept or convert FIT or KML files. The BFE file is not in the repo.
- Two commitments the team made to Frank are not on this slide because they are ours: the map decision document (slide 6) and Supaview running (slide 6).
- IF HE ASKS what happens if the 2021 file never comes: "We use the 2023 data for testing and development. It is missing one type, so it cannot go live as is."
- IF HE ASKS why you still need the field list: "Today admins choose from three fields. Your list sets what admins can show, hide or edit on every site page."
- IF HE ASKS about the Edit Report bug: "We don't know what it is. Our Sprint 3 story lets a steward edit their own past report, and we don't know if that is the same thing. A description or Harveer's contact would settle it."

## 19. Questions from the team

KEY LINE: "This is the team's turn to ask."
Each team member asks Frank one question, one sentence. Backups if quiet:
- "Should a site have one designated steward, or several?"
- "Who should review our testing and release plan for charter Project 2a?"
- "Which scoreboard idea first?"
- "Do you want the iNaturalist photo picker this term, or only the observations on site pages?"
- Questions the Sprint 3 plan says we take to Frank today: "Should the to-visit priority (2.0.12) give more activity points (1.0.5)?" "Which data should the map data layer show?" "Any open questions on the stories #169 to #180?"

Behind this slide:
- One steward per site is how the tables are built today (the site is the key of `site_stewards`; assigning a new steward replaces the old). Source: PR #131. Several stewards per site is a database change, and it matters for the lease holder model on slide 15.
- Charter Project 2a asks for review of release management "with former students and industry experts": https://sapaastewards.com/2026/06/03/student-opportunities-2026-to-2027/. Frank was asked on Oct 2 and Oct 9; no name has been recorded.
- Scoreboard ideas: slide 6.
- iNaturalist picker: the question depends on the #200 scope change (slide 10). Say first what we found, then ask.
- The two plan questions come from the gamification and map-layer notes in the Sprint 1 and 2 TA feedback rows of https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (a bounty-board idea that gives more points for chosen sites; a data layer on the map). The wording is from the slide notes, and the owner of each question is not recorded.
- More backups if time: "Do you want trimming of stray GPX lines this term?" (slide 10); "Do you want suppress as its own level below archive?" (open from last week; Frank did not answer); "Who tests in December?" (slide 17).
- Open-question lists for the Sprint 3 stories: the plan says each team writes an "Open questions" list on its story issue (#169 to #180) at Sprint 3 planning, and Aaron brings those questions to this Oct 16 meeting. No such lists are visible in GitHub today and there are no Oct 14 minutes (issue #264 https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/264 is open). Confirm with Aaron before the meeting whether he has questions for Frank.

## 20. Today in one slide

KEY LINE: "Three columns: what changed, what's next, and what's coming."
[click] This week: "Version 1.1 is released, all sixteen Sprint 2 stories are done, and the map filters by county, type and name. We read your version 4 email, and that is our reading, not a decision."
[click] Next week: "Link sites to boundaries, put all sites on one map, GPX upload, safety information and password reset. Three of these were due today and are late, so these dates may move."
[click] Coming up: "Maps and history on October 27. Then, if you agree, the proof of concept for Sprint 4 on November 17, and our final release on December 1. The field test is in December, at or after that last release."

Behind this slide:
- This week: slides 4, 5 and 14 to 15. Next week: slides 8 and 9. Coming up: slides 10, 12 and 16.
- "Nov 17: proof of concept (proposed)" is our proposal (slide 16) and needs Frank's decision and a change request. "Dec 1: final release" is the plan. "December: field test" has no date and falls at or after the Dec 1 release. Slide item "Your version 4 email: our reading".
- IF HE ASKS what is the single most important decision: "Which two requirements for the proof of concept, because Sprint 4 is planned around it."

## 21. Round table

Frank picks the order; the presenter speaks last. Three sentences each, at most.
The presenter's last word, about 20 seconds: "Version 1.1 is out. This week we start linking every site to its boundary and put them all on one map. We need your five decisions on the proof of concept so we can plan Sprint 4."

Behind this slide:
- On Oct 2, Zanab said the team should explain why it chooses what it chooses, and Frank agreed strongly. Give the reason first, then the decision.
- On Oct 2 Frank asked whether the presentation had improved on the week before. Open question: whether to ask Frank for the same feedback today.
- Frank's email asked Saumya for a few minutes at the end. If the team has not set up a separate time with Saumya, say it here: "If you want time with Saumya on the email, tell us and we will set it up."
- Before the meeting ends, note Frank's answers to the five decisions and the four older items in one list. Aaron writes the Oct 16 minutes (as he did for Oct 14, issue #264).

## 22. Backup: Sprint 2, final results

Use only if asked where a specific Sprint 2 item stands. 16 of 16 stories, 63 of 63 points, released October 13. Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md. Five acceptance tests of finished stories are only partly tested (2.0.3 AT4, 2.0.4 AT3, 7.0.1 AT3, 7.0.5 AT1 and AT3), out of 67; see https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/traceability-matrix.md.

Behind this slide: row by row (story, charter project, story issue, final pull requests, team).
- Steward profiles (US 1.0.1, P2b) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/54: PRs #131, #138, #141, #142, #238, #255. Alpha.
- Edit your own profile (US 1.0.2, P2b) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/55: PRs #138, #151. Alpha.
- Steward named on each site (US 3.0.2, P2b) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/62: PRs #133, #134, #139, #140. Alpha.
- Admins add a site (US 2.0.2, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/56: PRs #153, #162 (similar-name warning and SAPAA-map suggestions), #167 (pick a boundary by hand). Gamma.
- Deactivate and reactivate a site (US 2.0.3, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/57: PR #150 (Jayden). Hides the site from pickers and search; inspections still viewable. Beta. AT4 partly tested.
- Archive, restore, delete a site (US 2.0.4, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/58: PR #160 (Jayden). Gamma. AT3 partly tested. Needs production migration `20261008164223_delete_site.sql`.
- Edit a site (US 2.0.5, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/59: PR #163 (Zanab). Gamma.
- Links on site pages (US 2.0.10, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/61: PRs #145, #163 (Zanab). Gamma.
- Map with county filter and search (US 2.0.6, P2c) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/60: PRs #159, #161, #166, #167, #241. Beta.
- Photo ID optional and form keeps its page (US 4.0.6, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/63: PRs #147, #164, #236. Beta.
- Sign out from every page (US 5.0.4, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/64: PRs #120, #158, #238, #255. Alpha.
- Stewards export their own reports (US 7.0.1, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/68: PR #155 (Chris). Gamma. AT3 partly tested.
- Delete a photo (US 7.0.5, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/65: PRs #148 (Chris), #234. Beta. AT1 and AT3 partly tested.
- Hide private fields on export (US 7.0.7, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/67: PRs #146 (Alissa), #237. Beta.
- Export more than 50 reports (US 7.0.6, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/66: PR #237 (reads past the 1,000-row limit, with tests). The 50-site cap itself was removed in July 2026 by the Winter 2026 team. Gamma. The warning for very large exports promised earlier is not built.
- Delete a report (US 7.0.8, P1) https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/69: PR #165 (Jayden). Gamma.
- IF HE ASKS how many points are done: "63 of 63. 30 on Oct 7, 51 on Oct 9, 63 on Oct 11."
- IF HE ASKS why the table says "P1" for site management: "Those stories are tagged to Project 1 in our stories document. Your charter lists site management as Project 15, which is not assigned to a team."

## 23. Backup: Sprint 3, what you get, and when (planned)

Use only if asked. Footer: "Freeze Sunday, Oct 25. Release Tuesday, Oct 27. '+' = team request, not in your charter. 3a = iNaturalist." The third column is headed "Planned" (it was "Built").

Behind this slide:
- Source: Sprint 3 plan in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (60 points committed, 57 re-estimated). The "Planned" dates are the first and last due dates of each story's tasks. These are plan dates. As of today nothing is merged, and the three Oct 16 tasks (#181, #182, #183) are late.
- Sites linked to government boundaries, Oct 16 to 19: US 6.0.1 #180 (5, Blue): #181 link and centre point (Oct 16), #190 matching and unmatched list (Oct 18), #193 geocoding cache (Oct 19).
- All sites and boundaries on one map, Oct 17 to 22: US 2.0.1 #171 (8, Red): #184, #191, #206.
- Open a site's details from the map, Oct 21 to 22: US 2.0.8 #172 (3, Blue): #203, #208.
- Upload a GPX track of a visit, Oct 17 to 21: US 2.0.9 #173 (5, Red): #185, #192, #201.
- Offline and online map layers, Oct 18 to 24: US 4.0.2 #175 (13, Red; "+" chip, not in the charter): #189, #207, #209, #213.
- Past inspections open from profile history, Oct 17 to 20: US 1.0.3 #169 (2, Green): #187, #198.
- Activity totals on each profile, Oct 19: US 1.0.4 #170 (2, Green): #195.
- Edit my previous inspections, Oct 19 to 23: US 4.0.4 #176 (5, Blue): #194, #204, #210.
- Safety information on each site, Oct 17 to 21: US 2.0.11 #174 (5, Blue): #186, #197, #202.
- Reset a forgotten password, Oct 17 to 20: US 5.0.2 #179 (2, Green): #188, #199.
- iNaturalist photos in the report, Oct 20 to 23: US 4.0.5 #177 (5, Green, 3a): #200, #211. Scope under review (see slide 10).
- Top iNaturalist observations on a site, Oct 21 to 23: US 4.0.7 #178 (5, Green, 3a): #205, #212.
- Points by team: Red 26, Blue 18, Green 16.
- If the team is behind at the Oct 20 mid-point: US 4.0.7 moves to Sprint 4 first, then 4.0.5; the offline tasks #207, #209, #213 move if the map page and GPX table are not merged by Oct 20.
- IF HE ASKS why the map is split across teams: "Red has the map, GPX tracks and offline layers because they are one connected piece of work. Blue does the boundary link and site details. Green does profiles, password reset and iNaturalist."
- IF HE ASKS why Red has so much: "Red has 13 points per person, which is the largest load. That is why the plan names the offline tasks as the first thing to move."

## 24. Hidden slide: "SAUMYA IS COOKED"

Hidden, not for the client. Do not present it. Delete it before the file is sent, or leave it hidden.

---

## Things to check before the meeting

Status and dates
1. Sprint 3 has no merged or open pull requests. `sprint-3` equals `main`. Three tasks due today are not done and have no pull request: #181 (site to boundary and centre point, Blue), #182 (Sprint 3 test plan, Blue), #183 (schema review, Green). #181 gates #184, #190, #193 and US 4.0.7. The Oct 17 tasks (#184 to #188) have no branch. So the Oct 17 to Oct 22 dates on slide 9 ("What the plan has by next Friday") may slip. Slide 9 now has an Oct 16 row "Due today, late". Before presenting, ask Aaron, Jayden and Chris for the true status and update slide 9 if any of the three is done by then. Say the dates are "the plan, not a promise", and state the plan fallback: if Red has not merged #184 and #185 by Oct 20, the offline tasks #207, #209 and #213 move to Sprint 4.
2. Red has 13 points per person (Sprint 2 highest team was 9.7). Fallback: if the map page (#184) and GPX table (#185) are not merged by Oct 20, offline tasks #207, #209, #213 move to Sprint 4; iNaturalist US 4.0.7 then 4.0.5 move first. That fallback moves up to 23 points into Sprint 4, and competes with the proof of concept room on slide 16 (about 49 points shrinks to about 26 by our arithmetic).
3. Slide 9 notes in spec.js are stale: they still describe the older slide (an Oct 17 row for the three late tasks and an Oct 23 row; "opening a past report to edit it"). The script follows the slide as it reads now. "Past reports open" on Oct 20 matches the profile history link (#187, #198), not editing (#194, #210). "Release Tuesday Oct 27" is the deadline; the plan has Red releasing Oct 26. Slide 5 notes still say "Everything on this slide was in the Oct 9 deck as in review or not built", which is not true for all eight items; the script avoids that sentence.
4. Velocity numbers (60 committed, 57 re-estimate, planning rate 4.07 points per person per week) are in the plan; Frank has not seen them.

Release and production
4a. "Released" is not "live". Slides 5 and 6 say version 1.1 is released and ask Frank to try it. For it to work, the live database needs the one-time production updates, and nothing in the repo confirms they were run. Confirm with the team (and whoever has Supabase dashboard access) before the meeting, and do not say "it is live" unless confirmed. If it is not done, tell Frank before he tests: "don't surprise your users".
5. Unknown whether the production database migrations were run. The Sprint 2 release notes say to run the new SQL migrations in production, in order, before deploying; the runbook is https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/contributing.md#production-database-migrations . Examples from the PRs: the `W26_` rename `20261003000000_remove_w26_prefix.sql` (PR #129), the user model `20261004000000` (PR #131), `20261004010000_create_protected_areas.sql`, `20261005000000_profile_distinct_site_count.sql` (without it the profile page errors), `20261005010000_create_socials.sql`, `20261008000000_create_site_page_fields.sql` (#163), `20261008164223_delete_site.sql` (#160), `20261009000000_archive_site_inspection_reports.sql` (#165), `20261009120000` and `20261009120100` (#167), `20261010000100_require_approval_for_people_reads.sql` (#238). If these were not run, the live app, the site page fields, the archive buttons and the profile may error. Ask who has Supabase dashboard access (Frank's admin?) and whether it was done.
6. Unknown whether Supaview ("Superview" in Frank's speech) connects to the live database. On Oct 9 the team told Frank it would be running by Tuesday. Confirm the spelling and run the check, or tell Frank we have not.
7. CI is down: GitHub Actions cannot start jobs because the code host account has failed payments, so every PR shows failed or missing checks. The Sprint 2 release PRs #284 and #285 were merged with an administrator override. Slide 4 says 1,524 tests passed on our machines (111 suites, 5 skipped, 0 failed, on `main` at `ceb5188`); do not say CI passed. Who fixes billing is unknown.
8. Three Cypress test-account passwords remain in git history (PR #240); rotation not verified. The warning for very large PDF exports (promised earlier) is not verified.
9. PR #286 (Sprint 2 close-out docs) is still open, so `main` does not yet say that #96, #97 and #98 are closed. The links in this script point to `main`.
10. Fact conflict: an earlier note said issue #98 is open; `gh` shows #98 closed today (Oct 16, 20:32 UTC). Issue #264 (minutes of the Oct 14 lab) is still open and no Oct 14 minutes exist.

Frank's Oct 9 items and what he has sent since
11. Which Oct 9 items Frank has sent since: sample GPX files (about 100), BFE column G update, the 2021 boundary file, the full site-page field list, Harveer's description, the GIS contact. Slide 18 may list items he already sent; delete those. Slide 6 thanks him for the GPX files as an offer; confirm whether they arrived.
12. Map decision document: Frank asked for it in his Drive and the repo; it is a Google Doc and is not in the repo. Confirm it exists, who writes it, and when it is shared. Slide 6 says "we will write it up"; do not give a date. The offline-caching, hosting cost, non-profit terms and Google clause questions behind the choice remain unconfirmed (task #189, Oct 18).
13. Leaflet versus MapLibre: the plan now says MapLibre and Protomaps; the architecture diagram and the sequence diagram for US 4.0.2 still say Leaflet. Fix or be ready to explain. OpenCage free tier is 2,500 requests per day (#193). The Protomaps key must be set in production, or the map shows a setup card.
14. iNaturalist: Alissa's comment on #200 today changes the scope. Acceptance test 1 of US 4.0.5 says "selecting images from their iNaturalist account", which an unauthenticated approach may not meet. No re-point of #200 or the story is recorded. Slide 10's footer asks Frank "is it enough?" before the team has settled how the picker works. The charter's own Project 3a text is about SAPAA's use of iNaturalist.ca (training, a project of all Natural Area polygons); a software integration appears under "Project 4 – iNaturalist and Mapping in SIR-SAPAA v2.1". Our stories document tags 4.0.5 and 4.0.7 as 3a. Last week's script said "Project 4". Confirm which label to use.
15. Open-question lists for Sprint 3 stories (#169 to #180) were supposed to be taken to Frank today. None is visible in GitHub. Confirm with Aaron.

Slides 14 to 18 (Frank's version 4 email)
16. I could read Frank's page in full but not his email. The summary says it asks Saumya for a few minutes at the end of the meeting. Saumya is not here. Decide what the presenter says and whether a follow-up with Saumya is offered.
17. Slide 14's original note said a lease-site volunteer "is more likely to visit a far-flung site on vacation". That is not on the page and was removed. Check the other claims on slide 14 against the email.
18. The page's PoC next-step line reads "2 or business requirements" (a word is missing). We read it as two or more. Ask.
19. Everything on slides 14 to 18 is a proposal. The deck must not read as a decision. Check the footer of slide 16 and the title of slide 17 say so.
20. Sprint 5 ends Dec 1 with our last release, so a December field test falls at or after the last release. Slide 16 says Sprint 5 will "prepare the December field test, fix what we can, hand over", and slide 20 says "Dec 1: final release; December: field test". The test has no date and no tester. Fixes after the test go to the Winter 2027 team unless the test starts in the last days of November or someone agrees to fix later. Whether our team continues after Dec 1 is not in the repo. Do not say Sprint 5 contains the test and its fixes.
21. Advisory panel meets Nov 1 to January: no dates yet. It overlaps Sprint 4 (Oct 28 to Nov 17) and Sprint 5 (to Dec 1), with course deadlines Oct 27, Nov 17 and Dec 1. We do not know whether team members are expected at panel meetings.
22. A change request has no template or named recipient in the repo. The rule is in the Sept 25 minutes (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meeting-minutes.md) and in Frank's Sept 25 words. The contents listed on slide 16 are our proposal. Confirm whether anyone besides Frank must approve (for example the course instructor).
23. Charter Project 15 (v3, site management) is listed "Available" in the charter, and the site management work we shipped is tagged Project 1 in our stories. What Frank counts as version 3 is unknown.
24. The page says users in version 2 can "drop a pin" and "include GPS tracks". Sprint 3 draws GPX tracks only; there is no pin or point of interest feature. Frank may ask.
25. Data model answers on slide 15 are our reading and nothing is designed or estimated. The "absence of a sign" idea needs an expected-asset list; we have not tested that idea with Frank.
26. The arithmetic on slide 16 (21 points freed, about 49 of 57 for the PoC) is ours and is not in the plan. Sprint 4 has no issues. The PoC has no estimate.
27. Gamification wording: Frank's page lists "basic gamification" and iNaturalist integration in the first phase. The proposal moves activity points (US 1.0.5) later. Be ready for "that is in my first phase".

Slides 1, 21 and 24
28. The cover says "Saumya is not here. He is cooked." Check with the team whether that line should be on a client-facing title slide. Frank may ask; the script gives a one-line answer. The reason Saumya is absent is not recorded.
29. Slide 21's note originally said Saumya speaks last; the script says the presenter speaks last. Slide 24 ("SAUMYA IS COOKED") is hidden and not for the client. Delete it or leave it hidden before sending the file.

Smaller items
30. Slide 5's note said everything on it was "in review or not built" on Oct 9; this is not true for all eight items (see slide 5). The script says "five were still in review".
31. Five acceptance tests of finished stories are partly tested (slide 22). Sprint 3 acceptance tests for dirty GPX tracks do not exist.
32. A branch `feat/docker-local` (Chris) has no PR; not in the plan; no action needed unless asked.
33. The "Image Extract" item is taken to be US 3.0.3 (export all digital files). That mapping comes from last week's script; Frank's BFE list is not in the repo.
