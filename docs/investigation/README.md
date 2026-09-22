# Investigation — Fall 2026 SAPAA handover

Everything this team found while taking the project over: what is actually built, what is
broken, what the previous two teams left behind, and which user stories we are missing.

Produced by reading the codebase, the docs, the Week 3 handoff transcript, Alissa's PR #2,
the deployed app, and the mobile app.

## Start here

| Document | What it is |
|---|---|
| **[THE-SCHEMA-SPLIT.md](THE-SCHEMA-SPLIT.md)** | The biggest finding: two inspection systems in one database, sharing one table. Read this before planning any sprint. |

The candidate user stories that came out of this work are in `docs/claude-user-stories.md`, and the
defects and engineering work are in `docs/issues.md`.

## Supporting reports

| Document | Scope |
|---|---|
| [codebase-audit.md](codebase-audit.md) | Web app: routes, auth, schema, PDFs, maps, tests, CI, tech debt. BUILT/PARTIAL/NOT BUILT per capability. |
| [docs-and-transcript-findings.md](docs-and-transcript-findings.md) | Week 3 handoff transcript + all `docs/*.md`: known bugs, deferred work, mentor/client guidance, constraints. |
| [alissa-pr-and-branches.md](alissa-pr-and-branches.md) | PR #2 verbatim (23 stories), the other remote branches, `.github/` state. |
| [mobile-fnr-audit.md](mobile-fnr-audit.md) | The mobile app (real name **StewardLog**): what works, offline/sync reality, parity gaps, 3 defects. |
| [live-site-walkthrough.md](live-site-walkthrough.md) | Black-box pass over the Vercel deployment. Note: the app is fully gated, so only `/login` and `/signup` were observable. |
| [google-sheets-backdoor.md](google-sheets-backdoor.md) | `googleSheets/code.gs` — a Google Sheet with production database write access. Nobody mentioned it. |
| [prior-team-storymap.md](prior-team-storymap.md) | The Winter 2026 team's full 5-sprint backlog, decoded from the story-map image. Their ID scheme, and what Sprint 5 never finished. |

## The five things that change our plan

1. **Authorization is not enforced server-side anywhere.** Any signed-in account — including an
   unapproved one — can promote itself to admin or delete any report by calling a server action
   directly. Everything else on this list is less urgent than this.
2. **Two inspection systems in one database.** Web writes `W26_*`; mobile and a Google Sheet write
   legacy `inspectheader`/`inspectdetails`. Only `luperson` is shared. Which makes People
   Management the integration point of the system, not a CRUD feature.
3. **There is no geographic data.** No lat/long anywhere — the heatmap geocodes site *name
   strings* at runtime. Every map story in the current backlog is unbuildable until this is fixed.
4. **The KPIs already exist — in the mobile app.** Mehrdad said we measure nothing; in fact the
   mobile app computes most of the stats Frank wants. Porting beats rebuilding.
5. **Offline data loss is live today.** An offline edit on mobile is silently discarded, and
   "Sync Now" doesn't sync.

## Caveats

- The deployed app is fully gated; `/sites`, the map and site detail pages were **not** observed
  directly. Those sections of the live-site report are marked `[code-derived]` and need a second
  pass by someone with an account.
- Some transcript claims are stale and were corrected against the code: mobile is **already on
  React 19** (not 18), and CI **does** exist (though it may be a dead runner).
- Duplicate sites appear in **no document anywhere**. Confirm with Frank before building dedupe.
