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

Three kinds of branch, and `main` keeps its name:

```text
feature branch ──PR──> main ──PR──> release
```

| Branch | Role | How it changes |
| --- | --- | --- |
| `<type>/<short-description>` | Feature branch. Always created from `main`. | You push to it. |
| `main` | Development branch: all finished work lands here. Docs are deployed from it. | PR from a feature branch, squash merge. |
| `release` | What gets released. It only ever holds code that was ready on `main`. | PR from `main`, merge commit. |

Gamma makes each release (see [Project management](project-management.md)):

1. Open a PR with base `release` and head `main`. Use a title like `(chore): release sprint 2`.
2. Get the normal 2 approvals and green checks.
3. Merge with a **merge commit**, so `release` and `main` stay in step and the next release PR
   has no conflicts.
4. Publish the GitHub release from `release`.

Never commit to `release` directly and never open a PR into it from any branch other than
`main`. The `conventions` check fails the PR if you do. Hotfixes go through `main` like
everything else.

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
- **Green checks:** `webapp-tests`, `mobile-tests`, `docs-build`, `hook-tests`,
  `conventions` and `reviewer-gate` (branch name, PR title and every commit message).

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
other lockfiles, for example the root `package-lock.json` and `deno.lock`. It's only a nudge
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

`.github/workflows/diagrams.yaml` runs when a PR into `main` or `release` is opened, reopened
or updated. It has two jobs:

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
both on `pull_request`). None of them run on a commit pushed with `GITHUB_TOKEN`, so the PR
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
approved by someone other than its author. The `reviewers` check counts approvals on the head
commit only. So a diagrams commit after an approval needs new approvals. Run
`npm run diagrams` and commit the result before you ask for review, and the workflow has
nothing to push.
