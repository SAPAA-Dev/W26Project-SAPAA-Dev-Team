# Requirements Traceability Matrix (Fall 2026)

This page links each acceptance test (AT) in [User Stories](user-stories.md) to the automated tests
that check it. Status is as of **October 7, 2026**. Sprint 2 is still in progress: the code freeze is
October 11 and the release is October 13 at 20:00.

## How to read this page

- There is one table for each feature area. Each row is one AT of one user story.
- **Test file(s)** are relative to `webapp/`. Jest tests are in `__tests__/`. Cypress (E2E) tests
  are in `cypress/e2e/`.
- **S/F** tells which scenarios the tests check:

| Value | Meaning |
|---|---|
| S+F | The tests check the success scenario and a failure scenario (error, refusal or invalid input). |
| S | The tests check the success scenario only. |
| F | The tests check a failure scenario only. |
| - | There is no test. |

- **Status** comes from the Jest run of the CI workflow on `main` at commit `7b98085`
  (October 7, 2026: 975 tests, 975 passed, 0 failed). CI does not run Cypress.

| Status | Meaning |
|---|---|
| Pass | Tests for the AT exist and passed in CI. |
| Pass (partial) | Tests passed in CI, but they check only part of the AT. The note below the table tells which part is missing. |
| Fail | A test for the AT failed in CI. |
| Not run | Only a Cypress test checks the AT. CI does not run Cypress, so the result is not verified. |
| Not yet tested | No test checks the AT. |

## How to update this page

1. When you add or change a test for an AT, add or change its row here in the same PR.
2. Put the story and AT number in the test name, for example `'shows the steward with a link to their profile (3.0.2 AT3)'`.
   Many Fall 2026 test files do not have these labels yet. Until they do, the row on this page is
   the link between a test and its story.
3. Use the Fall 2026 story ID. Many inherited test names use Winter 2026 IDs (see
   [Inherited story IDs in test names](#inherited-story-ids-in-test-names)).
4. Take the status from the CI run of the merged commit. Do not mark an AT as Pass from a local run only.
5. When a sprint starts, add rows for its stories with the status Not yet tested.

## 1 - People Management

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Status |
|---|---|---|---|---|---|---|
| US 1.0.1 | AT1 | A profile shows name, skills, focus area, contact info and inspection count | `__tests__/app/api/profile.test.ts`, `__tests__/components/ProfilePage.test.tsx`, `__tests__/lib/socials.test.ts` | API, Component, Unit | S+F | Pass |
| US 1.0.1 | AT2 | Open my own profile from the main menu | - | - | - | Not yet tested |
| US 1.0.1 | AT3 | Open a profile from an inspection on a site page | `__tests__/components/SubmittedBy.test.tsx`, `__tests__/lib/steward-actions.test.ts` | Component, Unit | S+F | Pass |
| US 1.0.1 | AT4 | Go back to the previous page from a profile | `__tests__/components/ProfilePage.test.tsx` | Component | S | Pass |
| US 1.0.1 | AT5 | A reload shows the latest stored values | - | - | - | Not yet tested |
| US 1.0.2 | AT1 | A user edits only their own information | `__tests__/app/api/profile.test.ts`, `__tests__/components/ProfilePage.test.tsx` | API, Component | S+F | Pass |
| US 1.0.2 | AT2 | A request to edit another user's information fails | `__tests__/app/api/profile.test.ts` | API | F | Pass (partial) |
| US 1.0.2 | AT3 | A blank name or email blocks Save and highlights the field | `__tests__/components/ProfilePage.test.tsx` | Component | F | Pass (partial) |
| US 1.0.2 | AT4 | After Save, the page shows the new values | `__tests__/components/ProfilePage.test.tsx`, `__tests__/app/api/profile.test.ts` | Component, API | S | Pass (partial) |
| US 1.0.2 | AT5 | Saved values stay after sign-out and sign-in | - | - | - | Not yet tested |
| US 1.0.2 | AT6 | Added skills and focus areas show on the profile after Save | `__tests__/components/ProfilePage.test.tsx`, `__tests__/app/api/profile.test.ts` | Component, API | S+F | Pass (partial) |
| US 1.0.3 | AT1 to AT3 | Inspection history on a profile (Sprint 3) | - | - | - | Not yet tested |
| US 1.0.4 | AT1 to AT2 | Activity aggregates on a profile (Sprint 3) | - | - | - | Not yet tested |

Notes:

- 1.0.1 AT1: `profile.test.ts` checks the GET response (contact details, 401, 404, 503).
  `ProfilePage.test.tsx` checks that the page shows the details, skills, focus areas and the
  inspection count.
- 1.0.1 AT2: `HeaderDropdown.test.tsx` and `AdminNavBar.test.tsx` test only Logout. No test opens a
  profile from the menu.
- 1.0.1 AT5: `ProfilePage.test.tsx` renders one mocked response and never reloads.
- 1.0.2 AT1: PATCH `/api/profile` takes no target id. It writes only the row of the signed-in person
  ('saves contact details for the signed-in person only'). A signed-out request gets 401.
- 1.0.2 AT2: 'writes with the signed-in client so the database applies the rules' depends on row
  level security (RLS) on `people`. The test mocks the database, so it does not prove the refusal.
- 1.0.2 AT3: 'blocks saving when the name is ""' and 'blocks saving when the name is "   "' (PR #151)
  check that an empty or spaces-only name marks the field invalid and sends no PATCH. The red border
  comes from the `user-invalid:` style, and no test checks it. No test checks the contact email
  field. The account email is not editable on the profile page. The server tests check only the
  length limit (30 refused, 29 accepted).
- 1.0.2 AT4 and AT6: 'lets an owner update only profile fields' checks the PATCH body. No test
  checks the page after Save.

## 2 - Place Management

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Status |
|---|---|---|---|---|---|---|
| US 2.0.2 | AT1 | An Admin selects the boundary of a new site | - | - | - | Not yet tested |
| US 2.0.2 | AT2 | A possible-duplicate warning shows before save | `__tests__/components/AddSiteModal.test.tsx`, `__tests__/components/queries.createSite.test.ts` | Component, Unit | S+F | Pass |
| US 2.0.2 | AT3 | An empty required field blocks creation and is highlighted | `__tests__/components/AddSiteModal.test.tsx`, `__tests__/components/queries.createSite.test.ts` | Component, Unit | S+F | Pass |
| US 2.0.2 | AT4 | A Steward's create request is refused and no site is made | `__tests__/components/queries.createSite.test.ts` | Unit | F | Pass |
| US 2.0.2 | AT5 | A new site appears in the search results | - | - | - | Not yet tested |
| US 2.0.2 | AT6 | Boundary suggestions from the Alberta government KML | - | - | - | Not yet tested |
| US 2.0.3 | AT1 | Toggle a site between active and inactive | `__tests__/components/queries.disable.test.ts`, `__tests__/pages/AdminSites.disable.test.tsx`, `cypress/e2e/disable_site_profile.cy.ts` | Unit, Component, E2E | S+F | Pass |
| US 2.0.3 | AT2 | An inactive site is not in site pickers or search results | `cypress/e2e/disable_site_profile.cy.ts` | E2E | S | Not run |
| US 2.0.3 | AT3 | A reactivated site appears again | `__tests__/pages/AdminSites.disable.test.tsx`, `cypress/e2e/disable_site_profile.cy.ts` | Component, E2E | S | Pass |
| US 2.0.3 | AT4 | The inspections of an inactive site can still be viewed | `__tests__/pages/AdminSiteDetails.test.tsx`, `__tests__/components/queries.admin.test.ts` | Page, Unit | S+F | Pass (partial) |
| US 2.0.3 | AT5 | A new site is active by default | `__tests__/components/queries.createSite.test.ts` | Unit | S | Pass |
| US 2.0.4 | AT1 | The Admin confirms before a site is deleted | - | - | - | Not yet tested |
| US 2.0.4 | AT2 | The confirmation names how many records are affected | - | - | - | Not yet tested |
| US 2.0.4 | AT3 | The agreed cascade applies to inspections, images and visit counts | - | - | - | Not yet tested |
| US 2.0.4 | AT4 | A failed cascade rejects the delete and changes nothing | - | - | - | Not yet tested |
| US 2.0.5 | AT1 | An Admin enters edit mode on a site page | `__tests__/pages/AdminSites.edit.test.tsx`, `__tests__/components/queries.edit.test.ts`, `cypress/e2e/edit_site_profile.cy.ts` | Component, Unit, E2E | S+F | Pass (partial) |
| US 2.0.5 | AT2 | A non-admin cannot enter edit mode | `__tests__/components/queries.edit.test.ts`, `__tests__/pages/AdminSites.edit.test.tsx`, `cypress/e2e/edit_site_profile.cy.ts` | Unit, Component, E2E | F | Pass |
| US 2.0.5 | AT3 | Edit mode shows which fields are included or excluded | - | - | - | Not yet tested |
| US 2.0.5 | AT4 | After save, the site page shows new fields and hides excluded ones | - | - | - | Not yet tested |
| US 2.0.6 | AT1 | Filters keep only matching sites on the map | - | - | - | Not yet tested |
| US 2.0.6 | AT2 | Clearing a filter shows all active sites again | - | - | - | Not yet tested |
| US 2.0.6 | AT3 | Selecting a search match centres the map on the site | - | - | - | Not yet tested |
| US 2.0.10 | AT1 | A short link to the SAPAA website on the site page | `__tests__/components/SiteLinks.test.tsx` | Component, Unit | S+F | Pass |
| US 2.0.10 | AT2 | A short link to iNaturalist on the site page | `__tests__/components/SiteLinks.test.tsx` | Component, Unit | S+F | Pass |
| US 2.0.10 | AT3 | A link opens in a new window | `__tests__/components/SiteLinks.test.tsx` | Component | S | Pass |
| US 2.0.1 | AT1 to AT4 | Sites and past visits on the map (Sprint 3) | - | - | - | Not yet tested |
| US 2.0.8 | AT1 to AT3 | Site details from the map (Sprint 3) | - | - | - | Not yet tested |
| US 2.0.9 | AT1 to AT5 | GPX track upload (Sprint 3) | - | - | - | Not yet tested |
| US 2.0.11 | AT1 to AT4 | Safety information for a site (Sprint 3) | - | - | - | Not yet tested |

Notes:

- 2.0.2 AT2 to AT4: `AddSiteModal.test.tsx` tests the name, the duplicate warning and the county.
  `queries.createSite.test.ts` tests `createSite` and `findSitesWithName`, including the refusal of
  a Steward and of an admin whose approval was revoked.
- 2.0.3 AT2: the Cypress test checks only the user sites page, not the site pickers or search.
- 2.0.3 AT4: 'loads an inactive site in the administrator view' (`AdminSiteDetails.test.tsx`, PR #150)
  checks that the admin site page loads an inactive site, requests its inspections and shows the
  Inspection Reports section. 'returns an inactive site for an approved admin'
  (`queries.admin.test.ts`) checks `getSiteByNameAdmin`, and the same file checks that it refuses a
  steward and a revoked admin. The tests cover the admin view only. The Cypress case 'should not
  allow users to view the detail page of a disabled site' blocks the view for other users.
- 2.0.5 AT1: the tests cover the name and county modal on the admin sites list (inherited from
  Winter 2026 US 4.0.3). They do not cover edit mode on the site page.
- 2.0.6: `kmlImport.test.ts` and `kml-import-actions.test.ts` test only the import of KML data. No
  test renders the map.

## 3 - Admin Persona

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Status |
|---|---|---|---|---|---|---|
| US 3.0.2 | AT1 | An Admin searches for a steward to assign | `__tests__/components/SiteSteward.test.tsx`, `__tests__/lib/steward-actions.test.ts` | Component, Unit | S+F | Pass |
| US 3.0.2 | AT2 | An Admin assigns a new steward and replaces the old one | `__tests__/components/SiteSteward.test.tsx`, `__tests__/lib/steward-actions.test.ts` | Component, Unit | S+F | Pass |
| US 3.0.2 | AT3 | The assignment shows on the site page and on the steward's profile | `__tests__/components/SiteSteward.test.tsx`, `__tests__/lib/steward-actions.test.ts`, `__tests__/components/ProfilePage.test.tsx` | Component, Unit | S | Pass |
| US 3.0.2 | AT4 | A user who cannot assign is refused and nothing is created | `__tests__/lib/steward-actions.test.ts`, `__tests__/components/SiteSteward.test.tsx` | Unit, Component | F | Pass |

Notes:

- 3.0.2 has no E2E test. The unit and component tests mock the server actions and the database.

## 4 - General Features

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Status |
|---|---|---|---|---|---|---|
| US 4.0.6 | AT1 | A SIR with an empty Identifier submits | `__tests__/pages/FormSubmissionPrevention.test.tsx`, `__tests__/pages/UserEditSiteInspectionForm.test.tsx` | Page | F | Pass (partial) |
| US 4.0.6 | AT2 | No "required" note beside the Identifier field | - | - | - | Not yet tested |
| US 4.0.2 | AT1 to AT4 | Offline and online map layers (Sprint 3) | - | - | - | Not yet tested |
| US 4.0.4 | AT1 to AT4 | Edit my previous inspections (Sprint 3) | - | - | - | Not yet tested |
| US 4.0.5 | AT1 to AT2 | iNaturalist integration (Sprint 3) | - | - | - | Not yet tested |
| US 4.0.7 | AT1 to AT5 | Top iNaturalist observations for a site (Sprint 3) | - | - | - | Not yet tested |

Notes:

- 4.0.6 AT1: PR #147 removed Identifier from the expected list of missing image fields
  (`Q81.1 image: Caption, Photographer, Date`). The tests show that Identifier is not required. No
  test shows a SIR with an empty Identifier that submits. `__tests__/app/api/s3-presign.test.ts` has
  no empty-Identifier case: every case sends `identifier: "Broken Tree"`.
- 4.0.4: the inherited tests `UserEditSiteInspectionForm.test.tsx` and
  `cypress/e2e/edit_site_inspection_form.cy.ts` (Winter 2026 US 1.0.22) are related. They are mapped
  to 4.0.4 when the story starts in Sprint 3.

## 5 - Access and Accounts

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Status |
|---|---|---|---|---|---|---|
| US 5.0.4 | AT1 | After sign-out, opening the app again shows the sign-in page | `__tests__/components/auth.test.ts`, `__tests__/components/ProtectedRoutes.test.tsx`, `__tests__/components/HeaderDropdown.test.tsx`, `cypress/e2e/logout.cy.ts` | Unit, Component, E2E | S+F | Pass (partial) |
| US 5.0.4 | AT2 | After sign-out, the Back button shows no signed-in page | `cypress/e2e/logout.cy.ts` | E2E | S | Not run |
| US 5.0.4 | AT3 | Sign out from any page | `__tests__/components/HeaderDropdown.test.tsx`, `__tests__/components/AdminNavBar.test.tsx`, `__tests__/components/ProtectedRoutes.test.tsx` | Component | S | Pass (partial) |
| US 5.0.2 | AT1 to AT4 | Reset a forgotten password (Sprint 3) | - | - | - | Not yet tested |

Notes:

- 5.0.4 AT1: `auth.test.ts` checks a logout and a failed logout. `ProtectedRoutes.test.tsx` checks
  that a signed-out user goes to `/login`. No test signs out and then opens the app again.
- 5.0.4 AT3: the tests cover the user menu (`UserNavBar`), the admin menu (`AdminNavBar`) and the
  approval-pending screen only. No test checks every page.

## 6 - Data and Places

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Status |
|---|---|---|---|---|---|---|
| US 6.0.1 | AT1 to AT4 | Site geometry from the shared KML source (Sprint 3) | - | - | - | Not yet tested |

Notes:

- 6.0.1: `__tests__/lib/kmlImport.test.ts` and `__tests__/lib/kml-import-actions.test.ts` (PR #152)
  test the KML parser and the import. They are mapped to 6.0.1 when the story starts in Sprint 3.

## 7 - Inspections and Media

| US | AT | Acceptance test (short) | Test file(s) | Test type | S/F | Status |
|---|---|---|---|---|---|---|
| US 7.0.1 | AT1 | A Steward exports a PDF of their own SIR | `__tests__/app/api/pdf.test.ts`, `__tests__/components/SirPdfExportButton.test.tsx` | API, Component | S+F | Pass |
| US 7.0.1 | AT2 | A Steward's request for another person's SIR is refused | `__tests__/app/api/pdf.test.ts`, `__tests__/app/api/pdf-status.test.ts`, `__tests__/components/SirPdfExportButton.test.tsx` | API, Component | F | Pass |
| US 7.0.1 | AT3 | The PDF has the same answers and photos as the SIR page | `__tests__/components/SirPdfExportButton.test.tsx` | Component | S | Pass (partial) |
| US 7.0.5 | AT1 | A deleted image is gone from the site gallery and reports | `__tests__/app/api/site-images-delete.test.ts`, `__tests__/components/DeleteImageButton.test.tsx` | API, Component | S+F | Pass (partial) |
| US 7.0.5 | AT2 | Non-admins see no delete control and the server refuses them | `__tests__/app/api/site-images-delete.test.ts` | API | F | Pass (partial) |
| US 7.0.5 | AT3 | The S3 file of a deleted image is gone | `__tests__/app/api/site-images-delete.test.ts`, `__tests__/lib/s3Delete.test.ts` | API, Unit | S+F | Pass (partial) |
| US 7.0.5 | AT4 | A deactivated SIR keeps its S3 files | - | - | - | Not yet tested |
| US 7.0.5 | AT5 | A rolled-back SIR submission removes its S3 files | `__tests__/components/queries.rollback.test.ts`, `__tests__/pages/FormSubmissionPrevention.test.tsx` | Unit, Page | S+F | Pass |
| US 7.0.6 | AT1 | An export of more than 50 SIRs has each selected SIR | - | - | - | Not yet tested |
| US 7.0.6 | AT2 | Each exported SIR has the same answers as its page | - | - | - | Not yet tested |
| US 7.0.6 | AT3 | A Steward's bulk export request is refused | `__tests__/app/api/pdf.test.ts` | API | F | Pass (partial) |
| US 7.0.6 | AT4 | A failed export leaves the stored SIRs unchanged | - | - | - | Not yet tested |
| US 7.0.7 | AT1 | Fields selected to hide are marked for the export | `__tests__/components/PdfExportModal.test.tsx`, `cypress/e2e/pdf_export.cy.ts` | Component, E2E | S+F | Pass |
| US 7.0.7 | AT2 | Hidden fields are absent and the other fields are present | `__tests__/lib/pdfDataFetcher.test.ts`, `__tests__/app/api/pdf.test.ts` | Unit, API | S+F | Pass |
| US 7.0.7 | AT3 | The stored answers stay after an export with hidden fields | - | - | - | Not yet tested |
| US 7.0.7 | AT4 | A Steward's export request with hidden fields is refused | `__tests__/app/api/pdf.test.ts` | API | F | Pass (partial) |
| US 7.0.7 | AT5 | With no hidden fields, the export has the full SIR | `__tests__/lib/pdfDataFetcher.test.ts` | Unit | S | Pass (partial) |
| US 7.0.8 | AT1 | The Admin confirms before a SIR is deleted | - | - | - | Not yet tested |
| US 7.0.8 | AT2 | A deleted SIR is gone from the site and report lists | - | - | - | Not yet tested |
| US 7.0.8 | AT3 | The images of a deleted SIR are no longer shown | - | - | - | Not yet tested |
| US 7.0.8 | AT4 | A Steward's delete request is refused and the SIR stays | - | - | - | Not yet tested |
| US 7.0.8 | AT5 | A failed delete shows an error and the SIR stays | - | - | - | Not yet tested |

Notes:

- 7.0.1 AT1: 'allows an approved steward to export a SIR they submitted' (`pdf.test.ts`) checks the
  202 response and the export job. `SirPdfExportButton.test.tsx` checks that the button starts a
  single-report job and tracks it to the download, and shows the error of a failed job. The PDF
  job (`processPdfJob`) is mocked.
- 7.0.1 AT2: `pdf.test.ts` checks the 403 for a SIR of another person, a SIR that does not exist,
  site and multi-site mode, and a Steward whose approval was revoked. No job is created.
  `pdf-status.test.ts` checks the 403 for the job of another user. `SirPdfExportButton.test.tsx`
  shows the server error.
- 7.0.1 AT3: the test checks only that the request asks for images (`includeImages: true`). No
  test compares the PDF with the SIR page.
- 7.0.5 AT1: the tests check the row delete and the `onDeleted` callback. No test checks the
  gallery or a report after the delete.
- 7.0.5 AT2: the server refusal is tested (403 for a non-admin, an unapproved admin, and a role in
  `user_metadata`). No test checks that non-admins see no delete control.
- 7.0.5 AT3: the S3 client is mocked.
- 7.0.6 AT3: the only test is the general non-admin 403 on `POST /api/pdf`, not a bulk request.
- 7.0.7 AT2: 'omits a hidden question and keeps the other answers' (`pdfDataFetcher.test.ts`) and
  'drops hidden question ids that are not integers' (`pdf.test.ts`) pass on `main`. The second test
  failed on `d18f3bd`.
- 7.0.7 AT4: the test uses the general non-admin 403, not a request with hidden fields.
- 7.0.7 AT5: 'returns all sections when selectedSections is "all"' checks sections. No test sends
  an empty list of hidden questions.

## Sprint 2 dev tasks

| Task | Team | Test file(s) | Status |
|---|---|---|---|
| Improve authentication checks for admin routes | Beta | `__tests__/lib/admin-actions.test.ts`, `__tests__/lib/form-actions.test.ts`, `__tests__/components/queries.admin.test.ts`, and the 403 cases in `__tests__/app/api/` | Pass |
| Investigate and fix Invalid Identifier Supabase error (#128) | Alpha | - | Not yet tested |
| Update db names to not include "W26" as prefix (#129) | Alpha | - (#129 changed only the table names in mocks) | Not yet tested |
| Create and migrate the user model (#131) | Alpha | - | Not yet tested |
| Fix site inspection page resetting current page when app is exited temporarily | Beta | - | Not yet tested |
| Set up development, release, and feature branches | Gamma | - (no code) | - |

## Coverage summary

Sprint 2 stories, as of October 7, 2026. "Partial" includes the ATs that only Cypress checks.

| Story | Team | ATs | Covered | Partial | None |
|---|---|---|---|---|---|
| US 1.0.1 | Alpha | 5 | AT1, AT3, AT4 | - | AT2, AT5 |
| US 1.0.2 | Alpha | 6 | AT1 | AT2, AT3, AT4, AT6 | AT5 |
| US 2.0.2 | Gamma | 6 | AT2, AT3, AT4 | - | AT1, AT5, AT6 |
| US 2.0.3 | Beta | 5 | AT1, AT3, AT5 | AT2 (Cypress only), AT4 | - |
| US 2.0.4 | Gamma | 4 | - | - | AT1 to AT4 |
| US 2.0.5 | Gamma | 4 | AT2 | AT1 | AT3, AT4 |
| US 2.0.6 | Beta | 3 | - | - | AT1 to AT3 |
| US 2.0.10 | Gamma | 3 | AT1 to AT3 | - | - |
| US 3.0.2 | Alpha | 4 | AT1 to AT4 | - | - |
| US 4.0.6 | Beta | 2 | - | AT1 | AT2 |
| US 5.0.4 | Alpha | 3 | - | AT1, AT2 (Cypress only), AT3 | - |
| US 7.0.1 | Gamma | 3 | AT1, AT2 | AT3 | - |
| US 7.0.5 | Beta | 5 | AT5 | AT1, AT2, AT3 | AT4 |
| US 7.0.6 | Gamma | 4 | - | AT3 | AT1, AT2, AT4 |
| US 7.0.7 | Beta | 5 | AT1, AT2 | AT4, AT5 | AT3 |
| US 7.0.8 | Gamma | 5 | - | - | AT1 to AT5 |
| **Total** | | **67** | **23** | **18** | **26** |

2.0.4, 2.0.6 and 7.0.8 have no tests because their work is not merged on `main`.

Some stories have tests for one scenario only. 7.0.6 and 4.0.6 have only failure-scenario rows (F),
and many other rows are S only or F only. The owner team adds the missing scenario: 7.0.6 Gamma,
4.0.6 Beta, 1.0.1, 1.0.2 and the Alpha dev tasks (#128, #129, #131) Alpha.

Sprint 3 stories (1.0.3, 1.0.4, 2.0.1, 2.0.8, 2.0.9, 2.0.11, 4.0.2, 4.0.4, 4.0.5, 4.0.7, 5.0.2 and
6.0.1) are not yet tested. Their rows are added AT by AT when the sprint starts.

## Known limits

- CI runs only Jest (`npm test` in `.github/workflows/ci.yaml`). The Cypress specs in
  `cypress/e2e/` are not run in CI, so their rows are marked Not run.
- The Cypress specs sign in with accounts of the Winter 2026 team. The Fall 2026 team may not
  control these accounts.
- Most unit and API tests mock Supabase and S3. They do not test row level security or a real
  bucket.

## Inherited story IDs in test names

Some inherited test names use Winter 2026 story IDs. These IDs are the same as different Fall 2026
IDs. Read them as "W26 US x.y.z" (see the archive in [Project Management](project-management.md)).
They are not evidence for the Fall 2026 story with the same number.

| Test file | Name in the test | Read as |
|---|---|---|
| `__tests__/pages/SiteDetails.test.tsx` | US 1.0.1 - Access Site Inspection Form on Web Application | W26 US 1.0.1 |
| `__tests__/pages/SiteInspectionReport.test.tsx` | US 1.0.2, US 1.0.4, US 1.0.5 and others | W26 US 1.0.x |
| `__tests__/pages/ImageUploadSectionPersistence.test.tsx` | US 2.0.2 - Image Metadata | W26 US 2.0.2 |
| `__tests__/components/UploadImages.test.tsx` | US 2.0.8 - User Upload of Standalone Site Images | W26 US 2.0.8 |
| `cypress/e2e/homepage_image_upload.cy.ts` | US 2.0.8 - User Upload of Standalone Site Images | W26 US 2.0.8 |
| `__tests__/pages/UserEditSiteInspectionForm.test.tsx` | US 1.0.22 – (User) Edit My Site Inspections Form | W26 US 1.0.22 |

## Archive: Winter 2026 matrix

The Winter 2026 team kept their matrix in a spreadsheet. We keep the link for reference only. We do
not update it for Fall 2026.

[View the Winter 2026 Traceability Matrix](https://docs.google.com/spreadsheets/d/1lidLGHJA07vB-MdxcdPFwCnxkWpWXxtmATjuhJUGd7k/edit?usp=sharing)
