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

## How this is enforced

A local `commit-msg` hook in `.githooks/` checks both the message and the current branch
name on every commit. It is installed by the `prepare` script in `package.json`, so a fresh
clone picks it up the first time you run `npm install` — from the repository root, `webapp/`,
or `FNR/`, whichever you install first.

If you cloned before the hook existed, or you skipped `npm install`, wire it up by hand:

```bash
git config core.hooksPath .githooks
```

`main` and `master` are exempt from the branch check, and git's own merge, revert, and
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
above followed by `/`. `main`, `gh-pages` and `dependabot/**` are the only exceptions. So
`feat/site-search` works, but `saumya/test` or `username-patch-1` won't push. When you edit a
file in the GitHub web editor, rename its suggested `patch-1` branch before you commit.

**`main` is PR-only.** Nobody can push, force-push or delete `main` directly. Everything
goes through a pull request, and a PR needs all of these before it can merge:

- **2 approvals from teammates.** Pushing a new commit dismisses earlier approvals, and the
  latest push has to be approved by someone other than its author.
- **All review conversations resolved.**
- **Green checks:** `webapp-tests`, `mobile-tests`, `docs-build`, `hook-tests` and
  `conventions` (branch name, PR title and every commit message).

**Squash merge only.** Each PR lands on `main` as one commit, and the PR title is its
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
