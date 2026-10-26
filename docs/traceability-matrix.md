# Requirements Traceability Matrix (Fall 2026)

This page links each acceptance test (AT) in [User Stories](user-stories.md) to the automated tests
that check it. Status is as of **October 13, 2026**, the Sprint 2 release, on `main` at `ceb5188`
(merged in [#284](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/284)). That is `main`
at the October 11 code freeze (`9009d0d`) plus the Sprint 2 fix and follow-up PRs (#253 to #262
and #276). The GitHub release
[`sprint-2`](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/releases/tag/sprint-2) was
published on October 13.

Sprint 3 records were updated on **October 26, 2026** after the skills, export and activity
PRs merged. The current scope is 14 stories and 50 acceptance tests. US 3.0.4 was removed when
Frank required accounts and sign-in; PR #310 was closed without merge.

The combined local close-out run on the Sprint 3 source after #305, #312 and #315, with the
#318 changes and Chris's shared-branch test fixes, passed **1912 tests, 25 skipped, 0 failed**
(132 passing suites). Type check and full lint passed. The prior sprint CI run failed the
profile query-count and date tests; the current required CI result is still pending.
The database rule run passed **25 tests** on local Supabase after the merged Sprint 3 migrations.
The export follow-up (#318) passed **38 tests**, including three state-write failure tests.

The browser checks use the real app with local Supabase and local SMTP. The offline check
uses the real browser cache and MapLibre with controlled tile responses. These are local
results, not production acceptance. See [release checks](sprint-3-release.md) for the evidence,
steps, open checks and final CI status. A covered AT does not make the full suite green.

## How to read this page

- There is one table for each feature area. Each row is one AT of one user story.
- **Test file(s)** are relative to `webapp/`. Jest tests are in `__tests__/`. Cypress (E2E) tests
  are in `cypress/e2e/`. A number after a colon is the line of the test, for example
  `ProfilePage.test.tsx:243`.
- **PR** is the pull request that added or changed the tests and the code of a Sprint 3 AT. "Not
  merged" means the PR of the story is not in `sprint-3`. Rows from earlier sprints show `-`.
- **S/F** tells which scenarios the tests check:

| Value | Meaning |
|---|---|
| S+F | The tests check the success scenario and a failure scenario (error, refusal or invalid input). |
| S | The tests check the success scenario only. |
| F | The tests check a failure scenario only. |
| - | There is no test. |

- **Labelled in test name** tells if the name of a test carries the story and AT number, for
  example `(5.0.4 AT2)` or `US 2.0.6 AT3:`. **Yes** means that a test of the row has the story ID
  and the AT number of the row in its name. **No** means that no test name of the row has that
  label.
- **Status** comes from a full local run of `npm run test:ci` (Jest with coverage) on `main` at
  `ceb5188`: 111 suites passed and 1 skipped, 1524 tests passed, 5 skipped, 0 failed (the
  database rule suite skips without a local Supabase). These are local results.
  GitHub Actions has not run since October 10, because the account's Actions payments failed. CI
  did not run on the commits from `e39cc8f` (PR #243) onward, on any fix branch, or on #284 and
  #285, which were merged with an admin bypass. The last CI run that ran the tests is
  [run 38092728953](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/actions/runs/38092728953)
  on `2cf69c6` (October 10: 96 suites, 1235 tests, all passed). When CI runs again, take the
  status from the CI run of `main` and remove this note.
- **Cypress.** `.github/workflows/e2e.yaml` runs seven specs against a local Supabase on PRs into
  `main` and `release`, and by hand: `logout`, `profile`, `authorized_check`, `add_site`,
  `archive_report`, `deactivate_site` and `map_filter`. Actions has not run it yet. The Cypress
  results on this page come from the same seven specs run the same way on a local machine
  (local run, October 12, 2026, commit `23aada5`: 7 specs, 29 tests, 29 passed).
- **Database rules.** `__tests__/db/rls.test.ts` (`npm run test:db`) checks the row level security
  policies and function grants against a local Supabase. Local run, October 12, 2026: 5 tests, 5
  passed. CI does not run it.

| Status | Meaning |
|---|---|
| Pass | Tests for the AT exist and passed. |
| Pass (partial) | Tests passed, but they check only part of the AT. The note below the table tells which part is missing. |
| Fail | A test for the AT failed. |
| Not run | Only a Cypress or database test checks the AT, and no recorded run of that test exists, so the result is not verified. |
| Not yet tested | No test checks the AT. |

## How to update this page

1. When you add or change a test for an AT, add or change its row here in the same PR.
2. Put the story and AT number in the test name, for example `'shows the steward with a link to their profile (3.0.2 AT3)'`.
3. Use the Fall 2026 story ID. Inherited test names use Winter 2026 IDs with a `W26` prefix (see
   [Inherited story IDs in test names](#inherited-story-ids-in-test-names)).
4. Take the status from the CI run of the merged commit. Do not mark an AT as Pass from a local
   run only. The October 11 status is an exception, because Actions could not run (see above).
5. When a sprint starts, add rows for its stories with the status Not yet tested.

## 1 - People Management

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Labelled in test name | Status | PR |
|---|---|---|---|---|---|---|---|---|
| US 1.0.1 | AT1 | A profile shows name, skills, focus area, contact info and inspection count | `__tests__/app/api/profile.test.ts:274`, `__tests__/components/ProfilePage.test.tsx:106,116,134,140`, `__tests__/lib/socials.test.ts` | API, Component, Unit | S+F | Yes | Pass | - |
| US 1.0.1 | AT2 | Open my own profile from the main menu | `__tests__/components/HeaderDropdown.test.tsx:94` | Component | S | Yes | Pass | - |
| US 1.0.1 | AT3 | Open a profile from an inspection on a site page | `__tests__/components/SubmittedBy.test.tsx:11`, `__tests__/lib/steward-actions.test.ts:183` | Component, Unit | S+F | Yes | Pass | - |
| US 1.0.1 | AT4 | Go back to the previous page from a profile | `__tests__/components/ProfilePage.test.tsx:69` | Component | S | Yes | Pass | - |
| US 1.0.1 | AT5 | A reload shows the latest stored values | `__tests__/components/ProfilePage.test.tsx:308` | Component | S | Yes | Pass | - |
| US 1.0.2 | AT1 | A user edits only their own information | `__tests__/app/api/profile.test.ts:326,393`, `__tests__/components/ProfilePage.test.tsx:252`, `__tests__/db/rls.test.ts:56` | API, Component, DB | S+F | Yes | Pass | - |
| US 1.0.2 | AT2 | A request to edit another user's information fails | `__tests__/app/api/profile.test.ts:307`, `cypress/e2e/profile.cy.ts:91`, `__tests__/db/rls.test.ts:65` | API, E2E, DB | F | Yes | Pass | - |
| US 1.0.2 | AT3 | A blank name or email blocks Save and highlights the field | `__tests__/components/ProfilePage.test.tsx:227,239`, `__tests__/app/api/profile.test.ts:361,401`, `__tests__/lib/socials.test.ts:21` | Component, API, Unit | F | Yes | Pass | - |
| US 1.0.2 | AT4 | After Save, the page shows the new values | `__tests__/components/ProfilePage.test.tsx:273,290,308`, `__tests__/app/api/profile.test.ts:345,410` | Component, API | S+F | Yes | Pass | - |
| US 1.0.2 | AT5 | Saved values stay after sign-out and sign-in | `cypress/e2e/profile.cy.ts:64` | E2E | S | Yes | Pass | - |
| US 1.0.2 | AT6 | Added skills and focus areas show on the profile after Save | `__tests__/components/ProfilePage.test.tsx:308`, `__tests__/app/api/profile.test.ts:419` | Component, API | S+F | Yes | Pass | - |
| US 1.0.3 | AT1 | The profile lists previous inspections with site and date | `__tests__/components/ProfilePage.test.tsx:117,191` | Component | S | No | Pass (partial) | [#298](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/298) |
| US 1.0.3 | AT2 | A past inspection opens with its submitted information | `__tests__/components/ProfilePage.test.tsx:108` | Component | S | Yes | Pass | [#298](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/298) |
| US 1.0.3 | AT3 | Hidden answers are not shown to other stewards | `__tests__/components/queries.exportPaging.test.ts:182,208`, `__tests__/app/api/site-images.test.ts:157,193`, `__tests__/pages/SiteDetails.test.tsx:564` | Unit, API, Page | S+F | Yes | Pass | [#298](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/298) |
| US 1.0.4 | AT1 | The aggregates match the user's data (SIR count, activities) | `__tests__/app/api/profile.test.ts` (contribution statistics), `__tests__/components/ProfilePage.test.tsx` | API, Component | S+F | Yes | Pass | [#315](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/315) |
| US 1.0.4 | AT2 | A new report adds 1 to the SIR count | - | - | - | No | Not yet tested | [#315](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/315) |
| US 1.0.6 | AT1 | Skills and focus areas use dropdowns with an "Other" option | `__tests__/components/TagPicker.test.tsx:13,30` | Component | S+F | Yes | Pass | [#308](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/308) |
| US 1.0.6 | AT2 | Typing a skill or focus area suggests similar existing values | `__tests__/components/TagPicker.test.tsx:41`, `__tests__/lib/profileTags.test.ts` | Component, Unit | S+F | Yes | Pass | [#308](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/308) |
| US 1.0.6 | AT3 | An edited skill or focus area shows on the profile after Save | `__tests__/components/ProfilePage.test.tsx:372`, `__tests__/components/TagPicker.test.tsx:94` | Component | S | Yes | Pass | [#308](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/308) |

Notes:

- 1.0.1 AT1: `profile.test.ts` checks the GET response (contact details, 401, 404, 503).
  `ProfilePage.test.tsx` checks that the page shows the details, skills, focus areas and the
  inspection count.
- 1.0.1 AT5 and 1.0.2 AT4: 'shows the saved values again after a reload' saves, unmounts the page,
  mounts it again and checks that it reads the profile from the server. The server response is
  mocked.
- 1.0.2 AT1: PATCH `/api/profile` takes no target id. It writes only the row of the signed-in person
  ('saves contact details for the signed-in person only'). A signed-out request gets 401.
- 1.0.2 AT2: 'writes with the signed-in client so the database applies the rules' depends on row
  level security (RLS) on `people`. The test mocks the database, so it does not prove the refusal.
  `rls.test.ts:65` signs in as a steward against a local Supabase and checks that the update of
  another person's row changes nothing. The Cypress test 'US 1.0.2 AT2: does not let one user
  change another user's profile' checks it end to end. Both passed in the October 12 local run.
- 1.0.2 AT3: the tests check a blank or spaces-only name, a blank contact email (in the page and on
  the server) and the length limit. The red border comes from the `user-invalid:` style, and no
  test checks the style.
- 1.0.2 AT6: 'shows the saved values again after a reload' adds a skill and a focus area, checks
  that the save sends both, and checks that both show after the reload. `profile.test.ts:419`
  rejects more than twelve skills.
- 1.0.3 AT1: `ProfilePage.test.tsx:117,191` check that the history is listed and paged. No test
  checks the site name and the date of each row.
- 1.0.4: PR #315 is merged. The aggregate tests cover AT1; the combined local run includes the corrected query-count assertion. AT2 still needs explicit count-plus-one evidence.
- 1.0.6 and 3.0.3 merged through #308 and #309. US 3.0.4 was removed on October 26; #310 was closed without merge.

## 2 - Place Management

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Labelled in test name | Status | PR |
|---|---|---|---|---|---|---|---|---|
| US 2.0.2 | AT1 | An Admin selects the boundary of a new site | `__tests__/components/AddSiteModal.test.tsx:109`, `__tests__/components/ProtectedAreaField.test.tsx:24,38`, `__tests__/components/queries.createSite.test.ts:70,84,89,97`, `cypress/e2e/add_site.cy.ts:54` | Component, Unit, E2E | S+F | Yes | Pass | - |
| US 2.0.2 | AT2 | A possible-duplicate warning shows before save | `__tests__/components/AddSiteModal.test.tsx:70,82`, `__tests__/components/queries.createSite.test.ts:107,115,123,135,143`, `cypress/e2e/add_site.cy.ts:75` | Component, Unit, E2E | S+F | Yes | Pass | - |
| US 2.0.2 | AT3 | An empty required field blocks creation and is highlighted | `__tests__/components/AddSiteModal.test.tsx:60,97`, `__tests__/components/queries.createSite.test.ts:65`, `cypress/e2e/add_site.cy.ts:89` | Component, Unit, E2E | S+F | Yes | Pass | - |
| US 2.0.2 | AT4 | A Steward's create request is refused and no site is made | `__tests__/components/queries.createSite.test.ts:29,36,43`, `cypress/e2e/add_site.cy.ts:100` | Unit, E2E | F | Yes | Pass | - |
| US 2.0.2 | AT5 | A new site appears in the search results | `__tests__/pages/AdminSites.test.tsx:174,186`, `cypress/e2e/add_site.cy.ts:127` | Page, E2E | S+F | Yes | Pass | - |
| US 2.0.2 | AT6 | Boundary suggestions from the Alberta government KML | `__tests__/components/AddSiteModal.test.tsx:126,138`, `__tests__/components/queries.createSite.test.ts:148,155`, `__tests__/lib/availableProtectedAreas.test.ts:9`, `cypress/e2e/add_site.cy.ts:141` | Component, Unit, E2E | S+F | Yes | Pass | - |
| US 2.0.3 | AT1 | Toggle a site between active and inactive | `__tests__/components/queries.disable.test.ts:90,101,118`, `__tests__/pages/AdminSites.disable.test.tsx:41,55,87,108,211`, `cypress/e2e/deactivate_site.cy.ts:72` | Unit, Component, E2E | S+F | Yes | Pass | - |
| US 2.0.3 | AT2 | An inactive site is not in site pickers or search results | `__tests__/components/queries.sitesOnline.test.ts:72`, `__tests__/components/queries.report-writes.test.ts:109,116`, `__tests__/components/queries.boundaries.test.ts:115`, `cypress/e2e/deactivate_site.cy.ts:83` | Unit, E2E | S+F | Yes | Pass | - |
| US 2.0.3 | AT3 | A reactivated site appears again | `__tests__/pages/AdminSites.disable.test.tsx:143,186`, `cypress/e2e/deactivate_site.cy.ts:89,97` | Component, E2E | S+F | Yes | Pass | - |
| US 2.0.3 | AT4 | The inspections of an inactive site can still be viewed | `__tests__/pages/AdminSiteDetails.test.tsx:1117`, `__tests__/components/queries.admin.test.ts:67`, `cypress/e2e/deactivate_site.cy.ts:109` | Page, Unit, E2E | S+F | Yes | Pass (partial) | - |
| US 2.0.3 | AT5 | A new site is active by default | `__tests__/components/queries.createSite.test.ts:50`, `cypress/e2e/deactivate_site.cy.ts:118` | Unit, E2E | S | Yes | Pass | - |
| US 2.0.4 | AT1 | The Admin confirms before a site is deleted | `__tests__/pages/AdminSites.archive.test.tsx:152,206,218,267`, `__tests__/pages/AdminSites.archived.test.tsx:161,202,231` | Page | S+F | Yes | Pass | - |
| US 2.0.4 | AT2 | The confirmation names how many records are affected | `__tests__/pages/AdminSites.archive.test.tsx:152,167,189,252`, `__tests__/pages/AdminSites.archived.test.tsx:180`, `__tests__/components/queries.archive-site.test.ts:80` | Page, Unit | S+F | Yes | Pass | - |
| US 2.0.4 | AT3 | The agreed cascade applies to inspections, images and visit counts | `__tests__/components/queries.archive-site.test.ts:144,222`, `__tests__/pages/Reports.test.tsx:105,126`, `__tests__/pages/SiteDetails.test.tsx:160` | Unit, Page | S | Yes | Pass (partial) | - |
| US 2.0.4 | AT4 | A failed cascade rejects the delete and changes nothing | `__tests__/components/queries.archive-site.test.ts:163,241`, `__tests__/pages/AdminSites.archive.test.tsx:235`, `__tests__/pages/AdminSites.archived.test.tsx:214` | Unit, Page | F | Yes | Pass | - |
| US 2.0.5 | AT1 | An Admin enters edit mode on a site page | `__tests__/pages/SiteDetails.test.tsx:207`, `__tests__/components/SitePageEditor.test.tsx:27`, `__tests__/lib/availableProtectedAreas.test.ts:18` | Page, Component, Unit | S | Yes | Pass | - |
| US 2.0.5 | AT2 | A non-admin cannot enter edit mode | `__tests__/pages/SiteDetails.test.tsx:215`, `__tests__/components/queries.sitePageFields.test.ts:35` | Page, Unit | F | Yes | Pass | - |
| US 2.0.5 | AT3 | Edit mode shows which fields are included or excluded | `__tests__/components/SitePageEditor.test.tsx:44` | Component | S | Yes | Pass | - |
| US 2.0.5 | AT4 | After save, the site page shows new fields and hides excluded ones | `__tests__/pages/SiteDetails.test.tsx:222,239`, `__tests__/components/SitePageEditor.test.tsx:52,68`, `__tests__/components/queries.sitePageFields.test.ts:44,102`, `__tests__/components/SiteLinks.test.tsx:39` | Page, Component, Unit | S+F | Yes | Pass | - |
| US 2.0.6 | AT1 | Filters keep only matching sites on the map | `__tests__/lib/boundaryFilters.test.ts:85,98,109,120,132,154,160`, `__tests__/components/MapAreaFilters.test.tsx:23`, `__tests__/components/queries.boundaries.test.ts:77,105`, `__tests__/pages/Sites.test.tsx:678`, `cypress/e2e/map_filter.cy.ts:53` | Unit, Component, Page, E2E | S+F | Yes | Pass | - |
| US 2.0.6 | AT2 | Clearing a filter shows all active sites again | `__tests__/pages/Sites.test.tsx:739`, `__tests__/lib/boundaryFilters.test.ts:94,143,174,218`, `cypress/e2e/map_filter.cy.ts:66` | Page, Unit, E2E | S | Yes | Pass | - |
| US 2.0.6 | AT3 | Selecting a search match centres the map on the site | `__tests__/components/SiteMap.test.tsx:442,455`, `__tests__/pages/Sites.test.tsx:775`, `__tests__/lib/boundaries.test.ts:267`, `cypress/e2e/map_filter.cy.ts:76,92` | Component, Page, Unit, E2E | S+F | Yes | Pass | - |
| US 2.0.10 | AT1 | A short link to the SAPAA website on the site page | `__tests__/components/SiteLinks.test.tsx:6,10,23`, `__tests__/components/queries.sitePageFields.test.ts:122,133` | Component, Unit | S+F | Yes | Pass | - |
| US 2.0.10 | AT2 | A short link to iNaturalist on the site page | `__tests__/components/SiteLinks.test.tsx:23` | Component | S | Yes | Pass | - |
| US 2.0.10 | AT3 | A link opens in a new window | `__tests__/components/SiteLinks.test.tsx:30` | Component | S | Yes | Pass | - |
| US 2.0.1 | AT1 | Every active Site is drawn with its boundary | `__tests__/components/SiteMap.test.tsx:1104,1110` | Component | S | No | Pass (partial) | [#301](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/301) |
| US 2.0.1 | AT2 | A GPX track is drawn in a style different from the boundary | `__tests__/lib/gpxTrack.test.ts:78`, `__tests__/components/SiteMap.test.tsx:1619` | Unit, Component | S | Yes | Pass | [#301](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/301) |
| US 2.0.1 | AT3 | The Site page links to its location on the map | `__tests__/pages/SiteDetails.test.tsx:300` | Page | S | Yes | Pass | [#301](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/301) |
| US 2.0.1 | AT4 | Only the newly selected Site is highlighted | `__tests__/components/SiteMap.test.tsx:1541,1550,1565`, `__tests__/pages/Sites.test.tsx:960` | Component, Page | S | Yes | Pass | [#301](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/301) |
| US 2.0.8 | AT1 | Selecting a Site opens its detail view | `__tests__/components/SiteMap.test.tsx:631,647` | Component | S | Yes | Pass | [#297](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/297) |
| US 2.0.8 | AT2 | The detail view shows the same name, county and last inspection date as the Site page | `__tests__/components/queries.boundaries.test.ts:150,171,191,201`, `__tests__/lib/boundaries.test.ts:230,239`, `__tests__/components/SiteMap.test.tsx:655,701,718` | Unit, Component | S+F | Yes | Pass | [#297](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/297) |
| US 2.0.8 | AT3 | "View SIRs" goes to the past SIRs | `__tests__/components/SiteMap.test.tsx:739,755` | Component | S | Yes | Pass | [#297](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/297) |
| US 2.0.9 | AT1 | A valid .gpx file is saved and linked to the Site and the account | `__tests__/lib/gpx-track-actions.test.ts:72,90`, `__tests__/components/GpxTrackUpload.test.tsx:68` | Unit, Component | S | Yes | Pass | [#296](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/296) |
| US 2.0.9 | AT2 | A file without the .gpx extension shows "only GPX files" | `__tests__/lib/gpx-track-actions.test.ts:122`, `__tests__/components/GpxTrackUpload.test.tsx:99` | Unit, Component | F | Yes | Pass | [#296](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/296) |
| US 2.0.9 | AT3 | An invalid .gpx file or one with no track points is refused and nothing is saved | `__tests__/lib/gpx-track-actions.test.ts:235,246`, `__tests__/components/GpxTrackUpload.test.tsx:140` | Unit, Component | F | Yes | Pass | [#296](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/296) |
| US 2.0.9 | AT4 | A stored track reads back with the same track points | `__tests__/components/queries.gpxTracks.test.ts:109`, `__tests__/lib/gpxTrack.test.ts:33`, `__tests__/components/GpxTrackUpload.test.tsx:166` | Unit, Component | S | Yes | Pass | [#296](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/296) |
| US 2.0.9 | AT5 | A file over the size limit is refused with a message that names the limit | `__tests__/lib/gpx-track-actions.test.ts:257`, `__tests__/components/GpxTrackUpload.test.tsx:111` | Unit, Component | F | Yes | Pass | [#296](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/296) |
| US 2.0.9 | AT6 | Several files at once: each valid file is saved and each refused file is listed with its reason | `__tests__/lib/gpx-track-actions.test.ts:289`, `__tests__/components/GpxTrackUpload.test.tsx:123,140` | Unit, Component | S+F | Yes | Pass | [#296](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/296) |
| US 2.0.12 | AT1 | An Admin enters the three scores and they are saved | `__tests__/lib/sitePriority.test.ts:18`, `__tests__/lib/site-priority-actions.test.ts:44`, `__tests__/components/SitePriority.test.tsx:48` | Unit, Component | S+F | Yes | Pass | [#307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307) |
| US 2.0.12 | AT2 | The Site page shows one to-visit priority calculated from the scores | `__tests__/lib/sitePriority.test.ts:7`, `__tests__/lib/site-priority-actions.test.ts:44`, `__tests__/components/SitePriority.test.tsx:48` | Unit, Component | S | Yes | Pass | [#307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307) |
| US 2.0.12 | AT3 | Two Sites with the same scores show the same priority | `__tests__/lib/sitePriority.test.ts:12`, `__tests__/lib/site-priority-actions.test.ts:137` | Unit | S | Yes | Pass | [#307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307) |
| US 2.0.12 | AT4 | A Steward sees the priority and the three scores | `__tests__/lib/site-priority-actions.test.ts:110`, `__tests__/components/SitePriority.test.tsx:21` | Unit, Component | S | Yes | Pass | [#307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307) |
| US 2.0.12 | AT5 | The server refuses a Steward's change and the scores stay the same | `__tests__/lib/site-priority-actions.test.ts:62`, `__tests__/components/SitePriority.test.tsx:73` | Unit, Component | F | Yes | Pass | [#307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307) |
| US 2.0.13 | AT1 | An Admin sees a reminder when the points are more than a year old | `__tests__/lib/sitePriority.test.ts:38`, `__tests__/lib/site-priority-actions.test.ts:125`, `__tests__/components/SitePriority.test.tsx:100` | Unit, Component | S | Yes | Pass | [#307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307) |
| US 2.0.13 | AT2 | No reminder when the points are less than a year old | `__tests__/lib/sitePriority.test.ts:42`, `__tests__/lib/site-priority-actions.test.ts:131`, `__tests__/components/SitePriority.test.tsx:106` | Unit, Component | S | Yes | Pass | [#307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307) |
| US 2.0.13 | AT3 | Saving new points removes the reminder and stores the new date | `__tests__/lib/site-priority-actions.test.ts:44`, `__tests__/components/SitePriority.test.tsx:113` | Unit, Component | S | Yes | Pass | [#307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307) |
| US 2.0.13 | AT4 | A Steward does not see the Admin reminder | `__tests__/lib/site-priority-actions.test.ts:110`, `__tests__/components/SitePriority.test.tsx:106` | Unit, Component | F | Yes | Pass | [#307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307) |
| US 2.0.14 | AT1 | Each boundary uses the color saved by an Admin for its site or site type (Sprint 3) | `__tests__/components/SiteMap.test.tsx:324,849,882,931`, `__tests__/lib/boundaries.test.ts:325,331,349,364`, `__tests__/components/queries.boundaryColors.test.ts:38,52,66,76`, `__tests__/components/queries.boundaries.test.ts:104,113` | Component, Unit | S+F | No | Pass | [#303](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/303) |

Notes:

- 2.0.2 AT1: the site is linked to one protected area (its boundary). `ProtectedAreaField.test.tsx`
  checks the choice, `availableProtectedAreas.test.ts` hides an area that another site uses, and
  `queries.createSite.test.ts` checks the id and the messages for a missing or taken area.
- 2.0.2 AT5: `AdminSites.test.tsx` adds a site, searches for it on the admin sites list and finds
  it. A refused create adds nothing to the results. The server responses are mocked.
- 2.0.3 AT2: `getSitesOnline` (the sites list and the site pickers) reads only active, unarchived
  sites (`queries.sitesOnline.test.ts`). `getCurrentSiteId` finds only an active, unarchived site, `addSiteInspectionReport`
  refuses a deactivated site and inserts nothing ([PR #242](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/242)), and the map
  boundaries leave out an inactive site for a Steward. The Cypress test checks the user sites page.
- 2.0.3 AT3: when the server refuses or fails the reactivation, the site keeps its Inactive badge,
  the edit dialog stays open and the error shows in an alert (`AdminSites.disable.test.tsx:186`).
- 2.0.3 AT4: the tests cover the admin view only. `deactivate_site.cy.ts:109` deactivates a site
  and opens one of its reports as an admin. No test opens the reports of an inactive site as a
  Steward.
- 2.0.4: the story is built as two steps, archive (hide, with restore) and delete for good from the
  archived sites page ([PR #160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160)). The tests mock the database functions.
  `queries.archive-site.test.ts` also checks that a Steward, an unapproved admin and a signed-out
  caller are refused before any RPC runs.
- 2.0.4 AT3: the tests check the counts that the function returns, that the site leaves the list,
  and that reports of an archived or deleted site show as plain text. The cascade runs in a
  database function. No test runs it, so the status is partial.
- 2.0.5 AT1 and AT2: `SiteDetails.test.tsx` renders the site page: an approved Admin sees the edit
  button and opens edit mode, and a Steward sees no edit button. `queries.sitePageFields.test.ts`
  shows that `updateSitePageFields` refuses a Steward on the server. `AdminSites.edit.test.tsx` and
  `queries.edit.test.ts` now carry `(2.0.5 AT1)` and `(2.0.5 AT2)` labels
  ([PR #243](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/243)), but they test the name, county and protected area modal on the admin
  sites list (inherited from Winter 2026 US 4.0.3), not edit mode on the site page. They are not
  listed as evidence.
- 2.0.5 AT4: `SiteDetails.test.tsx` saves in edit mode and checks that the site page shows the new
  link and drops the hidden one. When the save is refused, the old links stay. The server actions
  are mocked.
- 2.0.6 AT2: `Sites.test.tsx` clears a county filter on the rendered map view and checks that every
  active area shows again. `boundaryFilters.test.ts` checks the filter state.
- 2.0.6 AT3: the search box lists the matching protected areas, and picking one calls `fitBounds`
  on that area ([PR #241](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241)). `SiteMap.test.tsx` mocks MapLibre and checks the
  `fitBounds` call.
- 2.0.6: `kmlImport.test.ts` and `kml-import-actions.test.ts` test the import of the KML data.
  `boundaries.test.ts` and `queries.boundaries.test.ts` test the boundary data that the map draws.
- 2.0.10 AT1: `queries.sitePageFields.test.ts:122` gives the default links to a site with no saved
  links, and `:133` gives no link when the admin cleared or hid it.
- 2.0.1 AT1: `SiteMap.test.tsx:1104,1110` check the boundary layer. No test checks that an inactive
  site is not drawn.
- 2.0.12 and 2.0.13: the tests mock the server actions and the database. No database test checks
  that the server refuses a Steward's change.

## 3 - Admin Persona

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Labelled in test name | Status | PR |
|---|---|---|---|---|---|---|---|---|
| US 3.0.2 | AT1 | An Admin searches for a steward to assign | `__tests__/components/SiteSteward.test.tsx:39,70`, `__tests__/lib/steward-actions.test.ts:102,130,139`, `__tests__/pages/SiteDetails.test.tsx:187,195` | Component, Unit, Page | S+F | Yes | Pass | - |
| US 3.0.2 | AT2 | An Admin assigns a new steward and replaces the old one | `__tests__/components/SiteSteward.test.tsx:39,82`, `__tests__/lib/steward-actions.test.ts:75` | Component, Unit | S+F | Yes | Pass | - |
| US 3.0.2 | AT3 | The assignment shows on the site page and on the steward's profile | `__tests__/components/SiteSteward.test.tsx:15,25`, `__tests__/lib/steward-actions.test.ts:152,166`, `__tests__/components/ProfilePage.test.tsx:41,60` | Component, Unit | S | Yes | Pass | - |
| US 3.0.2 | AT4 | A user who cannot assign is refused and nothing is created | `__tests__/lib/steward-actions.test.ts:47,61`, `__tests__/components/SiteSteward.test.tsx:55` | Unit, Component | F | Yes | Pass | - |
| US 3.0.3 | AT1 | An export puts the files in a ZIP file | `__tests__/lib/processExportJob.test.ts` (`buildExportZip`), `__tests__/components/ExportAllFilesButton.test.tsx` | Unit, Component | S+F | Yes | Pass | [#309](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/309) |
| US 3.0.3 | AT2 | The export has all images, at minimum | `__tests__/lib/processExportJob.test.ts` (`collectExportEntries`, 1000-row paging, missing objects) | Unit | S+F | Yes | Pass | [#309](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/309) |

Notes:

- 3.0.2 has no E2E test. The unit and component tests mock the server actions and the database.

## 4 - General Features

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Labelled in test name | Status | PR |
|---|---|---|---|---|---|---|---|---|
| US 4.0.6 | AT1 | A SIR with an empty Identifier submits | `__tests__/pages/FormSubmissionPrevention.test.tsx:370,469`, `__tests__/pages/UserEditSiteInspectionForm.test.tsx:747`, `__tests__/app/api/s3-presign.test.ts:477` | Page, API | S+F | Yes | Pass | - |
| US 4.0.6 | AT2 | No "required" note beside the Identifier field | `__tests__/pages/FormSubmissionPrevention.test.tsx:506` | Page | S | Yes | Pass | - |
| US 4.0.2 | AT1 | Download a map area for offline use and see its download status | `__tests__/components/OfflineSavePanel.test.tsx:218,257,269,291` | Component | S+F | No | Pass | [#293](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/293), [#299](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/299) |
| US 4.0.2 | AT2 | Offline, downloaded tiles render and the map pans and zooms inside the area | [Local browser cache and zoom check](sprint-3-release.md#acceptance-evidence), `__tests__/components/SiteMap.test.tsx:1225` | Browser, Component | S | No | Pass | [#293](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/293) |
| US 4.0.2 | AT3 | Offline, missing tiles outside the area are indicated | [Local missing-tile check](sprint-3-release.md#acceptance-evidence), `__tests__/components/SiteMap.test.tsx` (offline badge) | Browser, Component | S+F | No | Pass | [#293](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/293) |
| US 4.0.2 | AT4 | Online, the map uses live tiles and not the cache | [Local reconnect check](sprint-3-release.md#acceptance-evidence), `__tests__/components/SiteMap.test.tsx` (4.0.2 AT4) | Browser, Component | S | Yes | Pass | [#293](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/293) |
| US 4.0.4 | AT1 | The author opens a past SIR and enters edit mode | `__tests__/pages/UserEditSiteInspectionForm.test.tsx:616,641` | Page | S | No | Pass | [#300](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/300) |
| US 4.0.4 | AT2 | Another steward cannot enter edit mode or change the SIR | `__tests__/components/queries.report-writes.test.ts:157,167`, `__tests__/pages/UserEditSiteInspectionForm.test.tsx:623`; [local browser check](sprint-3-release.md#acceptance-evidence) | Unit, Page, Browser | F | No | Pass | [#300](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/300) |
| US 4.0.4 | AT3 | Clearing a required answer blocks submit and lists the missing questions | `__tests__/components/queries.report-writes.test.ts:200,212`, `__tests__/pages/UserEditSiteInspectionForm.test.tsx:723` | Unit, Page | S+F | No | Pass | [#300](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/300) |
| US 4.0.4 | AT4 | Saved edits show everywhere the report is rendered | `__tests__/pages/UserEditSiteInspectionForm.test.tsx:825,842` | Page | S | No | Pass (partial) | [#298](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/298), [#300](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/300) |
Notes:

- 4.0.6 AT1: 'submits a report whose image has an empty Identifier' saves `identifier: null`. The
  presign route returns an upload URL when the identifier is empty or null.
- 4.0.2 AT2 to AT4: the local browser run saved 96 tiles, used the real cache while offline,
  showed missing tiles after panning outside the area, and returned to live requests on reconnect.
- 4.0.4 AT2 and AT3: the server tests check ownership, approval and the names of missing required
  questions. The local browser run also checked denied edit mode and a blocked save after a
  required answer was cleared. AT4 stays partial because every export and summary view was not
  checked after the same edit.

## 5 - Access and Accounts

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Labelled in test name | Status | PR |
|---|---|---|---|---|---|---|---|---|
| US 5.0.4 | AT1 | After sign-out, opening the app again shows the sign-in page | `__tests__/middleware.test.ts:54`, `__tests__/components/ProtectedRoutes.test.tsx:56,185`, `__tests__/components/HeaderDropdown.test.tsx:70,106`, `__tests__/components/AdminNavBar.test.tsx:51,64`, `__tests__/components/auth.test.ts:151,157,164`, `cypress/e2e/logout.cy.ts:46,58` | Unit, Component, E2E | S+F | Yes | Pass | - |
| US 5.0.4 | AT2 | After sign-out, the Back button shows no signed-in page | `__tests__/components/SignedOutGuard.test.tsx:10`, `cypress/e2e/logout.cy.ts:79` | Component, E2E | S | Yes | Pass | - |
| US 5.0.4 | AT3 | Sign out from any page | `__tests__/components/TermsContent.test.tsx:15`, `__tests__/components/ProfilePage.test.tsx:342`, `__tests__/components/HeaderDropdown.test.tsx:52,58`, `__tests__/components/AdminNavBar.test.tsx:31`, `__tests__/components/ProtectedRoutes.test.tsx:170`, `cypress/e2e/logout.cy.ts:98` | Component, E2E | S | Yes | Pass | - |
| US 5.0.2 | AT1 | Select "Forgot password", enter an email, then an email is sent | [Local email, code and password check](sprint-3-release.md#acceptance-evidence); `__tests__/pages/ResetPassword.test.tsx`, `__tests__/app/password-reset-verify-code.test.ts` | Browser, API, Page | S+F | Yes | Pass | [#295](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/295) |
| US 5.0.2 | AT2 | Verify a code before setting a new password | [Local email, code and password check](sprint-3-release.md#acceptance-evidence); `__tests__/pages/ResetPassword.test.tsx`, `__tests__/app/password-reset-verify-code.test.ts` | Browser, API, Page | S+F | Yes | Pass | [#295](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/295) |
| US 5.0.2 | AT3 | Sign in with the new password and not with the old one | [Local email, code and password check](sprint-3-release.md#acceptance-evidence); `__tests__/pages/ResetPassword.test.tsx`, `__tests__/app/password-reset-verify-code.test.ts` | Browser, API, Page | S+F | Yes | Pass | [#295](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/295) |
| US 5.0.2 | AT4 | Reset the password without admin intervention | [Local email, code and password check](sprint-3-release.md#acceptance-evidence); `__tests__/pages/ResetPassword.test.tsx`, `__tests__/app/password-reset-verify-code.test.ts` | Browser, API, Page | S+F | Yes | Pass | [#295](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/295) |

Notes:

- 5.0.4 AT1: the middleware sends a signed-out user to `/login` on the server, and
  `ProtectedRoute` does the same in the browser. `auth.test.ts` checks a logout and a failed
  logout. No Jest test signs out and then opens the app again. The Cypress tests
  `logout.cy.ts:46,58` do, and they passed in the October 12 local run. Failure cases: when
  sign-out fails, `useSignOut` keeps the user on the page and shows `Sign-out failed. Check your
  connection and try again.` (`HeaderDropdown.test.tsx:106`, `AdminNavBar.test.tsx:64`,
  `ProtectedRoutes.test.tsx:185`). `auth.test.ts:157,164` check that `logout()` returns the error
  instead of success.
- 5.0.4 AT2: `SignedOutGuard.test.tsx` ([PR #158](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/158)) sends a signed-out user to `/login` when the
  Back button restores a cached page, and does nothing on public pages. The test fires the page
  event and does not press the real Back button.
- 5.0.4 AT3: the tests cover the user menu (`UserNavBar` in `HeaderDropdown.tsx`), the admin menu
  (`AdminNavBar`), the profile page, the terms page ([PR #238](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238)) and the
  approval-pending screen. `logout.cy.ts:98` signs out from a page other than the sites list. `/api-docs` is the Swagger reference for developers and is exempt, as the
  comment in `webapp/app/api-docs/page.tsx` says. No test visits every page.

Other access tests. These tests check sign-in, sign-up, approval and the server gates. They are not
evidence for an AT of 5.0.2 or 5.0.4. No current Fall 2026 story covers them: the security stories
were removed on September 25, 2026 (see [Project Management](project-management.md#sprint-2)).

| Test file | What it checks | Story in the test name |
|---|---|---|
| `__tests__/pages/Login.test.tsx` | Sign-in form, errors, OAuth errors | None |
| `__tests__/pages/Signup.test.tsx` | Sign-up form, password checks, email confirmation | None |
| `__tests__/components/UserApprovalWorkflow.test.tsx` | Admin approves, rejects and revokes a user | None (inherited, Winter 2026 US 5.0.1) |
| `__tests__/middleware.test.ts:53` | Approval gate on pages, API routes and server actions ([PR #240](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/240)) | `US 3.0.8, #5`: a removed story ([#5](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/5) is closed as not planned) |
| `__tests__/app/auth-callback.test.ts:43` | The OAuth callback accepts only a same-site `next` path ([PR #240](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/240)) | None |
| `__tests__/pages/AdminLayout.test.tsx:21` | Server check that the user is an approved admin for every page under `/admin` ([PR #240](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/240)) | None |
| `__tests__/cypress-credentials.test.ts:5` | No hard-coded logins in the Cypress specs | None |
| `__tests__/pages/Sites.test.tsx:173` | An unapproved user whose site load is refused sees "Awaiting Admin Approval" on `/sites`, not the load error | None |
| `cypress/e2e/authorized_check.cy.ts:12` | An unapproved user sees the awaiting-approval screen (passed in the October 12 local Cypress run) | `US 3.0.8, #5`: a removed story |
| `__tests__/db/rls.test.ts:73` | An unapproved user reads only their own `people` row, no `site_stewards` rows and no other socials | None |
| `__tests__/db/rls.test.ts:91` | A signed-in user cannot call `get_max_inspection_number` | None |
| `__tests__/db/rls.test.ts:99` | Anon cannot call `get_naturalness_distribution`, a signed-in user can | None |
| `__tests__/components/queries.report-writes.test.ts:301,344,372` | The read actions of [#251](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/251) refuse a signed-out and an unapproved caller. `getFormResponseById` refuses another user's report and an archived report, and answers the owner and an admin. `isSteward` checks only the signed-in user | None (`#251` in the suite name) |
| `__tests__/pages/UserEditSiteInspectionForm.test.tsx:627` | The edit-report page shows Access Denied when the server refuses the answers | None (`#251` in the test name) |
| `__tests__/lib/supabase-server.test.ts:18,25` | `createClient` writes refreshed session cookies, and does not throw when the response is already sent (the PDF job in `after()`) | None |

## 6 - Data and Places

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Labelled in test name | Status | PR |
|---|---|---|---|---|---|---|---|---|
| US 6.0.1 | AT1 | A Site with a boundary in the KML is linked to it, with the same longitude and latitude values | `__tests__/lib/kmlImport.test.ts:205,214,253`, `__tests__/lib/kml-import-actions.test.ts:144`, `__tests__/db/site-boundary-links.test.ts:102,135` | Unit, DB | S | No | Pass | [#294](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/294) |
| US 6.0.1 | AT2 | A Site read from the database has a boundary link or no link | `__tests__/db/site-boundary-links.test.ts:102,114,157` | DB | S+F | No | Pass | [#294](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/294) |
| US 6.0.1 | AT3 | Each Site is linked or is on the list of Sites with no boundary for an Admin | `__tests__/lib/kml-import-actions.test.ts:325,337`, `__tests__/components/KmlImportModal.test.tsx:41,59`, `__tests__/db/site-boundary-links.test.ts:114,125,148` | Unit, Component, DB | S+F | No | Pass | [#294](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/294), [#303](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/303) |
| US 6.0.1 | AT4 | The Unlinked filter shows only Sites with no boundary, and the Linked filter only Sites with one | `__tests__/lib/boundaryFilters.test.ts:228`, `__tests__/pages/AdminSites.test.tsx:107`, `__tests__/components/MapAreaFilters.test.tsx:36` | Unit, Page, Component | S | No | Pass | [#303](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/303) |
| US 6.0.1 | AT5 | The server refuses a Steward who calls the Admin import, and returns no list | `__tests__/lib/kml-import-actions.test.ts:116,128,137` | Unit | F | No | Pass | [#294](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/294) |

Notes:

- 6.0.1 uses the final wording of its 5 ATs. The geocoding AT was removed, because the team stopped
  using OpenCage. Some test names still say `US 6.0.1 AT3` for the Linked and Unlinked filter, which
  is AT4 now, so the Labelled column says No.
- 6.0.1 AT1, AT2 and AT3: `__tests__/db/site-boundary-links.test.ts` runs the real link function on a
  local Supabase (`npm run test:db -- --runInBand`). CI does not run it. It passed in the local run
  of October 26.

## 7 - Inspections and Media

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Labelled in test name | Status | PR |
|---|---|---|---|---|---|---|---|---|
| US 7.0.1 | AT1 | A Steward exports a PDF of their own SIR | `__tests__/app/api/pdf.test.ts:311`, `__tests__/components/SirPdfExportButton.test.tsx:32,41,84` | API, Component | S+F | Yes | Pass | - |
| US 7.0.1 | AT2 | A Steward's request for another person's SIR is refused | `__tests__/app/api/pdf.test.ts:333,346,372,384,395`, `__tests__/app/api/pdf-status.test.ts:69`, `__tests__/components/SirPdfExportButton.test.tsx:68` | API, Component | F | Yes | Pass | - |
| US 7.0.1 | AT3 | The PDF has the same answers and photos as the SIR page | `__tests__/components/SirPdfExportButton.test.tsx:41`, `__tests__/lib/pdfDataFetcher.test.ts:572,728`, `__tests__/lib/inspectionReport.test.tsx:53` | Component, Unit | S+F | Yes | Pass (partial) | - |
| US 7.0.5 | AT1 | A deleted image is gone from the site gallery and reports | `__tests__/pages/AdminGallery.test.tsx:200,215`, `__tests__/app/api/site-images-delete.test.ts:172,245`, `__tests__/components/DeleteImageButton.test.tsx:34,66` | Page, API, Component | S+F | Yes | Pass (partial) | - |
| US 7.0.5 | AT2 | Non-admins see no delete control and the server refuses them | `__tests__/app/api/site-images-delete.test.ts:98,113,128`, `__tests__/pages/SiteDetailsImageGallery.test.tsx:221` | API, Page | F | Yes | Pass | - |
| US 7.0.5 | AT3 | The S3 file of a deleted image is gone | `__tests__/app/api/site-images-delete.test.ts:172,190,245`, `__tests__/lib/s3Delete.test.ts:19` | API, Unit | S+F | Yes | Pass (partial) | - |
| US 7.0.5 | AT4 | A deactivated SIR keeps its S3 files | `__tests__/components/queries.archive-report.test.ts:154` | Unit | S | Yes | Pass | - |
| US 7.0.5 | AT5 | A rolled-back SIR submission removes its S3 files | `__tests__/components/queries.rollback.test.ts:59,82,94`, `__tests__/pages/FormSubmissionPrevention.test.tsx:304` | Unit, Page | S+F | Yes | Pass | - |
| US 7.0.6 | AT1 | An export of more than 50 SIRs has each selected SIR | `__tests__/app/api/pdf.test.ts:267`, `__tests__/lib/pdfDataFetcher.test.ts:449,463,487,497`, `__tests__/components/queries.exportPaging.test.ts:40,57,89,97` | API, Unit | S+F | Yes | Pass | - |
| US 7.0.6 | AT2 | Each exported SIR has the same answers as its page | `__tests__/components/queries.exportPaging.test.ts:105,152,167`, `__tests__/lib/pdfDataFetcher.test.ts:336,507` | Unit | S+F | Yes | Pass | - |
| US 7.0.6 | AT3 | A Steward's bulk export request is refused | `__tests__/app/api/pdf.test.ts:96,282,372,384` | API | F | Yes | Pass | - |
| US 7.0.6 | AT4 | A failed export leaves the stored SIRs unchanged | `__tests__/lib/processPdfJob.test.tsx:95` | Unit | F | Yes | Pass | - |
| US 7.0.7 | AT1 | Fields selected to hide are marked for the export | `__tests__/components/PdfExportModal.test.tsx:277,293,331` | Component | S | Yes | Pass | - |
| US 7.0.7 | AT2 | Hidden fields are absent and the other fields are present | `__tests__/lib/pdfDataFetcher.test.ts:299,358,367,375,670`, `__tests__/app/api/pdf.test.ts:541` | Unit, API | S+F | Yes | Pass | - |
| US 7.0.7 | AT3 | The stored answers stay after an export with hidden fields | `__tests__/lib/pdfDataFetcher.test.ts:314` | Unit | S | Yes | Pass | - |
| US 7.0.7 | AT4 | A Steward's export request with hidden fields is refused | `__tests__/app/api/pdf.test.ts:358` | API | F | Yes | Pass | - |
| US 7.0.7 | AT5 | With no hidden fields, the export has the full SIR | `__tests__/lib/pdfDataFetcher.test.ts:286,336` | Unit | S | Yes | Pass | - |
| US 7.0.8 | AT1 | The Admin confirms before a SIR is deleted | `__tests__/pages/ArchiveReportModal.test.tsx:31,53`, `__tests__/pages/AdminSiteDetails.test.tsx:1136`, `__tests__/pages/AdminReports.archived.test.tsx:93`, `__tests__/components/queries.archive-report.test.ts:88`, `cypress/e2e/archive_report.cy.ts:58` | Page, Unit, E2E | S+F | Yes | Pass | - |
| US 7.0.8 | AT2 | A deleted SIR is gone from the site and report lists | `__tests__/pages/AdminSiteDetails.test.tsx:1136,1158`, `__tests__/components/queries.reports.test.ts:93`, `__tests__/components/queries.archive-report.test.ts:119,130`, `cypress/e2e/archive_report.cy.ts:71` | Page, Unit, E2E | S+F | Yes | Pass | - |
| US 7.0.8 | AT3 | The images of a deleted SIR are no longer shown | `__tests__/components/queries.archive-report.test.ts:139,146,176`, `__tests__/app/api/gallery.test.ts:129`, `__tests__/app/api/site-images.test.ts:87`, `__tests__/app/api/sites-siteId-gallery.test.ts:102`, `__tests__/app/api/user-gallery-sir-upload.test.ts:72`, `cypress/e2e/archive_report.cy.ts:96` | Unit, API, E2E | S+F | Yes | Pass | - |
| US 7.0.8 | AT4 | A Steward's delete request is refused and the SIR stays | `__tests__/components/queries.archive-report.test.ts:60`, `__tests__/components/queries.rollback.test.ts:108,119,135`, `cypress/e2e/archive_report.cy.ts:118` | Unit, E2E | F | Yes | Pass | - |
| US 7.0.8 | AT5 | A failed delete shows an error and the SIR stays | `__tests__/pages/AdminReports.archived.test.tsx:125`, `__tests__/pages/ArchiveReportModal.test.tsx:71`, `__tests__/components/queries.archive-report.test.ts:207`, `cypress/e2e/archive_report.cy.ts:150` | Page, Unit, E2E | F | Yes | Pass | - |

Notes:

- 7.0.1 AT1: the PDF job (`processPdfJob`) is mocked in `pdf.test.ts` and
  `SirPdfExportButton.test.tsx`.
- 7.0.1 AT3: a single SIR export includes every photo, past the bulk cap, and a WebP photo is
  converted to JPEG ([PR #237](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/237)). No test compares the rendered PDF with the SIR page.
- 7.0.5 AT1: `AdminGallery.test.tsx` deletes an image in the admin gallery and checks that it
  leaves the gallery and that the other images stay. When the server refuses, the image stays. The
  other tests check the row delete and the `onDeleted` callback. No test renders the site gallery
  or a report after a delete, so the status is partial.
- 7.0.5 AT3: the S3 client is mocked.
- 7.0.6: the 50-site cap was removed before Fall 2026, in commit `dde6ccb` (July 22, 2026, Winter
  2026 team). [PR #237](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/237) added paging, so the report and photo queries of an export
  read past the PostgREST limit of 1000 rows, and added the 7.0.6 tests. `getSitesByNames` is not
  paged, so one export can name at most 1000 sites.
- 7.0.6 AT1 and AT2, failure cases: when a later page of the report or photo query fails, the
  query throws instead of returning the pages it read (`queries.exportPaging.test.ts:89,97,105`),
  and `fetchReportData` throws, so no export is made from part of the data
  (`pdfDataFetcher.test.ts:487,497,507`). `processPdfJob.test.tsx:75` marks the job failed when
  `fetchReportData` throws.
- 7.0.6 AT2: `queries.exportPaging.test.ts` reads 51 reports with the site page query
  (`getFormResponsesBySite`) and with the bulk export query (`getFormResponsesForSiteIds`), and
  checks that the answers are equal. Both leave out archived and deactivated reports. The test
  compares the data, not the rendered PDF.
- 7.0.6 AT3: `pdf.test.ts:372,384` (a Steward asks for a site or multi-site export) are labelled
  for both 7.0.1 AT2 and 7.0.6 AT3.
- 7.0.7 AT1: `cypress/e2e/pdf_export.cy.ts` tests the selection of sections and dates, not the
  hiding of a question, so it is not listed.
- 7.0.8: the story is built as two steps, archive and delete for good from the archived reports
  page ([PR #165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165)). The tests mock the database functions and S3.
- 7.0.8 AT2: 'archives a report after the administrator confirms' checks that the report card
  leaves the admin site page. `queries.reports.test.ts` checks that the report list filters on
  `archived_at is null`. `archive_report.cy.ts:71` archives a report on a local Supabase and checks
  that it is gone from the admin site page and from `/detail/<site>` after a reload. Failure
  cases: when the archive fails, the report stays on the admin site page and the dialog shows the
  error (`AdminSiteDetails.test.tsx:1158`). A Steward's archive makes no database call, and a
  missing or already archived report returns the database error (`queries.archive-report.test.ts:119,130`).
- 7.0.8 AT3: the gallery tests check that the attachment queries filter on
  `form_responses.archived_at is null`. `archive_report.cy.ts:96` reads the site gallery API of a
  local Supabase before and after the archive. Failure cases: a refused delete,
  or a delete of a missing or unarchived report, removes no S3 files
  (`queries.archive-report.test.ts:139,146`).

## Sprint 2 dev tasks

| Task | Team | Test file(s) | Status |
|---|---|---|---|
| Improve authentication checks for admin routes | Beta | `__tests__/app/api/heatmap.test.ts`, `__tests__/app/api/geocode.test.ts` (401 and 403 for each route), `__tests__/lib/admin-actions.test.ts`, `__tests__/lib/form-actions.test.ts`, `__tests__/components/queries.admin.test.ts`, `__tests__/components/queries.report-writes.test.ts` ([PR #242](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/242)), `__tests__/pages/AdminLayout.test.tsx` ([PR #240](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/240)), and the 403 cases in `__tests__/app/api/` | Pass |
| Investigate and fix Invalid Identifier Supabase error (#128) | Alpha | - | Not yet tested |
| Update db names to not include "W26" as prefix (#129) | Alpha | - (#129 changed only the table names in mocks) | Not yet tested |
| Create and migrate the user model (#131) | Alpha | - | Not yet tested |
| Fix site inspection page resetting current page when app is exited temporarily (#87, [PR #164](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/164), [PR #236](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/236)) | Beta | `__tests__/pages/SiteInspectionReport.test.tsx:947` and the draft tests under 'W26 US 1.0.26 - Persist Site Inspection Form Draft' (`:852`) | Pass |
| Set up development, release, and feature branches | Gamma | - (no code) | - |

Other tests from the Sprint 2 fixes, now on `main`. They check fixes, not an AT.

| Test file | What it checks | PR |
|---|---|---|
| `__tests__/app/api/heatmap.test.ts` | 401 and 403, `%`, `_` and `*` in the keyword, at most 50 sites, no match, 500 on a database error | [PR #261](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/261) |
| `__tests__/app/api/geocode.test.ts` | 401 and 403, `{latitude, longitude}` with nulls when there is no match, 500 when `OPENCAGE_API_KEY` is missing, the 8 second timeout and OpenCage errors | [PR #261](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/261) |
| `__tests__/pages/AdminFormEditor.loading.test.tsx` | The form editor loads the sections and the questions once, and an older questions load does not undo a toggle | [PR #261](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/261) |
| `__tests__/components/queries.sitesOnline.test.ts:49,81,111` | `getSitesOnline` asks for the newest dated and the newest undated report of each site, not every report | [PR #261](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/261) |
| `__tests__/lib/admin-actions.test.ts:77,97` | `getAllUsers` reads every page of users, and returns nothing when a later page fails | [PR #261](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/261) |
| `__tests__/pages/Sites.test.tsx` | The first-visit tutorial is stubbed, so the suite no longer fails at random | [PR #261](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/261) |

## Coverage summary

Sprint 2 stories, as of October 12, 2026, with the local Cypress and database rule runs.

| Story | Team | ATs | Covered | Partial | None |
|---|---|---|---|---|---|
| US 1.0.1 | Alpha | 5 | AT1 to AT5 | - | - |
| US 1.0.2 | Alpha | 6 | AT1 to AT6 | - | - |
| US 2.0.2 | Gamma | 6 | AT1 to AT6 | - | - |
| US 2.0.3 | Beta | 5 | AT1, AT2, AT3, AT5 | AT4 | - |
| US 2.0.4 | Gamma | 4 | AT1, AT2, AT4 | AT3 | - |
| US 2.0.5 | Gamma | 4 | AT1 to AT4 | - | - |
| US 2.0.6 | Beta | 3 | AT1 to AT3 | - | - |
| US 2.0.10 | Gamma | 3 | AT1 to AT3 | - | - |
| US 3.0.2 | Alpha | 4 | AT1 to AT4 | - | - |
| US 4.0.6 | Beta | 2 | AT1, AT2 | - | - |
| US 5.0.4 | Alpha | 3 | AT1 to AT3 | - | - |
| US 7.0.1 | Gamma | 3 | AT1, AT2 | AT3 | - |
| US 7.0.5 | Beta | 5 | AT2, AT4, AT5 | AT1, AT3 | - |
| US 7.0.6 | Gamma | 4 | AT1 to AT4 | - | - |
| US 7.0.7 | Beta | 5 | AT1 to AT5 | - | - |
| US 7.0.8 | Gamma | 5 | AT1 to AT5 | - | - |
| **Total** | | **67** | **62** | **5** | **0** |

On October 9 the totals were 33 covered, 23 partial and 11 with no test. On `main` at `9009d0d`
they were 51 covered, 15 partial and 1 with no test (2.0.2 AT5). The tests that came in after the
freeze covered 2.0.2 AT5, 2.0.5 AT1, AT2 and AT4, 2.0.6 AT2 and 7.0.6 AT2. Every AT now has a
test.

**Code coverage** of the same local run (`npm run test:ci`, October 13): statements 85.06%,
branches 74%, functions 78.61%, lines 87.56%. The run fails below the thresholds in
`webapp/jest.config.ts` (statements 83, branches 72, functions 77, lines 85).

Sprint 3 coverage after the October 26 close-out checks. This table measures coverage, not
release approval. The full-suite failure above must be corrected before release.

| Story | Team | ATs | Covered | Partial | None |
|---|---|---|---|---|---|
| US 1.0.3 | Green | 3 | AT2, AT3 | AT1 | - |
| US 1.0.4 | Green | 2 | AT1 | - | AT2 |
| US 1.0.6 | Red | 3 | AT1, AT2, AT3 | - | - |
| US 2.0.1 | Red | 4 | AT2, AT3, AT4 | AT1 | - |
| US 2.0.8 | Blue | 3 | AT1, AT2, AT3 | - | - |
| US 2.0.9 | Red | 6 | AT1, AT2, AT3, AT4, AT5, AT6 | - | - |
| US 2.0.12 | Red | 5 | AT1, AT2, AT3, AT4, AT5 | - | - |
| US 2.0.13 | Red | 4 | AT1, AT2, AT3, AT4 | - | - |
| US 2.0.14 | Blue | 1 | AT1 | - | - |
| US 3.0.3 | Red | 2 | AT1, AT2 | - | - |
| US 4.0.2 | Red | 4 | AT1, AT2, AT3, AT4 | - | - |
| US 4.0.4 | Blue | 4 | AT1, AT2, AT3 | AT4 | - |
| US 5.0.2 | Green | 4 | AT1, AT2, AT3, AT4 | - | - |
| US 6.0.1 | Blue | 5 | AT1, AT2, AT3, AT4, AT5 | - | - |
| **Total** | | **50** | **46** | **3** | **1** |

US 3.0.4 is removed, not an untested commitment. Activity-count AT2 still needs explicit evidence.

## Close-out evidence notes

- The server ownership and required-answer tests already exist in `queries.report-writes.test.ts`.
  The previous plan did not list them. Browser checks confirmed an owner edit, preservation of
  the hidden flag, rejection of another steward's edit and absence of the hidden text for that steward.
- The earlier offline AT2–AT4 gap is covered by the local browser run with 96 saved tiles.
  It checks the cache path, missing-tile indicator and return to live requests. It does not
  test a production Protomaps key or a full reload of the app while offline.
- Password-reset AT1–AT4 passed against local Supabase with a delivered local SMTP message.
  Production SMTP, template and redirect settings still need the release owner's check.
- SIR-edit AT4 stays partial: the site view and visibility are checked, but every export and
  summary view has not been checked in a browser after the same edit.

## Known limits

- `.github/workflows/ci.yaml` runs Jest with the coverage gate (`npm run test:ci`), the type check,
  the build and a blocking lint (`--max-warnings 0`). `.github/workflows/e2e.yaml` runs seven
  specs against a local Supabase on PRs into `main` and `release`. The comment in the workflow names
  each excluded spec and the reason. The other specs, for example `disable_site_profile.cy.ts`, need
  the production inspection form, fixed report ids or S3, and are not run in CI. The E2E results on
  this page are from a local run, not from CI.
- The Cypress specs read their logins from `Cypress.env()` ([PR #240](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/240)). Each developer copies
  `webapp/cypress.env.example.json` to `webapp/cypress.env.json` before a run.
- Most unit and API tests mock Supabase and S3. They do not test row level security or a real
  bucket.

## Inherited story IDs in test names

Inherited test names use Winter 2026 story IDs. Since [PR #243](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/243) these names start with
`W26`, for example `W26 US 1.0.1 - Access Site Inspection Form on Web Application`. They are not
evidence for the Fall 2026 story with the same number. A text search for `US 1.0.1` still finds
`W26 US 1.0.1`, so search for the Fall 2026 label format, for example `(1.0.1 AT` or `US 1.0.1 AT`.

| Test file | Name in the test | Read as |
|---|---|---|
| `__tests__/pages/SiteDetails.test.tsx:385` | W26 US 1.0.1 - Access Site Inspection Form on Web Application | W26 US 1.0.1 |
| `__tests__/pages/SiteInspectionReport.test.tsx:301` and later | W26 US 1.0.2, 1.0.4, 1.0.5, 1.0.7, 1.0.8, 1.0.11, 1.0.12, 1.0.14, 1.0.16, 1.0.26, 1.0.27, 1.0.28 | W26 US 1.0.x |
| `__tests__/pages/ProtectedAreaDesignation.test.tsx:61`, `SectionFiveHumanActivities.test.tsx:207`, `SectionSixNeedsDone.test.tsx:116`, `ImageCaptionUpload.test.tsx:61`, `OverallImpressionSite.test.tsx:89`, `INaturalistSubmissions.test.tsx:79` | W26 US 1.0.9, 1.0.13, 1.0.15, 1.0.18, 1.0.6, 1.0.10 | W26 US 1.0.x |
| `__tests__/pages/ImageUploadSectionPersistence.test.tsx:96` | W26 US 2.0.2 - Image Metadata | W26 US 2.0.2 |
| `__tests__/components/UploadImages.test.tsx:29`, `cypress/e2e/homepage_image_upload.cy.ts:77` | W26 US 2.0.8 - User Upload of Standalone Site Images | W26 US 2.0.8 |
| `__tests__/pages/UserEditSiteInspectionForm.test.tsx:607`, `cypress/e2e/edit_site_inspection_form.cy.ts:6` | W26 US 1.0.22 - (User) Edit My Site Inspections Form | W26 US 1.0.22 |

Files with both kinds of ID. Read each test by its own label:

- `__tests__/components/TermsContent.test.tsx:15` is labelled `(5.0.4 AT3)`. It checks the terms
  page, which `SiteInspectionReport.test.tsx:301` also tests under `W26 US 1.0.4 - Have access to
  the Terms and Conditions`. Fall 2026 US 1.0.4 is a different story (activity aggregates).
- `__tests__/pages/SiteDetails.test.tsx:187` and `:195` are labelled `(3.0.2 AT1)`. The same file
  has the `W26 US 1.0.1` suite at line 385. Fall 2026 US 1.0.1 is a different story (user
  profiles).
- `__tests__/middleware.test.ts:53` names `US 3.0.8`, a story that was removed. See
  [Other access tests](#5-access-and-accounts).

## Archive: Winter 2026 matrix

The Winter 2026 team kept their matrix in a spreadsheet. We keep the link for reference only. We do
not update it for Fall 2026.

[View the Winter 2026 Traceability Matrix](https://docs.google.com/spreadsheets/d/1lidLGHJA07vB-MdxcdPFwCnxkWpWXxtmATjuhJUGd7k/edit?usp=sharing)
