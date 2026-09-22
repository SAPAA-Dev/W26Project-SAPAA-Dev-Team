# SAPAA — Docs & Handoff-Transcript Findings

Investigation of every project document under `docs/`, with emphasis on the Week 3
handoff meeting between the current (Fall 2026) team and the previous CMPUT 401 team.

**Sources read in full**
- `docs/meetings/week3/week3.txt` (full transcript — the file contains the *same* ~32.5k-char
  transcript repeated 4 times; only one copy is unique content)
- `docs/meetings/week3/week3Summary.txt`
- `docs/index.md`, `docs/project-management.md`, `docs/software-design.md`,
  `docs/api-documentation.md`, `docs/aws-architecture.md`, `docs/meeting-minutes.md`,
  `docs/ui-design.md`, `docs/FNR-user-manual.md`, `docs/Deployment-manual.md`,
  `docs/webapp-deployment.md`, `docs/teamwork.md`, `docs/traceability-matrix.md`,
  `docs/user-manual.md`, `docs/admin-manual.md`, `docs/job-documentation.md`,
  `docs/sonar-qube.md`

**Important correction to the existing summary file.** `week3Summary.txt` labels the previous
team as the "Fall '25 team". The docs make clear there were **two** prior teams:
a Fall 2025 team (Mehrdad, Gabriel — the FNR/reader app + the map) and a **Winter 2026 team**
(Vishal, Harveer, Raiyana, Jason, Braden, Akib, Zoe — the SIR web app). `docs/api-documentation.md`
has separate "From Winter 2026" and "From Fall 2025" sections, and `docs/project-management.md`
is the W26 sprint plan (Feb–Mar 2026). Mehrdad and Gabriel are Fall-2025 alumni acting as
technical mentors, which is why Mehrdad is the one giving KPI advice.

---

## 1. Known Bugs & Defects

### From the handoff transcript (`docs/meetings/week3/week3.txt`)

| # | Item | Near-quote (attributed) |
|---|---|---|
| B1 | **Map search is broken.** The admin heat-map search was tested live during the call with the term "ATV" and returned nothing. | Vishal: "So it doesn't work. It needs it needs development." |
| B2 | **The map itself is frozen/static.** No one on the W26 team touched it; the person who built it has left. | Vishal: "this is pretty much stayed the exact same since we started" |
| B3 | **Nobody knows what map provider is in use.** Google Maps vs OpenStreetMap is unconfirmed; the only person who knew has left the project. | Vishal: "I don't know if he ended up switching to the … open street map" |
| B4 | **Sign-up confirmation email does not reliably send.** A current-team member signed up and was let straight in without the two-step flow. | Harveer: "either that or the feature is broken"; Mehrdad: "congrats, you found it on day zero" |
| B5 | **Data inconsistency between Google-OAuth sign-ups and email/password sign-ups.** Different user records result. | Harveer: "there's a bit of data differences between when a user signs up by a … Google account and by just normal sign up" |
| B6 | **Users created via OAuth may have no password**, and the admin "change password" flow was never validated for them. | Harveer: "that's an interesting edge case. I've not actually…" |
| B7 | **Logout is effectively broken / confusing.** Returning to the site silently re-authenticates from the stored access token, and the only logout control lives on the homepage. | Vishal: "you have to manually log out and every time you come back … it'll like reload you back in" |
| B8 | **Admin landing page is mostly dead.** Only one tile actually navigates anywhere. | Vishal: "that's the only clickable year for now" |
| B9 | **User/account management is half-built.** | Harveer: "it's kind of like clunky. It's not really fully developed" |
| B10 | **General admission of residual bugs** in the W26 deliverable. | Vishal: "There might be like some bugs here and there" |

### From other docs

| # | Item | Source |
|---|---|---|
| B11 | **Naturalness scores are stored inconsistently in the DB** — "4 - Great", "4 = Great", "Great" all appear. A Postgres RPC papers over it with `ILIKE`+`CASE` normalisation. Any new stat/KPI built on `obs_value` inherits this. | `docs/ui-design.md` §20.3 |
| B12 | **Live Supabase project URL and anon JWT are committed in the repo docs** (`https://yizmvkfkgahyoqeznvki.supabase.co` plus a full `eyJ…` anon key hardcoded in the env example). Should be rotated/scrubbed. | `docs/webapp-deployment.md` §Environment Variables |
| B13 | **Two contradictory deployment manuals are checked in.** `Deployment-manual.md` documents the W26 stack (AWS S3, `W26_*` tables, no OpenCage) and is in the mkdocs nav; `webapp-deployment.md` documents the F25 stack (OpenCage, `sites_list_fnr` / `sites_report_fnr_test` tables, no AWS) and is **not** in the nav. Env-var lists differ. | `mkdocs.yml`, both files |
| B14 | **Logo alt text is inconsistent** across pages (`"SAPAA"` and `"Logo"` both exist) and is asserted by tests. | `docs/ui-design.md` §21.2 |
| B15 | **Table name typo in the deployment manual**: `W26_form_reponses` (missing "s"). | `docs/Deployment-manual.md` §Database Setup |
| B16 | Known defects the W26 team was still fixing at the very end: next/previous button anchoring, back-button navigation across all pages, "Other" text-box input behaviour, image upload failing **on the deployed Vercel link** (but not locally), CSV delimiter collision with semicolons. | `docs/meeting-minutes.md` (Feb 27, Mar 6, Mar 10, Mar 17/18) |

---

## 2. Explicitly Deferred Work ("we never got to that")

### From the transcript

| # | Item | Near-quote (attributed) |
|---|---|---|
| D1 | **The whole mobile app.** Planned for W26 Sprints 4–5, dropped to protect the web app. Explicitly handed to the current team. | Vishal: "That was supposed to be something that we worked on over a sprint 4 and five"; "you guys are gonna be picking up on what we couldn't" |
| D2 | **Mobile is a full iteration behind the web app** and got zero work last term. | Mehrdad: "it's one iteration behind because the … they did no work in the mobile app at all" |
| D3 | **React 18 → 19 upgrade on mobile** is called out as the single biggest expected pain point. | Mehrdad: "the biggest struggle you guys are going to have with that is upgrading to React 19" |
| D4 | **A staging environment between dev and production — deliberately left for this team by Frank.** | Harveer: "he wants a staging environment in between, and he wanted to leave that for your class" |
| D5 | **Gamification** was never scoped or built — it only ever existed as a "post-requirement". | Harveer: "were we thinking of stuff like … trophies, like who has the most site visits? Maybe like a community board" |
| D6 | **People & place management** — nothing exists beyond raw account CRUD. | Harveer: "so far we have just the basics, like reset password, create account, delete account" |
| D7 | **No KPIs or statistics are being measured anywhere.** | Mehrdad: "you don't have any of the stats, so obviously that's your number one priority" |
| D8 | **GitHub issues were left unfinished** and are not necessarily still the right priorities. | Vishal: "we didn't get to fully finish then"; "it's kind of dependent on … what Frank wants right now over those issues" |
| D9 | **No CI/CD beyond the course-required Cybera runner.** Smoke / E2E / front-end test pipeline is this team's job. | Vishal: "you would have to develop that … cyber instance, on your … 401 repo" |
| D10 | **Map data work.** Even with a map present, the data layer behind it needs building. | Vishal: "apart from there being a map … you would have to work on … the data" |

### From other docs

| # | Item | Source |
|---|---|---|
| D11 | **Explicit hand-off list written into the W26 end-of-project report**: (a) "Ability to edit/add site data"; (b) "Rework the manual implementation of admin approving users". | `docs/meeting-minutes.md`, Mar 20 2026 Meeting #8 |
| D12 | **MoSCoW "Would Like But Won't Get"** — never delivered: US 1.0.20 Admin Editing Image Metadata, US 2.0.4 Offline Image Viewing, US 3.0.1 mobile SIR form, US 3.0.2 Offline Data Syncing. | `docs/index.md` §MoSCoW |
| D13 | **Sprint 5 backlog vs. Sprint 5 task table mismatch**: US 2.0.4, US 3.0.1 and US 3.0.2 appear in the Sprint 5 user-story list but have **no assigned tasks** — i.e. listed then dropped. | `docs/project-management.md` §Sprint 5 |
| D14 | **"Future Enhancements" opened but not closed**: CRUD operations for form *sections*, and moving questions across sections. | `docs/meeting-minutes.md`, Mar 6 2026 |
| D15 | **Legacy data migration** — 40+ years of historical inspection data still needs migrating into the new schema. W26 had a hard "out of the database by April 5th" constraint and only produced a *plan*. | `docs/meeting-minutes.md`, Feb 20 / Mar 13 / Mar 19 / Mar 20 |
| D16 | **Dragons' Den feature requests never built**: summarising all site inspection reports, and viewing prior SIRs side-by-side while filling out a new report. | `docs/meeting-minutes.md`, Mar 19 2026 |

---

## 3. Mentor & Client Guidance

### Mehrdad (technical mentor) — KPI advice, verbatim-ish

> "you don't have any of the stats, so obviously that's your number one priority. Number 2 is going to be how to show them. So don't … let one get out of the other. You don't have any KPIs right now. You guys aren't measuring anything."

Read as an explicit ordering: **(1) instrument and compute metrics → (2) only then design where they surface** (map vs. profile page vs. dashboard).

### Mehrdad — UI sprint timing

> "you guys get one entire sprints or maybe even 2 just for upgraded UI. So any type of … UI work and like designing anything, save it for that sprint."

Caveat captured live in the call: the current team replied "No, we don't have a UI sprint right now", and Vishal added "They probably changed it one group" — so this is **TA-dependent and must be confirmed**.

### Mehrdad / Harveer — environments & deployment

- Staging must be built by this team, between prod and the course dev branch (see D4).
- Two deployments run in parallel, and both must be maintained:
  > Vishal: "you'd basically have 2 reposts to maintain, but your priority, like development repo would be the, a coarse one because that's what would get your grades"
- The W26 workflow was: finish + get sprint approval on the course repo, **then** push to Frank's deployment so he can see it live.
  > Harveer: "after spring … once we submitted … we went and, like, added everything to Frank['s]"
- **Use Frank's repository, not the previous team's personal fork** — Frank's has the latest code (Vishal worked on it over the summer).
- Access: a shared dev-team email covers GitHub + Supabase + Vercel. Password format warning: capital "E" then a **space**.

### Harveer / Vishal — process norms

- Frank owns and schedules the weekly meeting, **every Friday**.
- He expects a slide deck each week: what was done / what's next / open questions. "He likes seeing those slide notes."
- A shared Google Drive of all past Friday decks is being handed over as a style reference.
- Frank as a person: "he's a great mentor, but he expects your work to be to be proper"; not deeply technical ("I wouldn't say technically so[und]"); "if you have any questions, you can always reach out … this project means a lot to them."
- Sprint 1 advice: mostly user stories + scope negotiation with Frank; push back where things aren't deliverable — "reason with him, and try to see like why certain things may not be deliverable". Spend leftover time reading the codebase to be ready for Sprint 2.
- Issue tracking: GitHub Issues + a Kanban board — "those 2 are like pretty much essential for 401's purpose" — but the choice may be TA-dependent.
- Codebase quality: "The web app is pretty clean."

### What Frank (the client) wants / is unclear about

| # | Item | Evidence |
|---|---|---|
| F1 | **Repo cleanup / defect audit is a stated requirement in Frank's own brief.** | Current team (transcript): "one of Frank's requirements … was, we basically have to try to figure out if there was any mistakes in the repository and kind of clean the repository up" |
| F2 | **GIS / mapping is a named requirement this semester.** | Current team: "we wanted to talk about the geographic interface system … because that was one of Frank's requirements for this semester" |
| F3 | **Gamification** — wanted, but completely unscoped. | Harveer: "did we list that as a … post requirement" (it was only ever backlog) |
| F4 | **Tension: Frank wants gamification but also called the UI "bland".** These pull in different directions and must be resolved with him. | Current team: "I sort of expressed that the UI looked … pretty bland and basic, and he also wanted the gamification done" |
| F5 | **People/place management** probably means a **user-facing profile page**, not more admin tooling — but this is an inference, not a confirmed requirement. | Harveer: "he would want some something of a profile page or like something of user management for the user's end. and not just the admin … You would have to speak [to Frank]" |
| F6 | **Web app before mobile**, per Harveer's read of Frank — but flagged as possibly stale. | "he wants the [web] application to be finished first" … "you'd speak to him" |
| F7 | **Build/release cadence**: Frank talked to the current team about "small commits of builds" going to a production branch — which is what triggered the staging-environment requirement. | Current team: "he also talked about something like build, build releases … we keep deploying" |
| F8 | **The WordPress site is NOT the product.** Frank's WordPress site is his separate news/updates site; the product is the Vercel Next.js app. The current team initially confused the two. | "the current web app is actually not the word[Press]. The WordPress is just what Frank was using before" |
| F9 | Frank has a **decided historical-continuity requirement**: keep the original Q-number format (Q21, Q37, …) to stay consistent with **40+ years** of inspection data. | `docs/meeting-minutes.md`, Feb 20 2026 |
| F10 | Inspection numbers are **auto-generated per calendar year**. | `docs/meeting-minutes.md`, Feb 20 2026 |
| F11 | Form section names must **match the official SAPAA website's** structure. | `docs/meeting-minutes.md`, Feb 20 2026 |
| F12 | Frank ran **real-steward user-testing sessions** (Mar 10 and Mar 12, 2026) with timed scenarios, plus a **"Dragons' Den"** review with industry professionals. That is an established, repeatable practice this client expects. | `docs/meeting-minutes.md` |

---

## 4. Documented Existing Features (what the app is supposed to do)

### Web app — SIR (`docs/index.md`, `docs/ui-design.md`, `docs/project-management.md`)

Routes that exist: `/sites`, `/detail/[namesite]`, `/detail/[namesite]/new-report`,
`/detail/[namesite]/edit-report/[responseId]`, `/gallery`, `/login`, `/signup`, `/terms`,
`/admin/dashboard`, `/admin/account-management`, `/admin/sites`, `/admin/sites/[id]`,
`/admin/gallery`, `/admin/form-editor`.

Delivered user stories (P1–P6):
- **Form**: full Site Inspection Form (US 1.0.1–1.0.16) mapped question-by-question to the
  original SAPAA form (Q11–Q83); liability gate requiring a typed, case-sensitive phrase with a
  911 / "310-LAND" notice; Terms & Conditions acceptance gate; required-question enforcement
  (US 1.0.27); **localStorage draft persistence, scoped per site** (US 1.0.26); autofill of
  name/email/phone/date (US 1.0.28); non-public information fields with hard guarantees that
  name/email/user_id never enter the answers payload (US 1.0.23); user edit of own past reports
  with ownership check (US 1.0.22).
- **Admin form editor**: add / modify / hide-show questions (US 1.0.17, 1.0.24, 1.0.25), with
  hidden questions preserving past answers; drag-and-drop ordering (`@dnd-kit`); rich-text
  (bold/italic/underline/link) in subtext with an XSS allowlist of `strong, em, u, a` (US 1.0.30).
- **Images**: S3 presigned direct upload (US 2.0.1); image captions/identifiers (US 1.0.18,
  2.0.2); per-site gallery (US 2.0.3); admin media management with SAPAA filename convention
  `ClydeFen-2025-01-23-BobSuruncle-ATVTrack.jpg` and metadata search/filter (US 2.0.7);
  standalone (non-SIR) site image upload (US 2.0.8); homescreen gallery (US 2.0.9);
  admin gallery + metadata modal (US 1.0.19).
- **Reports**: customisable PDF export — single inspection, whole site, or multi-site, with
  quick toggles and advanced filters and image-size optimisation (US 4.0.1).
- **Sites**: admin update of site profile incl. county lookup (US 4.0.3); admin
  enable/disable a site profile (US 4.0.4).
- **Accounts**: admin approval/rejection of new users via `user_metadata.authenicated` [sic]
  (US 5.0.1); sign-out with token revocation (US 5.0.2); role = `admin` | `steward` in
  `user_metadata.role`.
- **Cross-cutting**: full responsive overhaul at 375/768/1280 (TASK 6.0.1); toast/banner error
  handling (TASK 6.0.2); `inspection_number` + `inspection_date` on every response (TASK 6.0.3).
- **In-app guided tutorial** via `react-joyride`, replayable from the dropdown — built
  deliberately for an older, less tech-literate user base (transcript + ui-design §1.2).

### Data / infrastructure

- Supabase Postgres, `W26_`-prefixed tables: `W26_form_responses`, `W26_answers`,
  `W26_questions`, `W26_question_options`, `W26_sites-pa`, `W26_attachments`,
  `W26_form_sections`, `W26_ab_counties`, `W26_homepage-image-uploads`.
  Legacy `sites_*` / `*_fnr` tables still exist; new work must not depend on them
  (`docs/ui-design.md` A.2).
- RPCs: `get_naturalness_distribution()`, `get_top_sites_distribution()`.
- AWS S3 bucket `sapaa-inspection-images` (ca-central-1), private, 1-hour signed URLs,
  keys `inspections/{siteId}/{responseId}/{questionId}/…` and
  `homepage-image-uploads/{siteId}/{userId}/…`.
- API surface: `/api/s3/presign`, `/api/s3/presign-homepage-images`, `/api/gallery` (admin),
  `/api/homepage-images` + `/{siteId}` (admin), `/api/sites/{siteId}/gallery` (auth),
  `/api/site-images` (auth), `/api/user-gallery/homepage-upload`, `/api/user-gallery/sir-upload`,
  `/api/geocode` (OpenCage), `/api/heatmap`. Swagger at `/api-docs`.
- CI **does** exist: `.github/workflows/test.yaml` runs Jest on a **self-hosted** runner on
  push to `main`/`Sprint-*` and all PRs, with a `deploy` job gated on tests. 22 Cypress E2E
  specs live in `webapp/cypress/e2e/`. (This partially contradicts the transcript's
  "no CI/CD" claim — verify the self-hosted runner is still alive.)

### FNR — "Field Notes Reader" (`docs/FNR-user-manual.md`, `FNR/`)

A **separate Expo/React Native app** (`FNR/package.json`, name `stewardlog`) plus a matching
read-only web view. Documented features:
- Login via Google, **Microsoft**, or email/password (note: the SIR web app documents Google
  only — a real divergence).
- **Analytics tab with actual KPIs**: Total Sites Inspected, Last Inspection date, naturalness
  pie chart (Excellent/Good/Fair/Poor/Cannot Answer), keyword heat-map site locator with a
  markers toggle, and a manual "Sync Now".
- Sites tab: search, sort (A–Z / Z–A / newest / oldest), status badges driven by recency
  (Recently Visited / Visited This Year / Visited Recently / **Needs Review**), last-visit age
  ("10d ago", "2yr ago").
- **Offline**: tick sites → Download; app auto-switches to offline mode; offline sites support
  detail view, reading reports and PDF generation; delete downloaded sites to reclaim space.
- Site detail: naturalness score with colour slider, plus **two review modes** —
  **"By Date"** (read one full inspection) and **"By Question"** (track one question's answers
  across years). This is the longitudinal-trend feature.
- Map tab with pins and "Open in Google Maps" hand-off for navigation.
- "Generate Report" → PDF, shareable/saveable.
- Web admin dashboard: Total Records, Last Record, naturalness pie, **Top 5 Sites by inspection
  count**, heat-map keyword search; account management with Total Users / Admins / Stewards
  counts, search by email, filter & sort, add/edit/delete user, role assignment.
- Web "Protected Areas" landing with four stat cards: **Total Sites, Total Inspections,
  Active This Year, Needs Attention (not inspected 2+ years)**.

> **This matters a lot.** Mehrdad's "you have no KPIs" is true of the *SIR web app*, but the FNR
> app already documents almost exactly the KPI set a "stats" story would need. Whether FNR is
> live, abandoned, or should be merged into the main app is an open question. `FNR/package.json`
> already pins **React 19.1.0 / React Native 0.81.4 / Expo ~54**, which **contradicts the
> transcript's "it's built on React 18, it'll be a lot of upgrades"** — verify against the
> actual repo Frank hosts before budgeting sprint time for that upgrade.

---

## 5. Constraints & Risks

| # | Constraint / risk | Source |
|---|---|---|
| C1 | **Dual deployment must be kept in sync** — course repo (graded) + Frank's own deployment. Push to Frank only after sprint approval. | transcript |
| C2 | **Frank's repo is canonical**, not the previous team's fork; Vishal did summer work on Frank's copy. | transcript |
| C3 | **Image storage budget: under CAD $50/month.** | `docs/index.md` TASK 2.0.5 |
| C4 | **Google Maps API has a monthly request cap**, and **OpenCage free tier is 2,500 requests/day**. Any map/heat-map feature must consider quota. Provider currently unknown. | transcript + `docs/api-documentation.md`, `docs/webapp-deployment.md` |
| C5 | **Supabase free-tier limits and media egress costs** are called out as a risk needing a monthly budget cap. | `docs/index.md` §Open-source Projects |
| C6 | **Q-numbering must not change** — 40+ years of historical data depends on it. | `docs/meeting-minutes.md` Feb 20 |
| C7 | **Legacy data migration is unfinished and time-boxed historically** ("out of the database by April 5th"). | `docs/meeting-minutes.md` Mar 20 |
| C8 | **Users are elderly and not technically literate** — this is the justification for the in-app tutorial and constrains every UI decision. Vishal: "the users for this app were pretty [3rd] age. And not really technically literate". | transcript |
| C9 | **Field conditions**: remote Alberta protected areas, unreliable connectivity → offline is a functional requirement, not a nice-to-have. | `docs/index.md` P3, FNR manual |
| C10 | **Secrets hygiene**: a real Supabase anon key is committed; `SUPABASE_SECRET` and all `AWS_*` must stay server-side (never `NEXT_PUBLIC_`). Security checklist exists in both deployment manuals. | `docs/webapp-deployment.md`, `docs/Deployment-manual.md` |
| C11 | **RLS is manual** — policies must be created per table; role/approval live in Supabase `user_metadata`, not in a table. Changing an admin currently means editing Raw User Meta Data by hand in the Supabase dashboard. | `docs/Deployment-manual.md` §Database Setup |
| C12 | **Self-hosted CI runner** (Cybera) is a single point of failure the previous team set up; if it's offline, CI silently dies. | `.github/workflows/test.yaml`, `docs/meeting-minutes.md` Mar 11 |
| C13 | **Key knowledge has walked out the door** — the map author is gone ("the person with that isn't here … isn't with us anymore"). | transcript |
| C14 | **mkdocs nav omits `FNR-user-manual.md` and `webapp-deployment.md`** — two substantial docs are orphaned and will confuse the next reader. | `mkdocs.yml` |
| C15 | **`webapp/temp-supabase.py`** — a 300-line throwaway Python script is checked into the web app root. Repo-cleanup candidate (and Frank explicitly asked for cleanup, F1). | repo |
| C16 | **A December deadline is NOT mentioned anywhere in these documents.** The only dates found are the W26 term (Feb 1 / Feb 15 / Mar 8 / Mar 22 / Mar 31 sprint deadlines, Apr 5 DB cutoff). Treat any December target as unverified. | — |

---

## 6. Open Questions for Frank

Drawn directly from where the transcript says "ask Frank", plus gaps the docs leave.

**Scope & priority**
1. Web app vs. mobile app — which is the priority *now*? (Harveer's "web first" read is from last term and he flagged it may be stale.)
2. Where does **gamification** rank? Badges, trophies ("most site visits"), a community board with reactions — which, if any, and does the team design the badge art and the award rules?
3. How do you want the **UI tension** resolved — you called the current UI bland, but gamification and a visual refresh may collide. Is there a redesign appetite, or polish-in-place?
4. What exactly does **"people and place management"** mean to you? Is it a **user-facing profile page** (Harveer's guess), or admin tooling, or both?
5. Is **GIS/mapping** a build-it-properly requirement this term, or exploratory? (The existing map is static and its search is broken.)
6. Is the **legacy data migration** (40+ years) still outstanding, and is it ours?
7. Are the **Dragons' Den** asks in scope: an all-SIR summary view, and viewing past SIRs side-by-side while filling in a new one?

**KPIs & stats (Mehrdad's #1 priority)**
8. Which numbers actually matter to SAPAA? Candidates already implied by the docs: site visits per steward, sites needing review (2+ years), naturalness trend per site, inspections per year, top sites by activity.
9. Where should they surface — map, profile page, admin dashboard, or all three?
10. Do you want steward-visible stats (feeding gamification), or admin-only reporting?

**Environments & release**
11. Confirm the **staging environment** shape: what gates promotion from staging to your production site?
12. Should the dual-repo push-to-Frank-after-sprint-review workflow continue, or should we move to one repo?
13. What is your expected **release cadence** for the "small builds" you described?

**Accounts & data quality**
14. The sign-up confirmation email appears broken and OAuth vs. email sign-ups produce different user records — do you want the whole approval flow reworked? (The W26 team wrote "rework the manual implementation of admin approving users" into their handoff list.)
15. Should stewards be able to self-serve password/profile changes, or stay admin-mediated?
16. Are duplicate sites / duplicate users a real problem in your data today? (Nothing in the docs implements dedupe — worth confirming before we invent a requirement.)

**Other**
17. Is the **FNR "Field Notes Reader"** app still live and wanted? Should it be merged into the main app, kept separate, or retired? Its analytics screens already do much of what a "stats" feature needs.
18. Microsoft SSO is documented for FNR but not for the SIR web app — should the two auth stacks be unified?
19. Confirm the **map provider** (Google Maps vs OpenStreetMap/Leaflet) and who pays for quota.
20. Is there a **field-testing session** planned this term, like the March 10/12 steward sessions? If so, what date, so we can work backwards from it?

