# Sprint 3 Test Plan

This page names the test type for each acceptance test (AT) of the Sprint 3 user stories
([#182](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/182)). It also names the test
that checks the AT now, or the test that the team plans to add. The
[Traceability Matrix](traceability-matrix.md) records the results of these tests
([#214](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/214)).

Status is as of October 23, 2026, on `sprint-3` at `52ed9a4`.

## Test types

| Type | What it checks | Tool | Where |
|---|---|---|---|
| Unit | One function or server action. Supabase, S3 and other services are mocks. | Jest | `webapp/__tests__/lib/`, `webapp/__tests__/components/queries.*` |
| Integration | One page, component or API route with its children. The server actions are mocks. | Jest and React Testing Library | `webapp/__tests__/pages/`, `webapp/__tests__/components/`, `webapp/__tests__/app/` |
| E2E | A full user flow in a browser against a local Supabase. | Cypress | `webapp/cypress/e2e/` |
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
| AT1: the aggregates match the user's data (SIR count, activities) | Unit, Integration | `__tests__/components/ProfilePage.test.tsx:117` (summaries) | Partial: add a `(1.0.4 AT1)` unit test for the count query and an integration test for the shown numbers |
| AT2: a new report adds 1 to the SIR count | Integration | Planned: `ProfilePage.test.tsx`, `(1.0.4 AT2)` reload after a new report | Planned |

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

## 4.0.2 Offline and Online Map Layers (Red)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: download a map area for offline use and see its download status | Unit, Integration | `__tests__/components/OfflineSavePanel.test.tsx:218`, `:257`, `:269`, `:291`; `__tests__/lib/map/offline/tileCache.test.ts` | Exists |
| AT2: offline, downloaded tiles render and the map pans and zooms inside the area | Unit, Manual | `__tests__/lib/map/offline/tileCache.test.ts:314` (a cached tile is returned) | Partial and Manual: save an area, turn on "Offline" in the browser developer tools, reload the map, then pan and zoom inside the area |
| AT3: offline, missing tiles outside the area are indicated | Manual | None | Manual: with "Offline" on, pan outside the saved area and check that the missing tiles are marked, not blank. Add a unit test if the indicator logic is a separate function |
| AT4: online, the map uses live tiles and not the cache | Unit, Manual | Planned: `tileCache.test.ts`, `(4.0.2 AT4)` online request goes to the network | Planned and Manual: with the network on, check in the Network tab that tiles come from the tile server |

## 4.0.4 Edit My Previous Inspections (Blue)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: the author opens a past SIR and enters edit mode | Integration | `__tests__/pages/UserEditSiteInspectionForm.test.tsx:616`, `:641` | Exists: add the `(4.0.4 AT1)` label |
| AT2: another steward cannot enter edit mode or change the SIR | Unit, Integration | `__tests__/pages/UserEditSiteInspectionForm.test.tsx:623`, `:630`; planned: a unit test that the update server action refuses a caller who is not the author | Partial: add the server action test, `(4.0.4 AT2)` |
| AT3: clearing a required answer blocks submit and lists the missing questions | Integration, E2E | `__tests__/pages/UserEditSiteInspectionForm.test.tsx:723`, `:791`; `cypress/e2e/required_questions_submit_block.cy.ts` | Partial: check that the test asserts the list of missing questions ([#204](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/204)) |
| AT4: saved edits show everywhere the report is rendered | Integration, E2E | `__tests__/pages/UserEditSiteInspectionForm.test.tsx:825`, `:842`; `cypress/e2e/edit_site_inspection_form.cy.ts` | Partial: add tests for the profile history and the PDF export ([#210](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/210)) |

## 5.0.2 Reset a Forgotten Password (Green)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: "Forgot password" with an email sends an email | Integration | `__tests__/app/password-reset-request-code.test.ts:44` to `:135`; `__tests__/pages/ForgotPassword.test.tsx:33`, `:41`, `:55`; `__tests__/pages/Login.test.tsx:51` | Exists |
| AT2: the user verifies a code before the reset | Integration | `__tests__/app/password-reset-verify-code.test.ts:48`, `:55`, `:63`; `__tests__/pages/ForgotPassword.test.tsx:68`, `:87`; `__tests__/pages/ResetPassword.test.tsx:32` | Exists |
| AT3: the new password works and the old one does not | Integration, Manual | `__tests__/pages/ResetPassword.test.tsx:41`, `:51`, `:61`, `:73` | Partial and Manual: the tests check that the update is sent. On a local Supabase, reset a test account and sign in with the new and the old password |
| AT4: no admin step is needed | Integration | `__tests__/pages/ForgotPassword.test.tsx:41`, `:68`; `__tests__/pages/ResetPassword.test.tsx:61` | Exists |

## 6.0.1 Store Each Site's Geometry From the Shared Source (Blue)

| AT | Type | Test | Status |
|---|---|---|---|
| AT1: a site in the government KML uses exactly the same geometry | Unit | `__tests__/lib/kmlImport.test.ts:205`, `:214`, `:253`, `:262`; `__tests__/lib/kml-import-actions.test.ts:144` | Partial: add a `(6.0.1 AT1)` test that a linked site reads the geometry of its protected area unchanged ([#181](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/181)) |
| AT2: a Site read from the database has a boundary and a centre point | Unit | Planned: `(6.0.1 AT2)` query test that a linked site returns its boundary and a latitude and longitude | Planned: `sites_pa` has `protected_area_id`, but no centre point column on `sprint-3` yet ([#181](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/181)) |
| AT3: each Site has a geometry or is on a list of unmatched Sites for an Admin | Unit, Integration | `__tests__/lib/kml-import-actions.test.ts:325`, `:337`, `:349`, `:359`, `:371`; `__tests__/lib/boundaryFilters.test.ts:223`; `__tests__/components/MapAreaFilters.test.tsx:35` | Exists |
| AT4: geocoding results are cached and stay under 2,500 requests a day | Unit | `__tests__/app/api/geocode.test.ts` checks the route, not the cache | Planned: `(6.0.1 AT4)` tests that a second request for the same place uses the cache and that the route stops at the daily limit ([#193](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/193)) |

## Summary

| Story | ATs | Exists | Partial | Planned | Manual |
|---|---|---|---|---|---|
| 1.0.3 | 3 | 2 | 1 | 0 | 0 |
| 1.0.4 | 2 | 0 | 1 | 1 | 0 |
| 2.0.1 | 4 | 3 | 1 | 0 | 0 |
| 2.0.8 | 3 | 3 | 0 | 0 | 0 |
| 2.0.9 | 6 | 6 | 0 | 0 | 0 |
| 4.0.2 | 4 | 1 | 1 | 1 | 1 |
| 4.0.4 | 4 | 1 | 3 | 0 | 0 |
| 5.0.2 | 4 | 3 | 1 | 0 | 0 |
| 6.0.1 | 4 | 1 | 1 | 2 | 0 |
| **Total** | **34** | **20** | **9** | **4** | **1** |

Some ATs need two types (for example Partial and Manual). The table counts each AT once, by its
main status.

## How to run the tests

From `webapp/`:

- Jest (unit and integration): `npm test`
- One file: `npx jest __tests__/components/SiteMap.test.tsx`
- Cypress (E2E): see `.github/workflows/e2e.yaml`. It needs a local Supabase (`npm run dev`).
  Do not run Cypress against production.
