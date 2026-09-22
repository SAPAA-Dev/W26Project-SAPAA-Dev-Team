# Mobile App (FNR / "StewardLog") — Investigation Audit

**Audited:** 2026-09-21 · **Scope:** `FNR/` (read-only inspection of `webapp/` for parity comparison)
**Verdict:** FNR is a **working, inherited, read-mostly field-reference app** — not the "full mobile app" of v5.0, and not a field data-capture tool. It has serious security and data-integrity defects and has **diverged from the webapp's database schema**.

Labels used: **BUILT** (works end to end) · **PARTIAL** (present but incomplete/broken in a meaningful way) · **NOT BUILT** (absent).

---

## 1. What FNR actually is

"FNR" is not an acronym expanded anywhere in the codebase or docs. The app's real product name is **StewardLog**:

- `FNR/package.json:2` — `"name": "stewardlog"`
- `FNR/app.json:3-4` — `"name": "StewardLog"`, `"slug": "stewardlog"`
- `FNR/app.json:21` — Android package `com.zdev.stewardlog`

"FNR" survives only as a **database naming prefix** on the legacy Supabase views the app reads: `sites_list_fnr`, `sites_report_fnr_test`, `sites_detail_fnr_test`, `inspectdetails_fnr_test`. The directory is named after the data it consumes, not a feature. Best reading: *Field Notes / Reports* view of the legacy inspection schema.

### Provenance — this is inherited code, not this semester's work

```
git log --format="%h %ad %an %s" --date=short -- FNR
8d2662a 2026-03-30 vishalsivakumar2809  documentation: added pages for manuals
23724dc 2026-03-19 harveerdeol          feat: added approval feature in admin account
ffc211d 2026-01-22 Braden Woods         chore: get old code in our repo
```

Three commits total. The base commit is literally *"get old code in our repo"*. **Christopher has no commits in `FNR/`.** The app was built by the Winter-2026 (or earlier) team and imported wholesale. There is **no `FNR/README.md`**.

This matters for the client's roadmap question: the client's "no full mobile app until v5.0 (2027-28)" plan is **not contradicted** by FNR's existence. FNR is a pre-existing read-only companion, not a new build.

### End-to-end flow (what a user can do)

**Auth** (`FNR/src/screens/LoginScreen.tsx`, `FNR/src/services/auth.ts`)
- Email/password via Supabase Auth (`auth.ts:76-102`), Google OAuth (`auth.ts:105-200`), Microsoft/Azure OAuth (`auth.ts:203-369`), signup (`auth.ts:372-416`).
- Role read from `user_metadata.role`, default `steward` (`auth.ts:33`).

**Navigation** (`FNR/App.tsx:478-511`) — three bottom tabs: Analytics, Sites, Map. Admin section reachable via header overflow menu (`App.tsx:210-217`).

| Screen | File | What it does |
|---|---|---|
| Analytics | `src/screens/AnalyticsScreen.tsx` | KPI tiles, naturalness pie, top-sites pie, heatmap; "Sync Now" |
| Sites (Home) | `src/screens/HomeScreen.tsx` | Site list, search, sort, select→download, select→delete |
| Site Detail | `src/screens/SiteDetailScreen.tsx` | **Read-only** inspection history, by-date / by-question tabs, PDF export |
| Map | `src/screens/MapScreen.tsx` | WebView of a fixed Google My Maps URL |
| Admin Dashboard | `src/screens/DashboardScreen.tsx` | Same stats as Analytics + heatmap |
| Admin Sites | `src/screens/AdminSitesScreen.tsx` | Site list for admins |
| Admin Site Detail | `src/screens/AdminSiteDetailScreen.tsx` | **The only write surface** — edit/delete an inspection |
| Accounts | `src/screens/AccountManagementScreen.tsx` | Create / update / delete users |
| Settings | `src/screens/SettingsScreen.tsx` | Auto-delete retention days, dark mode |
| PDF Viewer | `src/screens/PDFViewerScreen.tsx` | Renders generated PDFs |

**Status: BUILT** as a read/reference app. **NOT BUILT** as a data-capture app — see §5.

---

## 2. Offline & sync

### SQLite is genuinely used — **BUILT** (for reads)

`expo-sqlite` is a real dependency and a real code path, not decoration (`package.json:37`, `app.json:33`).

**Download flow** (`src/services/database.ts:454-531`):
1. `FNR/src/services/database.ts:456` — creates `documentDirectory/sites/<siteName>/`
2. `database.ts:469` — opens a **per-site** SQLite DB at `sites/<siteName>/data.sqlite`
3. `database.ts:473-498` — `CREATE TABLE IF NOT EXISTS inspections (...)` — a flattened, denormalised single table
4. `database.ts:501-505` — pulls rows from the Supabase view `sites_report_fnr_test`
5. `database.ts:513-520` — `INSERT OR REPLACE` each row
6. `database.ts:523-524` — writes `meta.json` holding `{ lastAccessed }`

**Offline read** (`src/screens/SiteDetailScreen.tsx:89-90`, `AdminSiteDetailScreen.tsx:317-318`):
```
SELECT * FROM inspections ORDER BY inspectdate DESC
```
Connectivity is detected with `@react-native-community/netinfo` in four screens (`HomeScreen.tsx:71`, `SiteDetailScreen.tsx:69`, `AdminSiteDetailScreen.tsx:297`, `MapScreen.tsx:20`) and each screen branches online/offline in `loadX()`.

**Retention/GC** (`database.ts:587-646`): sites untouched for N days are deleted; default 30 (`database.ts:10`). Driven on app start and every 24h (`App.tsx:547-590`).

### There is NO sync. — **NOT BUILT**

This is the single most important finding about offline behaviour.

- **No outbox, no queue, no dirty flag, no conflict resolution, no retry.** Grep for a pending-write queue returns nothing. The word "sync" appears only in `syncNow` (below).
- **Offline edits are impossible.** `AdminSiteDetailScreen.tsx:399-424` (`handleSaveInspection`) calls `updateInspectionOnline(editedInspection)` **unconditionally** — there is no `if (isOnline)` guard, despite `isOnline` being tracked in that very component (`AdminSiteDetailScreen.tsx:284`). Offline, the Supabase call fails and the user gets `Alert.alert('Error', 'Failed to save changes: …')` (`AdminSiteDetailScreen.tsx:420`). **The edit is discarded.** Nothing is persisted locally, nothing is retried.
- **Conflict handling: none.** `updateInspectionOnline` (`database.ts:303-440`) issues bare `UPDATE … WHERE id = …` with no version column, no `updated_at` check, no optimistic-concurrency guard. Last writer wins silently.
- **Refreshing offline data requires a manual delete + re-download.** Confirmed by the docs themselves (`docs/FNR-user-manual.md:1184-1196`).

### "Sync Now" is mislabelled — **PARTIAL (misleading)**

`src/screens/AnalyticsScreen.tsx:192-195`:
```ts
// Manual sync button
const syncNow = async () => {
  await fetchStats();
};
```
`fetchStats` (`AnalyticsScreen.tsx:128-182`) only re-queries **analytics aggregates** (`sites_report_fnr_test` count, latest date, two RPCs). It does **not** refresh downloaded site bundles and does **not** push anything.

The user manual instructs users to press it for exactly the thing it does not do:
- `docs/FNR-user-manual.md:1159-1168` — "Mobile App Shows Old Data → Analytics → Sync Now"
- `docs/FNR-user-manual.md:1172-1182` — "Changes in Web App Don't Appear in Mobile App → Analytics → Sync Now"

**Both documented remedies are false.** The only working remedy is the delete-and-re-download in `docs/FNR-user-manual.md:1184-1196`.

### Dead offline code — **NOT BUILT (vestigial)**

A whole second offline mechanism exists and is never invoked: a bundled `mock_data.sqlite` asset (`src/assets/mock_data.sqlite`, whitelisted in `metro.config.js:7`), copied to internal storage by `loadLocalDB()` (`database.ts:13-29`) and opened by `openDatabase()` (`database.ts:34-40`), feeding `getSites` / `getImages` / `getPdfs` / `getInspections` (`database.ts:123-156`).

**Zero screens call any of these six functions.** `getSites` is imported in `HomeScreen.tsx:6` and never used; `getImages`/`getPdfs`/`getInspections` are imported in `SiteDetailScreen.tsx:9` and never used. The `images`/`pdfs` state they would feed (`SiteDetailScreen.tsx:49-50`) is declared and never populated — so the photo-gallery UI is a stub over dead code.

---

## 3. Backend & credentials

### Same Supabase project, **different schema** — this is the headline parity problem

Both apps point at Supabase project `yizmvkfkgahyoqeznvki`. But they operate on **two different, largely disjoint data models**.

| | Mobile (FNR) | Webapp |
|---|---|---|
| Inspection header | `inspectheader` | `W26_form_responses` |
| Inspection answers | `inspectdetails` | `W26_answers` |
| Question defs | `inspectquestions` | `W26_questions`, `W26_question_options`, `W26_question_keys`, `W26_form_sections` |
| Sites | `sites_list_fnr` (view) | `W26_sites-pa`, `sites_list_fnr` |
| Photos | *(none)* | `W26_attachments` |
| People | `luperson` | `luperson` |
| Reports view | `sites_report_fnr_test` | `sites_report_fnr_test`, `sites_detail_fnr_test` |

Mobile tables enumerated from `FNR/src/services/database.ts:166,185,197,211,222,312,330,346,358,420,448,502` and `AnalyticsScreen.tsx:130,136`.
Webapp targets from `webapp/utils/supabase/queries.ts:102` (`W26_answers`), `:171` (`W26_form_responses`), and `webapp/app/api/gallery/route.ts:59`, `webapp/app/api/site-images/route.ts:39` (`W26_attachments`).

**Shared surface is only:** `sites_list_fnr`, `sites_report_fnr_test`, `luperson`, and two analytics RPCs.

The webapp has moved to a **dynamic form-builder schema** (`W26_*`, driven by `webapp/app/admin/form-editor/page.tsx`). Mobile is still on the **legacy fixed schema**. A new inspection submitted on the web lands in `W26_form_responses`/`W26_answers`; mobile never reads those tables. An edit made in mobile writes `inspectdetails`; the webapp's report pages never read that table. **They pass data only insofar as the `sites_report_fnr_test` view happens to bridge them — and the mobile write path targets the underlying legacy tables, not whatever feeds the W26 side.**

### Credentials in the bundle — **CRITICAL**

Three separate problems, all shipping to the device.

**(a) Supabase anon key hardcoded and committed.**
`FNR/src/services/supabase.ts:3-4` — literal project URL and a literal `anon` JWT, committed to git. (Same key is also printed in `docs/webapp-deployment.md:80`.) An anon key is designed to be public *provided RLS is enforced* — but `docs/webapp-deployment.md:334-345` describes RLS only as something you "may need to configure", with a sample policy of `USING (true)`. Treat as unverified.

**(b) OpenCage geocoding API key hardcoded and committed.**
`FNR/src/services/openCage.ts:3` — a literal third-party billable API key in source. Extractable from any build; usable to burn the project's quota.

**(c) Supabase `service_role` key shipped into the mobile bundle. — CRITICAL**

`FNR/app.config.js:6-9` injects it into `expo.extra`:
```js
extra: {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
},
```
`expo.extra` is **embedded in the app binary** and readable by anyone with the APK/IPA. It is then read and used at runtime:
- `FNR/src/services/adminAuth.ts:20-23` — destructured from `Constants.expoConfig.extra`; module **throws at import time** if absent
- `FNR/src/services/adminAuth.ts:132` — `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` — a full admin client on the handset
- `FNR/src/services/adminAuth.ts:156` and `:176` — the service-role key sent as a `Bearer` token from the device to `/functions/v1/add-user` and `/functions/v1/delete-user`
- `FNR/src/services/adminAuth.ts:197` — `supabaseAdmin.auth.admin.updateUserById(...)`

The `service_role` key **bypasses all Row Level Security**. Anyone who installs the app can extract it and read, modify, or delete the entire SAPAA database and every user account. The project's own docs mark this key **"KEEP THIS SECRET"** (`docs/webapp-deployment.md:81`).

The webapp does this correctly for contrast: `webapp/utils/supabase/admin.ts:5` reads `process.env.SUPABASE_SECRET` — **no `NEXT_PUBLIC_` prefix**, so it stays server-side only.

Mitigating facts: no `.env` file is present in the working tree, `.env` is gitignored (`.gitignore:104`), and `git log --all -- "FNR/.env*"` returns nothing — **the key value itself was never committed.** The defect is architectural (the key is designed to be shipped to clients), not a committed-secret leak. *No secret values are reproduced in this report.*

### Client-side-only authorization — **PARTIAL**

- Admin gate is a client-side string compare: `FNR/App.tsx:212` — `if (auth?.user?.role === 'admin')`, else an `Alert`. Nothing server-side stops a modified client.
- Role lives in `user_metadata` (`auth.ts:33,60,91`), which in Supabase is **writable by the user themselves** via `auth.updateUser`. A steward can self-promote to admin unless a DB trigger prevents it (none found in this repo).
- Signup hardcodes `authenticated: false` for an admin-approval workflow (`auth.ts:386`), but nothing in the mobile app enforces that flag before granting access — `App.tsx:640` branches on `auth.isAuthenticated` only.

---

## 4. Maps & geolocation

**Map tab: PARTIAL (it's a web page, not a map).**
`FNR/src/screens/MapScreen.tsx:41-46` renders a `WebView` pointed at a **hardcoded Google My Maps embed URL** (`MapScreen.tsx:8-9`). Offline it shows a card saying the map is unavailable plus a link that also needs the internet (`MapScreen.tsx:52-62`).

**Analytics/Dashboard heatmap: BUILT (online only).**
`react-native-maps` is genuinely used in two places — `AnalyticsScreen.tsx:6,287-299` and `DashboardScreen.tsx:4,283-295` — with `MapView`, `Heatmap`, `Marker`, hardcoded to an Edmonton-centred region (`AnalyticsScreen.tsx:40-45`). Coordinates come from the `get_heatmap_data` RPC plus **live OpenCage geocoding per site** (`src/services/openCage.ts:5-25`, called from `AnalyticsScreen.tsx:98`, `DashboardScreen.tsx:87`). Both requirements make it online-only.

**Offline map tiles: NOT BUILT.** No `UrlTile`, no tile cache, no MBTiles, no offline region download. Nothing in `metro.config.js:7`'s asset whitelist relates to tiles.

**Device geolocation: NOT BUILT.** `expo-location` is not a dependency (`package.json:12-56`). No `getCurrentPosition`, no `Geolocation`, no location permission declared in `app.json`. **The app cannot tell a steward where they are, cannot stamp an observation with a GPS fix, and cannot sort sites by proximity.**

---

## 5. Photo capture & upload — **NOT BUILT**

Nothing. No camera, no gallery picker, no upload.

- No `expo-camera`, `expo-image-picker`, or `react-native-image-picker` in `FNR/package.json`.
- Grep across `FNR/src` and `FNR/App.tsx` for `camera|ImagePicker|takePicture|launchImageLibrary` → **zero matches**.
- No camera or photo-library permission strings in `app.json`.
- No Supabase Storage or S3 usage anywhere in `FNR/src` (no `.storage`, no `.upload(`).
- The `Image` interface (`database.ts:100-104`), `getImages` (`database.ts:132-138`), the `images` state (`SiteDetailScreen.tsx:49`) and `renderImage` (`SiteDetailScreen.tsx:143-152`) are all **dead scaffolding** over the unused mock DB — never populated, never rendered with data.

By contrast the webapp has a full photo pipeline: `webapp/app/api/s3/presign/route.ts`, `webapp/app/api/user-gallery/sir-upload/route.ts`, `webapp/app/api/gallery/route.ts`, `webapp/app/gallery/page.tsx`, `webapp/app/admin/gallery/page.tsx`, all backed by `W26_attachments`.

**This is the starkest parity gap: photos are a core SAPAA inspection artifact, and the device with the camera is the one platform that cannot capture them.**

---

## 6. Build & release path — **PARTIAL (configured, undocumented, unreleased)**

`FNR/eas.json` exists and is minimal but valid:
```json
{ "cli": { "version": ">= 7.0.0" },
  "build": { "preview":    { "android": { "buildType": "apk" } },
             "production": { "android": { "buildType": "app-bundle" } } } }
```
- EAS project is linked: `FNR/app.json:39-43` — `extra.eas.projectId = e40fa398-935d-4662-91b1-534885fe1571`
- Android `preview` → **APK (sideload)**; `production` → **AAB (Play Store)**
- `expo-dev-client` is installed (`package.json:29`), implying a custom dev-client workflow

**Gaps:**
- **No iOS build profile at all.** `eas.json` has only `android` blocks. `app.json:17-19` sets `supportsTablet` but there is no `ios.bundleIdentifier`. **No TestFlight path exists.** Meanwhile `docs/FNR-user-manual.md:179` tells users to install from the App Store.
- **No `submit` profile** — no automated store submission.
- **Zero documentation.** Searching every `.md` in `docs/` for `eas build|eas.json|TestFlight|APK|sideload|Expo Go|Play Store|App Store` returns only two hits, both of which are the *user*-facing fiction below. `docs/Deployment-manual.md` and `docs/webapp-deployment.md` cover the webapp/AWS only — neither mentions FNR.
- **No `FNR/README.md`.**
- **The documented install path is false.** `docs/FNR-user-manual.md:177-183` says: open the Play Store / App Store, search "SAPAA", tap Install. There is no evidence of a published listing (version still `1.0.0`, package `com.zdev.stewardlog` — a personal-looking namespace). `docs/FNR-user-manual.md:965` repeats it in Troubleshooting.
- **Builds require a `.env` that is not in the repo and is documented nowhere.** `adminAuth.ts:21-23` throws on import if `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are missing from `expo.extra` — so a clean clone cannot build a working app, and nothing tells a new developer what to put where. There is no `.env.example`.

**Net:** a developer with the repo cannot ship this app to a volunteer without tribal knowledge, and an iOS volunteer cannot receive it at all.

---

## 7. Tests — **BUILT (extensive), currently RED**

Real, substantial test suite. `jest.setup.ts` is wired via `package.json:68-73` (`preset: jest-expo`).

`npx jest` result:
```
Test Suites: 1 failed, 18 passed, 19 total
Tests:       1 failed, 251 passed, 252 total
Time:        26.9 s
```

**19 suites / 252 tests** — 13 UI suites (`src/__tests__/ui-tests/`) and 6 unit suites (`src/__tests__/unit-tests/`), covering every screen plus `auth`, `adminAuth`, `database`, `openCage`, `pdfGenerator`.

**The one failure is a real stale-expectation bug**, not flake — `src/__tests__/unit-tests/auth.test.ts:175`:
```
- Expected: { isAuthenticated: true, user: { id, email, role } }
+ Received: { isAuthenticated: true, user: { id, email, role, authenticated: false } }
```
The `authenticated` field was added to the `User` shape (`src/services/auth.ts:10,34`) as part of the admin-approval feature (commit `23724dc`) and this assertion was never updated. **One-line fix.** But it means `npm test` is red on `main` — CI on this package would be failing, and nobody has noticed since March.

**Coverage gaps that matter:** the tests exercise rendering and happy paths. Nothing tests the offline write path (there isn't one), the delete-ID bug in §9, conflict behaviour, or a failed network save.

---

## 8. Parity vs. the webapp

Read-only comparison against `webapp/app`.

| Capability | Webapp | Mobile (FNR) | Verdict |
|---|---|---|---|
| Browse/search sites | `app/sites/page.tsx` | `HomeScreen.tsx` | parity |
| View site detail + history | `app/detail/[namesite]/page.tsx` | `SiteDetailScreen.tsx` | parity |
| **Create a new inspection** | `app/detail/[namesite]/new-report/page.tsx` | — | **MOBILE MISSING** |
| **Edit an inspection (steward)** | `app/detail/[namesite]/edit-report/[responseId]/page.tsx` | — (admin-only, `AdminSiteDetailScreen.tsx`) | **MOBILE MISSING** |
| **Photo upload / gallery** | `app/gallery`, `app/api/s3/presign`, `app/api/user-gallery/*` | — | **MOBILE MISSING** |
| **Dynamic form editor** | `app/admin/form-editor/page.tsx` | — | **MOBILE MISSING** |
| **Async PDF job queue** | `app/api/pdf`, `app/api/pdf/status/[jobId]`, `S26_pdf_jobs` | local `expo-print` (`pdfGenerator.ts:114-135`) | divergent |
| Admin dashboard + heatmap | `app/admin/dashboard` | `DashboardScreen.tsx` | parity |
| Account management | `app/admin/account-management` | `AccountManagementScreen.tsx` | parity (mobile insecure, §3) |
| **Offline access** | — | `HomeScreen`/`SiteDetailScreen` + SQLite | **WEB MISSING** (mobile's one real advantage) |
| Auth (email + Google + MS) | `app/login`, `app/auth/callback` | `LoginScreen.tsx`, `auth.ts` | parity |

### Does mobile data show up correctly on web?

**Largely no.**

1. **Schema divergence (§3)** — mobile writes `inspectdetails`/`inspectheader`/`luperson`; the webapp's report screens read `W26_form_responses`/`W26_answers`/`W26_questions`. A mobile edit does not reach the web's report UI, and a web-created report does not reach mobile's list except through the `sites_report_fnr_test` view.
2. **Mobile can't create data at all** — no new-inspection screen, so the only mobile→web flow is an *admin editing an existing* record.
3. **Web→mobile is stale by design** — offline bundles are snapshots refreshed only by delete + re-download (`docs/FNR-user-manual.md:1184-1196`).
4. **Mobile writes to `_test`-adjacent surfaces.** The app *reads* the view `sites_report_fnr_test` (`database.ts:197,502`) — a view whose own name says "test" — while *writing* to the production tables `inspectdetails`/`inspectheader`/`luperson` (`database.ts:312,330,346,358,420,448`). The `_fnr_test` variants sit commented out directly above each write (`database.ts:310-311, 329, 345, 357, 419, 447`). Read-from-test / write-to-prod is a live hazard.

---

## 9. Data-integrity bugs found

### 9.1 CRITICAL — inspection delete targets the wrong record

`FNR/src/services/database.ts:270` builds a **throwaway UI id** and keeps the real key separately:
```ts
id: inspections.length + 1,   // Temp ID for UI
inspection_id: header.id,     // Real ID for updates
```

The save path correctly uses the real key (`database.ts:304` — `editedInspection.inspection_id`). **The delete path does not.** `FNR/src/screens/AdminSiteDetailScreen.tsx:443`:
```ts
await deleteSiteReportOnline(selectedInspection.id);   // <- temp UI index (1, 2, 3 …)
```
which lands in `FNR/src/services/database.ts:448-450`:
```ts
.from('inspectdetails').delete().eq('inspection', inspectionId)
```

So deleting the 2nd inspection in the list issues `DELETE FROM inspectdetails WHERE inspection = 2` — **destroying all detail rows of whichever inspection genuinely has header id 2**, an unrelated record, possibly at an unrelated site. Should be `selectedInspection.inspection_id`.

### 9.2 HIGH — that delete silently reports success and orphans the header

`FNR/src/services/database.ts:444-451`: `detailError` is destructured and **never checked**, and the function has no `return`/`throw`. The caller's `try` therefore always succeeds and shows `Alert.alert('Success', 'Inspection deleted from Supabase.')` (`AdminSiteDetailScreen.tsx:444`) **even when the delete was rejected by RLS or failed outright.** It also deletes only `inspectdetails` and never the `inspectheader` row — leaving a headless inspection that still appears in list views.

### 9.3 MEDIUM — offline delete diverges permanently

`AdminSiteDetailScreen.tsx:446-447` deletes from the local SQLite cache when offline. With no sync layer, that deletion **never reaches the server** and is silently reverted the next time the site is re-downloaded — while the user was told "Success, Inspection deleted locally." (`:448`).

### 9.4 LOW — retention-setting key typo splits reads

Settings writes `@SAPPA_autoDeleteDays` (double-P) — `SettingsScreen.tsx:9`. `App.tsx:554,572` reads the same misspelling, so the primary path works. But `database.ts:601` reads `@SAPAA_autoDeleteDays` (correct spelling) — a key nothing ever writes. That fallback branch inside `cleanupExpiredSites` therefore always silently uses the 30-day default instead of the user's choice. Latent today (App.tsx always passes the value explicitly); a trap for the next caller.

### 9.5 LOW — notes round-trip through string concatenation

`updateInspectionOnline` (`database.ts:367-432`) reconstructs individual observation rows by **splitting the rendered notes blob on `'; '`** and regex-matching `^(Q\d+[^:]*?):\s*(.*)$` (`database.ts:374-390`). Any observation text containing `"; "` silently corrupts the mapping, and unmatched codes are skipped with only a `console.warn` (`:410`).

---

## 10. Documentation vs. reality

`docs/FNR-user-manual.md` (1349 lines) is well-written and describes an app that partly does not exist.

| Doc claim | Reality |
|---|---|
| `:177-183` Install from Play Store / App Store, search "SAPAA" | **False.** No published listing; no iOS build profile exists at all (`eas.json`). |
| `:1159-1168` Old data → "Analytics → Sync Now" | **False.** `syncNow` only refreshes analytics KPIs (`AnalyticsScreen.tsx:192-195`). |
| `:1172-1182` Web changes not showing → "Sync Now" | **False.** Same; also the two apps are on different schemas (§3). |
| `:278-312` Working Offline — download, view, read reports, generate PDFs | **Accurate.** This is the app's genuine strength. |
| `:1184-1196` Offline data outdated → delete and re-download | **Accurate** — and is in fact the *only* refresh mechanism. |
| `:376-395` "Using the Map" / "interactive map" | **Overstated.** A WebView of a fixed Google My Maps page (`MapScreen.tsx:8,41`). |
| `:146-173` roles / admin approval | Described, but enforced **client-side only** (`App.tsx:212`), and `user_metadata` is user-writable (§3). |
| Build/release process | **Absent from every doc.** `Deployment-manual.md` and `webapp-deployment.md` cover the webapp only. |

Nothing in the manual mentions photo capture on mobile — the docs are at least honest about that gap.

---

## 11. Summary table

| Area | Status |
|---|---|
| Auth (email + Google + Microsoft) | **BUILT** |
| Site browse / search / sort | **BUILT** |
| Inspection history viewing (by date / by question) | **BUILT** |
| Offline **read** via per-site SQLite | **BUILT** |
| Retention / auto-cleanup of cached sites | **BUILT** |
| Local PDF generation & share | **BUILT** (works offline) |
| Analytics KPIs + heatmap | **BUILT** (online only) |
| Test suite | **BUILT** (252 tests) — **1 failing** |
| Admin user management | **PARTIAL** — works, but via service-role key on device |
| Inspection **edit** | **PARTIAL** — admin-only, online-only, delete is broken (§9.1) |
| Map | **PARTIAL** — WebView of a fixed Google My Maps page |
| EAS build config | **PARTIAL** — Android only, undocumented, never released |
| "Sync Now" | **PARTIAL** — mislabelled; refreshes analytics only |
| **Offline write / sync / conflict resolution** | **NOT BUILT** |
| **Create a new inspection on mobile** | **NOT BUILT** |
| **Photo capture / upload** | **NOT BUILT** |
| **Device geolocation** | **NOT BUILT** |
| **Offline map tiles** | **NOT BUILT** |
| **iOS build / TestFlight path** | **NOT BUILT** |
| **Schema alignment with webapp (`W26_*`)** | **NOT BUILT** |
| Server-side authorization | **NOT BUILT** (client-side gate only) |

---

## 12. Recommended priority order

1. **Remove `SUPABASE_SERVICE_ROLE_KEY` from the mobile bundle** (`app.config.js:8`, `adminAuth.ts:20,132,156,176,197`). Move every admin operation behind an Edge Function that authorizes the caller's JWT server-side. **Rotate the key** — assume it is compromised if any build was distributed.
2. **Fix the delete bug** — `AdminSiteDetailScreen.tsx:443` must pass `inspection_id`, and `deleteSiteReportOnline` (`database.ts:444-451`) must check its error and delete the header too.
3. **Decide the schema question.** Either mobile migrates to `W26_*`, or a documented, maintained view contract bridges the two. Today they silently diverge.
4. **Enforce roles server-side** with RLS; stop trusting `user_metadata.role`.
5. **Rotate the OpenCage key** (`openCage.ts:3`) and move it to `expo.extra`/EAS secrets.
6. **Either build offline write + an outbox, or remove the edit button when offline** and say so in the UI. Silent data loss is the worst of the three options.
7. **Fix `auth.test.ts:175`** so `npm test` is green, and put FNR in CI.
8. **Correct the user manual** — install path, "Sync Now", and the map description.
9. **Write `FNR/README.md`** with `.env.example`, the EAS build commands, and the distribution story (add an iOS profile if volunteers use iPhones).
10. **Delete the dead mock-DB path** (`database.ts:13-40,100-156`, `src/assets/mock_data.sqlite`) or wire it up. It currently misleads every reader into thinking photos exist.
