# Issues Backlog

Every gap and defect found in the handover audit, written so it can be exported to GitHub
Issues directly. Evidence for each item is in `docs/investigation/`.

**Effort** assumes LLM assistance, so it measures human judgement and review time, not typing.
S is under a day, M is one to three days, L is three to seven days, XL is over a week.

**Impact** is 1 to 5, where 5 means the project is meaningfully worse without it.

**Value** is impact weighted against effort. Three stars means do it now, one star means only if
there is room.

## How to export

Each entry below has a `Title`, `Labels` and a body. To file one, copy the body and run:

```bash
gh issue create --repo UAlberta-CMPUT401/F26project-SAPAA --title "<Title>" --label "<Labels>" --body "<body>"
```

Labels used: `security`, `data`, `bug`, `feature`, `mobile`, `infra`, `docs`, `ux`, `spike`.

---

## Priority table

Sorted by value. Cut the line wherever your capacity runs out.

| # | Title | Area | Impact | Effort | Value | Blocked by |
|---|---|---|---|---|---|---|
| 1 | Stop `/gallery` leaking every user's photos | security | 5 | S | ★★★ | |
| 2 | Remove committed secrets from docs and tests | security | 4 | S | ★★★ | |
| 3 | Rotate service role key and remove it from the mobile bundle | security | 5 | S | ★★★ | |
| 4 | Enforce caller identity on every server action | security | 5 | M | ★★★ | |
| 5 | Move `role` out of `user_metadata` into a table with RLS | security | 5 | M | ★★★ | |
| 6 | Decide the canonical database schema (spike) | data | 5 | S | ★★★ | |
| 7 | Add real coordinates to sites | data | 5 | M | ★★★ | |
| 8 | Fix the failing test on main | infra | 2 | S | ★★★ | |
| 9 | Add `.env.example` and a working setup guide | infra | 3 | S | ★★★ | |
| 10 | Log every role change | security | 3 | S | ★★★ | 4, 5 |
| 11 | Stop mobile silently discarding offline edits | mobile | 5 | L | ★★★ | |
| 12 | Make site search work | bug | 4 | S | ★★★ | |
| 13 | Key site detail pages by id, not name | bug | 4 | S | ★★★ | |
| 14 | Instrument the events KPIs are built from | feature | 5 | M | ★★★ | |
| 15 | Add password reset | feature | 4 | S | ★★★ | |
| 16 | Show stewards a map | feature | 4 | S | ★★★ | 7 |
| 17 | Send the approval email the app already promises | bug | 3 | S | ★★★ | |
| 18 | Cache geocoding results and bound the quota | bug | 3 | S | ★★★ | 7 |
| 19 | Fix logout | bug | 3 | S | ★★ | |
| 20 | Paginate the sites list | bug | 3 | S | ★★ | |
| 21 | Build the user profile page | feature | 4 | M | ★★ | 14 |
| 22 | Port the KPIs that already exist in the mobile app | feature | 4 | M | ★★ | 14 |
| 23 | Put the database schema in version control | infra | 4 | M | ★★ | 6 |
| 24 | Add image deletion and clean up orphaned files | feature | 4 | M | ★★ | |
| 25 | Stand up a staging environment | infra | 4 | M | ★★ | |
| 26 | Make CI actually gate merges | infra | 3 | S | ★★ | |
| 27 | Record inspection edit history | feature | 4 | M | ★★ | |
| 28 | Prepare for December field testing | infra | 4 | S | ★★ | |
| 29 | Clean the naturalness data | data | 3 | M | ★★ | |
| 30 | Add "Compare by Question" to the web app | feature | 4 | M | ★★ | |
| 31 | Fix login and signup accessibility | ux | 3 | S | ★★ | |
| 32 | Let stewards export their own PDFs | feature | 3 | S | ★★ | |
| 33 | Promote or delete the `_test` views | data | 2 | S | ★★ | 6 |
| 34 | Fix the mobile "Sync Now" button | mobile | 2 | S | ★★ | |
| 35 | Decide the fate of the Google Sheets pipeline | spike | 3 | S | ★★ | 6 |
| 36 | Fix the mobile delete-by-index bug | mobile | 4 | S | ★★★ | |
| 37 | Write a backup and recovery runbook | infra | 3 | S | ★★ | |
| 38 | Reconcile `luperson` with auth accounts | data | 4 | L | ★★ | 6 |
| 39 | Unify the two question banks | data | 4 | L | ★★ | 6 |
| 40 | Add an all-inspections summary view | feature | 3 | M | ★★ | |
| 41 | Show past inspections while filling a new one | feature | 3 | M | ★★ | |
| 42 | Support non-public, SAPAA-only answers | feature | 3 | M | ★★ | |
| 43 | Finish site classification by region and county | feature | 2 | S | ★★ | |
| 44 | Add photo capture to the mobile app | mobile | 4 | L | ★ | |
| 45 | Publish the mobile app so volunteers can install it | mobile | 3 | L | ★ | |
| 46 | Declare and request device permissions | mobile | 2 | S | ★ | 44 |
| 47 | Show how stale offline data is | mobile | 2 | S | ★ | |
| 48 | Migrate 40+ years of legacy inspections | data | 5 | XL | ★ | 6, 39 |
| 49 | Give mobile and web a shared read model | data | 4 | XL | ★ | 6, 48 |
| 50 | Resolve offline edit conflicts | mobile | 4 | XL | ★ | 11 |
| 51 | Add offline support to the web app | feature | 3 | XL | ★ | |
| 52 | Confirm whether duplicate sites exist before building dedupe | spike | 1 | S | ★ | |

## Do not build these, they already exist

Checked against the code. Scoping these again would waste a sprint.

- **Admin editor for form questions.** Add, edit, hide and drag to reorder, with a Markdown
  editor, at `webapp/app/admin/form-editor/page.tsx`.
- **PDF generation.** A real background job pipeline with S3 upload and a live notification when
  the file is ready.
- **Soft delete and admin override edit for reports.**
- **Heatmap, charts, in-app tutorial, Swagger API docs at `/api-docs`.**
- **Autosave drafts** was already specified by the Winter team as US 1.0.26. Check what shipped
  before re-estimating it.
- **Account search and filters** already exist in account management.

---

# Issue bodies

## Tier 1, do these first

### 1. Stop `/gallery` leaking every user's photos
`Labels: security, bug`

The user gallery API routes are copies of the admin routes with the role check deleted and no
owner filter added in its place, so `/gallery` serves every user's photos to any signed in user.
`webapp/app/api/user-gallery/sir-upload/route.ts` still reads `role` and then ignores it.

Fix: filter by the calling user's id, and confirm the homepage upload route has the same
treatment. Acceptance: a steward sees only their own uploads, an admin sees all.

### 2. Remove committed secrets from docs and tests
`Labels: security`

Real account passwords appear in roughly 15 Cypress specs. The Supabase key is pasted four times
into `docs/webapp-deployment.md`, which GitHub Actions publishes to a public GitHub Pages site.
An OpenCage API key is hardcoded in `FNR/src/services/openCage.ts`.

Fix: move all of these to environment variables, scrub the docs, and rotate anything that was
public. Acceptance: no credential appears in a grep of the repo or the published docs site.

### 3. Rotate the service role key and remove it from the mobile bundle
`Labels: security, mobile`

`FNR/app.config.js` passes the Supabase service role key into `expo.extra`, where the app reads it
on the device. That key ignores all database permission rules, so anyone who obtains the app file
has full database access. The key value was never committed, so this is an architecture problem
rather than a leak, but it still needs rotating.

Fix: rotate the key, remove it from the client config, and move the operations that need it behind
a server endpoint that checks the caller. Acceptance: no privileged key is present in a built app
bundle.

### 4. Enforce caller identity on every server action
`Labels: security`

Every exported function in a `'use server'` file is a public endpoint. Four such files exist and
none of them check who is calling, while most use the service role client. Any signed in account,
including one never approved, can call `updateUser` to become admin or
`rollbackSiteInspectionSubmission` to delete any report. `ProtectedRoute.tsx` only controls
rendering, it is not a gate.

Fix: read the caller's session at the top of each privileged action, look up their role in the
database, refuse if they are not permitted, and only then use the service role client.
Acceptance: calling a privileged action as a steward, outside the UI, is refused. See issue #5,
these two belong together. Tracked as US 3.0.8 in GitHub issue #5.

### 5. Move `role` out of `user_metadata` into a table with RLS
`Labels: security, data`

A user is allowed to edit their own `user_metadata`, so storing the role there means any
permission check is asking the user what their own permissions are. Nothing prevents
`auth.updateUser({data: {role: 'admin'}})`.

Fix: create a roles table, protect it with row level security so only admins can write to it, and
seed the first admin as a database record. Acceptance: a user cannot change their own role by any
route, including the auth API directly.

### 6. Decide the canonical database schema
`Labels: spike, data`

The web app reads and writes `W26_*` tables. The mobile app and the Google Sheet read and write
legacy `inspectheader`, `inspectdetails`, `inspectquestions` and `luperson`. The only shared table
is `luperson`. So a web inspection does not exist for mobile, the question bank is duplicated, and
40 years of history is invisible to the web app.

This is a one way door and it blocks a large part of the backlog. Fix: write a short architecture
decision record choosing which schema is canonical and what happens to the other. Acceptance: a
decision document merged to the repo, with the follow up work broken into issues.
See `docs/investigation/THE-SCHEMA-SPLIT.md`.

### 7. Add real coordinates to sites
`Labels: data, feature`

Sites have no latitude or longitude columns anywhere. The existing heatmap geocodes the site's
**name as text** through the OpenCage API on every page load, one site per second, caching nothing.

This blocks every map user story in the backlog. Fix: add coordinate columns, populate them, and
read from them instead of geocoding at runtime. Acceptance: the map renders from stored
coordinates with no external geocoding call on page load.

### 8. Fix the failing test on main
`Labels: bug, infra`

251 of 252 tests pass. `FNR/src/.../auth.test.ts` has a stale expectation left over from a change
in March and has been red for six months. One line.

### 9. Add `.env.example` and a working setup guide
`Labels: infra, docs`

A clean clone does not start. `FNR/src/services/adminAuth.ts` throws on import when environment
variables are missing, and no document lists what they should be. Acceptance: a new teammate can
clone and run both apps using only the README.

### 10. Log every role change
`Labels: security`

Record who made the change, who it affected, the previous and new role, and the time. Three
columns. It means "how did this person become an admin" always has an answer.

### 11. Stop mobile silently discarding offline edits
`Labels: mobile, bug`

`handleSaveInspection` in `FNR/src/screens/AdminSiteDetailScreen.tsx` calls Supabase
unconditionally. With no connection it shows an error and throws the edit away. Stewards work in
remote parks with no signal, so this is live data loss today.

Fix: queue writes locally and flush them when connectivity returns. Acceptance: an edit made with
airplane mode on is still present and syncs once reconnected.

### 12. Make site search work
`Labels: bug`

Reported broken during the handover call, and Aaron reproduced it live on 19 September. But the
web and mobile code already filter site names and counties, and there are tests covering it, so
this is a regression rather than missing work. Pin down the deployed commit and environment where
it fails before estimating.

### 13. Key site detail pages by id, not name
`Labels: bug`

Site detail is routed as `/detail/[namesite]`, so renaming a site silently breaks every link to
it, and two similarly named sites collide on the same URL. Fix before any deduplication work.

### 14. Instrument the events KPIs are built from
`Labels: feature, data`

Our mentor's advice was to measure first and decide where to display second. Almost every
stat idea currently in the backlog is a display decision resting on data nobody is recording.
Acceptance: visits, inspections, and per user activity are recorded in a queryable form.

### 15. Add password reset
`Labels: feature`

No route, no link on the login page. Acceptance: a user who forgets their password can recover
access without an admin.

### 16. Show stewards a map
`Labels: feature`

The web dashboard map and heat map are admin only, under
`webapp/app/admin/dashboard/components/Map.tsx`, but the mobile app already gives authenticated
users map and analytics tabs. The gap is web specific, so the story should say so or define what
is actually missing. Depends on issue 7.

### 17. Send the approval email the app already promises
`Labels: bug`

`webapp/components/ProtectedRoute.tsx` tells the user they will receive an email when approved.
Nothing sends one. Either send it or stop promising it.

### 18. Cache geocoding results and bound the quota
`Labels: bug`

The dashboard re-geocodes every site on every load, one per second, uncached. The OpenCage free
tier allows 2,500 requests per day. Largely resolved by issue 7, but the guard is still worth
having.

## Tier 2, high value with moderate work

### 19. Fix logout
Both apps already expose logout controls beyond the home page and call Supabase `signOut`. If a
defect remains it is session restoration or reaching pages with the back button after logging out.
Specify and test that behaviour rather than treating logout as missing. `Labels: bug`

### 20. Paginate the sites list
`/sites` fetches every site and filters and sorts client side in a `useMemo`. `Labels: bug`

### 21. Build the user profile page
`full_name`, `avatar_url` and `phone` are read in four places and written in zero, so half the data
model is already there. Needs issue 14 for the stats. `Labels: feature`

### 22. Port the KPIs that already exist in the mobile app
The mobile app already computes total sites inspected, naturalness distribution, top five sites,
"needs attention after two years", and active this year. Porting is much cheaper than building
from nothing. `Labels: feature`

### 23. Put the database schema in version control
There are zero `.sql` files in the repo and no migrations directory. Two database functions the
dashboard depends on exist only inside Supabase. The deployment manual says to contact the
development team for the schema. `Labels: infra, data`

### 24. Add image deletion and clean up orphaned files
Nothing in the codebase can delete an image. Deleting a report leaves its files in storage
permanently, against a storage budget the client capped at CAD $50. `Labels: feature`

### 25. Stand up a staging environment
Deliberately left for this team by the client. Also covers the obligation to push approved work to
the client's own deployment after each sprint. `Labels: infra`

### 26. Make CI actually gate merges
Only the webapp test job runs on pull requests. Lint and build checks are absent. The deploy job
runs on pushes to main only and invokes `/home/ubuntu/deploy/docker-compose.yml`, which lives
outside the repo, while the deployment manual says no CI is needed. The workflow also still
triggers on `Sprint-2` through `Sprint-5`, which do not exist on origin. `Labels: infra`

### 27. Record inspection edit history
Editing an inspection deletes the old answers and inserts new ones with no record of what changed.
For conservation records spanning decades this matters. `Labels: feature, data`

### 28. Prepare for December field testing
The client brief commits to field testing in early December 2026, and timed steward scenarios are
an established client practice. Confirm the date and work backwards. `Labels: infra`

### 29. Clean the naturalness data
`obs_value` holds "4 - Great", "4 = Great" and "Great" interchangeably, papered over by a
case insensitive match in a database function. Every statistic built on it inherits the mess.
`Labels: data`

### 30. Add "Compare by Question" to the web app
The mobile app lets you pick one question and see its answers across years. Nothing equivalent
exists on the web. High client value and nobody has written it down. `Labels: feature`

### 31. Fix login and signup accessibility
Observed on the live site: no `<form>` element despite submit buttons, so Enter does not submit
and password managers do not save. No `autocomplete` attributes. Password visibility toggles have
no accessible name at all. Two `<h1>` per page. Low contrast text on the dark green panel. The
user base is explicitly older and less technical. `Labels: ux`

### 32. Let stewards export their own PDFs
PDF export is admin only today. `Labels: feature`

### 33. Promote or delete the `_test` views
`sites_detail_fnr_test`, `sites_report_fnr_test`, `inspectheader_fnr_test` and `luperson_fnr_test`
are in the production read path of one or both apps. `Labels: data`

### 34. Fix the mobile "Sync Now" button
It only refreshes the analytics numbers, while the user manual tells people to press it to fix
stale site data. Both documented remedies are false. `Labels: mobile, bug`

### 35. Decide the fate of the Google Sheets pipeline
`googleSheets/code.gs` has production database write access. Its sync deletes any row missing from
the sheet, it generates primary keys with max id plus one, and it writes in two steps with a best
effort undo. Whichever schema wins in issue 6 decides whether it keeps working at all.
`Labels: spike, data`

### 36. Fix the mobile delete-by-index bug
`AdminSiteDetailScreen.tsx` passes the temporary list index where the real key belongs, so deleting
the second item in the list wipes whichever inspection happens to have that id, possibly on a
different site. The delete helper also never checks its error and always reports success.
`Labels: mobile, bug`

### 37. Write a backup and recovery runbook
`Labels: infra, docs`

## Tier 3, worth doing if there is room

### 38. Reconcile `luperson` with auth accounts
`luperson` is a people table separate from login accounts, and it is the only table shared between
the two halves of the system. This is also the documented cause of Google sign in and email sign up
producing different user records. Needs an invite or claim flow, detection of people with no login
and logins with no person, and duplicate merging. `Labels: data, feature`

### 39. Unify the two question banks
One definition of the inspection form instead of two. Question numbers must be preserved because
the legacy data is keyed on them. `Labels: data`

### 40. Add an all-inspections summary view
Asked for by the client at Dragons' Den, never built. `Labels: feature`

### 41. Show past inspections while filling in a new one
Same source, never built. `Labels: feature`

### 42. Support non-public, SAPAA-only answers
Sensitive answers that must not appear in public views or in the generated PDF. Specified by the
Winter team as US 1.0.23 and dropped. `Labels: feature`

### 43. Finish site classification by region and county
A counties table already exists, so this is finishing rather than building. `Labels: feature`

### 44. Add photo capture to the mobile app
The one device with a camera is the one that cannot attach a photo, while the web app has a
complete upload pipeline. `Labels: mobile, feature`

### 45. Publish the mobile app so volunteers can install it
The EAS build profiles define Android artifacts only. The repo does have an iOS Expo config and an
`ios` script, so the platform is not unconfigured, but nothing has been published and the manual
tells people to search an app store where the app does not appear. The publication gap still needs
resolving before December field testing if iPhones are in scope. `Labels: mobile, infra`

### 46. Declare and request device permissions
Camera, photo library and location are none of them declared or requested. `Labels: mobile`

### 47. Show how stale offline data is
Tell the user "this data is 12 days old", allow refresh without delete, and show storage use.
`Labels: mobile, ux`

### 48. Migrate 40+ years of legacy inspections
Large, and dependent on issues 6 and 39. Needs to be reversible, re-runnable, and to produce a row
count reconciliation report. `Labels: data`

### 49. Give mobile and web a shared read model
So a steward sees the same inspection history in both apps. `Labels: data`

### 50. Resolve offline edit conflicts
Two people editing the same inspection with one offline is currently undefined behaviour, and there
is no version column anywhere in the schema. `Labels: mobile, data`

### 51. Add offline support to the web app
No service worker, manifest or local storage exists. `Labels: feature`

### 52. Confirm whether duplicate sites exist before building dedupe
Duplicate sites are mentioned in no document anywhere in this project. Worth ten minutes with the
client before spending a sprint on it. The related defect that is definitely real is issue 13.
`Labels: spike`
