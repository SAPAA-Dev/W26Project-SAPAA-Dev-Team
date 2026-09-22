# SAPAA Web App — Codebase Audit (What Is Actually Built)

Scope: `webapp/` (Next.js 16 App Router + Supabase + AWS S3), plus repo-root CI/CD and
supporting directories. All paths are relative to the repo root
`/Users/saumya/Desktop/Fall26/401/F26project-SAPAA/`.

Labels used: **BUILT** (works end to end), **PARTIAL** (works but with a real gap),
**NOT BUILT** (no code exists), **BROKEN** (code exists but is wrong or unreachable).

Stack, from `webapp/package.json`:
Next 16.2.2, React 19.2, `@supabase/ssr` + `@supabase/supabase-js`, `@aws-sdk/client-s3`,
`@react-pdf/renderer`, `leaflet` + `react-leaflet` + `leaflet.heat`, `chart.js`,
`@dnd-kit`, `react-joyride`, `swagger-ui-react`, Jest + Testing Library, Cypress 15.

---

## 1. Route inventory (App Router)

### Public / auth routes

| Route | File | Status | Notes |
|---|---|---|---|
| `/` | `webapp/app/page.tsx:12` | BUILT (trivial) | Client component that immediately `router.push('/login')`. No landing page. |
| `/login` | `webapp/app/login/page.tsx` | BUILT | Email+password, Google and Microsoft OAuth buttons. Redirects to `/sites` if a session exists (`webapp/app/login/page.tsx:21`). |
| `/signup` | `webapp/app/signup/page.tsx:50` | BUILT | Calls `signup()`; new users get `user_metadata = { role: 'steward', authenticated: false }` (`webapp/services/auth.ts:119`). |
| `/auth/callback` | `webapp/app/auth/callback/route.ts` | PARTIAL | OAuth code exchange; stamps new users with `authenticated: false` using the **service-role** admin client (`webapp/app/auth/callback/route.ts:41-52`). The "is new user" guard is a broken boolean at `webapp/app/auth/callback/route.ts:40` — `(!session.user.user_metadata?.authenticated === undefined)` is always `false`, so the branch only runs because the `isNewUser` half is true; the second condition is dead. |
| `/auth/confirm` | `webapp/app/auth/confirm/route.ts` | BUILT | Exchanges email-confirm code, redirects `/sites`. |
| `/auth/auth-code-error` | `webapp/app/auth/auth-code-error/page.tsx` | BUILT | Static error page. |
| `/error` | `webapp/app/error/page.tsx:4` | BUILT (stub) | Renders one sentence of text. |
| `/terms` | `webapp/app/terms/page.tsx`, `webapp/app/terms/TermsContent.tsx` | BUILT | Long static terms/fine-print page, links out to iNaturalist (`webapp/app/terms/TermsContent.tsx:138`). |

### Steward-facing routes

| Route | File | Status | Notes |
|---|---|---|---|
| `/sites` | `webapp/app/sites/page.tsx` | BUILT | Real home page. Site cards, search by name/county, 4-way sort, 5 KPI stat cards, inspection-age badges (`webapp/app/sites/page.tsx:203-220`), Joyride tutorial, homepage image upload widget. |
| `/detail/[namesite]` | `webapp/app/detail/[namesite]/page.tsx` | BUILT | Three view modes: `by-date`, `by-question`, `image-gallery` (`webapp/app/detail/[namesite]/page.tsx:42`). Computes an average naturalness score client-side (`:309-331`). |
| `/detail/[namesite]/new-report` | `webapp/app/detail/[namesite]/new-report/page.tsx` (+ `MainContent.tsx`, `Footer.tsx`) | BUILT | The site inspection form. 915-line renderer. See §3. |
| `/detail/[namesite]/edit-report/[responseId]` | `webapp/app/detail/[namesite]/edit-report/[responseId]/page.tsx` | PARTIAL | Edit works; authorization is client-side only. See §2 and §3. |
| `/gallery` | `webapp/app/gallery/page.tsx` | PARTIAL | "User gallery". Despite the name, the backing endpoints return **every** image in the system for any signed-in user (see §6). Marked in-file as ChatGPT-generated (`webapp/app/gallery/page.tsx:3`). |
| `/private` | `webapp/private/page.tsx` | BROKEN / DEAD | Leftover from the Supabase Next.js quickstart. Renders `<p>Hello {email}</p>`. Note the directory is `webapp/private/`, not `webapp/app/private/`, so it is **not** actually routable — it is pure dead code that still imports the server Supabase client. |
| `/api-docs` | `webapp/app/api-docs/page.tsx`, `SwaggerPageClient.tsx` | BUILT | Swagger UI pointed at `/api/openapi`. Login-gated by middleware (it is not in the allow-list). |

### Admin routes (all wrapped in `<ProtectedRoute requireAdmin>`)

| Route | File | Status | Notes |
|---|---|---|---|
| `/admin/dashboard` | `webapp/app/admin/dashboard/page.tsx:278` | PARTIAL | KPI tiles, two Chart.js pie charts from Postgres RPCs, image gallery strip, and the Leaflet heatmap. Heatmap has no stored coordinates — see §4. |
| `/admin/account-management` | `webapp/app/admin/account-management/page.tsx:117` | BUILT | Full user CRUD: list, add, edit (email/password/role/approved), delete. Filter by role and by pending/approved (`:44-52`). |
| `/admin/sites` | `webapp/app/admin/sites/page.tsx:235` | BUILT | All sites incl. inactive, rename + reassign county, enable/disable, bulk multi-site PDF export (`:554-559`). |
| `/admin/sites/[id]` | `webapp/app/admin/sites/[id]/page.tsx` | BUILT | 1341 lines. Per-site admin view: all responses incl. inactive, enable/disable a response (`:406-409`), admin edit of any response (`:451`), CSV-ish export (`:480`), per-site PDF export (`:1332`). |
| `/admin/form-editor` | `webapp/app/admin/form-editor/page.tsx:300` | BUILT | Live form builder: sections list, add question, edit question + options, hide/show question (never delete, per client request — `webapp/utils/form-actions.ts:172`), drag-and-drop reorder via `@dnd-kit` (`:273`), Markdown rich-text editor for subtext/description. |
| `/admin/gallery` | `webapp/app/admin/gallery/page.tsx:126` | BUILT | Admin view of every inspection + homepage image, with search and a lightbox. Also marked ChatGPT-generated (`:3`). |

### API routes

| Route | Method | File | Auth enforced | Status |
|---|---|---|---|---|
| `/api/gallery` | GET | `webapp/app/api/gallery/route.ts:39` | session + `role === 'admin'` (`:54`) | BUILT |
| `/api/site-images` | GET | `webapp/app/api/site-images/route.ts:17` | session only (`:20`) | PARTIAL — any user can read any `siteid`/`responseid` |
| `/api/sites/[siteId]/gallery` | GET | `webapp/app/api/sites/[siteId]/gallery/route.ts:35` | session only (`:57`) | BUILT |
| `/api/homepage-images` | GET | `webapp/app/api/homepage-images/route.ts:16` | session + admin (`:23`) | BUILT |
| `/api/homepage-images/[siteId]` | GET | `webapp/app/api/homepage-images/[siteId]/route.ts:16` | session only (`:29`) | BUILT |
| `/api/user-gallery/sir-upload` | GET | `webapp/app/api/user-gallery/sir-upload/route.ts:39` | session only; `role` read at `:52` and then **never used** | BROKEN intent — returns all users' images |
| `/api/user-gallery/homepage-upload` | GET | `webapp/app/api/user-gallery/homepage-upload/route.ts:16` | session only, no `user_id` filter (`:24-27`) | BROKEN intent — same |
| `/api/s3/presign` | POST | `webapp/app/api/s3/presign/route.ts:23` | session (`:26`) | BUILT — validates MIME + 10 MB cap (`:20-21`), 180 s expiry |
| `/api/s3/presign-homepage-images` | POST | `webapp/app/api/s3/presign-homepage-images/route.ts:22` | session (`:25`) | BUILT |
| `/api/pdf` | POST | `webapp/app/api/pdf/route.ts:62` | session + admin (`:75`) | BUILT — enqueues a job, returns 202 |
| `/api/pdf/status/[jobId]` | GET | `webapp/app/api/pdf/status/[jobId]/route.ts:19` | session only (`:23`), **no `created_by` check** | PARTIAL — relies entirely on RLS |
| `/api/heatmap` | GET | `webapp/app/api/heatmap/route.ts:4` | **none** | PARTIAL — reads legacy `sites_report_fnr_test` |
| `/api/geocode` | GET | `webapp/app/api/geocode/route.ts:6` | **none** | PARTIAL — proxies OpenCage with the server API key; unauthenticated-callable geocoding proxy (middleware would redirect a browser, but any request carrying any valid session passes) |
| `/api/openapi` | GET | `webapp/app/api/openapi/route.ts:4` | none | BUILT |

`/api/heatmap`, `/api/geocode` and `/api/openapi` are **not** in the OpenAPI spec
(`webapp/lib/swagger.ts` documents 11 paths, listed at `:206`–`:937`). The spec's
`servers` list includes a Vercel URL and an **ngrok tunnel URL**
(`webapp/lib/swagger.ts:8-12`), which suggests demos were served off a laptop.

---

## 2. Auth and authorization

### How auth works — BUILT

- Supabase Auth via `@supabase/ssr`. Three distinct clients:
  - browser/anon: `webapp/utils/supabase/client.ts:5`
  - cookie-aware server (respects RLS as the user): `webapp/utils/supabase/server.ts:20`
  - **service-role** (bypasses RLS): `webapp/utils/supabase/server.ts:9` (`createServerSupabase`) and `webapp/utils/supabase/admin.ts:3` (`supabaseAdmin`)
- Providers: email/password, Google, Microsoft/Azure (`webapp/services/auth.ts:153`, `:172`),
  plus an orphaned GitHub OAuth server action (`webapp/app/login/actions.ts:21`) with no UI.
- `webapp/middleware.ts:35-46` redirects any unauthenticated request to `/login`, except
  `/login`, `/signup`, `/auth/*`, `/error`. This is the only server-enforced gate.

### Roles — PARTIAL

Two roles, both stored in **`auth.users.user_metadata`**, not a table:
- `role`: `'admin'` | `'steward'` (default `'steward'`), `webapp/utils/admin-actions.ts:23`
- `authenticated`: boolean approval flag, set `false` on signup (`webapp/services/auth.ts:119`)
  and flipped by an admin (`webapp/utils/admin-actions.ts:60-71`)

There is also a separate legacy notion of "steward" read from a `luperson` table by email
(`webapp/utils/supabase/queries.ts:349`). It only controls whether the fine-print modal is
shown on the inspection form (`webapp/app/detail/[namesite]/new-report/page.tsx:141-147`).
So "steward" means two different things in two places.

### Where permissions are checked

**Client-side only (the landmine):**
- `webapp/components/ProtectedRoute.tsx:127` — `if (requireAdmin && userRole !== 'admin')` renders an "Access Denied" card. This is a React render branch. It stops nothing on the server.
- `webapp/components/ProtectedRoute.tsx:98` — the "Awaiting Admin Approval" screen. Same.
- `webapp/components/HeaderDropdown.tsx:110` — hides the Admin menu item.
- `webapp/app/detail/[namesite]/page.tsx:649` — `const isOwner = currentUserId !== null && response.user_id === currentUserId;` decides whether the Edit button renders.
- `webapp/app/detail/[namesite]/edit-report/[responseId]/page.tsx:172-174` — `setIsAuthorized(isOwner || isAdmin)`. The only authorization on the edit page.

**Server-side, real:**
- `webapp/middleware.ts` (authentication only, never role)
- Role checks inside API route handlers: `webapp/app/api/gallery/route.ts:54`, `webapp/app/api/pdf/route.ts:75`, `webapp/app/api/homepage-images/route.ts:23`

**Server Actions — NO authorization at all.** Four files carry `'use server'`:
`webapp/app/login/actions.ts:1`, `webapp/utils/admin-actions.ts:1`,
`webapp/utils/form-actions.ts:1`, `webapp/utils/supabase/queries.ts:1`.
Every exported function in those files is a remotely-invocable POST endpoint. Not one of
them calls `auth.getUser()` to authorize the caller — the sole exception is
`getCurrentUserUid()` (`webapp/utils/supabase/queries.ts:231`), which reads the caller's id
but gates nothing. And almost all of them use `createServerSupabase()` / `supabaseAdmin`,
i.e. the **service-role key**, so RLS does not apply either.

Concretely, any signed-in account — including a `steward` whose `authenticated` flag is
`false`, i.e. one an admin has explicitly not approved — can invoke:

| Server action | File:line | Effect |
|---|---|---|
| `getAllUsers` | `webapp/utils/admin-actions.ts:12` | Dump every user's id, email, role, approval state |
| `addUser` | `webapp/utils/admin-actions.ts:28` | Create a user, **including `role: 'admin'`** |
| `updateUser` | `webapp/utils/admin-actions.ts:60` | Change any user's email, password, role, approval — full account takeover |
| `deleteUser` | `webapp/utils/admin-actions.ts:47` | Delete any account |
| `updateSite` / `toggleSiteActive` | `webapp/utils/supabase/queries.ts:448`, `:463` | Rename or disable any site |
| `setFormResponseActive` | `webapp/utils/supabase/queries.ts:218` | Hide/unhide any inspection report |
| `rollbackSiteInspectionSubmission` | `webapp/utils/supabase/queries.ts:187` | **Hard-delete** any report plus its answers and attachment rows |
| `updateSiteInspectionAnswers` | `webapp/utils/supabase/queries.ts:848` | Rewrite the answers of anyone's report |
| `saveQuestion` / `addQuestion` / `toggleQuestionActive` / `reorderQuestions` | `webapp/utils/form-actions.ts:111`, `:183`, `:173`, `:311` | Rewrite the live inspection form for every user |
| `getFormResponsesBySiteAdmin` | `webapp/utils/supabase/queries.ts:657` | Read reports an admin has deactivated |

A second, simpler escalation: the role lives in `user_metadata`, which Supabase lets the
user themselves write via `auth.updateUser({ data: { role: 'admin' } })` unless a DB hook or
custom-claims setup blocks it. Nothing in this repo blocks it. A user who does that then
passes every `role !== 'admin'` check in the API routes too.

**Verdict: authorization is NOT BUILT server-side. It is a UI convention.**

---

## 3. Site inspection form

### Form rendering — BUILT

- Entry: `webapp/app/detail/[namesite]/new-report/page.tsx`, renderer `MainContent.tsx` (915 lines), sticky nav `Footer.tsx`.
- Questions are **fully data-driven** from `W26_questions` + `W26_question_options` + `W26_form_sections` (`webapp/utils/supabase/queries.ts:302-347`), ordered by `formorder`, filtered to `is_active`.
- Supported question types (`webapp/app/detail/[namesite]/new-report/MainContent.tsx:280-476`): `option`, `selectall`, `text` (and a stray `'text\n'` case at `:398`), `agreement`, `site_select`, `date`, `image`.
- Section-by-section navigation with prev/next and last-section detection.
- Required-field enforcement before submit, listing the missing question numbers (`webapp/app/detail/[namesite]/new-report/page.tsx:406-418`).
- Per-image metadata is mandatory: caption, date, identifier (≤20 chars), photographer (≤25 chars) — `:476-496`.
- A "fine print" acceptance modal shown to non-`luperson` users (`:617`).
- Guided tour via `react-joyride` (`webapp/components/TutorialOverlay.tsx`).

### Autosave / drafts — PARTIAL

- `localStorage` only, keyed `inspection-draft-${userUid}-${siteId}` (`webapp/app/detail/[namesite]/new-report/page.tsx:187`).
- Saved on every `responses` change (`:232-236`), restored on mount (`:196-226`), cleared after a successful submit (`:574-576`).
- **Selected image files are stripped from the draft** (`:210-215`) — anything with a `previewUrl` is dropped. A steward who fills in 60 questions with 10 photos and reloads gets the text back and loses the photos silently.
- **The edit page has no draft support at all** — no `localStorage` in `webapp/app/detail/[namesite]/edit-report/[responseId]/page.tsx`.
- Draft is per-browser-profile. It does not follow the user to another device.

### Offline support — NOT BUILT

No service worker, no `manifest.json`, no IndexedDB, no `navigator.onLine` handling
anywhere (`webapp/public/` contains only SVGs and logos). Every step of submission
(`getCurrentSiteId`, `addSiteInspectionReport`, presign, S3 PUT, `uploadSiteInspectionAnswers`)
requires connectivity. Since stewards inspect remote protected areas, this is a significant
gap between the product and the field reality.

### Submission — BUILT, with a manual rollback

`webapp/app/detail/[namesite]/new-report/page.tsx:402-594`: create the response row →
per image, presign + PUT to S3 → insert answers → insert attachments → clear draft →
redirect to `/sites?submitted=true`. On any throw, `rollbackSiteInspectionSubmission()`
deletes the partial report (`:583-589`). There is no DB transaction; the rollback is
best-effort application code and is itself an unauthenticated server action.

### Editing a submitted report — PARTIAL / insecure

- Owner or admin can edit (`webapp/app/detail/[namesite]/edit-report/[responseId]/page.tsx:172-174`), client-side check only.
- Admins can also edit from `webapp/app/admin/sites/[id]/page.tsx:451`.
- Edits **replace** all answers: delete-then-reinsert into `W26_answers`
  (`webapp/utils/supabase/queries.ts:866-878`). **There is no history, no audit trail,
  no `updated_at`, no "edited by".** Prior answer text is gone permanently.
- Existing images cannot be removed on edit, only their caption/identifier updated
  (`webapp/utils/supabase/queries.ts:833`); a deliberate decision per commit
  `f875863` ("Disabled the option to edit image metadata after submitting it, as that
  would mess up the s3 files").
- Reports can be soft-hidden by an admin (`is_active`) rather than deleted
  (`webapp/utils/supabase/queries.ts:218`); user-facing queries filter on it
  (`webapp/utils/supabase/queries.ts:738`).

---

## 4. Sites, geo data, map and heatmap

### Data model

There is no `types/` directory and no generated Supabase types. The schema exists only as
hand-written interfaces in `webapp/utils/supabase/queries.ts:6-81` and
`webapp/utils/form-actions.ts:8-33`.

Current-generation tables (`W26_` / `S26_` prefixes = Winter/Spring 2026 cohorts):

| Table | Columns seen in code |
|---|---|
| `W26_sites-pa` | `id`, `namesite`, `ab_county` (FK), `is_active` — `webapp/utils/supabase/queries.ts:364-380` |
| `W26_ab_counties` | `id`, `county` — `:436-445` |
| `W26_form_responses` | `id`, `site_id`, `user_id`, `inspection_no`, `inspection_date`, `created_at`, `is_active` — `:166-185`, `:675-688` |
| `W26_answers` | `response_id`, `question_id`, `obs_value`, `obs_comm` — `:55-60` |
| `W26_questions` | `id`, `form_question`, `subtext`, `question_type`, `is_required`, `is_active`, `section_id`, `autofill_key`, `question_key_id`, `formorder`, `obs_value`, `obs_comm`, `"question key"` — `webapp/utils/form-actions.ts:60-78` |
| `W26_question_options` | `id`, `question_id`, `option_text`, `is_active`, `position` |
| `W26_question_keys` | `id`, `category`, `"question key"`, `comment`, `definition` — `webapp/utils/form-actions.ts:211-220` |
| `W26_form_sections` | `id`, `title`, `description`, `header` — `webapp/utils/form-actions.ts:44-52` |
| `W26_attachments` | `id`, `response_id`, `question_id`, `site_id`, `storage_key`, `filename`, `content_type`, `file_size_bytes`, `caption`, `description`, `photographer`, `identifier`, `date` — `webapp/utils/supabase/queries.ts:542-555` |
| `W26_homepage-image-uploads` | `storage_key`, `filename`, `content_type`, `file_size_bytes`, `site_id`, `user_id`, `date`, `photographer`, `identifier`, `caption`, `created_at` — `:569-581` |
| `S26_pdf_jobs` | `id`, `status`, `mode`, `request_payload`, `created_by`, `storage_path`, `error` — `webapp/app/api/pdf/route.ts:82-91`, `webapp/lib/pdf/processPdfJob.ts:57-60` |

Legacy tables still referenced from live code (tech debt, note the `_test` suffixes on
production paths):
- `sites_detail_fnr_test` — `webapp/utils/supabase/queries.ts:520`
- `sites_report_fnr_test` — `webapp/app/api/heatmap/route.ts:17`
- `sites_list_fnr` — `webapp/utils/supabase/queries.ts:260`, `:288`
- `luperson` — `webapp/utils/supabase/queries.ts:352`
- `vw_inspect_all` — `webapp/temp-supabase.py`

Two Postgres RPCs exist with no SQL definition anywhere in the repo:
`get_naturalness_distribution` and `get_top_sites_distribution`
(`webapp/utils/supabase/queries.ts:940`, `:950`).

### Geo data — NOT BUILT

**There is no latitude, longitude, geometry, PostGIS, or boundary column anywhere in the
schema as used by the app.** `SiteSummary` (`webapp/utils/supabase/queries.ts:6-13`) has no
spatial field, and no query selects one.

### Map — BUILT (admin dashboard only)

`webapp/app/admin/dashboard/components/Map.tsx`. Leaflet 1.9 via `react-leaflet` 5, OSM
tiles (`:82`), centred on Edmonton `[53.5461, -113.4938]` (`:76`), dynamically imported
with `ssr: false` (`webapp/app/admin/dashboard/page.tsx:31`). Default marker icons are
re-pointed at a **cdnjs CDN** (`:10-12`) — an external runtime dependency for an internal tool.

### Heatmap — PARTIAL, and architecturally fragile

`leaflet.heat` is loaded lazily (`webapp/app/admin/dashboard/components/Map.tsx:35`); the
`leaflet-heat.d.ts` at `webapp/leaflet-heat.d.ts:1` is a one-line ambient module
declaration to satisfy TypeScript. The heat layer itself is configured at `:49-57`.

How a heatmap point is produced today:
1. Admin types a keyword and hits search (`webapp/app/admin/dashboard/page.tsx:94`).
2. `GET /api/heatmap?keyword=…` does an `ilike` over `sites_report_fnr_test.namesite` and counts rows per site name in JavaScript (`webapp/app/api/heatmap/route.ts:16-47`).
3. For **each** returned site, the browser calls `GET /api/geocode?q=<site name>`, which forwards the *site name string* to the OpenCage geocoding API (`webapp/app/api/geocode/route.ts:13-23`).
4. The loop sleeps **1000 ms between sites** to dodge rate limits (`webapp/app/admin/dashboard/page.tsx:152-154`).
5. Coordinates are used once and thrown away — nothing is cached or persisted.

Consequences: a 50-site search takes ~50 s; results depend on a third-party geocoder
guessing an Alberta protected area from a name like "Riverlot 56 NA"; the weight is a count
from a legacy `_test` table, not from `W26_form_responses`; and the whole feature breaks if
`OPENCAGE_API_KEY` is unset or the free quota is exhausted (there is no fallback path).

**The single highest-leverage schema change available: add `latitude`/`longitude` (or a
PostGIS `geography(Point)`) to `W26_sites-pa`.** It deletes the geocode proxy, deletes the
1-second sleep, makes the heatmap instant, and unlocks map-based site browsing, distance
sorting, and "sites near me" for stewards.

---

## 5. People and users

### User storage — PARTIAL

Users exist **only** in Supabase's `auth.users`. There is no `profiles`/`users` table.
Everything the app knows about a person is `id`, `email`, and two `user_metadata` keys
(`role`, `authenticated`) — `webapp/utils/admin-actions.ts:20-25`. The UI also reads
`full_name`, `avatar_url` and `phone` from `user_metadata`
(`webapp/app/detail/[namesite]/new-report/page.tsx:31-34`), but **nothing in the app ever
writes them** — they only appear if an OAuth provider supplies them. For an email/password
steward they are permanently blank.

- Legacy `luperson` table holds an email list used as a boolean "is a real steward" check (`webapp/utils/supabase/queries.ts:349-359`). Its other columns are unused.

### Capability checklist

| Capability | Status | Evidence |
|---|---|---|
| Admin user list / add / edit / delete | BUILT | `webapp/app/admin/account-management/page.tsx:54-86` |
| Admin approval workflow for new signups | BUILT | `webapp/utils/admin-actions.ts:60`; gate at `webapp/components/ProtectedRoute.tsx:98` |
| **User profile page** | **NOT BUILT** | No route, no component. Nothing renders or edits a user's own details. |
| **Edit your own name / avatar / phone** | **NOT BUILT** | Fields are read in 4 places, written in 0. |
| **"My reports" / my activity view** | **NOT BUILT** | No query filters `W26_form_responses` by `user_id`; the only per-user thing is the ownership boolean at `webapp/app/detail/[namesite]/page.tsx:649`. |
| Per-user stats / KPIs / leaderboard | NOT BUILT | Global counts only (`getTotalInspectionCount`, `webapp/utils/supabase/queries.ts:907`). |
| Following / favouriting a site | NOT BUILT | No such table, type, or UI. |
| Steward↔site assignment | NOT BUILT | No join table. Any steward can file a report on any site. |
| Membership types / tiers | NOT BUILT | Exactly two roles, both in `user_metadata`. |
| Notifications / email on approval | NOT BUILT | `webapp/components/ProtectedRoute.tsx:110` **promises** "You'll receive an email notification once you've been approved" — no code sends it. |
| Password reset | NOT BUILT | No `resetPasswordForEmail` anywhere; only `resendConfirmation` (`webapp/services/auth.ts:18`). |
| Audit log of who changed what | NOT BUILT | — |

Note the "steward" name appears in report data as a free-text *answer* to question
`Q13_FirstandLastNameForGuests` (`webapp/utils/supabase/queries.ts:602`, `:646`), not as a
foreign key to a user. Reports are attributed by a typed-in string, not by identity.

---

## 6. Images and photos

### Storage — BUILT (S3, not Supabase Storage)

- AWS S3 via presigned PUT URLs. Supabase Storage is **not** used.
- Two key namespaces:
  - `inspections/{siteId}/{responseId}/{questionId}/{generatedFilename}` — `webapp/app/api/s3/presign/route.ts:94-95`
  - `homepage-image-uploads/{siteId}/{userId}/{generatedFilename}` — `webapp/app/api/s3/presign-homepage-images/route.ts:75`
  - `pdf-exports/{userId}/{jobId}/{filename}` — `webapp/lib/pdf/processPdfJob.ts:47`
- Filename convention `Site-Date-Photographer-Identifier-uuid.ext` (`webapp/utils/media/generateFilename.ts:37-38`) — a real requirement from the client, implemented properly.
- Validation: MIME allow-list (jpeg/png/webp) and 10 MB cap, both server-side (`webapp/app/api/s3/presign/route.ts:20-21`, `:60-72`). Presigned PUT expires in 180 s (`:106`). Presigned GET expires in 3600 s.
- Metadata rows go to `W26_attachments` / `W26_homepage-image-uploads`.

### Where images are displayed — BUILT

Site detail gallery tab (`webapp/app/detail/[namesite]/page.tsx:246-289`, merging
`/api/sites/{id}/gallery` and `/api/homepage-images/{id}`), user gallery
(`webapp/app/gallery/page.tsx:49-80`), admin gallery
(`webapp/app/admin/gallery/page.tsx:51-70`), admin dashboard strip
(`webapp/app/admin/dashboard/page.tsx:213-250`), and inside PDFs.

### Delete / edit — NOT BUILT (delete) / PARTIAL (edit)

- **There is no image deletion anywhere.** Zero `DeleteObjectCommand` imports, zero `DELETE`/`PUT`/`PATCH` route handlers in the entire `webapp/app/api` tree. Once uploaded, an image is permanent — including one uploaded to the wrong site or containing something that shouldn't be public.
- Editing is limited to `caption` and `identifier` on an existing attachment (`webapp/utils/supabase/queries.ts:833-845`), and only from the edit-report page. `photographer` and `date` are baked into the S3 filename and cannot be corrected.
- Deleting a report via `rollbackSiteInspectionSubmission` (`webapp/utils/supabase/queries.ts:187`) removes the `W26_attachments` **rows** but leaves the S3 objects. The bucket will accumulate orphans indefinitely.

### Privacy leak

`/api/user-gallery/sir-upload` (`webapp/app/api/user-gallery/sir-upload/route.ts:54-70`) and
`/api/user-gallery/homepage-upload` (`webapp/app/api/user-gallery/homepage-upload/route.ts:24-27`)
are copies of the admin gallery route with the `role !== 'admin'` guard deleted but no
`user_id` filter added. `/api/user-gallery/sir-upload:52` even still reads `const role = …`
and then ignores it. Any signed-in steward hitting `/gallery` receives presigned URLs for
**every photo in the system**, including ones attached to reports an admin has deactivated.

### Images in PDFs — BUILT

`webapp/lib/pdf/pdfDataFetcher.ts:54-91` presigns each attachment for 300 s, downloads the
bytes, sniffs the magic number to confirm PNG/JPEG (`:30-35`), and embeds the buffer.
Concurrency bounded to 15 via `p-limit` (`:52`). Capped at `maxImagesPerInspection`
(default 5, clamped to 0–20 at `webapp/app/api/pdf/route.ts:28-30`).

---

## 7. PDF generation and the job queue

**BUILT** — this is the most professionally engineered part of the codebase (commit
`c2c1b68 "feature: bulk and site pdf use job queue"`).

Flow:
1. `webapp/components/PdfExportModal.tsx` collects options and POSTs to `/api/pdf` (`:239`). Three modes: `single`, `site`, `multi-site` (`:229-234`).
2. `webapp/app/api/pdf/route.ts:62` authenticates, requires admin (`:75`), validates and clamps options (`:18-60`), inserts a row into `S26_pdf_jobs` with `status: 'pending'` (`:82-91`), and returns **202 + jobId** (`:103`).
3. Work is scheduled with Next's `after()` (`:97-101`) — the response is sent, then `processPdfJob` runs in the same serverless/Node process.
4. `webapp/lib/pdf/processPdfJob.ts:22` marks `processing`, fetches data, renders with `@react-pdf/renderer` `renderToBuffer` (`:39`), uploads to `pdf-exports/{userId}/{jobId}/…` (`:50-55`), marks `complete` with `storage_path` (`:57-60`). On failure it writes `status: 'failed'` + the error message (`:63`).
5. `webapp/components/PdfJobWatcher.tsx` (mounted globally in `webapp/app/layout.tsx:37`) subscribes to Supabase Realtime on `S26_pdf_jobs` filtered to `created_by=eq.<uid>` (`:18`) and auto-downloads the finished file via a synthetic `<a>` click (`:27-32`).
6. `webapp/components/PdfExportsDropdown.tsx` lists the last 20 jobs for manual re-download (`:21-25`).

Document rendering: `webapp/lib/pdf/inspectionReport.tsx` (406 lines) + `styles.ts` (312 lines) —
cover page, naturalness summary, per-section answers, embedded photos with captions.

### Caveats

- **It is not a real queue.** `after()` runs the job in the same process that served the request. There is no worker, no retry, no visibility timeout, no dead-letter. If that instance is recycled mid-render, the job is stuck on `processing` forever with nothing to reap it. Multi-site exports over hundreds of responses are exactly the case most likely to hit a platform execution limit.
- Job-status polling does not verify ownership (`webapp/app/api/pdf/status/[jobId]/route.ts:22-31`) and `PdfExportsDropdown` selects from `S26_pdf_jobs` with no `created_by` filter (`:21-25`). Both depend entirely on RLS being enabled on that table — which cannot be verified from this repo because there are no migrations (§9).
- `getFormResponsesForSiteIds` pages 1000 rows at a time and `console.log`s every page (`webapp/utils/supabase/queries.ts:986`, `:1006`) — noisy production logging.
- Only admins can export. Stewards cannot get a PDF of their own report.

---

## 8. Tests

**BUILT, and unusually extensive for a student project — but with a hard dependency problem in E2E.**

### Jest — BUILT

- Config: `webapp/jest.config.ts` (ts-jest, jsdom, `@/` path alias, CSS/image/markdown mocks).
- 55 suites, ~750 `it()` blocks, **19,363 lines** under `webapp/__tests__/`.
- Coverage is genuinely broad: API routes (`__tests__/app/api/*` — 10 files), components, admin pages, and per-user-story form tests (`INaturalistSubmissions.test.tsx`, `SectionFiveHumanActivities.test.tsx`, `OverallImpressionSite.test.tsx`, `ProtectedAreaDesignation.test.tsx`, `SectionSixNeedsDone.test.tsx`). Several name the user story explicitly, e.g. `__tests__/pages/INaturalistSubmissions.test.tsx:79` — "US 1.0.10".
- These are real assertions with mocked Supabase/S3, not stubs. `webapp/jest.setup.ts` injects dummy AWS env vars.
- **No `--coverage` threshold is configured**, so the actual covered-line percentage is unknown and unenforced.

### Cypress E2E — PARTIAL / not CI-safe

- 20 spec files, ~226 `it()` blocks, `webapp/cypress/e2e/`.
- Good scenario coverage: form fill + persistence, image upload + captions, form editor add/modify/hide, site profile edit/disable, PDF export, galleries, logout, rich text.
- `webapp/cypress.config.ts:11-67` defines Node tasks that hit the **live Supabase with the service-role key** to clean up test questions and restore site rows.
- **Every spec logs in through the real UI with a hardcoded real account and password**, committed in plaintext. Password literals appear at `webapp/cypress/e2e/pdf_export.cy.ts:21`, `admin_gallery.cy.ts:19`, `admin_media_management.cy.ts:19`, `user_gallery.cy.ts:22`, `image_upload.cy.ts:10`, `image_upload_section_persistence.cy.ts:22`, `full_form_fill_persistence.cy.ts:22`, `edit_site_inspection_form.cy.ts:11`, `image_caption_upload.cy.ts:22`, `add_form_editor.cy.ts:29` and `:96`, `modify_form_editor.cy.ts:20` and `:168`, `site_details_gallery.cy.ts:85`, `required_questions_submit_block.cy.ts` (~`:23`), `authorized_check.cy.ts:8`. Two distinct accounts are used — one admin, one steward.
- Specs hardcode `http://localhost:3000` (`webapp/cypress/e2e/authorized_check.cy.ts:5`) rather than `baseUrl`.
- Net effect: the E2E suite mutates the same Supabase project the app runs on, and cannot be run by a new contributor or by CI without those exact accounts existing.

---

## 9. Database migrations

**NOT BUILT.**

- No `supabase/` directory, no `migrations/`, no `.sql` file anywhere in the repo.
- No generated `database.types.ts`. Types are hand-maintained TypeScript interfaces in `webapp/utils/supabase/queries.ts:6-81` and `webapp/utils/form-actions.ts:8-33`, which can and will drift.
- The two RPCs the dashboard depends on (`get_naturalness_distribution`, `get_top_sites_distribution`, `webapp/utils/supabase/queries.ts:940`, `:950`) have no definition in version control. If the Supabase project is lost or a fresh one is needed, they must be rewritten from scratch.
- RLS policies are likewise invisible. Several code paths (`webapp/app/api/pdf/status/[jobId]/route.ts`, `webapp/components/PdfExportsDropdown.tsx`, `webapp/app/api/site-images/route.ts`) are only safe if specific RLS policies exist — and there is no way to confirm that from the repo.
- `webapp/temp-supabase.py` is the closest thing to a migration: a 293-line one-off script that reads the legacy `sites_detail_fnr_test` table, regex-parses free-text `notes` into question codes (`:55`), and inserts into `W26_form_responses` / `W26_answers` (`:254-287`). It writes a `migration_log.txt` (`:20`), swallows every error with `continue` (`:289-291`), has no `requirements.txt`, and is not idempotent. It is named "temp" but is the only record of how the legacy corpus was converted.

**Conclusion: schema changes are made by hand in the Supabase console.** Nobody can
reproduce the database from this repo.

---

## 10. CI/CD

Two workflows exist, both live, both `runs-on: self-hosted`.

### `.github/workflows/test.yaml` — "Webapp CI" — PARTIAL

- Triggers (`:2-12`): push to `main` and `Sprint-2`…`Sprint-5`; PRs to `'**'`. Concurrency cancel-in-progress (`:14-16`).
- Job `test-webapp` (`:19-36`): Node 20, `npm ci || npm install` in `webapp` (`:32`), then `npm test -- --forceExit` (`:36`) — i.e. Jest only.
- **No `next build`, no `npm run lint`, no Cypress in CI**, despite all three being configured (`webapp/package.json:9`, `:60`). A change that breaks the production build can merge cleanly.
- `npm ci || npm install` (`:32`) swallows lockfile drift instead of failing on it.
- No coverage gate.

### Deploy job — BROKEN / unreproducible

- `test.yaml:38-50`: gated on `main` + push (`:41`), runs `docker-compose down && docker-compose up -d --build` in `working-directory: /home/ubuntu/deploy` (`:47-50`).
- **No `docker-compose.yml` exists anywhere in the repo** — only `webapp/dockerfile`. The compose file, the env wiring and the host all live off-repo on the self-hosted runner.
- The `checkout` at `:43-44` is dead: the deploy step immediately `cd`s to an unrelated absolute path.
- **Zero secrets referenced** — all runtime env vars are set on the runner host, untracked.
- No `environment:` key. **No staging environment. No preview deploys. One target, `main` only.**

### `.github/workflows/gh-pages.yaml` — MkDocs → GitHub Pages — BUILT

- Push to `main`/`dev` + all PRs (`:5-11`); `mkdocs build --clean` (`:45`) then `peaceiris/actions-gh-pages@v4` (`:49`), publish gated to `main`/`dev` (`:50`).
- Only secret in the whole `.github/` tree: `secrets.GITHUB_TOKEN` (`:52`).
- The `dev` trigger arm is dead — no such branch exists.

### Deployment story — three contradictory accounts

| Source | Claims |
|---|---|
| `.github/workflows/test.yaml:46-50` | Docker Compose on a self-hosted EC2-style box |
| `docs/Deployment-manual.md:28`, `:253-313`, `:319` | Vercel, and explicitly "no GitHub Actions required" |
| `docs/webapp-deployment.md:29` (older) | A live Vercel URL |
| `docs/software-design.md:95-96` | "Deployment: Cybera" — nothing in the repo implements it |

`webapp/dockerfile:1-15` is a valid two-stage Node 20 Alpine build using
`output: 'standalone'` (`webapp/next.config.ts:6`), but bakes in no env vars.
`webapp/lib/swagger.ts:8-12` lists a Vercel URL *and* an ngrok tunnel as servers.

**Nobody can currently say, with evidence from this repo, how production is deployed.**
Whoever owns the runner or the Vercel project is an undocumented single point of failure.

### Required env vars (from `docs/Deployment-manual.md:160-166`, cross-checked against code)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`webapp/middleware.ts:10-11`),
`SUPABASE_SECRET` (`webapp/utils/supabase/admin.ts:5`), `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME` (`webapp/app/api/s3/presign/route.ts:8-16`),
`OPENCAGE_API_KEY` (`webapp/app/api/geocode/route.ts:4`).
`OPENCAGE_API_KEY` is **missing from the current deployment manual's required-vars table** —
it survives only in the superseded `docs/webapp-deployment.md:120`. A fresh deploy that
follows the current manual silently ships a broken heatmap.

---

## 11. Dead code, tech debt and landmines

### Security

| Issue | Location | Severity |
|---|---|---|
| Every exported server action is unauthenticated **and** runs with the service-role key | `webapp/utils/admin-actions.ts:1`, `webapp/utils/supabase/queries.ts:1`, `webapp/utils/form-actions.ts:1` | Critical — privilege escalation to full admin |
| Role stored in user-writable `user_metadata`, with no DB hook to prevent self-promotion | `webapp/components/ProtectedRoute.tsx:19`, `webapp/utils/admin-actions.ts:23` | Critical |
| "User gallery" endpoints return every user's images | `webapp/app/api/user-gallery/sir-upload/route.ts:54`, `webapp/app/api/user-gallery/homepage-upload/route.ts:24` | High — data exposure |
| PDF job status/download has no ownership check | `webapp/app/api/pdf/status/[jobId]/route.ts:25-39` | Medium — depends on unverifiable RLS |
| `/api/site-images` lets any user enumerate attachments for any site or response | `webapp/app/api/site-images/route.ts:44-45` | Medium |
| Real account passwords committed in plaintext (see §8 for the full line list) | `webapp/cypress/e2e/*.cy.ts` | High — credentials must be rotated and the accounts treated as compromised |
| Service-role key required at module load, imported into a module tree shared with pages | `webapp/utils/supabase/admin.ts:3-5` (`SUPABASE_SECRET`) | Medium — one bad import away from a client-bundle leak; the warning at `webapp/utils/supabase/server.ts:7` says exactly this |
| AWS long-lived access keys instead of an IAM role | `webapp/app/api/s3/presign/route.ts:14-15` and 5 other route files | Medium |
| Unauthenticated-callable geocoding proxy burning the OpenCage quota | `webapp/app/api/geocode/route.ts:13` (`OPENCAGE_API_KEY`) | Low |

Inside `webapp/`, no secret *values* are committed: `.env*` is gitignored
(`webapp/.gitignore`), `git ls-files` shows no env file, and every key is read from
`process.env`. No `AKIA…`, no `sk-…`, no service-role literal. The webapp exposure above is
about *where* the keys are used, plus the plaintext Cypress account passwords.

**Outside `webapp/`, real credentials are committed.** Found in the mobile app and the docs:

| Location | Kind | Note |
|---|---|---|
| `FNR/src/services/supabase.ts:3` | Supabase project URL | hardcoded, tracked |
| `FNR/src/services/supabase.ts:4` | Supabase anon/publishable JWT | hardcoded, tracked |
| `docs/webapp-deployment.md:80`, `:128`, `:184`, `:265` | the **same** anon JWT, four times in prose | **published to the public GitHub Pages site** by `.github/workflows/gh-pages.yaml` |
| `FNR/src/services/openCage.ts:3` | OpenCage API key, hardcoded literal | quota/billing exposure; the webapp does this correctly via env |
| `FNR/app.config.js:8` → `FNR/src/services/adminAuth.ts:20` | **service-role key piped into `expo.extra` and read on-device** | no value in git, but `expo.extra` ships inside the APK — any build made from this config hands full RLS-bypassing DB access to anyone who unzips it |

An anon key is only safe to publish if RLS is correct on every table — and RLS here is
undocumented, untracked (§9), and the single example policy in
`docs/Deployment-manual.md:349-356` is `USING (true)` for all authenticated users, against a
table name that no longer exists. Treat the anon key and the OpenCage key as compromised.

### Correctness bugs

- `webapp/utils/supabase/queries.ts:145` — `const inspectionNumber = data[0].inspection_no;` runs before the "no previous records" check at `:148`. On an empty `W26_form_responses` for the current year this throws `TypeError: Cannot read properties of undefined`. Currently masked only because the function is **unused** (`getNextFormInspectionNumber` is referenced nowhere outside its own file), yet `addSiteInspectionReport` calls it at `:168` — so it *is* live on every submission, and will break on the first submission of a new year if the `.like()` filter returns nothing.
- `webapp/app/auth/callback/route.ts:40` — `(!session.user.user_metadata?.authenticated === undefined)` is always `false`. Dead condition.
- `webapp/app/api/user-gallery/sir-upload/route.ts:52` — `const role = …` assigned, never read.
- `webapp/utils/form-actions.ts:5` — `import { Truck } from 'lucide-react'` in a server-only module. Unused, and pulls an icon library into the server bundle.
- `webapp/utils/supabase/queries.ts:537` — `steward: insp.steward` reads a column that is not in the `.select()` on line 521, so it is always `undefined`.
- `webapp/utils/supabase/queries.ts:83` — `keyMapPromise` is a module-level memo with no invalidation. If an admin renames a question key in the form editor, every running server instance keeps the stale map until restart.
- `webapp/next.config.ts:20` — `remotePatterns` still contains the placeholder hostname `your-project-id.supabase.co`.

### Dead / abandoned code

- `webapp/private/page.tsx` — Supabase quickstart leftover, not under `app/`, unroutable.
- `webapp/app/login/actions.ts:5-31` — `login()` and `loginGithub()` server actions; the UI uses `services/auth.ts` instead. GitHub OAuth has no button.
- `webapp/utils/supabase/queries.ts:253` (`addSiteInspection`) and `:516` (`getInspectionDetailsOnline`) — write to / read from the legacy `sites_list_fnr` and `sites_detail_fnr_test` tables. Still imported by the new-report page.
- `webapp/temp-supabase.py` — one-off migration script, 10.9 KB, committed.
- `webapp/README.md` — untouched `create-next-app` boilerplate. Zero project-specific setup instructions, no env-var list. A new contributor cannot start the app from this repo without asking someone.
- `webapp/public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` — create-next-app leftovers.
- Repo root contains `empty.md`, `ruvector.db` (1.5 MB), and a `.claude-flow/` directory — artifacts, not project files.
- `webapp/app/gallery/page.tsx:3`, `webapp/app/admin/gallery/page.tsx:3`, `webapp/app/api/sites/[siteId]/gallery/route.ts:6` carry "Generated by ChatGPT" comments, acknowledging copy-paste lineage — which is exactly how the user-gallery authorization gap was introduced.

### Duplication worth consolidating

- The S3 client is constructed independently in 7 files (`app/api/gallery`, `app/api/site-images`, `app/api/homepage-images`, `app/api/homepage-images/[siteId]`, `app/api/sites/[siteId]/gallery`, `app/api/s3/presign`, `app/api/s3/presign-homepage-images`, `app/api/pdf/status/[jobId]`, `lib/pdf/processPdfJob.ts`, `lib/pdf/pdfDataFetcher.ts`).
- `getCurrentUser()` is redefined verbatim in five files (`app/sites/page.tsx:61`, `app/detail/[namesite]/page.tsx:96`, `app/detail/[namesite]/new-report/page.tsx:21`, `app/detail/[namesite]/edit-report/[responseId]/page.tsx:25`, `components/HeaderDropdown.tsx:26`).
- `handleBack()` (the `sessionStorage` nav-stack pop) is copy-pasted into at least `app/admin/dashboard/page.tsx:252`, `app/admin/account-management/page.tsx:100`, and the other admin pages.

---

---

## 12. `FNR/` — the mobile app (abandoned, and pointed at the wrong tables)

**PARTIAL → effectively dead.**

- Expo SDK 54 / React Native 0.81.4, `"name": "stewardlog"` (`FNR/package.json:2`). EAS build profiles in `FNR/eas.json:1-16` cover **Android only** — no iOS profile, contradicting the "Android & iOS" story in `docs/index.md:462`.
- 14 screens under `FNR/src/screens/`: Login, Signup, Home, Dashboard, **Map**, SiteDetail, AdminSites, AdminSiteDetail, AccountManagement, AccountDetailsOverlay, Analytics, Settings, PDFViewer. Services for `supabase`, `auth`, `adminAuth`, `database`, `pdfGenerator`, `openCage`. 18 test files under `FNR/src/__tests__/` — **none of which any CI job runs** (`test.yaml` only touches `webapp`).
- Same Supabase project as the webapp, **but a different generation of tables**: FNR queries `sites_report_fnr_test`, `inspectdetails`, `inspectheader`, `inspectquestions`, `luperson`, `sites_list_fnr` and their `_fnr_test` variants. The webapp has migrated to `W26_*`. **Mobile and web are not looking at the same data.**
- Last commit touching `FNR/src` is `23724dc` (2026-03-19); `webapp/` has commits through `c2c1b68` (2026-08-01). ~5 months of divergence.
- A stale second Expo manifest sits at the repo root (`package.json:20`, `"name": "f25project-SAPAA"`).
- `FNR/src/assets/mock_data.sqlite` is a committed mock DB — consistent with an offline/demo posture that never landed.

This matters for user stories: `docs/index.md:462-475` (US 3.0.1) claims a report filed on
mobile is "visible on the web and vice versa", and `:477-487` (US 3.0.2) claims offline
capture with auto-sync. **Neither is true of the code on `main`.**

---

## 13. State of the documentation

- `docs/admin-manual.md`, `docs/user-manual.md`, `docs/job-documentation.md`, `docs/traceability-matrix.md`, `docs/sonar-qube.md` are **pure external embeds** — a PDF `<embed>` or a Google Docs/Sheets/Slides iframe and nothing else (e.g. `docs/admin-manual.md:1-7` is 8 lines). Not greppable, not diffable, and empty the moment a share link lapses.
- `docs/software-design.md` is a link farm: the ER diagram lives on Lucidchart (`:24-26`), UML on mermaid.live (`:34`), six sequence diagrams and the Figma mocks elsewhere (`:45-80`). No prose description of components exists in the repo.
- `docs/api-documentation.md` documents **3 of the ~15 API routes** — only `/api/geocode` (`:23-54`), `/api/heatmap` (`:58-105`) and the Supabase auth routes (`:109-118`). The W26 half (`:1-15`) just points at Swagger behind an **ngrok free tunnel** (`:7`).
- `docs/Deployment-manual.md:90-96` lists the `W26_*` tables but misspells `W26_form_reponses` and omits `W26_question_options`, `W26_question_keys`, `W26_homepage-image-uploads`, `W26_ab_counties` and `S26_pdf_jobs`.
- `docs/Deployment-manual.md:342` — "Contact your development team for the complete SQL schema." The schema is a phone call.
- Committed junk: `docs/meetings/week3/.remember/` (agent tool state, logs, PID files), `agentdb.rvf`, `ruvector.db` (1.5 MB), `empty.md`, `.DS_Store` at root and in `docs/`.

Real feature claims live in `docs/index.md`: P1 Site Inspection Web App (`:33`), P2 Site
Image Management (`:376`), P3 Mobile App (`:462`), P4 Site Management (`:492`), P5 User
Accounts (`:532`), P6 Misc UI (`:564`), with MoSCoW at `:596-653`.

---

## Implied user stories nobody has written

These are gaps where the code, the UI copy, or the client's domain clearly imply a feature
that does not exist:

1. **Approval-notification email.** `webapp/components/ProtectedRoute.tsx:110` promises the user an email. Nothing sends one. Either build it or change the copy.
2. **Password reset.** No flow exists. An admin currently resets passwords by hand via `updateUser` (`webapp/utils/admin-actions.ts:68`).
3. **User profile page.** `full_name`, `avatar_url`, `phone` are read in four places and written nowhere.
4. **"My inspections" view.** The ownership check exists (`webapp/app/detail/[namesite]/page.tsx:649`) but there is no way for a steward to list their own reports.
5. **Steward-to-site assignment.** Any steward can file against any site; "who is responsible for this site" is not modelled.
6. **Offline / field capture.** The whole product is used in remote protected areas and requires full connectivity.
7. **Photo deletion / moderation.** Nothing can remove a wrong or sensitive photo.
8. **Report edit history.** Edits destructively replace answers with no audit trail.
9. **Steward-accessible PDF export.** Only admins can export (`webapp/app/api/pdf/route.ts:75`).
10. **Site coordinates.** Runtime geocoding by name is a workaround for a missing column.
11. **S3 orphan cleanup.** Deleting a report leaves its objects in the bucket forever.
12. **Draft that survives image selection and works on the edit page.**
13. **Mobile/web data unification.** `docs/index.md:462-475` promises cross-platform report visibility; `FNR/` queries the pre-`W26_` tables, so the promise is currently false.
14. **A reproducible environment.** No SQL in the repo, no staging environment, no documented deploy target — "a new developer can stand up the project" is itself an unwritten story.
