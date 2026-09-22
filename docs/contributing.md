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

It is an ordinary local git hook, so it can be skipped deliberately:

```bash
git commit --no-verify
```

```bash
git push --no-verify
```

Nothing in CI rejects a commit for its message, so use the bypass when you have a reason to
and keep to the convention the rest of the time — this history is what the team reads at
sprint reviews.
