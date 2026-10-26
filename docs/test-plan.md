# Sprint 3 Test Plan

This page names the test type for each acceptance test (AT) of the Sprint 3 user stories
([#182](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/182)). It also names the test
that checks the AT now, or the test that the team plans to add. The
[Traceability Matrix](traceability-matrix.md) records the results of these tests
([#214](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/214)).

Status was updated on October 26, 2026. The scope is 14 stories and 50 ATs after US 3.0.4 was removed. See [release checks](sprint-3-release.md) for local browser evidence and open release checks.

## Test types

| Type | What it checks | Tool | Where |
|---|---|---|---|
| Unit | One function or server action. Supabase, S3 and other services are mocks. | Jest | `webapp/__tests__/lib/`, `webapp/__tests__/components/queries.*` |
| Integration | One page, component or API route with its children. The server actions are mocks. | Jest and React Testing Library | `webapp/__tests__/pages/`, `webapp/__tests__/components/`, `webapp/__tests__/app/` |
| Database | One SQL function on a local Supabase, with no mocks. | Jest | `webapp/__tests__/db/` |
| E2E | A full user flow in a browser against a local Supabase. | Browser tooling; existing Cypress CI jobs | [Local release checks](sprint-3-release.md); `webapp/cypress/e2e/` |
| Manual | A flow that the tools cannot check, for example a device that goes offline. A team member does the steps and records the result in the PR. | Browser | The PR of the story |

Rules:

- Every AT has at least one automated test, unless the AT is marked Manual.
- An AT that refuses an action (for example "only the author can edit") has a test for the refusal,
  not only for the success scenario.
- Put the story and AT number in the test name, for example `'(4.0.4 AT2) ...'`. See
  [How to update this page](traceability-matrix.md#how-to-update-this-page).
- File paths are relative to `webapp/`. A number after a colon is the line of the test.

## How to read the Status column

| Status | Meaning |
|---|---|
| Exists | A test that checks the AT is on `sprint-3`. |
| Partial | A test exists, but it checks only part of the AT. The note tells which part is missing. |
| Planned | No test exists yet. The team adds the named test with the story's PR. |
| Manual | The AT is checked by hand. The steps are in the note. |

## 1.0.3 Show history of Site Inspections on a Steward's Profile (Green)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: the profile lists previous inspections with site and date | Integration | `__tests__/components/ProfilePage.test.tsx:117`, `:191` (inspection history paging) | Partial: add a test named `(1.0.3 AT1)` that checks the site name and the date of each row |
| AT2: a past inspection opens with its submitted information | Integration | `__tests__/components/ProfilePage.test.tsx:108` | Exists |
| AT3: hidden answers are not shown to other stewards | Unit, Integration | `__tests__/components/queries.exportPaging.test.ts:182`, `:208`; `__tests__/app/api/site-images.test.ts:157`, `:193`; `__tests__/pages/SiteDetails.test.tsx:564` | Exists |

## 1.0.4 Aggregate User Activity and Contributions on a user's profile (Green)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: the aggregates match the user's data | Unit, Integration | `__tests__/app/api/profile.test.ts` (contribution statistics), `__tests__/components/ProfilePage.test.tsx` | Exists; the separate query-count test still fails in the full run |
| AT2: a new report adds 1 to the SIR count | Integration | Planned: `ProfilePage.test.tsx`, `(1.0.4 AT2)` reload after a new report | Planned |

## 1.0.6 Select and Edit Skills and Focus Areas (Red)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: dropdowns offer existing values and Other | Integration | `__tests__/components/TagPicker.test.tsx:13,30`, `__tests__/components/ProfilePage.test.tsx:372` | Exists |
| AT2: typing suggests similar values | Unit, Integration | `__tests__/lib/profileTags.test.ts`, `__tests__/components/TagPicker.test.tsx:41` | Exists |
| AT3: saved changes appear on the profile | Integration | `__tests__/components/ProfilePage.test.tsx:372`, `__tests__/components/TagPicker.test.tsx:94` | Exists |

## 2.0.1 View Sites and Past Visits on an Interactive Map (Red)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: every active Site is drawn with its boundary | Integration, E2E | `__tests__/components/SiteMap.test.tsx` (boundary layer and load notes, `:1104`, `:1110`); `cypress/e2e/map_filter.cy.ts` | Partial: add a `(2.0.1 AT1)` test that checks inactive sites are not drawn |
| AT2: a GPX track is drawn in a style different from the boundary | Unit, Integration | `__tests__/lib/gpxTrack.test.ts:78`; `__tests__/components/SiteMap.test.tsx:1619` | Exists |
| AT3: the Site page links to its location on the map | Integration | `__tests__/pages/SiteDetails.test.tsx:300` | Exists |
| AT4: only the newly selected Site is highlighted | Integration | `__tests__/components/SiteMap.test.tsx:1541`, `:1550`, `:1565`; `__tests__/pages/Sites.test.tsx:960` | Exists |

## 2.0.8 View a Site's Details From the Map (Blue)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: selecting a Site opens its detail view | Integration | `__tests__/components/SiteMap.test.tsx:631`, `:647` | Exists |
| AT2: the detail view shows the same name, county and last inspection date as the Site page | Unit, Integration | `__tests__/components/queries.boundaries.test.ts:150`, `:171`, `:191`, `:201`; `__tests__/lib/boundaries.test.ts:230`, `:239`; `__tests__/components/SiteMap.test.tsx:655`, `:701`, `:718` | Exists |
| AT3: "View SIRs" goes to the past SIRs | Integration | `__tests__/components/SiteMap.test.tsx:739`, `:755` | Exists |

## 2.0.9 Upload a GPX Track of a Site Visit (Red)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: a valid .gpx file is saved and linked to the Site and the account | Unit, Integration | `__tests__/lib/gpx-track-actions.test.ts:72`, `:90`; `__tests__/components/GpxTrackUpload.test.tsx:68` | Exists |
| AT2: a file without the .gpx extension shows "only GPX files" | Unit, Integration | `__tests__/lib/gpx-track-actions.test.ts:122`; `__tests__/components/GpxTrackUpload.test.tsx:99` | Exists |
| AT3: an invalid .gpx file or one with no track points is refused and nothing is saved | Unit, Integration | `__tests__/lib/gpx-track-actions.test.ts:235`, `:246`; `__tests__/components/GpxTrackUpload.test.tsx:140` | Exists |
| AT4: a stored track reads back with the same track points | Unit, Integration | `__tests__/components/queries.gpxTracks.test.ts:109`; `__tests__/lib/gpxTrack.test.ts:33`; `__tests__/components/GpxTrackUpload.test.tsx:166` | Exists |
| AT5: a file over the size limit is refused with a message that names the limit | Unit, Integration | `__tests__/lib/gpx-track-actions.test.ts:257`; `__tests__/components/GpxTrackUpload.test.tsx:111` | Exists |
| AT6: several files at once: each valid file is saved and each refused file is listed with its reason | Unit, Integration | `__tests__/lib/gpx-track-actions.test.ts:289`; `__tests__/components/GpxTrackUpload.test.tsx:123`, `:140` | Exists |

## 2.0.12 Score a Site for To-Visit Priority (Red)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: An Admin enters the three scores and they are saved | Unit, Integration | `__tests__/lib/sitePriority.test.ts:18`, `__tests__/lib/site-priority-actions.test.ts:44`, `__tests__/components/SitePriority.test.tsx:48` | Exists |
| AT2: The Site page shows one to-visit priority calculated from the scores | Unit, Integration | `__tests__/lib/sitePriority.test.ts:7`, `__tests__/lib/site-priority-actions.test.ts:44`, `__tests__/components/SitePriority.test.tsx:48` | Exists |
| AT3: Two Sites with the same scores show the same priority | Unit, Integration | `__tests__/lib/sitePriority.test.ts:12`, `__tests__/lib/site-priority-actions.test.ts:137` | Exists |
| AT4: A Steward sees the priority and the three scores | Unit, Integration | `__tests__/lib/site-priority-actions.test.ts:110`, `__tests__/components/SitePriority.test.tsx:21` | Exists |
| AT5: The server refuses a Steward's change and the scores stay the same | Unit, Integration | `__tests__/lib/site-priority-actions.test.ts:62`, `__tests__/components/SitePriority.test.tsx:73` | Exists |

## 2.0.13 Flag Site Points That Are a Year Old (Red)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: An Admin sees a reminder when the points are more than a year old | Unit, Integration | `__tests__/lib/sitePriority.test.ts:38`, `__tests__/lib/site-priority-actions.test.ts:125`, `__tests__/components/SitePriority.test.tsx:100` | Exists |
| AT2: No reminder when the points are less than a year old | Unit, Integration | `__tests__/lib/sitePriority.test.ts:42`, `__tests__/lib/site-priority-actions.test.ts:131`, `__tests__/components/SitePriority.test.tsx:106` | Exists |
| AT3: Saving new points removes the reminder and stores the new date | Unit, Integration | `__tests__/lib/site-priority-actions.test.ts:44`, `__tests__/components/SitePriority.test.tsx:113` | Exists |
| AT4: A Steward does not see the Admin reminder | Unit, Integration | `__tests__/lib/site-priority-actions.test.ts:110`, `__tests__/components/SitePriority.test.tsx:106` | Exists |

## 2.0.14 Color Map Sites by Type (Blue)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: a boundary uses the saved site or type color | Unit, Integration | `__tests__/components/SiteMap.test.tsx`, `__tests__/components/queries.boundaryColors.test.ts`, `__tests__/lib/boundaries.test.ts` | Exists |

## 3.0.3 Export All Digital Files (Red)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: export produces a ZIP | Unit, Integration | `__tests__/lib/processExportJob.test.ts` (`buildExportZip`), `__tests__/components/ExportAllFilesButton.test.tsx` | Exists |
| AT2: the archive includes all images and file types | Unit, Integration | `__tests__/lib/processExportJob.test.ts` (`collectExportEntries`, paging and missing objects), `__tests__/app/api/export.test.ts` | Exists |

## 4.0.2 Offline and Online Map Layers (Red)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: download a map area for offline use and see its download status | Unit, Integration | `__tests__/components/OfflineSavePanel.test.tsx:218`, `:257`, `:269`, `:291`; `__tests__/lib/map/offline/tileCache.test.ts` | Exists |
| AT2: offline, downloaded tiles render and the map pans and zooms | Unit, E2E | `__tests__/lib/map/offline/tileCache.test.ts`, [local browser run](sprint-3-release.md#acceptance-evidence) | Exists; local browser passed |
| AT3: offline, missing tiles outside the saved area are indicated | Integration, E2E | `__tests__/components/SiteMap.test.tsx` (offline badge), [local browser run](sprint-3-release.md#acceptance-evidence) | Exists; local browser passed |
| AT4: online, the map uses live requests instead of the cache | Integration, E2E | `__tests__/components/SiteMap.test.tsx` (4.0.2 AT4), [local reconnect check](sprint-3-release.md#acceptance-evidence) | Exists; local browser passed |

## 4.0.4 Edit My Previous Inspections (Blue)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: the author opens a past SIR and enters edit mode | Integration | `__tests__/pages/UserEditSiteInspectionForm.test.tsx:616`, `:641` | Exists: add the `(4.0.4 AT1)` label |
| AT2: another steward cannot enter edit mode or change the SIR | Unit, Integration, E2E | `__tests__/components/queries.report-writes.test.ts:157,167`, `__tests__/pages/UserEditSiteInspectionForm.test.tsx:623`; [local browser run](sprint-3-release.md#acceptance-evidence) | Exists |
| AT3: clearing a required answer blocks submit and lists missing questions | Unit, Integration, E2E | `__tests__/components/queries.report-writes.test.ts:200,212`, `__tests__/pages/UserEditSiteInspectionForm.test.tsx:723`; [local browser run](sprint-3-release.md#acceptance-evidence) | Exists |
| AT4: saved edits show everywhere the report is rendered | Integration, E2E | `__tests__/pages/UserEditSiteInspectionForm.test.tsx:825`, `:842`; `cypress/e2e/edit_site_inspection_form.cy.ts` | Partial: add tests for the profile history and the PDF export ([#210](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/210)) |

## 5.0.2 Reset a Forgotten Password (Green)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: "Forgot password" with an email sends an email | Integration | `__tests__/app/password-reset-request-code.test.ts:44` to `:135`; `__tests__/pages/ForgotPassword.test.tsx:33`, `:41`, `:55`; `__tests__/pages/Login.test.tsx:51` | Exists |
| AT2: the user verifies a code before the reset | Integration | `__tests__/app/password-reset-verify-code.test.ts:48`, `:55`, `:63`; `__tests__/pages/ForgotPassword.test.tsx:68`, `:87`; `__tests__/pages/ResetPassword.test.tsx:32` | Exists |
| AT3: the new password works and the old one does not | Integration, E2E | `__tests__/pages/ResetPassword.test.tsx`; [local SMTP and browser run](sprint-3-release.md#acceptance-evidence) | Exists; real local Auth passed |
| AT4: no admin step is needed | Integration | `__tests__/pages/ForgotPassword.test.tsx:41`, `:68`; `__tests__/pages/ResetPassword.test.tsx:61` | Exists |

## 6.0.1 Store Each Site's Geometry From the Shared Source (Blue)

The tests in `__tests__/db/` run the real SQL function on a local Supabase. `npm test` skips them. Run them with
`npm run test:db -- --runInBand` after `supabase start`.

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: a Site with a boundary in the KML is linked to it, and the stored boundary has the same longitude and latitude values as the KML | Unit, Database | `__tests__/lib/kmlImport.test.ts:205`, `:214`, `:253`; `__tests__/lib/kml-import-actions.test.ts:144`; `__tests__/db/site-boundary-links.test.ts:102`, `:135` | Exists |
| AT2: a Site read from the database has a boundary link or no link | Database | `__tests__/db/site-boundary-links.test.ts:102`, `:114`, `:157` | Exists |
| AT3: each Site is linked to a boundary or is on the list of Sites with no boundary for an Admin | Unit, Integration, Database | `__tests__/lib/kml-import-actions.test.ts:325`, `:337`; `__tests__/components/KmlImportModal.test.tsx:41`, `:59`; `__tests__/db/site-boundary-links.test.ts:114`, `:125`, `:148` | Exists |
| AT4: the Unlinked filter shows only the Sites with no boundary, and the Linked filter shows only the Sites with a boundary | Unit, Integration | `__tests__/lib/boundaryFilters.test.ts:228`; `__tests__/pages/AdminSites.test.tsx:107`; `__tests__/components/MapAreaFilters.test.tsx:36` | Exists |
| AT5: the server refuses a Steward who calls the Admin import, and returns no list | Unit | `__tests__/lib/kml-import-actions.test.ts:116`, `:128`, `:137` | Exists |

## Summary

The [traceability matrix](traceability-matrix.md) has one row per AT. Coverage is now:

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

US 3.0.4 is removed. Activity-count AT2 and the remaining partial rows still need evidence.
The full suite is not green until the profile query-count failure is corrected.

## How to run the tests

From `webapp/`:

- Jest (unit and integration): `npm test`
- One file: `npx jest __tests__/components/SiteMap.test.tsx`
- Local browser checks: follow [Sprint 3 release checks](sprint-3-release.md). The recorded run used a local Supabase, local SMTP and disposable accounts. No Cypress run was made.
- Existing Cypress CI jobs are in `.github/workflows/e2e.yaml`; follow the project rule that an agent does not run Cypress.
