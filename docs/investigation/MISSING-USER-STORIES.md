# Gap Analysis — User Stories We Are Missing

Compared against: the rough-draft backlog in the project-requirements notes, **and** Alissa's
PR #2 (`docs/project-requirements/user-stories`, 23 stories), **and** the Winter 2026 team's
story map (`prior-team-storymap.md`).

Every item below is justified by evidence from the codebase, the docs, the transcript or the
live deployment. Citations point at the investigation reports in this folder.

Legend:
**[NEW]** nobody has written this · **[BROKEN]** in the draft but not buildable as written ·
**[DUPE]** already exists, stop re-writing it

---

## 0. Two facts that invalidate part of the current backlog

**Fact 1 — there is no geographic data in the system.** Zero lat/long/geometry columns
anywhere. The existing heatmap geocodes **site name strings** through the OpenCage API at
runtime, one site per second, caching nothing (`webapp/app/admin/dashboard/page.tsx:132-154`).

→ Alissa's **US 2.0.1 "View Sites on an Interactive Map"** is **[BROKEN]** — not buildable as
written. It silently depends on a coordinates story that does not exist. Same for US 2.0.6
(filter by county on a map) and US 2.0.10 (click a site on the map).

**Fact 2 — there are two inspection systems in one database** (see `THE-SCHEMA-SPLIT.md`).
Web app writes `W26_*`; mobile and the Google Sheet write legacy `inspectheader`/`inspectdetails`.
The only shared table is `luperson`.

→ Every People-management and Place-management story needs to state **which schema it targets**,
or it will be built on the half that doesn't hold the data.

---

## 1. Access control — P0, and completely absent from all three backlogs

Authorization is not enforced server-side anywhere. Four files carry `'use server'`; every
exported function is a public endpoint, none authorizes its caller, and nearly all use the
**service-role key**. `ProtectedRoute.tsx:127` is a React render branch, not a gate.

1. **[NEW]** *As SAPAA, I want every privileged server action to verify the caller's identity and
   role server-side, so that a signed-in user cannot perform admin actions by calling the
   endpoint directly.* Today any signed-in account — **including one an admin has explicitly not
   approved** — can call `addUser`/`updateUser`/`deleteUser` (`webapp/utils/admin-actions.ts:28,47,60`)
   to self-promote to admin or take over any account, or `rollbackSiteInspectionSubmission`
   (`queries.ts:187`) to hard-delete any report.
2. **[NEW]** *…I want a user's role stored in a table protected by row-level security, so that a
   user cannot grant themselves a role.* Role currently lives in user-writable `user_metadata`
   with no DB hook blocking `auth.updateUser({data:{role:'admin'}})` — which also defeats the
   API-route role checks that read it.
3. **[NEW]** *As a steward, I want my uploaded photos visible only to me and to admins.*
   `/api/user-gallery/sir-upload` and `/homepage-upload` are copies of the admin routes with the
   role check deleted and **no `user_id` filter added** — `/gallery` serves everyone's photos.
4. **[NEW]** *…I want privileged keys never shipped to a client.* `FNR/app.config.js:8` pipes the
   **service-role key into `expo.extra`**, read on-device at `adminAuth.ts:20`. Any APK built from
   that config carries full RLS bypass. Rotate the key and re-architect those calls.
5. **[NEW]** *…I want no credentials in version control.* Real account passwords sit in ~15
   Cypress specs (`cypress/e2e/pdf_export.cy.ts:21`); the Supabase anon JWT is pasted 4× into
   `docs/webapp-deployment.md`, which `gh-pages.yaml` **publishes to public GitHub Pages**;
   OpenCage key hardcoded at `FNR/src/services/openCage.ts:3`.

> Alissa's US 3.0.y ("revoke a user's access") is the right instinct for the wrong reason.
> Revocation is meaningless until #1 and #2 land — a revoked user can re-promote themselves.

## 2. Schema unification — P0, blocks most of Place & People

6. **[NEW]** *Spike + written decision (ADR): which schema is canonical?* One-way door.
7. **[NEW]** *Migrate 40+ years of legacy inspections into the canonical schema*, reversibly,
   re-runnably, with a row-count reconciliation report.
8. **[NEW]** *Unify the two question banks* (`inspectquestions`/`inspectqcategory`/`questionmapping`
   vs `W26_questions`/`W26_form_sections`) into one, preserving Q-numbers — legacy data is keyed
   on them and they must never change.
9. **[NEW]** *One shared read model for sites and inspections*, so a steward sees the same
   inspection history on web and mobile.
10. **[NEW]** *Decide the fate of the Google Sheets pipeline* — it writes the legacy schema, so the
    schema decision determines whether it keeps working. See `google-sheets-backdoor.md` for its
    own defects (destructive full-table sync that deletes rows missing from the sheet;
    `max(id)+1` client-side keys; non-atomic writes).
11. **[NEW]** *Promote or delete the `_test` views.* `sites_detail_fnr_test`,
    `sites_report_fnr_test`, `inspectheader_fnr_test`, `luperson_fnr_test` are all in the
    **production read path** of one or both apps.
12. **[NEW]** *Reconcile `luperson` with Supabase Auth accounts* — the only seam between the two
    worlds. Invite/claim flow, person-with-no-login, login-with-no-person, duplicate merge.
    This is also the documented root of the Google-OAuth vs email sign-up divergence.
13. **[NEW]** *Put the database schema in version control.* Zero `.sql` files repo-wide, no
    `supabase/` dir; two dashboard RPCs have no definition anywhere in VCS.
    `docs/Deployment-manual.md:342` literally says "Contact your development team for the
    complete SQL schema."

## 3. Place management — what the draft misses

14. **[NEW]** *As SAPAA, I want each site to store real coordinates*, so the map is accurate and
    doesn't depend on geocoding a name string. **Blocks US 2.0.1 / 2.0.6 / 2.0.10.**
15. **[NEW]** *…I want geocoding results cached and quota-bounded* (OpenCage free tier is
    2,500/day; the current loop re-geocodes every site on every dashboard load).
16. **[NEW]** *As a steward, I want a map at all.* The Leaflet map + heatmap exist but are
    **admin-only** (`app/admin/dashboard/components/Map.tsx`). Every map story in the draft is
    written from a user's perspective against an admin-only feature.
17. **[NEW]** *…I want site links to survive a rename.* Site detail is keyed by **name**
    (`/detail/[namesite]`), so renaming a site silently breaks every link to it and near-identical
    names collide on one URL. Fix before any dedupe work.
18. **[NEW]** *…I want the site list paginated.* `/sites` fetches all sites and filters/sorts
    client-side in a `useMemo`.
19. **[NEW]** *Site search actually works.* Reported broken in the handoff call (live "ATV" search
    failed) and never fixed.
20. **[DUPE-ish]** Classification by region/subregion/county — `W26_ab_counties` already exists;
    scope this as "finish", not "build".

## 4. People management & KPIs — reframed

Mehrdad's advice was *measure first, decide where to display second*. The draft backlog and
Alissa's TODO block are almost entirely **display** decisions.

21. **[NEW]** *Instrument the events that KPIs are computed from* — before any profile or badge
    design. This is the actual priority #1 and it is in nobody's backlog.
22. **[NEW]** *Reuse the KPIs that already exist.* The mobile app already computes Total Sites
    Inspected, naturalness distribution, Top 5 Sites, "Needs Attention (2+ years)", Active This
    Year, and per-site naturalness trend. Porting/merging these is far cheaper than building from
    zero — and nobody realised they exist.
23. **[NEW]** *Clean the naturalness data before building KPIs on it.* `obs_value` holds
    "4 - Great", "4 = Great" and "Great" interchangeably, papered over by an ILIKE RPC. Every
    statistic inherits the mess.
24. **[NEW]** *"Compare by Question" longitudinal view* — pick one question, see its answers
    across years. Exists in mobile, nothing equivalent on web. High value, non-obvious.
25. **[NEW]** *Approval-notification email.* `ProtectedRoute.tsx:110` **promises the user an
    email**; nothing sends one. Also the documented broken confirmation-email flow.
26. **[NEW]** *Password reset.* Absent entirely — no route, no link on the login page.
27. **[NEW]** *"My inspections" list.* `full_name`/`avatar_url`/`phone` are **read in 4 places and
    written in 0** — the profile page the draft asks for has half a data model already waiting.
28. **[NEW]** *Fix logout.* Returning to the site silently re-auths from the stored token, and
    the only logout control is on the homepage.

## 5. Inspection lifecycle & audit

29. **[NEW]** *Inspection edit history.* Edits **delete and re-insert answers with no audit trail**
    (`queries.ts:866`). Alissa's US 2.0.11 (place changes) and US 3.0.7 (admin actions) don't cover
    the inspection answers themselves.
30. **[NEW]** *Steward-accessible PDF export* — PDF generation is admin-only today.
31. **[NEW]** *Non-public / SAPAA-only fields* (Winter US 1.0.23, dropped): sensitive answers that
    must not appear in public views **or in the generated PDF**. Absent from every current backlog.
32. **[NEW]** *All-SIR summary view* — asked for at Dragons' Den, never built.
33. **[NEW]** *View past SIRs side-by-side while filling in a new one* — same source, never built.
34. **[DUPE]** Autosave drafts: Winter **US 1.0.26** (5 pts) already specified this; Alissa's
    US 4.0.3 restates it. Check what shipped before re-estimating.
35. **[DUPE]** Admin form-question CRUD: **already built** — `app/admin/form-editor/page.tsx:300`
    does add/edit/hide/drag-reorder with a Markdown editor. Do not re-scope it.

## 6. Images

36. **[NEW]** *Delete an image, and clean up its storage.* There is **no image deletion anywhere** —
    zero `DeleteObjectCommand`, zero DELETE route handlers. Deleting a report orphans its S3
    objects permanently. Alissa's US 2.0.9 asks for removal but misses the orphan-cleanup half,
    which is what costs money against the CAD $50 storage ceiling.
37. **[NEW]** *Photo capture on mobile.* The one platform with a camera is the one that cannot
    attach a photo, while the web app has a full S3 pipeline.

## 7. Offline — a functional requirement, not a nice-to-have

Remote Alberta sites. Winter's US 3.0.1/3.0.2 were listed in Sprint 5 then silently dropped.

38. **[NEW]** *Queued writes / outbox.* Today an offline edit is **silently discarded** —
    `handleSaveInspection` (`AdminSiteDetailScreen.tsx:399-424`) calls Supabase unconditionally and
    shows an error. This is live data loss, not a missing feature.
39. **[NEW]** *Offline sync conflict resolution.* Two stewards edit the same inspection, one
    offline. There is **no version column anywhere** in the schema.
40. **[NEW]** *Fix "Sync Now"* — it only calls `fetchStats()` (`AnalyticsScreen.tsx:192-195`),
    refreshing analytics, while the user manual tells users to press it to fix stale site data.
    Both documented remedies are false.
41. **[NEW]** *Staleness indicators and download-before-you-go* — "this data is 12 days old",
    storage budgeting, refresh without delete.
42. **[NEW]** *Offline support on the web app* — none exists (no service worker, manifest, or
    IndexedDB). Alissa's US 4.0.1/4.0.2 assume it does.

## 8. Distribution, devices, accessibility

43. **[NEW]** *Get the app onto volunteers' phones.* `eas.json` is **Android-only**, no iOS profile
    exists, nothing is published, and the manual tells people to search an app store where the app
    does not appear. An iPhone volunteer cannot receive this app today.
44. **[NEW]** *Device permission consent* — camera, photo library, location: none declared, none
    requested.
45. **[NEW]** *Accessibility for an elderly, non-technical user base* — the explicit design
    constraint behind the replayable tutorial. Concrete observed failures: unlabeled
    password-visibility toggles (WCAG 4.1.2), no `<form>` element so Enter doesn't submit, no
    `autocomplete` attributes, two `<h1>` per page, low-contrast text on the dark green panel.

## 9. Engineering & delivery (the "Repository" epic, made concrete)

46. **[NEW]** *Staging environment* — deliberately left for this team by Frank. Plus the
    dual-deploy obligation (course repo → Frank's site after sprint approval).
47. **[NEW]** *CI that actually gates* — no lint, build, or E2E in CI; `test.yaml` targets
    `Sprint-2..Sprint-5` branches that **don't exist on origin**, and its deploy step runs
    `docker-compose` in `/home/ubuntu/deploy` with **no `docker-compose.yml` in the repo**, while
    `Deployment-manual.md:319` says Vercel and "no GitHub Actions required".
48. **[NEW]** *`.env.example` + onboarding* — a clean clone **won't build**: `adminAuth.ts:21-23`
    throws on import without a `.env` that no document describes.
49. **[NEW]** *Backup and recovery runbook.*
50. **[NEW]** *Fix the red test on main* — 251/252; `auth.test.ts:175` has a stale expectation from
    a March commit, unnoticed for six months.
51. **[NEW]** *Field-test milestone* — the client brief commits to **early-December 2026** field
    testing, and timed steward scenarios are an established client practice (ran Mar 10 & 12).
    Ask Frank for this term's date and work backwards.

---

## Stories in the current draft that should change

- **US 2.0.1 / 2.0.6 / 2.0.10 (maps)** — not buildable until site coordinates exist. Add #14 as a
  blocker or they will fail in sprint.
- **Dedupe sites (draft + US 2.0.4)** — **duplicates are mentioned in no document anywhere.**
  Confirm with Frank that duplicates actually exist before spending a story. Note that #17
  (name-keyed URLs) is the real defect near this area.
- **ID collisions** — new IDs `US 1.0.1`, `US 2.0.1`, `US 4.0.1` collide with *different* Winter
  stories of the same number, and ~80 references in `docs/project-management.md` and the meeting
  minutes point at the old numbering. Pick a non-colliding scheme before merging PR #2.
- **19 of 23 stories have no acceptance tests**, three ship literal `so that ________` blanks, and
  US 3.0.5 ends "so we can gamify shit" — in a document intended for the client.
- **Gamification** — entirely unscoped, and it **collides with Frank calling the UI "bland."**
  Resolve direction with Frank before writing any of the ~15 badge ideas.
- **MoSCoW was never updated** — every new story is currently unprioritized.

## Questions for Frank this adds

1. Which is the system of record — the web app's data, or the 40+ years of legacy inspections?
2. Does the Google Sheet keep write access to the database?
3. Should stewards see a map, or is geography admin-only?
4. Do sensitive/SAPAA-only answers need to be hidden from PDFs as well as from public views?
5. Are duplicate sites a real problem you've experienced, or a hypothetical?
6. Is iPhone support required for December field testing? (Today it is impossible.)
7. What is the December field-test date, and who are the testers?
8. Gamification vs. a cleaner UI — if you had to pick one this term, which?
