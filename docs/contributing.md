# Contributing

## Commit messages

Every commit message starts with a type in parentheses, then a short description:

```text
(<type>): <description>
```

Allowed types:

| Type | Use for |
| --- | --- |
| `feat` | new user-facing functionality |
| `fix` | bug fixes |
| `docs` | documentation only |
| `chore` | maintenance, config, dependency bumps |
| `refactor` | restructuring without behaviour change |
| `style` | formatting, naming, no logic change |
| `perf` | performance work |
| `build` | build scripts, packaging |
| `ci` | GitHub Actions and other pipeline changes |
| `test` | tests only |
| `del` | removing code, files, or features |

Examples:

```text
(feat): add supplier search
(fix): prevent duplicate checkout
(refactor): extract payment validation
(docs): update setup instructions
```

The space after `):` is optional, so `(docs):update setup instructions` also passes.
For compatibility with older PR commits, `Update <path>` also passes in CI.

## Branch names

```text
<type>/<short-description>
```

The type list is the same as above. Descriptions are lowercase kebab-case: no spaces, no
underscores, no capitals.

Examples:

```text
feat/supplier-search
fix/duplicate-checkout
refactor/payment-validation
docs/local-setup
```

## Branch model

Four kinds of branch, and `main` keeps its name:

```text
feature branch ──PR──> sprint-N ──PR──> main ──PR──> release
```

| Branch | Role | How it changes |
| --- | --- | --- |
| `<type>/<short-description>` | Feature branch. Created from the branch of the current sprint, `sprint-N`. | You push to it. |
| `sprint-N` | Sprint branch, for example `sprint-2`. Every finished PR of sprint N lands here. | PR from a feature branch, squash merge. |
| `main` | Holds only the work of finished sprints. Docs are deployed from it, and each GitHub release is built from it. | One PR from `sprint-N` at the end of the sprint. |
| `release` | What gets released. It only ever holds code that was ready on `main`. Production deploys from it. | PR from `main`, merge commit. |

Each sprint has its own branch, `sprint-N`, made from `main`. Feature branches start from it, and
their PRs go into it. At the end of the sprint, one PR merges `sprint-N` into `main`. The Scrum
Master of the sprint reviews that PR (see [Scrum roles](project-management.md#scrum-roles)). The
GitHub ruleset allows branch names that start with `sprint-`. Every sprint ends with a GitHub
release built from `main` (step 7 below). `sprint-2` is the first sprint branch. The Sprint 2 work
before it merged straight into `main`.

The hosting project (Vercel) has its own production branch setting. It is not stored in this
repository, so nobody can check it from here. The person who owns the hosting account must check
that the production branch is `release`. If it is `main`, every merged PR goes live.

The team that owns Platform / CI/CD / releases in the sprint makes the release (see
[Project management](project-management.md)):

1. Merge `sprint-N` into `main` with one PR that the Scrum Master of the sprint reviews.
2. Open a PR with base `release` and head `main`. Use a title like `(chore): release sprint 2`.
3. Assign the Scrum Master of the sprint and at least one other person
   (see [Scrum roles](project-management.md#scrum-roles)). The Scrum Master's approval is one of
   the 2 required approvals. The `reviewer-gate` status needs every assignee to approve. **This
   is not enforced yet:** the `main` and `release` rulesets require the `reviewers` check, which
   always passes, and not the `reviewer-gate` status. Until a repo admin changes the required
   check in both rulesets from `reviewers` to `reviewer-gate`, any 2 approvals merge the release
   PR, so the Scrum Master has to check the status by hand before merging.
4. Get the 2 approvals and green checks.
5. Before the code is deployed, a human runs the new SQL migrations
   (see [Production database migrations](#production-database-migrations)).
6. Merge with a **merge commit**, so `release` and `main` stay in step and the next release PR
   has no conflicts.
7. Tag the release on `main`, on the commit that was merged into `release`, for example
   `sprint-2`. Publish the GitHub release from that tag. The notes list each story with its issue
   and PRs, the number of CI tests, the known gaps and the feedback from the TA that the sprint
   addressed.

Never commit to `release` directly and never open a PR into it from any branch other than
`main`. The `conventions` check fails the PR if you do. Hotfixes go through `main` like
everything else.

## Production database migrations

Nothing applies the files in `webapp/supabase/migrations/` to production. CI has no migration
job, and a deploy does not run them. A person runs each file by hand in the Supabase dashboard
(SQL editor) on the production project. The app reads only the renamed tables (`sites_pa`,
`questions`, ...) and the new columns (`protected_area_id`, `archived_at`). If the code is
deployed before the SQL, every site and form query fails. So the SQL runs first.

The person who runs it needs access to the production Supabase project. Do not run these files
from the app.

### Before you start

1. Take a backup of the production database (Supabase dashboard > Database > Backups, or
   `pg_dump`).
2. Find out what production already has:

   ```sql
   select to_regclass('public."W26_sites-pa"') as old_sites,
          to_regclass('public.sites_pa')       as new_sites,
          to_regclass('public.people')         as people,
          to_regclass('public.protected_areas') as protected_areas;
   ```

   A name that is not null exists. `old_sites` not null and `new_sites` null means the rename in
   step 2 is still to do. Production may already have some of the later steps. Read the header
   of a file before you run it again: most say that they are safe to run twice.
3. Find functions and views that name a `W26_` table. The rename file rewrites only
   `get_naturalness_distribution` and `get_top_sites_distribution`. Anything else in this result
   breaks at step 2 and needs its own fix first.

   ```sql
   select proname from pg_proc
   where pronamespace = 'public'::regnamespace and prosrc ilike '%W26\_%';
   select viewname from pg_views
   where schemaname = 'public' and definition ilike '%W26\_%';
   ```
4. Set the environment variables of the new build in the hosting project: see
   [Deployment manual](Deployment-manual.md#environment-variables).
   `NEXT_PUBLIC_PROTOMAPS_API_KEY` is baked in at build time, so it must exist before the build.

### Cutover window

Step 2 renames the `W26_` tables. The code that is live now breaks after the rename. The new code
breaks before it. There is no way to avoid a short gap, so do it in a maintenance window, right
before the deploy:

1. Tell the stewards and admins that the app is down for a short time.
2. Run steps 1 to 20 below, in order, in one sitting.
3. Merge the release PR straight away ([Branch model](#branch-model)), so the new code deploys.
4. Open the app and run the smoke test below. The window ends when it passes.

The team agrees the time of the window. Alpha does not run the rename before that.

### Order

Run the files in this order.

| Step | File | Note |
| --- | --- | --- |
| 0 | `20260925000000_local_app_schema.sql` | **Never run this on production.** It is only for a fresh local database: it creates the `W26_` tables, which production already has. It also enables row level security on `luperson` with no policy, so on production it would cut the F26 mobile app and the Google Sheet off from `luperson`. `create table if not exists` does not protect against this. |
| 1 | `20261002000000_fix_questions_section_fk_name.sql` | Run only while `W26_questions` still exists. After the rename the file fails. It does nothing when the constraint already has the right name. |
| 2 | `20261003000000_remove_w26_prefix.sql` | The rename. Do it in the cutover window. |
| 3 | `20261004000000_create_user_model.sql` | Adds the trigger on `auth.users` and a `people` row for each existing login. Check the count after it (below). |
| 4 | `20261004010000_create_protected_areas.sql` | Skip it if `protected_areas` already exists (the `protected_areas` result in the pre-check is not null). Also skip it if the table has a `folder` column, which means step 9 already ran. The header says safe to run twice, but after step 9 dropped `site_id` a second run fails on the `site_id` index. |
| 5 | `20261005000000_profile_distinct_site_count.sql` | |
| 6 | `20261005010000_create_socials.sql` | |
| 7 | `20261005020000_gallery_read_policies.sql` | |
| 8 | `20261006000000_create_kml_imports_bucket.sql` | |
| 9 | `20261006010000_alter_protected_areas_for_kml_import.sql` | Drops 8 columns of `protected_areas`, including `site_id`. |
| 10 | `20261008000000_create_site_page_fields.sql` | Needed for the site page fields. |
| 11 | `20261008164223_delete_site.sql` | Adds `sites_pa.archived_at`. Every site query reads it. |
| 12 | `20261009000000_archive_site_inspection_reports.sql` | Adds `form_responses.archived_at` and redefines the count and dashboard functions. |
| 13 | `20261009120000_add_sites_pa_protected_area_id.sql` | Needed by the admin sites list, the map filter, and adding and editing a site. |
| 14 | `20261009120100_sites_pa_protected_area_id_unique.sql` | If it fails, stop. Two sites share one protected area. Remove the extra link by hand, then run the file again. |
| 15 | `20261009130000_get_max_inspection_number.sql` | From [PR #242](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/242). Adds `get_max_inspection_number`. New reports get no inspection number until it exists. |
| 16 | `20261010000000_form_responses_select_policy.sql` | From [PR #234](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/234). Lets approved users read `form_responses`. Without it the galleries show no images. Check first: `select policyname from pg_policies where tablename = 'form_responses';` |
| 17 | `20261010000100_require_approval_for_people_reads.sql` | From [PR #238](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238). Only approved accounts (and the owner of a row) read `people`, `socials` and `site_stewards`. |
| 18 | `20261011000000_revoke_public_execute_on_report_functions.sql` | From `fix/alpha-code-quality`. Run it after step 15. Only the service role can then call `get_distinct_inspected_site_count` and `get_max_inspection_number`. |
| 19 | `20261011010000_revoke_public_execute_on_dashboard_functions.sql` | From `fix/gamma-sprint-2-gaps`. Run it after step 12. Revokes execute on `get_naturalness_distribution` and `get_top_sites_distribution` from `public` and `anon`. `authenticated` keeps it, because the StewardLog admin dashboard calls both functions after sign-in. |
| 20 | `20261012000000_add_question_atomically.sql` | From `fix/form-editor-save-errors` (#273). Run it after step 2. Adds `add_question_atomically`, for the service role only. Until it exists, adding a question in the form editor fails. |

PRs #234, #238 and #242 are merged on `main`. Steps 18 to 20 come from the Sprint 2 fix branches,
which merge into `main` with the `sprint-2` PR. Run each step only when its file is on `main`.
If a PR merges with a different file name, use the name in the merged PR.

### Checks

Right after step 3, the counts must match:

```sql
select (select count(*) from auth.users) as logins,
       (select count(*) from public.people where auth_user_id is not null) as people;
```

Before step 14, look for two sites that share a protected area:

```sql
select protected_area_id, count(*) from public.sites_pa
where protected_area_id is not null group by 1 having count(*) > 1;
```

Smoke test after the deploy: `/sites` (list and map), a new report with a photo, the profile page,
assigning a steward, archiving a site and a report, and the gallery.

Then, in the app:

1. An admin runs the KML import (Admin > Sites) to fill `protected_areas`.
2. Admins link each site to a protected area.
3. Check that admins and approved users have `app_metadata.role` and `app_metadata.authenticated`.

If a query fails with `PGRST200` after a migration, run `notify pgrst, 'reload schema';` and try
again.

### Local and CLI-managed databases

Two files were merged out of timestamp order: `20261005020000_gallery_read_policies.sql` (after
the `20261006*` files) and `20261008000000_create_site_page_fields.sql` (after
`20261008164223_delete_site.sql`). `supabase migration up` does not apply a file that is older
than one it has already applied. A local database that was set up before these merged can miss
the gallery policies or `site_page_fields`. Run this once:

```bash
supabase migration up --local --include-all
```

These commands are for local databases only. Never run `supabase db push` against production:
there is no staging, and production is migrated by hand in the cutover window (above).
`--include-all` would apply every file, including step 0 and the `W26_` rename, with no
pre-checks. If a local database cannot be fixed, `supabase db reset` rebuilds it from the files.

When a PR merges late, give its migration a timestamp later than every file on `main`.

## How this is enforced

A local `commit-msg` hook in `.githooks/` checks both the message and the current branch
name on every commit. It is installed by the `prepare` script in `package.json`, so a fresh
clone picks it up the first time you run `npm install` — from the repository root, `webapp/`,
or `FNR/`, whichever you install first.

If you cloned before the hook existed, or you skipped `npm install`, wire it up by hand:

```bash
git config core.hooksPath .githooks
```

`main`, `master` and `release` are exempt from the branch check, and git's own merge, revert, and
autosquash messages are left alone.

After editing the hook, check it still behaves:

```bash
sh .githooks/test-hooks.sh
```

## Bypassing the hook

It is an ordinary local git hook, so it can be skipped with `git commit --no-verify`. That only
gets you past your own machine: CI runs the same script on every commit in a PR, so a
badly named commit will still fail the PR. Fix it with `git commit --amend` or an interactive
rebase, then force-push your branch.

## CI

| Workflow | Runs on | Jobs and checks |
| --- | --- | --- |
| `ci.yaml` | Every push to any branch, and by hand | `webapp-tests`: `npm ci`, `npx tsc --noEmit`, `npm run test:ci`, `npm run build`, then `npm run lint -- --max-warnings 0`. `docs-build`: `mkdocs build --clean`. `hook-tests`: `sh .githooks/test-hooks.sh`. |
| `pr-checks.yaml` | PRs into `main`, `release` and `sprint-*` | `conventions` (branch name, PR title, commit messages) and `pr-size`. |
| `reviewer-gate.yaml` | PRs into `main`, `release` and `sprint-*`, and reviews | `reviewers`, which posts the `reviewer-gate` status. |
| `diagrams.yaml` | PRs into `main`, `release` and `sprint-*` | See [The diagrams workflow](#the-diagrams-workflow). |
| `e2e.yaml` | PRs into `main` and `release`, and by hand | `cypress`: runs `cypress/e2e/logout.cy.ts` and `cypress/e2e/profile.cy.ts` against a local Supabase that it starts in the job (the migrations, `supabase/seed.sql` and `scripts/e2e_seed.js`). |

Rules of the gates:

- **Lint blocks.** Any ESLint error or warning fails `webapp-tests`. Run `npx eslint .` in
  `webapp/` before you push.
- **Coverage blocks.** `npm run test:ci` is `jest --coverage`. It fails when the global coverage
  falls below `coverageThreshold` in `webapp/jest.config.ts` (statements 83, branches 72,
  functions 77, lines 85 percent). Run `npm run test:ci` in `webapp/` before you push.
- **Known problem.** `webapp-tests` runs `npm run test:ci` before the lint step, and the test run
  writes `webapp/coverage/`. `eslint.config.mjs` does not ignore that folder, so ESLint reports an
  unused `eslint-disable` directive in `coverage/lcov-report/block-navigation.js`, and
  `--max-warnings 0` fails the job. Until `coverage/**` is added to the ignores, delete
  `webapp/coverage/` before you run ESLint locally.
- **E2E runs only some specs.** The other Cypress specs need production data, real S3 images or
  an app fix. The comment in `e2e.yaml` names each excluded spec and the reason. `cypress` is not a
  required check. To save Actions minutes, it does not run on PRs into `sprint-*`.

As of October 11, 2026, GitHub Actions has not run since October 10, because the account's Actions
payments failed. Until it runs again, the results of these gates come from local runs only.

## GitHub rules

These are enforced on GitHub itself, not just locally.

**Branches.** GitHub rejects any new branch whose name doesn't start with one of the types
above followed by `/`. `main`, `release`, `gh-pages` and `dependabot/**` are the only exceptions. So
`feat/site-search` works, but `saumya/test` or `username-patch-1` won't push. When you edit a
file in the GitHub web editor, rename its suggested `patch-1` branch before you commit.

**`main` and `release` are PR-only.** The rules below apply to both. Nobody can push, force-push or delete either one directly. Everything
goes through a pull request, and a PR needs all of these before it can merge:

- **2 approvals from teammates.** Pushing a new commit dismisses earlier approvals, and the
  latest push has to be approved by someone other than its author.
- **Assigned reviewers.** Assign 2 or more people to the PR (sidebar > Assignees). Then only
  they can review and **all** of them must approve. With no assignees, any 2 teammates can
  approve. Exactly 1 assignee fails the `reviewer-gate` status. A bot comment reminds assignees to
  read every changed file top to bottom before approving.
- **All review conversations resolved.**
- **Green checks:** `webapp-tests`, `docs-build`, `hook-tests`, `conventions` (branch name,
  PR title and every commit message) and `reviewers`. The rulesets still name `reviewers`, which
  always passes. The `reviewer-gate` status carries the real result, and a repo admin must
  require it instead (see the Scrum Master step in the release PR steps).

**Squash merge only on `main`** (`release` takes merge commits only, see Branch model). Each PR lands on `main` as one commit, and the PR title is its
message. That's why the PR title has to follow the `(<type>): <description>` format too.
Branches are deleted automatically after merge.

**Copilot.** Copilot reviews every PR automatically. Its review never counts as one of the
2 approvals, because GitHub only lets Copilot comment. If the second reviewer is genuinely
unavailable, a repo admin can merge with 1 teammate approval plus a Copilot review that has
no unresolved comments. GitHub logs every one of those bypasses, so use it sparingly and say
why in the PR.

**Large PRs.** When a PR changes more than 500 lines, it gets a `large-pr` label and a
comment suggesting you split it. The number of lines does not include changes in `docs/`,
`webapp/package-lock.json` or `FNR/package-lock.json`. The number includes changes in all
other lockfiles, for example the root `package-lock.json`. It's only a nudge
and never blocks the merge.

**Code owners.** `.github/CODEOWNERS` auto-requests reviewers based on the files a PR
touches. At this time, it covers only `.github/` and `.githooks/`. An owner's approval isn't
required beyond the normal 2.

## Issues and the project board

New issues go through a template (user story, bug or task). Each one lands on the
[SAPAA project board](https://github.com/orgs/UAlberta-CMPUT401/projects/168) automatically.
Set the milestone in the sidebar, then set **Sprint** and **MoSCoW** on the board. Status
moves Todo → In progress → In review (PR open) → Done.

PRs are labelled by the folders they touch (`webapp`, `mobile`, `docs`, `infra`), so you can
filter the PR list down to your area.

## Diagrams

The Mermaid sources are in `docs/assets/*.mmd`. The rendered SVGs are in `docs/images/`.
[Software design](software-design.md) shows them.

Run this from the repository root after you change a migration, a server module or a `.mmd` file:

```bash
npm run diagrams        # update the generated parts, then render the SVGs that changed
npm run diagrams:check  # change nothing; fail if a diagram or an SVG is out of date
```

The tool is in `tools/diagrams/` and has its own `package.json`. It needs Node 22.13 or later.
The first run downloads a headless Chrome (about 200 MB on disk) for the renderer.

| Diagram | Generated part comes from |
| --- | --- |
| `ER_Diagram.mmd` | `webapp/supabase/migrations/*.sql`, applied in filename order with the Postgres parser |
| `UML_Class_Diagram_Models.mmd` | the same migrations (tables) and `webapp/lib/pdf/types.ts` (`PdfOptions`) |
| `UML_Class_Diagram.mmd` | the exported functions and route handlers of the modules in `tools/diagrams/src/config.mjs` |

Rules:

- The tool writes only between `%% BEGIN GENERATED: <name>` and `%% END GENERATED: <name>`.
  Do not edit that block. Everything outside it is hand-written and the tool keeps it, with
  the exceptions below.
- Class diagrams: to show a proposed item, write it outside the markers with a `[NEW x.y.z]`
  tag. For a new member of an existing class, add a second block of that class
  (`class Site { ... }`). Mermaid joins the two blocks.
- Class diagrams: when the code or a migration adds a proposed member, the tool removes the
  hand-written line. It also removes a `<<new table x>>` class when table `x` exists.
- Class diagrams: you can add a `[CHANGE x.y.z]` tag at the end of a generated line. The tool
  keeps it.
- `ER_Diagram.mmd` shows only the current schema. The tool removes a hand-written entity block
  for a generated table, and a column that the schema does not have (it shows a warning). It
  does not keep tags on generated lines. Put proposed tables and columns in
  `ER_Diagram_Proposed_User_Stories.mmd`.
- To add a module, a table or a column note, edit `tools/diagrams/src/config.mjs`.
- The sequence diagrams, `Architecture.mmd` and `ER_Diagram_Proposed_User_Stories.mmd` are
  hand-written. The tool warns when one of them names a table that a migration dropped or
  renamed, or a dropped or renamed column as `table.column`. It does not find a column name
  without its table.
- The tool renders a `.mmd` again only when its content changes. The hashes are in
  `docs/assets/.diagram-hashes.json`. A `.mmd` file is saved to the SVG name that
  `docs/software-design.md` links, for example `ER_Diagram.mmd` to `ER_Diagram_mermaid.svg`.
- Running the tool twice gives no changes.
- Self-check: `npm --prefix tools/diagrams test`. The workflow also runs it.
- The services diagram does not read `webapp/node_modules`. A type from a package shows as
  `any`, so the output is the same with or without the webapp packages installed.

### The diagrams workflow

`.github/workflows/diagrams.yaml` runs when a PR into `main`, `release` or a `sprint-*` branch is
opened, reopened or updated. It has two jobs:

| Job | Token | What it does |
| --- | --- | --- |
| `diagrams` | read-only, not kept in `.git/config` | Runs `npm run diagrams` and the self-check. If a file in `docs/assets` or `docs/images` changes, it saves the change as a patch. A render failure fails this job. |
| `diagrams-push` | GitHub App token | Runs only when the patch is not empty. It runs no code from the PR. It checks that the patch changes only `docs/assets` and `docs/images`, applies it, and pushes one commit, `(docs): update diagrams`, to the PR branch. |

`diagrams-push` fails, and does not push, in these cases. Run `npm run diagrams` and commit
the result.

| Case | Why it does not push |
| --- | --- |
| PR from a fork | It cannot push to a fork. |
| PR from `main` into `release` | `main` is PR-only. |
| The last commit is the diagrams commit | The tool did not give the same result twice. This stops a loop. |
| The `DIAGRAMS_APP_ID` variable is not set | There is no token that can push. |

The guard checks the committer of the last commit, not the author. A rebase sets a new
committer, so the job runs again on a rebased branch. If someone pushes while the job runs,
the push fails and nothing is overwritten. The next run updates the diagrams.

**The push token.** A push made with the default `GITHUB_TOKEN` does not start other workflows.
The five required checks of the `main` ruleset are `webapp-tests`, `docs-build`, `hook-tests`
(`ci.yaml`, on `push`), `conventions` (`pr-checks.yaml`) and `reviewers` (`reviewer-gate.yaml`,
both on `pull_request`). The `reviewers` job always passes. It posts its result as the
`reviewer-gate` status. None of them run on a commit pushed with `GITHUB_TOKEN`, so the PR
cannot merge. For this reason the workflow pushes only with a GitHub App token. A repo admin
sets it up:

1. Create a GitHub App, or use an existing one, with the repository permission
   **Contents: read and write** only. Install it on this repository only.
2. Add the repository variable `DIAGRAMS_APP_ID` (the App ID) and the secret
   `DIAGRAMS_APP_KEY` (the private key).

Do not use a personal access token. The `diagrams` job runs code from the PR, and a token of a
person lets a teammate push as that person.

As of October 7, 2026, the variable and the secret are not set. So `diagrams-push` fails when
the diagrams are out of date, and the author runs `npm run diagrams`.

**Required check.** The diagrams jobs are not required checks in the `main` ruleset, so a PR
with out-of-date diagrams can still merge. To block it, the ruleset owner (Gamma) adds
`diagrams` and `diagrams-push` as required checks.

**Approvals.** The `main` ruleset dismisses approvals on a new push, and the latest push must be
approved by someone other than its author. The `reviewer-gate` status counts approvals on the head
commit only. So a diagrams commit after an approval needs new approvals. Run
`npm run diagrams` and commit the result before you ask for review, and the workflow has
nothing to push.
