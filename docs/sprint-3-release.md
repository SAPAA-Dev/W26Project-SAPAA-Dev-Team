# Sprint 3 release checks

**Status: prepared, not published.** Deadline: October 27, 2026, at 20:00 MDT.
The release must follow `sprint-3` to `main` to `release`. Do not tag or deploy an unreviewed
feature branch. The current code freeze was missed; a merged story is not release approval.

## Scope

The current scope is **14 stories and 68 points**. On October 26, Frank required stewards to
have an account and sign in. US 3.0.4 (3 points) was removed and PR #310 was closed without merge.
This work is not carry-over to Sprint 4.

| Story | Code PRs |
|---|---|
| 1.0.3 Profile inspection history and hidden answers | #298 |
| 1.0.4 Profile activity totals | #315 |
| 1.0.6 Skills and focus area dropdowns | #308 |
| 2.0.1 Map sites and past visits | #296, #301 |
| 2.0.8 Site details from the map | #297 |
| 2.0.9 GPX upload | #296, #301; path policy #312 |
| 2.0.12 To-visit priority | #307 |
| 2.0.13 Old-score reminder | #307 |
| 2.0.14 Boundary colors | #301, #313 |
| 3.0.3 Export all digital files | #309; state-write fix #318 |
| 4.0.2 Offline and online maps | #293, #299 |
| 4.0.4 Edit previous reports | #300 |
| 5.0.2 Password reset | #295, #302 |
| 6.0.1 Site boundaries | #294, #303, #313 |

The safety and iNaturalist stories removed earlier remain out of scope. Their removed tasks
must not be counted as unfinished release features. The demo and retrospective (#218) are on
October 28 and are not an overdue pre-release implementation task.

## Acceptance evidence

The checks below ran on October 26 against the real local app and local Supabase. Disposable browser
accounts and report/site fixtures were removed after each browser run. The database suites keep
their standard local E2E seed data. Production was not used. No
Cypress or native mobile build was run.

| Check | Result and limits |
|---|---|
| Offline map, 4.0.2 AT1 to AT4 | Passed. The real MapLibre renderer saved 96 tiles into the browser Cache API. Offline zoom used the cache without new tile requests. Panning outside the saved area showed the missing-tile indicator. Reconnecting cleared the offline badge and made new live requests. Tile responses were controlled local fixtures; this does not check a production Protomaps key or a full offline page reload. |
| Password reset, 5.0.2 AT1 to AT4 | Passed. The app sent a real message to the local SMTP inbox. Its six-digit code opened the reset page. The browser changed the password. An invalid code and the old password were refused; the new password signed in. No Admin intervention was needed after fixture creation. This does not prove production SMTP or its template is configured. |
| Report edit and visibility, 4.0.4 AT1 to AT3 and part of AT4 | Passed locally. The owner opened edit mode and saved changed text. The database and site view showed the new text with its hidden flag retained. Clearing a required answer blocked Save and left the stored report unchanged. Another approved steward could neither see the hidden text nor enter edit mode. Every PDF, profile and Admin summary view was not rechecked after the same edit. |
| Server report rules | The focused Jest run passed the ownership, approval, required-answer and hidden-answer tests. These use mocked Supabase/S3. |
| Export job failure handling | 38 export tests passed, including three new tests that fail on the old state-write code. A failed processing write stops the upload; a failed completion write records failure; failure to record that failure rejects to the existing background error handler. S3 and Supabase are mocked. |
| Database rules and site links | 3 local database suites, 25 tests passed. The tests use the real local Supabase. This is not evidence that production migrations ran. |
| Focused acceptance suites | 14 suites, 357 tests passed. The map reconnection test is in `SiteMap.test.tsx`. |
| Clean production build | Passed with local placeholder settings on an isolated source copy. Compilation and build type checking passed. |
| Full unit suite on the sprint source after #305, #312 and #315, with the #318 changes | Passed: 1912 tests, 25 skipped, 0 failed (132 passing suites). Chris's shared-branch commits corrected the profile query count, forced the date test time zone and mocked the site gallery request. Type check and full lint also passed. Required CI is still pending. |

The prior sprint CI run ([40403404181](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/actions/runs/40403404181)) failed the profile query-count and date tests. The combined local run above includes their fixes. Do not use the older CI run as release evidence.

The test plan and traceability matrix cover **50 ATs: 46 covered, 3 partial and 1 with no test**.
The partial rows are profile-history row details (1.0.3 AT1), active-site map filtering (2.0.1 AT1)
and every view after a report edit (4.0.4 AT4). Activity-count AT2 still needs explicit count-plus-one
evidence. Coverage counts are not a claim that the full suite or production acceptance passed.

### Repeat the browser checks

1. Start only a local Supabase and the local app. Confirm the API URL is `localhost` or
   `127.0.0.1` before creating any fixture. Use a disposable account, site and report.
2. For the map, supply controlled map tiles or a permitted test provider. Save an area, switch
   the browser offline, pan and zoom, leave the area, then reconnect. Check both the visible
   indicators and network requests. Do not reload the whole app as a substitute for checking
   the map-layer story.
3. For password reset, request a code through the app. Read it from a local mail inbox, verify
   it, set a new password and sign out. Test sign-in with the old and new passwords. Confirm
   the local template includes the six-digit token.
4. For report edits, sign in as the report owner, change a hidden answer and save. Check the
   database and site view. Clear a required answer and confirm that Save is blocked with the
   missing-question list. Sign in as another approved steward and check visibility and edit
   refusal. Remove only the fixtures created for the check.

## Schema and migration review

The complete order is in [Contributing](contributing.md#production-database-migrations).
Do not run the local bootstrap migration on production. A human with production access must
check what is already applied and run only the missing, merged files before code deployment.

| File | Review observation |
|---|---|
| `20261020000000_create_gpx_tracks.sql` | Private bucket, 50 MiB size cap, GPX MIME types, site/user foreign keys and role/approval checks for reads/inserts. The path refinement is a later migration. |
| `20261020100000_link_sites_to_protected_areas.sql` and `20261021000000_link_sites_to_protected_areas.sql` | Byte-identical. Keep both history entries. The service-role-only RPC links unambiguous matches and calculates centres. Applying the files does not run the linking operation. |
| `20261022000000_add_answer_visibility.sql` | Adds `answers.is_hidden` with a false default. Existing answers remain visible. Server read/write tests and local browser checks cover the application filter. |
| `20261023000000_add_protected_area_boundary_color.sql` | Adds the optional color and a hex constraint. Existing grants apply; approved Admin actions control writes. |
| `20261024000000_add_site_priority_scores.sql` | Adds nullable scores and saved-by/date fields with a validity constraint. No existing score data is replaced. |
| `20261024010000_create_export_jobs.sql` | Creator-only authenticated reads. No authenticated insert, update or delete grant; the checked server route uses the service role. |
| `20261024020000_check_gpx_track_path.sql` | Apply the version merged by #312 after the GPX table. It constrains new insert paths and does not clean old rows. |

This inventory is not Green's approval and is not a production migration record. Issue #183
must carry the human review before release. Confirm the production schema and bucket policies;
a successful local test does not prove either.

## TA feedback addressed

| Feedback | Close-out response |
|---|---|
| Too many branches and trivial PRs | One export follow-up PR (#318) was explicitly approved after #309 merged with a confirmed error. The acceptance tests and release records are commits in that same follow-up. The branch hook rejected direct commits on `sprint-3`, so no hook was bypassed. No separate PR is made for each document. |
| Test locally before commits; use CI for integration | Local export tests, focused acceptance tests, database checks, a clean build and real browser checks were run. The final sprint CI result remains a release gate. |
| Meaningful human review | The follow-up names the failure state and the regression tests. Green reviewers are assigned. No agent approves its own change or substitutes a generic approval for a story review. |
| Reuse the S3 client and Admin checks | #311 introduced the shared helpers. #318 reuses `lib/s3/client.ts` in file export and its status route. Mock state is reset between tests. |
| Gallery pagination and other repeated helpers | The export catalog already pages in batches of 1000 and has a test beyond one page. This close-out does not refactor all gallery routes or unrelated UI components. The broader TA suggestions remain follow-up work for their owners. |

## Release gates

- [ ] Export follow-up #318 reviewed and merged into `sprint-3`.
- [x] The profile test fixes are included; the full local unit suite is green. CI is still required.
- [ ] Type check, build, lint, docs and required checks pass on the final sprint commit.
- [ ] Green records the schema/access-rule review in #183.
- [ ] A human records the production migration state and applies missing merged files.
- [ ] Production email template, SMTP, redirect URLs, Protomaps key and hosting limits checked.
- [ ] Jayden reviews the sprint PR into `main`; the required human approvals are present.
- [ ] Merge `sprint-3` into `main`, then open `main` into `release`.
- [ ] Get the required release reviews and green checks. Merge with a merge commit.
- [ ] Run production smoke checks using approved test accounts and data.
- [ ] Create the `sprint-3` tag on the released `main` commit and publish the release notes.

The live rulesets require `reviewers`, not the separate `reviewer-gate` status. Check assigned
reviewer approvals by hand; do not change a ruleset or use an Admin bypass to make this release.
Do not publish a success claim while a gate above is open.

### Final record

| Item | Value |
|---|---|
| Final sprint commit | Pending final fixes and CI |
| Sprint-to-main PR | [Draft #319](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/319); waits for #318 and release gates |
| Main-to-release PR | Pending sprint merge |
| Production migrations applied by / time | Human record required |
| Production smoke check by / time | Human record required |
| Released main commit and tag | Not published |

## Draft release notes

Sprint 3 adds map visit tracks and GPX upload, offline map areas, site details and boundary
colors, boundary linking, profile inspection history and activity totals, profile dropdowns,
report editing and hidden answers, password reset, site visit-priority scores and reminders,
and ZIP export of digital files.

US 3.0.4 was removed because stewards must have an account and sign in. The release also
addresses TA feedback on S3 reuse and the diagram check. The final published notes must include
the released commit, final CI counts, applied migrations and known acceptance limits. Do not
copy the pending local test failure into a claim that the release passed.
