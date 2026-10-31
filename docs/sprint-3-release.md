# Sprint 3 release checks

**Status: released on October 26, 2026. `sprint-3` is merged into `main` (#319 and #336), `main` is merged into `release` (#337), and the tag `sprint-3` is on `release` at `7e1ce196`.** Deadline: October 27, 2026, at 20:00 MDT.
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
| Database rules and site links | 4 local database suites, 36 tests passed. They use the real local Supabase. The migration-safety suite runs each check inside a rolled-back transaction. This is not evidence that production migrations ran. |
| Focused acceptance suites | 14 suites, 357 tests passed. The map reconnection test is in `SiteMap.test.tsx`. |
| Clean production build | Passed with local placeholder settings on an isolated source copy. Compilation and build type checking passed. |
| Full unit suite on this branch | Passed: 1895 tests, 36 skipped, 0 failed (131 passing suites). The four database suites skip in this run and were run separately (row above). Type check and full lint passed on the same source. The production build, docs build and hook tests were checked on the source before these test additions. |

The prior sprint CI run ([40403404181](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/actions/runs/40403404181)) failed the profile query-count and date tests. The combined local run above includes their fixes. Do not use the older CI run as release evidence.

The test plan and traceability matrix cover **50 ATs: 47 covered, 3 partial and 0 with no test**.
The partial rows are active-site map filtering (2.0.1 AT1) and every view after a report edit
(4.0.4 AT4). The profile-history row details (1.0.3 AT1) and the activity count (1.0.4 AT2) now
have labelled tests. Coverage counts are not a claim that the full suite or production acceptance
passed.

Three Sprint 3 Cypress specs are in the CI spec list: `map_site_popup.cy.ts` (2.0.8),
`edit_own_report.cy.ts` (4.0.4) and `password_reset_wrong_code.cy.ts` (5.0.2). They need only the
seed for users, sites, boundaries and the report owned by the seeded steward. They have not been
run locally; the E2E job is the evidence. The reset spec uses a wrong code, so it needs no SMTP
message.

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
Do not run the local bootstrap migration on production. On October 26 the team
decided that applying them is not a gate for this release. Features that read the new tables
and functions will not work in production until the missing files are applied.

| File | Review observation |
|---|---|
| `20261020000000_create_gpx_tracks.sql` | Private bucket, 50 MiB size cap, GPX MIME types, site/user foreign keys and role/approval checks for reads/inserts. The path refinement is a later migration. |
| `20261020100000_link_sites_to_protected_areas.sql` and `20261021000000_link_sites_to_protected_areas.sql` | Byte-identical. Keep both history entries. The service-role-only RPC links unambiguous matches and calculates centres. Applying the files does not run the linking operation. |
| `20261022000000_add_answer_visibility.sql` | Adds `answers.is_hidden` with a false default. Existing answers remain visible. Server read/write tests and local browser checks cover the application filter. |
| `20261023000000_add_protected_area_boundary_color.sql` | Adds the optional color and a hex constraint. Existing grants apply; approved Admin actions control writes. |
| `20261024000000_add_site_priority_scores.sql` | Adds nullable scores and saved-by/date fields with a validity constraint. No existing score data is replaced. |
| `20261024010000_create_export_jobs.sql` | Creator-only authenticated reads. No authenticated insert, update or delete grant; the checked server route uses the service role. |
| `20261024020000_check_gpx_track_path.sql` | Apply the version merged by #312 after the GPX table. It constrains new insert paths and does not clean old rows. |
| `20261025000000_fix_site_delete_impact.sql` | Replaces the site delete impact and permanent delete functions. Execute stays with the service role only. A GPX file in the bucket is not removed with its row. |
| `20261025000010_add_missing_fk_indexes.sql` | Eleven indexes, no policy or grant change. Locks each table while it builds. |
| `20261025000020_count_one_naturalness_answer_per_report.sql` | Replaces one read-only chart function. Grants are unchanged. Counts a report once even if it holds two Q31 rows. |

This inventory is not a production migration record. Issue #183 was closed as completed on
October 26 together with #321, which Abhinav approved after reviewing it against #183. The
production schema and bucket policies were not checked; a successful local test does not prove
either.

## TA feedback addressed

| Feedback | Close-out response |
|---|---|
| Too many branches and trivial PRs | One export follow-up PR (#318) was explicitly approved after #309 merged with a confirmed error. The acceptance tests and release records are commits in that same follow-up. Docs-only PRs still happened in Sprint 3 (#302, #314 and #317), so this claim is not met in full. Later records, including this update, are commits on `sprint-3`. |
| Test locally before commits; use CI for integration | Local export tests, focused acceptance tests, database checks, a clean build and real browser checks were run. The final sprint CI result remains a release gate. |
| Meaningful human review | The follow-up names the failure state and the regression tests. Green reviewers are assigned. No agent approves its own change or substitutes a generic approval for a story review. |
| Reuse the S3 client and Admin checks | #311 introduced the shared helpers. #318 reuses `lib/s3/client.ts` in file export and its status route. Mock state is reset between tests. |
| Gallery pagination and other repeated helpers | The export catalog already pages in batches of 1000 and has a test beyond one page. This close-out does not refactor all gallery routes or unrelated UI components. The broader TA suggestions remain follow-up work for their owners. |

## Release gates

- [x] Export follow-up #318 and migration follow-up #321 reviewed and merged into `sprint-3`.
- [x] The profile test fixes are included; the full local unit suite is green. CI is still required.
- [ ] Type check, build, lint, docs and required checks pass on the final sprint commit.
- [x] Schema and access-rule review: #183 closed as completed on October 26 with #321.
- Production migrations: not a release gate (team decision, October 26).
- [x] Production email template, SMTP, redirect URLs, Protomaps key and hosting limits checked (reported as passed by Saumya, October 26).
- [ ] Abhinav reviews the sprint PR into `main` in place of the Scrum Master (decided October 26); the required human approvals are present. Abhinav approved #336. #336 was merged with one human approval, and the ruleset needs two.
- [x] Merge `sprint-3` into `main` (PR #319, October 26).
- [x] Open `main` into `release` (#337).
- [x] Merge with a merge commit (#337). No human approval is recorded on #337, and its checks were queued when it merged. This is an open gap, not a pass.
- [x] Run production smoke checks using approved test accounts and data (reported as passed by Saumya, October 26; a manual check, not Cypress).
- [x] Create the `sprint-3` tag and publish the release notes. The tag is on `release` at `7e1ce196`.

The live rulesets require `reviewers`, not the separate `reviewer-gate` status. Check assigned
reviewer approvals by hand; do not change a ruleset or use an Admin bypass to make this release.
Do not publish a success claim while a gate above is open.

**Merge record for #319.** It merged on October 26 at 23:59 UTC as `0915e6a`, with approvals from Chris and Abhinav and a Copilot comment. Jayden's review (the gate above) is not recorded on the PR. The check rollup shows `cypress` and `conventions` failed and one `reviewers` run cancelled. The `conventions` check failed because the branch-name rule rejected the head branch `sprint-3` (the hook exempted only `main`, `master` and `release`); the commit messages were valid. The hook now exempts `sprint-N`. The `cypress` check failed with `EADDRINUSE :::3000` on the self-hosted runner, a CI problem and not a test failure ([#323](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/323)). The `reviewer-gate` status was waiting for Jayden; `webapp-tests`, `diagrams`, `diagram-svg-check`, `docs-build`, `pr-size` and `hook-tests` passed. The gates that depend on those checks stay open.

**Follow-up issues from the Sprint 3 review (October 26).** [#323](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/323) runs Cypress against the deployed site and fixes the E2E port conflict (Chris). [#324](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/324) makes the export skip missing files (Chris). [#325](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/325) adds the missing acceptance tests and fixes the matrix counts (Abhinav). [#326](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/326) fixes the accessibility gaps (Abhinav). [#328](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/328) hardens the password reset and the auth redirect (Alissa and Jayden).

### Final record

| Item | Value |
|---|---|
| Final sprint commit | `ab3be99` (head of `sprint-3` before this record update). `main` has the squash commit `0915e6a`. |
| Sprint-to-main PR | [#319](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/319), merged October 26 as `0915e6a`; #318 and #321 are merged |
| Main-to-release PR | [#337](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/337), merged October 26 as `7e1ce196` (merge commit) |
| Production migrations applied by / time | Not a gate (team decision, October 26) |
| Production smoke check by / time | Reported as passed by Saumya on October 26, 2026. The name of the person who ran it and the time are not recorded. |
| Released commit and tag | `7e1ce196` on `release`, tag `sprint-3`, [release](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/releases/tag/sprint-3). `main` is at `a2dee785`. |

## Release notes

These are the notes for the GitHub release. They were written on October 26 from the merged PRs. Add the released commit and the final CI result when the release is published.

Merged from `sprint-3` into `main` in [#319](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/319).

#### User stories (14, 68 points)
- US 1.0.3 Show history of Site Inspections on a Steward's Profile ([#169](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/169), PR #298). One AT is only partly tested.
- US 1.0.4 Aggregate User Activity and Contributions on a user's profile ([#170](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/170), PR #315). One AT has no test yet.
- US 1.0.6 Select and Edit Skills and Focus Areas (PR #308)
- US 2.0.1 View Sites and Past Visits on an Interactive Map ([#171](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/171), PRs #296 and #301). Sites without a boundary are not drawn yet.
- US 2.0.8 View a Site's Details From the Map ([#172](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/172), PR #297)
- US 2.0.9 Upload a GPX Track of a Site Visit ([#173](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/173), PRs #296, #301 and #312)
- US 2.0.12 Score a Site for To-Visit Priority (PR #307)
- US 2.0.13 Flag Site Points That Are a Year Old (PR #307)
- US 2.0.14 Color Map Sites by Type (PRs #301 and #313)
- US 3.0.3 Export all digital files from SIR-SAPAA (PRs #309 and #318)
- US 4.0.2 Offline and Online Map Layers ([#175](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/175), PRs #293 and #299)
- US 4.0.4 Edit My Previous Inspections ([#176](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/176), PR #300). One AT is only partly tested.
- US 5.0.2 Reset a Forgotten Password ([#179](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/179), PRs #295 and #302)
- US 6.0.1 Store Each Site's Geometry From the Shared Source ([#180](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/180), PRs #294, #303 and #313)

US 3.0.4 (stewards without an account) was removed on October 26 because Frank requires stewards to have an account and sign in. PR #310 was closed without merge.

#### Before deploying
Run the new SQL migrations in production in the order listed in [docs/contributing.md](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/contributing.md#production-database-migrations). On October 26 the team decided that applying them is not a gate for this release. The map tracks, priority scores, export, boundary colors and hidden answers do not work in production until they are applied. Production deploys from `release`.

Also check the email template and SMTP for the password reset code, the redirect URLs, and the Protomaps key.

#### Known gaps
- The acceptance tests were not run against the deployed system. The E2E job fails on the runner with a port conflict ([#323](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/323)).
- The to-visit priority score is a plain sum of three scores. Frank has not confirmed the formula.
- The export of all files fails if one stored file is missing ([#324](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/324)).
- Acceptance test and traceability gaps are tracked in [#325](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/325), accessibility gaps in [#326](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/326), and password reset hardening in [#328](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/328).
