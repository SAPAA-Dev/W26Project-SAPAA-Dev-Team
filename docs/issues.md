# Issues Backlog

Every gap and defect found in the handover audit, written so it can be exported to GitHub
Issues directly.

**Effort**: S is under a day, M is one to three days, L is three to seven days, XL is over a week.

**Impact** is 1 to 5, where 5 means the project is meaningfully worse without it.

**Value** is impact weighted against effort. Three stars means do it now, one star means only if
there is room.

## How to export

Each entry below has a `Title`, `Labels` and a body. To file one, copy the body and run:

```bash
gh issue create --repo UAlberta-CMPUT401/F26project-SAPAA --title "<Title>" --label "<Labels>" --body "<body>"
```

Labels used: `security`, `data`, `bug`, `feature`, `mobile`, `infra`, `docs`, `ux`, `spike`.

---

## Priority table

Sorted by value. Cut the line wherever your capacity runs out.

**Status** is as of October 7, 2026. It was checked against the pull requests merged into `main`
up to #155. "Open" means that no merged pull request resolves the item.

| # | Title | Area | Impact | Effort | Value | Blocked by | Status |
|---|---|---|---|---|---|---|---|
| 1 | Stop `/gallery` leaking every user's photos | security | 5 | S | ★★★ | | Open |
| 2 | Remove committed secrets from docs and tests | security | 4 | S | ★★★ | | Open. See the note in item 2 |
| 3 | Rotate service role key and remove it from the mobile bundle | security | 5 | S | ★★★ | | Open |
| 4 | Enforce caller identity on every server action | security | 5 | M | ★★★ | | Partly done (#144). Remaining: `queries.ts` write actions |
| 5 | Move `role` out of `user_metadata` into `app_metadata` | security | 5 | M | ★★★ | | Done: PR #144 (closes #71) |
| 6 | Decide the canonical database schema (spike) | data | 5 | S | ★★★ | | Open |
| 7 | Add real coordinates to sites | data | 5 | M | ★★★ | | In progress (#132, #152). Sites still have no coordinates |
| 8 | Fix the failing test on main | infra | 2 | S | ★★★ | | Open |
| 9 | Add `.env.example` and a working setup guide | infra | 3 | S | ★★★ | | Open |
| 10 | Log every role change | security | 3 | S | ★★★ | 4, 5 | Open |
| 11 | Stop mobile silently discarding offline edits | mobile | 5 | L | ★★★ | | Open |
| 12 | Make site search work | bug | 4 | S | ★★★ | | Open |
| 13 | Key site detail pages by id, not name | bug | 4 | S | ★★★ | | Open |
| 14 | Instrument the events KPIs are built from | feature | 5 | M | ★★★ | | Open |
| 15 | Add password reset | feature | 4 | S | ★★★ | | Open |
| 16 | Show stewards a map | feature | 4 | S | ★★★ | 7 | Open. US 2.0.6 (#60) is open |
| 17 | Send the approval email the app already promises | bug | 3 | S | ★★★ | | Open |
| 18 | Cache geocoding results and bound the quota | bug | 3 | S | ★★★ | 7 | Open |
| 19 | Fix logout | bug | 3 | S | ★★ | | Done: PR #120 (closes #94). US 5.0.4 (#64) closed |
| 20 | Paginate the sites list | bug | 3 | S | ★★ | | Open |
| 21 | Build the user profile page | feature | 4 | M | ★★ | | Done: #138, #140, #141, #142. US 1.0.1 (#54) closed |
| 22 | Port the KPIs that already exist in the mobile app | feature | 4 | M | ★★ | 14 | Open |
| 23 | Put the database schema in version control | infra | 4 | M | ★★ | 6 | Partly done. 10 migrations in `webapp/supabase/migrations/` |
| 24 | Add image deletion and clean up orphaned files | feature | 4 | M | ★★ | | Done: PR #148 (closes #65, US 7.0.5) |
| 25 | Stand up a staging environment | infra | 4 | M | ★★ | | Open |
| 26 | Make CI actually gate merges | infra | 3 | S | ★★ | | Partly done (#124, #125). Lint and build steps missing |
| 27 | Record inspection edit history | feature | 4 | M | ★★ | | Open |
| 28 | Prepare for December field testing | infra | 4 | S | ★★ | | Open |
| 29 | Clean the naturalness data | data | 3 | M | ★★ | | Open |
| 30 | Add "Compare by Question" to the web app | feature | 4 | M | ★★ | | Open |
| 31 | Fix login and signup accessibility | ux | 3 | S | ★★ | | Open |
| 32 | Let stewards export their own PDFs | feature | 3 | S | ★★ | | Done: PR #155 (closes #68, US 7.0.1) |
| 33 | Promote or delete the `_test` views | data | 2 | S | ★★ | 6 | Open |
| 34 | Fix the mobile "Sync Now" button | mobile | 2 | S | ★★ | | Open |
| 35 | Decide the fate of the Google Sheets pipeline | spike | 3 | S | ★★ | 6 | Decided. Apps Script removed from the repository (#118) |
| 36 | Fix the mobile delete-by-index bug | mobile | 4 | S | ★★★ | | Open |
| 37 | Write a backup and recovery runbook | infra | 3 | S | ★★ | | Open |
| 38 | Reconcile `luperson` with auth accounts | data | 4 | L | ★★ | 6 | Open |
| 39 | Unify the two question banks | data | 4 | L | ★★ | 6 | Open |
| 40 | Add an all-inspections summary view | feature | 3 | M | ★★ | | Open |
| 41 | Show past inspections while filling a new one | feature | 3 | M | ★★ | | Open |
| 42 | Support non-public, SAPAA-only answers | feature | 3 | M | ★★ | | Partly done (#146). Export-time hiding only |
| 43 | Finish site classification by region and county | feature | 2 | S | ★★ | | Open |
| 44 | Add photo capture to the mobile app | mobile | 4 | L | ★ | | Open |
| 45 | Publish the mobile app so volunteers can install it | mobile | 3 | L | ★ | | Open |
| 46 | Declare and request device permissions | mobile | 2 | S | ★ | 44 | Open |
| 47 | Show how stale offline data is | mobile | 2 | S | ★ | | Open |
| 48 | Migrate 40+ years of legacy inspections | data | 5 | XL | ★ | 6, 39 | Open |
| 49 | Give mobile and web a shared read model | data | 4 | XL | ★ | 6, 48 | Open |
| 50 | Resolve offline edit conflicts | mobile | 4 | XL | ★ | 11 | Open |
| 51 | Add offline support to the web app | feature | 3 | XL | ★ | | Open |
| 52 | Confirm whether duplicate sites exist before building dedupe | spike | 1 | S | ★ | | Open |

## Where these items are in the user stories

This backlog uses its own numbers, not story IDs. Story IDs, points and MoSCoW live in
[User Stories](user-stories.md) and are not repeated here, except in the table below. The table
uses the current story set (35 stories). "none" means that no current story covers the item.

| # | User story | MoSCoW | Points | Link |
|---|---|---|---|---|
| 4, 5 | none | - | - | The security stories were removed on September 25, 2026. Sprint 2 task #71 was closed by PR #144. Item 5 is done. Item 4 is only partly done |
| 9 | none | - | - | - |
| 11 | none | - | - | - |
| 13 | none | - | - | - |
| 14 | US 1.0.4 Aggregate User Activity and Contributions on a user's profile | Must | 2 | The stats need the activity records |
| 15 | US 5.0.2 Reset a Forgotten Password | Must | 2 | Same feature |
| 16 | US 2.0.1 View Sites and Past Visits on an Interactive Map | Should | 8 | Same feature |
| 18 | US 6.0.1 Store Each Site's Geometry From the Shared Source | Must | 5 | Its AT4 caches geocoding under the OpenCage limit |
| 21 | US 1.0.1 Add User Profiles | Must | 5 | Same feature. Done (#54 closed) |
| 24 | US 7.0.5 Delete an Image and Clean Up After It | Should | 5 | Same feature. Done (#65 closed by PR #148) |
| 35 | none | - | - | Decided, see item 35 |
| 42 | US 7.0.7 Hide Fields on a SIR Before Export | Must | 5 | Related: both keep answers out of a published SIR |
| 43 | none | - | - | - |

## Do not build these, they already exist

Checked against the code. Scoping these again would waste a sprint.

- **Admin editor for form questions.** Add, edit, hide and drag to reorder, with a Markdown
  editor, at `webapp/app/admin/form-editor/page.tsx`.
- **PDF generation.** A real background job pipeline with S3 upload and a live notification when
  the file is ready.
- **Soft delete and admin override edit for reports.**
- **Heatmap, charts, in-app tutorial, Swagger API docs at `/api-docs`.**
- **Autosave drafts** was already specified by the Winter team as US 1.0.26. Check what shipped
  before re-estimating it.
- **Account search and filters** already exist in account management.

---

## Issue bodies

### Tier 1, do these first

#### 1. Stop `/gallery` leaking every user's photos
`Labels: security, bug`

The user gallery API routes are copies of the admin routes with the role check deleted and no
owner filter added in its place, so `/gallery` serves every user's photos to any signed in user.
`webapp/app/api/user-gallery/sir-upload/route.ts` still reads `role` and then ignores it.

Fix: filter by the calling user's id, and confirm the homepage upload route has the same
treatment. Acceptance: a steward sees only their own uploads, an admin sees all.

#### 2. Remove committed secrets from docs and tests
`Labels: security`

Real account passwords appear in roughly 15 Cypress specs. The Supabase key is pasted four times
into `docs/webapp-deployment.md`, which GitHub Actions publishes to a public GitHub Pages site.
An OpenCage API key is hardcoded in `FNR/src/services/openCage.ts`.

Status as of October 7, 2026: open. The file was moved to `internal/webapp-deployment.md`, which
MkDocs does not publish, but the key is still in it 4 times. The Cypress specs still type literal
passwords (for example `webapp/cypress/e2e/add_form_editor.cy.ts:29`). The OpenCage key is still
in `FNR/src/services/openCage.ts:3`.

Fix: move all of these to environment variables, scrub the docs, and rotate anything that was
public. Acceptance: no credential appears in a grep of the repo or the published docs site.

#### 3. Rotate the service role key and remove it from the mobile bundle
`Labels: security, mobile`

`FNR/app.config.js` passes the Supabase service role key into `expo.extra`, where the app reads it
on the device. That key ignores all database permission rules, so anyone who obtains the app file
has full database access. The key value was never committed, so this is an architecture problem
rather than a leak, but it still needs rotating.

Fix: rotate the key, remove it from the client config, and move the operations that need it behind
a server endpoint that checks the caller. Acceptance: no privileged key is present in a built app
bundle.

#### 4. Enforce caller identity on every server action
`Labels: security`

Every exported function in a `'use server'` file is a public endpoint. Four such files exist and
none of them check who is calling, while most use the service role client. Any signed in account,
including one never approved, can call `updateUser` to become admin or
`rollbackSiteInspectionSubmission` to delete any report. `ProtectedRoute.tsx` only controls
rendering, it is not a gate.

Fix: read the caller's session at the top of each privileged action, look up their role in the
database, refuse if they are not permitted, and only then use the service role client.
Acceptance: calling a privileged action as a steward, outside the UI, is refused. See issue #5,
these two belong together. No current user story covers this item. The work is the Sprint 2 task #71.

Status as of October 7, 2026: partly done (#144). Six `'use server'` files now exist:
`webapp/utils/admin-actions.ts`, `webapp/utils/form-actions.ts`,
`webapp/utils/kml-import-actions.ts`, `webapp/utils/steward-actions.ts`,
`webapp/utils/supabase/queries.ts` and `webapp/app/login/actions.ts`. `updateUser`, `addUser`,
`deleteUser` and `getAllUsers` now refuse a caller who is not an approved admin. Remaining: the
service-role write actions in `queries.ts` still have no caller check, for example
`rollbackSiteInspectionSubmission`, `uploadSiteInspectionAnswers` and
`updateSiteInspectionAnswers`.

#### 5. Move `role` out of `user_metadata` into `app_metadata`
`Labels: security, data`

A user is allowed to edit their own `user_metadata`, so storing the role there means any
permission check is asking the user what their own permissions are. Nothing prevents
`auth.updateUser({data: {role: 'admin'}})`.

Fix: store the role and the approval flag in `app_metadata`, which only the service role can
write, and read them from `app_metadata` in every permission check. Acceptance: a user cannot
change their own role by any route, including the auth API directly.

Status: done. PR #144 (closes #71). All role and approval checks now read `app_metadata`
(`isApprovedAdmin` in `admin-actions.ts`, `requireApprovedAdmin` in `queries.ts` and
`form-actions.ts`, `steward-actions.ts`, and `webapp/app/api/pdf/route.ts`). The web app reads
`user_metadata` only for `full_name`, `avatar_url` and `phone`.

#### 6. Decide the canonical database schema
`Labels: spike, data`

The web app reads and writes `sites_pa`, `form_responses`, `answers`, `questions` and the other
tables in `webapp/supabase/migrations/` (the `W26_` prefix was removed by #129, task #73). The mobile app and the Google Sheet read and write
legacy `inspectheader`, `inspectdetails`, `inspectquestions` and `luperson`. The only shared table
is `luperson`. So a web inspection does not exist for mobile, the question bank is duplicated, and
40 years of history is invisible to the web app.

This is a one way door and it blocks a large part of the backlog. Fix: write a short architecture
decision record choosing which schema is canonical and what happens to the other. Acceptance: a
decision document merged to the repo, with the follow up work broken into issues.

#### 7. Add real coordinates to sites
`Labels: data, feature`

Sites have no latitude or longitude columns anywhere. The existing heatmap geocodes the site's
**name as text** through the OpenCage API on every page load, one site per second, caching nothing.

This blocks every map user story in the backlog. Fix: add coordinate columns, populate them, and
read from them instead of geocoding at runtime. Acceptance: the map renders from stored
coordinates with no external geocoding call on page load.

Progress as of October 7, 2026: `protected_areas` (#132) stores the KML/KMZ geometry. Admins
import it with `importProtectedAreasFromStorage` (#152), which parses the file with
`webapp/lib/map/kmlImport.ts`. #152 replaced the parser from #137. But
`20261006010000_alter_protected_areas_for_kml_import.sql` dropped the `site_id` link, so
`sites_pa` still has no coordinates. The admin dashboard still geocodes each site by name
(`webapp/app/admin/dashboard/page.tsx`).

#### 8. Fix the failing test on main
`Labels: bug, infra`

251 of 252 tests pass. `FNR/src/.../auth.test.ts` has a stale expectation left over from a change
in March and has been red for six months. One line.

#### 9. Add `.env.example` and a working setup guide
`Labels: infra, docs`

A clean clone does not start. `FNR/src/services/adminAuth.ts` throws on import when environment
variables are missing, and no document lists what they should be. Acceptance: a new teammate can
clone and run both apps using only the README.

#### 10. Log every role change
`Labels: security`

Record who made the change, who it affected, the previous and new role, and the time. Three
columns. It means "how did this person become an admin" always has an answer.

#### 11. Stop mobile silently discarding offline edits
`Labels: mobile, bug`

`handleSaveInspection` in `FNR/src/screens/AdminSiteDetailScreen.tsx` calls Supabase
unconditionally. With no connection it shows an error and throws the edit away. Stewards work in
remote parks with no signal, so this is live data loss today.

Fix: queue writes locally and flush them when connectivity returns. Acceptance: an edit made with
airplane mode on is still present and syncs once reconnected.

#### 12. Make site search work
`Labels: bug`

Reported broken during the handover call, and Aaron reproduced it live on 19 September. But the
web and mobile code already filter site names and counties, and there are tests covering it, so
this is a regression rather than missing work. Pin down the deployed commit and environment where
it fails before estimating.

#### 13. Key site detail pages by id, not name
`Labels: bug`

Site detail is routed as `/detail/[namesite]`, so renaming a site silently breaks every link to
it, and two similarly named sites collide on the same URL. Fix before any deduplication work.

#### 14. Instrument the events KPIs are built from
`Labels: feature, data`

Our mentor's advice was to measure first and decide where to display second. Almost every
stat idea currently in the backlog is a display decision resting on data nobody is recording.
Acceptance: visits, inspections, and per user activity are recorded in a queryable form.

#### 15. Add password reset
`Labels: feature`

No route, no link on the login page. Acceptance: a user who forgets their password can recover
access without an admin.

#### 16. Show stewards a map
`Labels: feature`

The web dashboard map and heat map are admin only, under
`webapp/app/admin/dashboard/components/Map.tsx`, but the mobile app already gives authenticated
users map and analytics tabs. The gap is web specific, so the story should say so or define what
is actually missing. Depends on issue 7.

Progress as of October 7, 2026: the web map is still admin only. The Sprint 2 map story
(US 2.0.6, #60) is still open. See the progress note in item 7.

#### 17. Send the approval email the app already promises
`Labels: bug`

`webapp/components/ProtectedRoute.tsx` tells the user they will receive an email when approved.
Nothing sends one. Either send it or stop promising it.

#### 18. Cache geocoding results and bound the quota
`Labels: bug`

The dashboard re-geocodes every site on every load, one per second, uncached. The OpenCage free
tier allows 2,500 requests per day. Largely resolved by issue 7, but the guard is still worth
having.

### Tier 2, high value with moderate work

#### 19. Fix logout
Both apps already expose logout controls beyond the home page and call Supabase `signOut`. If a
defect remains it is session restoration or reaching pages with the back button after logging out.
Specify and test that behaviour rather than treating logout as missing. US 5.0.4 (Sprint 2, issue #94) now covers this. `Labels: bug`

Status: done. #94 was closed by PR #120, which added the admin navigation bar to the admin site
details page, so sign-out can be reached there. US 5.0.4 (#64) is closed.

#### 20. Paginate the sites list
`/sites` fetches every site and filters and sorts client side in a `useMemo`. `Labels: bug`

#### 21. Build the user profile page
`full_name`, `avatar_url` and `phone` are read in four places and written in zero, so half the data
model is already there. Needs issue 14 for the stats. `Labels: feature`

Status: done. #138, #140, #141 and #142 built the profile page. US 1.0.1 (#54) is closed. It does
not need issue 14: the stats are calculated from `form_responses`. The profile data is in `people`
and `socials`, not in `user_metadata`. See [User Model](user-model.md). US 1.0.2 (#55) is closed
by PR #151.

#### 22. Port the KPIs that already exist in the mobile app
The mobile app already computes total sites inspected, naturalness distribution, top five sites,
"needs attention after two years", and active this year. Porting is much cheaper than building
from nothing. `Labels: feature`

#### 23. Put the database schema in version control
There are zero `.sql` files in the repo and no migrations directory. Two database functions the
dashboard depends on exist only inside Supabase. The deployment manual says to contact the
development team for the schema. `Labels: infra, data`

Status as of October 7, 2026: partly done. `webapp/supabase/migrations/` has 10 migrations.
`get_naturalness_distribution` and `get_top_sites_distribution` are defined in
`20260925000000_local_app_schema.sql` and recreated in `20261003000000_remove_w26_prefix.sql`.
Remaining: the production columns of the legacy tables are not in the repository (for example, the
local `luperson` has only `id` and `email`).

#### 24. Add image deletion and clean up orphaned files
Nothing in the codebase can delete an image. Deleting a report leaves its files in storage
permanently, against a storage budget the client capped at CAD $50. `Labels: feature`

Status: done. PR #148 (closes #65, US 7.0.5). `DELETE /api/site-images` deletes an image row and
calls `deleteObjectsByKeys` (`webapp/utils/media/s3Delete.ts`). `rollbackSiteInspectionSubmission`
now deletes the S3 objects of the report. See [API Documentation](api-documentation.md).

#### 25. Stand up a staging environment
Deliberately left for this team by the client. Also covers the obligation to push approved work to
the client's own deployment after each sprint. `Labels: infra`

#### 26. Make CI actually gate merges
Only the webapp test job runs on pull requests. Lint and build checks are absent. The deploy job
runs on pushes to main only and invokes `/home/ubuntu/deploy/docker-compose.yml`, which lives
outside the repo, while the deployment manual says no CI is needed. The workflow also still
triggers on `Sprint-2` through `Sprint-5`, which do not exist on origin. `Labels: infra`

Status as of October 7, 2026: partly done. `.github/workflows/ci.yaml` runs `webapp-tests`,
`docs-build` and `hook-tests` on every push. `pr-checks.yaml` runs `conventions` and `pr-size`.
`reviewer-gate.yaml` runs `reviewers` (#124, #125), which always passes and posts the result as the
`reviewer-gate` status (#154). The rulesets for `main` and `release` require `webapp-tests`,
`docs-build`, `hook-tests`, `conventions` and `reviewers`, not `reviewer-gate`, so the reviewer
rule is not enforced until an admin changes them. There is no deploy job
and no `Sprint-N` trigger. Remaining: lint and build steps (`webapp-tests` only runs `npm test`).

#### 27. Record inspection edit history
Editing an inspection deletes the old answers and inserts new ones with no record of what changed.
For conservation records spanning decades this matters. `Labels: feature, data`

#### 28. Prepare for December field testing
The client brief commits to field testing in early December 2026, and timed steward scenarios are
an established client practice. Confirm the date and work backwards. `Labels: infra`

#### 29. Clean the naturalness data
`obs_value` holds "4 - Great", "4 = Great" and "Great" interchangeably, papered over by a
case insensitive match in a database function. Every statistic built on it inherits the mess.
`Labels: data`

#### 30. Add "Compare by Question" to the web app
The mobile app lets you pick one question and see its answers across years. Nothing equivalent
exists on the web. The team wrote it as US 7.0.4, which is Won't Have for Fall 2026. `Labels: feature`

#### 31. Fix login and signup accessibility
Observed on the live site: no `<form>` element despite submit buttons, so Enter does not submit
and password managers do not save. No `autocomplete` attributes. Password visibility toggles have
no accessible name at all. Two `<h1>` per page. Low contrast text on the dark green panel. The
user base is explicitly older and less technical. `Labels: ux`

#### 32. Let stewards export their own PDFs
PDF export is admin only today. `Labels: feature`

Status as of October 7, 2026: done. PR #155 merged and closed US 7.0.1 (#68). A steward can
export a PDF of a SIR that they submitted. `POST /api/pdf` returns 403 for a SIR of another person.

#### 33. Promote or delete the `_test` views
`sites_detail_fnr_test`, `sites_report_fnr_test`, `inspectheader_fnr_test` and `luperson_fnr_test`
are in the production read path of one or both apps. `Labels: data`

#### 34. Fix the mobile "Sync Now" button
It only refreshes the analytics numbers, while the user manual tells people to press it to fix
stale site data. Both documented remedies are false. `Labels: mobile, bug`

#### 35. Decide the fate of the Google Sheets pipeline
**Decided on September 25, 2026: retire it.** Frank: "Google the sheets do
not store primary data. Okay. In no way, shape, or form." (D01).
`googleSheets/code.gs` has production database write access. Its sync deletes any row missing from
the sheet, it generates primary keys with max id plus one, and it writes in two steps with a best
effort undo. Whichever schema wins in issue 6 decides whether it keeps working at all.
`Labels: spike, data`

The Apps Script source was removed from the repository in #118. Check whether the deployed script
still runs against production.

#### 36. Fix the mobile delete-by-index bug
`AdminSiteDetailScreen.tsx` passes the temporary list index where the real key belongs, so deleting
the second item in the list wipes whichever inspection happens to have that id, possibly on a
different site. The delete helper also never checks its error and always reports success.
`Labels: mobile, bug`

#### 37. Write a backup and recovery runbook
`Labels: infra, docs`

### Tier 3, worth doing if there is room

#### 38. Reconcile `luperson` with auth accounts
`luperson` is a people table separate from login accounts, and it is the only table shared between
the two halves of the system. This is also the documented cause of Google sign in and email sign up
producing different user records. Needs an invite or claim flow, detection of people with no login
and logins with no person, and duplicate merging. `Labels: data, feature`

The user model (#116, #131) keeps `luperson` unlinked. `people` is now the auth-linked person
table. See [User Model](user-model.md).

#### 39. Unify the two question banks
One definition of the inspection form instead of two. Question numbers must be preserved because
the legacy data is keyed on them. `Labels: data`

#### 40. Add an all-inspections summary view
Asked for by the client at Dragons' Den, never built. `Labels: feature`

#### 41. Show past inspections while filling in a new one
Same source, never built. `Labels: feature`

#### 42. Support non-public, SAPAA-only answers
Sensitive answers that must not appear in public views or in the generated PDF. Specified by the
Winter team as US 1.0.23 and dropped. `Labels: feature`

Status as of October 7, 2026: partly done by #146. An admin can hide questions at export time
(`hiddenQuestionIds` on `POST /api/pdf`). Answers are not stored as non-public. US 7.0.7 (#67) and
task #91 are still open on GitHub.

#### 43. Finish site classification by region and county
A counties table already exists, so this is finishing rather than building. `Labels: feature`

#### 44. Add photo capture to the mobile app
The one device with a camera is the one that cannot attach a photo, while the web app has a
complete upload pipeline. `Labels: mobile, feature`

#### 45. Publish the mobile app so volunteers can install it
The EAS build profiles define Android artifacts only. The repo does have an iOS Expo config and an
`ios` script, so the platform is not unconfigured, but nothing has been published and the manual
tells people to search an app store where the app does not appear. The publication gap still needs
resolving before December field testing if iPhones are in scope. `Labels: mobile, infra`

#### 46. Declare and request device permissions
Camera, photo library and location are none of them declared or requested. `Labels: mobile`

#### 47. Show how stale offline data is
Tell the user "this data is 12 days old", allow refresh without delete, and show storage use.
`Labels: mobile, ux`

#### 48. Migrate 40+ years of legacy inspections
Large, and dependent on issues 6 and 39. Needs to be reversible, re-runnable, and to produce a row
count reconciliation report. `Labels: data`

#### 49. Give mobile and web a shared read model
So a steward sees the same inspection history in both apps. `Labels: data`

#### 50. Resolve offline edit conflicts
Two people editing the same inspection with one offline is currently undefined behaviour, and there
is no version column anywhere in the schema. `Labels: mobile, data`

#### 51. Add offline support to the web app
No service worker, manifest or local storage exists. `Labels: feature`

#### 52. Confirm whether duplicate sites exist before building dedupe
Duplicate sites are mentioned in no document anywhere in this project. Worth ten minutes with the
client before spending a sprint on it. The related defect that is definitely real is issue 13.
`Labels: spike`
