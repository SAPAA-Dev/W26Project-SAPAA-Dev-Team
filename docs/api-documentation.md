# API Documentation

*The Fall 2026 section is the reference for every route handler, server action and database
function of the web app. It describes `main` at `ceb5188`, the Sprint 2 release, merged in
[#284](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/284) on October 13, 2026. It was
checked on October 11 and 12 against the Sprint 2 fix branches that #284 brought into `main`. The
caller checks of `queries.ts` were checked again on `main` at `ceb5188`. The Winter 2026 section is
inherited. The Fall 2025 routes are now in the Fall 2026 section.*

Sprint 3 additions are labelled below and describe the sprint branch, not the Sprint 2 tag.

## API Documentation From Fall 2026

### Access rules

#### Admin rule

An action or route that is "admin only" reads the signed-in session on the server. It allows the
call only when `app_metadata.role` is `admin` and `app_metadata.authenticated` is `true`. It never
reads `user_metadata` and never trusts a value that the caller sends. Only the server can write
`app_metadata` (PR #144, closes #71).

#### Approval rule

An account is approved when `app_metadata.authenticated` is `true`. An admin sets it on the
Account Management page (`updateUser`). A new account starts unapproved (see
[Sign-in and approval](#sign-in-sign-up-and-approval)).

#### Middleware

`webapp/middleware.ts` runs before every page, route handler and server action, except static
files and images. It reads the session with `supabase.auth.getUser()`.

| Caller | Path | Result |
|---|---|---|
| No session | Not `/login`, `/signup`, `/auth/*` or `/error` | Redirect to `/login`. An API call also gets the redirect, not JSON. |
| Signed in, not approved | `GET /sites` | Allowed. `ProtectedRoute` shows the "Awaiting Admin Approval" screen. The site load of the page gets 403 (next row), and the page wraps its load error in `ProtectedRoute` too, so the user sees the approval screen, not "Unable to Load Sites". |
| Signed in, not approved | Any other `GET` page | Redirect to `/sites`. |
| Signed in, not approved | `/api/*` or any non-`GET` request (this includes a server action `POST`) | 403 `{"error": "Your account is awaiting admin approval."}` |
| Signed in, approved | Any | Allowed. The route or action makes its own check. |

The middleware does not check a request to `/login`, `/signup`, `/auth/*` or `/error`. So each
route and action must still check the caller itself. The 401 and 403 rows in the tables below are
those checks. An action that has "No caller check" depends on the middleware only.

#### Swagger

`/api-docs` shows `webapp/lib/swagger.ts`, served by `GET /api/openapi`. It lists every route
under `/api`. The two `/auth` routes are browser redirects and are only on this page.

---

### 1. API routes

Each route handler is in `webapp/app/api/<path>/route.ts`, or `webapp/app/auth/<path>/route.ts`.
"Signed-in client" means the route calls Supabase with the session of the caller, so row level
security applies (see [Access matrix](#4-access-matrix)). "Service-role client" means it bypasses
row level security.

| Method and path | Caller rule | Client | Section |
|---|---|---|---|
| `GET /api/profile` | Approved user | Service role | [Get a profile](#get-apiprofile) |
| `PATCH /api/profile` | Signed-in user, own profile | Signed-in | [Edit your own profile](#patch-apiprofile) |
| `GET /api/site-images` | Approved user; hidden photos only for owner/admin | Signed-in | [List report images](#get-apisite-images) |
| `DELETE /api/site-images` | Admin | Signed-in | [Delete an image](#delete-apisite-images) |
| `POST /api/pdf` | Admin, or steward for own report | Signed-in and service role | [Start a PDF export](#post-apipdf) |
| `GET /api/pdf/status/{jobId}` | Job creator | Signed-in | [PDF job status](#get-apipdfstatusjobid) |
| `GET /api/gallery` | Admin | Signed-in | [Admin report gallery](#get-apigallery) |
| `GET /api/sites/{siteId}/gallery` | Approved user; hidden photos only for owner/admin | Signed-in | [Site report gallery](#get-apisitessiteidgallery) |
| `GET /api/homepage-images` | Admin | Signed-in | [Admin homepage gallery](#get-apihomepage-images) |
| `GET /api/homepage-images/{siteId}` | Signed-in user (RLS) | Signed-in | [Site homepage images](#get-apihomepage-imagessiteid) |
| `POST /api/s3/presign` | Report owner or admin | None | [Presign a report photo](#post-apis3presign) |
| `POST /api/s3/presign-homepage-images` | Signed-in user | None | [Presign a homepage photo](#post-apis3presign-homepage-images) |
| `GET /api/user-gallery/sir-upload` | Approved user; hidden photos only for owner/admin | Signed-in | [User report gallery](#get-apiuser-gallerysir-upload) |
| `GET /api/user-gallery/homepage-upload` | Signed-in user (RLS) | Signed-in | [User homepage gallery](#get-apiuser-galleryhomepage-upload) |
| `GET /api/openapi` | No check in the handler | None | [OpenAPI document](#get-apiopenapi) |
| `GET /api/geocode` | Admin | Signed-in (auth only) | [Geocode a name](#get-apigeocode) |
| `GET /api/heatmap` | Admin | Signed-in | [Heat map counts](#get-apiheatmap) |
| `GET /auth/callback` | None (sign-in step) | Signed-in and service role | [OAuth callback](#get-authcallback) |
| `GET /auth/confirm` | None (sign-in step) | Signed-in | [Email confirmation](#get-authconfirm) |

Every error body is `{"error": "<message>"}`.

#### GET /api/profile

Returns a profile, its contact details, its inspection counts and one page of its inspection
history (#138, #142). See [User Model](user-model.md).

**Query parameters:**

- `personId` (optional): the `people.id` of the profile. Without it, the route returns the profile
  of the caller.
- `page` (optional): the page of the history. A page has 10 reports. A value that is not a
  positive number reads page 1. A value above 100,000 reads page 100,000. A page after the last
  report returns 200 with `history: []`, the requested `page` and the real `total`: PostgREST
  refuses that offset with `PGRST103`, so the route counts the reports in a second query. The
  profile page shows the history with Previous and Next buttons.

**Example response:**

```json
{
  "profile": {
    "id": 12,
    "displayName": "Jane Doe",
    "skills": ["Botany"],
    "focusAreas": ["Wetlands"],
    "socials": {
      "email": "jane@example.org", "phone": null, "website": "https://example.org",
      "instagram": null, "facebook": null, "x": null, "linkedin": null
    },
    "role": "Steward"
  },
  "isOwner": false,
  "stats": { "inspectionCount": 14, "distinctSiteCount": 5 },
  "history": [
    {
      "id": 301,
      "siteId": 44,
      "siteName": "Elk Island Provincial Park",
      "siteArchived": false,
      "siteInactive": false,
      "inspectionDate": "2026-09-30"
    }
  ],
  "pagination": { "page": 1, "pageSize": 10, "total": 14 }
}
```

- `role` is `Admin` or `Steward`, read from `app_metadata` of the linked login. It is for display
  only and never authorizes a request.
- The history and `inspectionCount` include only active reports that are not archived and still
  have a site (`is_active` is true, `archived_at` is null and `site_id` is not null). `distinctSiteCount` comes from
  `get_distinct_inspected_site_count`, with the same filter.
- `siteArchived` is true when the site of the report is archived. `siteInactive` is true when the
  site is deactivated. The profile page darkens the row, labels the state and does not link to the
  report. A report whose site was permanently deleted is not in the history or counts.
- `inspectionDate` is the inspection date, or the creation time when the report has no date.
- A person with no linked login gets `role: "Steward"`, zero counts and an empty history.

**Errors:**

| Status | Body | When |
|---|---|---|
| 401 | `Sign in to view profiles.` | No signed-in user. |
| 403 | `Your account is waiting for admin approval.` | The caller is not approved. The route reads with the service role, so it repeats the approval check of the RLS policy on `people` (`20261010000100_require_approval_for_people_reads.sql`). |
| 404 | `Profile not found.` | `personId` is not a whole number, is larger than the largest `bigint`, or no person has that id. Also when the caller has no person record. |
| 500 | `Unable to load this profile.` or `Unable to load inspection history.` | A database error. |
| 503 | `Profile data is being prepared. Please try again after the profile migration is applied.` | The `people` table does not exist. |

#### PATCH /api/profile

Updates the profile of the caller (#138, #142). The route writes with the signed-in client, so the
row level security and the column grants on `people` and `socials` stop any other write. The route
does not check approval. The `people` update policy allows the owner of the row.

**Request body:**

| Field | Required | Rule |
|---|---|---|
| `displayName` | Yes | 1 to 29 characters after trim. |
| `skills` | Yes | A list of at most 12 text tags. Each tag is 1 to 40 characters after trim. Duplicates are removed. |
| `focusAreas` | Yes | The same rule as `skills`. |
| `socials` | No | An object with `email`, `phone`, `website`, `instagram`, `facebook`, `x`, `linkedin`. Blank fields become `null`. When `socials` is sent, `email` is required and must be a valid address (at most 254 characters). `phone` is at most 30 characters. Links must start with `https://` (at most 300 characters). Without `socials`, the stored contact details do not change. |

**Example response:** `{"profile": {"id": 12, "displayName": "Jane Doe", "skills": ["Botany"],
"focusAreas": ["Wetlands"], "socials": {...}}}`. `socials` is in the response only when the
request sent it.

**Errors:**

| Status | Body | When |
|---|---|---|
| 400 | `Invalid profile update.` | The body is not JSON. |
| 400 | The rule that failed, for example `Display name must be between 1 and 29 characters.`, `Skills must contain no more than 12 entries.`, `Email is required.` or `Website must be a link that starts with https://` | A field breaks a rule above. |
| 401 | `Sign in to edit your profile.` | No signed-in user. |
| 404 | `Profile not found.` | The caller has no person record. |
| 500 | `Unable to save your profile.` | The `people` update failed. Nothing is saved. |
| 500 | `Your name, skills and focus areas were saved, but your contact details were not. Try again.` | The `people` update worked and the `socials` upsert failed. The body also has `profile` with the saved name, skills and focus areas. |
| 503 | `Profile data is being prepared. Please try again after the profile migration is applied.` | The `people` table does not exist. |

#### GET /api/site-images

Returns the report images of a site or of one report, each with a presigned S3 `GET` URL that is
valid for one hour.

**Query parameters:** `siteid` and `responseid`. At least one is required. Both filters apply when
both are sent.

**Response:** `{"items": [{id, response_id, question_id, storage_key, filename, content_type,
file_size_bytes, caption, identifier, site_id, is_hidden?, imageUrl}]}`. Images of archived reports
are left out. A hidden image is returned only to the report owner or an admin. It has
`is_hidden: true`. A row whose `storage_key` is outside the image folders is left out and never signed.

**Errors:** 401 `Unauthorized` (no signed-in user). 403 `Forbidden` (user is not approved). 400
`Provide at least one of: siteid, responseid`. 500 `Failed to fetch site images` (database or S3 error).

**Caller rule:** an approved user. The route checks the session before its service-role read. It
filters hidden photos before it creates signed URLs.

#### DELETE /api/site-images

Deletes one image row and then its S3 object (#148, closes #65, US 7.0.5).

**Query parameters:** `id` (required, numeric) and `kind` (optional): `attachments` (default) or
`homepage_image_uploads`.

**Response:** `{"deleted": true, "storageCleanupComplete": true}`. When the S3 delete fails after
the row is deleted, the route logs the error and returns 200 with `storageCleanupComplete: false`.
A retry would get 404, because the row is gone.

**Errors:**

| Status | Body | When |
|---|---|---|
| 400 | `Provide a valid image kind` | `kind` is not one of the two values. |
| 400 | `Provide a numeric attachment id` | `id` is missing or not a number. |
| 401 | `Unauthorized` | No signed-in user. |
| 403 | `Forbidden` | The caller is not an approved admin. |
| 404 | `Attachment not found` or `Homepage image not found` | No row has that id. |
| 422 | `This image is stored outside the image folders and cannot be deleted here` | The `storage_key` of the row is not in `inspections/` or `homepage-image-uploads/`. Nothing is deleted. |
| 500 | `Failed to delete site image` | The database delete failed. |

**Caller rule:** admin only (see [Admin rule](#admin-rule)). The signed-in client deletes the row,
so the admin delete policies on `attachments` and `homepage_image_uploads` also apply.

#### POST /api/pdf

Starts a PDF export job and returns at once. `processPdfJob` makes the file after the response
(`after()` in Next.js). Fall 2026 added `options.hiddenQuestionIds` (#146) and the steward rule
(US 7.0.1, #68, closed by PR #155).

**Request body:** `mode` is `single` (with `responseId`, a number), `site` (with `siteName`) or
`multi-site` (with `siteNames`, a list that is not empty). `options` is optional. See `PdfOptions`
in Swagger. A bad `maxImagesPerInspection`, `pageSize` or `sortOrder` gets its default value.
`hiddenQuestionIds` keeps only whole numbers.

**Response:** 202 `{"jobId": "<uuid>"}`. The route inserts the job in `S26_pdf_jobs` with the
signed-in client.

**Errors:**

| Status | Body | When |
|---|---|---|
| 401 | `Unauthorized` | No signed-in user. |
| 403 | `Forbidden - steward or admin access required` | The caller is not an approved admin or an approved steward. |
| 403 | `Forbidden - stewards can only export their own reports` | A steward sent `mode` `site` or `multi-site`. |
| 403 | `Forbidden - only admins can hide fields on export` | A steward sent a `hiddenQuestionIds` list that is not empty (US 7.0.7 AT4). |
| 403 | `Forbidden - you can only export reports you submitted` | A steward asked for a report that does not exist or that another user submitted. The route reads `form_responses.user_id` with the service-role client. |
| 500 | The parse message, for example `Missing mode in request body` or `Missing or invalid responseId for single mode` | The body is not valid. The route returns 500, not 400. |
| 500 | `Failed to create export job` | The job insert failed. |

**Caller rule:** an approved admin can use every mode and option. An approved steward can export
one report that they submitted, with no hidden fields.

#### GET /api/pdf/status/{jobId}

Returns the status of a PDF job. When the status is `complete`, the response has a presigned S3
`downloadUrl` that is valid for one hour.

**Response:** `{"status": "complete", "downloadUrl": "..."}`, or `{"status": "<status>", "error":
<text or null>}` for any other status.

**Errors:** 401 `Unauthorized`. 404 `Job not found` (no job, or RLS hides it). 403 `Forbidden`
(the job belongs to another user).

**Caller rule:** only the user who created the job. RLS on `S26_pdf_jobs` allows a user to read
only their own jobs, and the route checks `created_by` again. An admin cannot read the job of
another user.

#### GET /api/gallery

Returns all report images (JPEG, PNG and WebP) for the admin gallery, newest first, each with
`site_name` and a one-hour presigned `imageUrl`. Images of archived reports are left out. An image
whose URL could not be signed is left out. A hidden image has `is_hidden: true` for the admin.

**Response:** `{"items": [{id, response_id, question_id, caption, identifier, date, storage_key,
content_type, file_size_bytes, filename, site_id, site_name, is_hidden?, imageUrl}]}`.

**Errors:** 401 `Unauthorized`. 403 `Forbidden` (not an approved admin). 500 with the database
message, or `Failed to load gallery`.

#### GET /api/sites/{siteId}/gallery

Returns the report images of one site for the site page, newest first. Images of archived and of
deactivated reports are left out. Hidden images are left out for other stewards. The owner and an
admin receive the image with `is_hidden: true`.

**Response:** `{"items": [{id, caption, identifier, filename, file_size_bytes, site_name,
response_id, is_hidden?, imageUrl}]}`.

**Errors:** 400 `Invalid site id`. 401 `Unauthorized`. 403 `Forbidden` (user is not approved). 500
with the database message, or `Failed to load gallery`.

**Caller rule:** an approved user. The route checks the session before its service-role read and
filters hidden photos before it creates signed URLs.

#### GET /api/homepage-images

Returns all homepage image uploads for the admin gallery, newest `date` first.

**Response:** `{"items": [{id, site_id, site_name, date, photographer, caption, identifier,
filename, file_size_bytes, storage_key, imageUrl}]}`.

**Errors:** 401 `Unauthorized`. 403 `Forbidden` (not an approved admin). 500 with the database
message, or `Failed to load images`.

#### GET /api/homepage-images/{siteId}

Returns the homepage image uploads of one site, newest `date` first, with the same item shape as
`GET /api/homepage-images`.

**Errors:** 400 `Invalid site id`. 401 `Unauthorized`. 500 with the database message, or `Failed to
load images`.

**Caller rule:** any signed-in user. The handler has no admin check. RLS limits the rows to
approved users.

#### POST /api/s3/presign

Returns a presigned S3 `PUT` URL for one report photo. The URL is valid for 180 seconds. The
signature pins the `Content-Length`, so S3 refuses a body of a different size. The route checks
the type before it signs. The browser sends the `Content-Type` header so S3 stores the correct
object type.

**Request body:** `filename`, `contentType` (`image/jpeg`, `image/png` or `image/webp`),
`fileSize` (a positive whole number, at most 10 MB), `siteId`, `responseId` and `questionId`
(positive whole numbers), `siteName`, `date`, `photographer` (optional; the default is
`user_metadata.full_name` or `UnknownUser`) and `identifier` (optional).

**Response:** `{"uploadUrl": "...", "key": "inspections/<siteId>/<responseId>/<questionId>/<file>",
"generatedFilename": "<file>"}`.

**Errors:**

| Status | Body | When |
|---|---|---|
| 400 | `Invalid file data` | `filename` or `contentType` is missing, or `fileSize` is not a positive whole number. |
| 400 | `Missing ids` / `Invalid ids` | An id is missing, or is not a positive whole number. |
| 400 | `Missing image metadata` | `siteName` or `date` is missing. |
| 400 | `Unsupported file type` / `File too large` | The type or the size breaks the rule. |
| 400 | `Invalid image metadata` | The made key is not in the folder of that site, report and question. |
| 401 | `Unauthorized` | No signed-in user. |
| 403 | `Forbidden` | The report does not exist, or the caller is not its owner and is not an approved admin. |
| 500 | `Failed to generate upload URL` | The body is not JSON, the owner check failed, or signing failed. |

**Caller rule:** only the report owner or an approved admin. The route reads
`form_responses.user_id` for `responseId` and refuses any other caller with 403, so no one can
upload into another user's report folder. `insertInspectionAttachments` checks the owner and the
key again before it saves the row.

#### POST /api/s3/presign-homepage-images

Returns a presigned S3 `PUT` URL for one homepage photo. The URL is valid for 180 seconds.

**Request body:** `contentType`, `fileSize` (at most 10 MB), `siteId`, `siteName`, `date`,
`photographer` and `identifier`. All are required.

**Response:** `{"uploadUrl": "...", "key": "homepage-image-uploads/<siteId>/<userId>/<file>"}`.
`<userId>` is the id of the caller.

**Errors:** 400 `Invalid file data` (no `contentType`), `Missing siteId`, `Missing metadata`,
`Unsupported file type` or `File too large`. 401 `Unauthorized`. 500 `Failed to generate upload
URL`.

**Caller rule:** any signed-in user. `insertHomepageImageUpload` checks the key before it saves the
row.

#### GET /api/user-gallery/sir-upload

Returns the report images (JPEG, PNG and WebP) for the gallery of a signed-in user, newest first.
Images of archived and of deactivated reports are left out. Hidden images are left out for other
stewards. The owner and an admin receive the image with `is_hidden: true`. The items do not have
`storage_key`.

**Response:** `{"items": [{id, response_id, question_id, caption, identifier, date, content_type,
file_size_bytes, filename, site_id, site_name, is_hidden?, imageUrl}]}`.

**Errors:** 401 `Unauthorized`. 403 `Forbidden` (user is not approved). 500 with the database
message, or `Failed to load gallery`.

**Caller rule:** any signed-in user. RLS limits the rows to approved users.

#### GET /api/user-gallery/homepage-upload

Returns all homepage image uploads for the gallery of a signed-in user, newest `date` first. The
items do not have `storage_key`.

**Response:** `{"items": [{id, site_id, site_name, date, photographer, caption, identifier,
filename, file_size_bytes, imageUrl}]}`.

**Errors:** 401 `Unauthorized`. 500 with the database message, or `Failed to load images`.

**Caller rule:** any signed-in user. RLS limits the rows to approved users.

#### GET /api/openapi

Returns the OpenAPI 3.0 document in `webapp/lib/swagger.ts`. `/api-docs` reads it. The handler has
no check. The middleware requires an approved session.

#### GET /api/geocode

Gets the coordinates of a place name from the OpenCage Geocoding API (Fall 2025).

**Query parameters:** `q` (required).

**Response:** always `{"latitude": ..., "longitude": ...}`, for example
`{"latitude": 53.5731, "longitude": -112.8583}`. Both values are `null`, with status 200, when
OpenCage finds no match.

**Errors:**

| Status | Body | When |
|---|---|---|
| 400 | `Missing q param` | `q` is missing. The route checks this before the session. |
| 401 | `Unauthorized` | No signed-in user, or the session check fails. |
| 403 | `Forbidden` | The caller is not an approved admin. |
| 500 | `Geocoding is not configured` | `OPENCAGE_API_KEY` is not set. The route reads it on each request and does not call OpenCage. |
| 500 | The OpenCage or network message, or `Geocoding failed` | OpenCage fails, or does not answer in 8 seconds (`axios` timeout). |

**Caller rule:** admin only (see [Admin rule](#admin-rule)). Only the heat map on the admin
dashboard calls it. Each call uses the OpenCage quota: the free plan allows 2,500 requests each
day.

#### GET /api/heatmap

Counts the rows of the view `sites_report_fnr_test` whose site name contains a keyword, for the
heat map on the admin dashboard (Fall 2025).

**Query parameters:** `keyword`. The route removes `*`, because PostgREST reads `*` as `%` in
`ilike` and has no escape for it. It escapes `\`, `%` and `_`, so the keyword matches only those
characters. A keyword that is empty after this returns `{"data": []}` with no query and no session
check.

**Response:** `{"data": [{"namesite": "Elk Island Provincial Park", "count": 15}]}`, sorted by
count, most first, and at most 50 sites. The dashboard geocodes each site one second apart, so the
cap keeps the wait short. When nothing matches: `{"data": [], "message": "No sites found"}`.

**Errors:** 401 `Unauthorized` (no signed-in user). 403 `Forbidden` (not an approved admin). 500
with the database message when the query fails, or with the exception message.

**Caller rule:** admin only (see [Admin rule](#admin-rule)). It reads with the signed-in client, so
RLS on `sites_report_fnr_test` also applies.

#### Sign-in, sign-up and approval

Login, sign-up and sign-out run in the browser with supabase-js (`webapp/services/auth.ts`). They
are not API routes. The sequence is in [Software Design](software-design.md#sign-in-sign-up-and-admin-approval).

- **Sign-up:** `signup(email, password)` checks that the email has `@` and that the password has at
  least 6 characters, then calls `supabase.auth.signUp` with `emailRedirectTo` set to
  `/auth/confirm`. It does not set a role. The `create_person_on_signup` trigger adds a `people`
  row.
- **Login:** `login(email, password)` calls `signInWithPassword`. `signInWithGoogle` and
  `signInWithMicrosoft` call `signInWithOAuth` with `redirectTo` set to `/auth/callback`.
- **Approval:** an admin sets `authenticated: true` (and the role) with `updateUser` on the
  Account Management page. Until then the [middleware](#middleware) holds the user on the
  "Awaiting Admin Approval" screen.
- **Sign-out (US 5.0.4):** `logout()` calls `supabase.auth.signOut()` and returns
  `{success, error?}`. The shared hook `webapp/hooks/useSignOut.ts` calls
  it from `HeaderDropdown`, `AdminNavBar` and `ProtectedRoute`. On success it goes to `/login`.
  On failure the user stays on the page and sees `Sign-out failed. Check your connection and try
  again.`

`webapp/app/login/actions.ts` has the server actions `login(formData)` and `loginGithub()`. No
page imports them.

#### GET /auth/callback

The OAuth redirect target. It exchanges `code` for a session with the signed-in client.

- When the user was created less than 10 seconds ago and has no `app_metadata.authenticated`, the
  route uses the service-role client to set `authenticated: false` and `role` (the existing role,
  or `steward`).
- It redirects to `next` when `next` is a path on the same site (it starts with `/`, not `//`, and
  has no `\`). Otherwise it redirects to `/sites`. In production it uses the `x-forwarded-host`
  header for the host.
- With no `code`, or when the exchange fails, it redirects to `/auth/auth-code-error`.

#### GET /auth/confirm

The email confirmation link target. It exchanges `code` for a session and redirects to `/sites`.
With no `code`, or when the exchange fails, it redirects to `/auth/auth-code-error`.

---

#### File export (Sprint 3)

| Route | Caller and result |
|---|---|
| `POST /api/export` | Approved Admin only. Returns 202 and `jobId`; 409 when that Admin already has a recent pending or processing job. The server reads the file catalogs in pages of 1000. |
| `GET /api/export/status/{jobId}` | Signed-in job creator or approved Admin. Returns the job state and, when complete, a one-hour signed download link. |

The job includes inspection images, homepage images, GPX objects and completed PDF exports.
It stops above 500 MiB of source files and fails if a stored object cannot be read. The ZIP is
held in memory. The processor and status route use the shared S3 client. Each state write checks
its error; if the failed state cannot be saved, the processor rejects to the existing background
error handler. The app does not claim success for an unrecorded completed job.

### 2. Server actions

A server action is an exported function in a `'use server'` file. The page calls it directly, but
it is still a public HTTP endpoint, so the caller check must run on the server. The helpers below
read the caller with `supabase.auth.getUser()`, never from an argument. Each file has its own
copy.

| Helper | File | Rule | On failure |
|---|---|---|---|
| `requireApprovedAdmin(message)` | `utils/supabase/queries.ts`, `utils/form-actions.ts` | Approved admin. | Throws the message. The default in `queries.ts` is `Only admins can edit sites.`. In `form-actions.ts` it is `Only admins can edit the form.`. |
| `requireApprovedCaller(message)` | `utils/supabase/queries.ts` | Approved user. Returns `{userId, isAdmin, email}`. | Throws the message. The default is `You must be signed in to view site boundaries.`. The read actions pass `Only approved users can view this data.`. |
| `requireReportWriter(responseId, message)` | `utils/supabase/queries.ts` | Approved user who owns the report, or an approved admin. The report must not be archived. Returns `{userId, isAdmin, email, siteId, createdAt}`. | Throws the message, or `A valid report ID is required.`. The default message is `You are not allowed to change this report.`. `getFormResponseById` passes `You are not allowed to view this report.`. |
| `isApprovedAdmin()` | `utils/admin-actions.ts`, `utils/kml-import-actions.ts` | Approved admin. | Returns `false`. The action returns an error object. |
| `getAdminUserId()` | `utils/steward-actions.ts` | Approved admin. Returns the user id. | Returns `null`. |

"No caller check" means that the action has no check of its own. Only the
[middleware](#middleware) stands in front of it. GitHub issue #251 listed 13 read actions in
`queries.ts` with no caller check. [PR #259](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/259)
added a check to each of them, changed `isSteward` and `getFormResponseById`, and deleted
`addSiteInspection`. Issue #251 is closed, and the fix is on `main` since #284. `getSitesOnline`
was not on the #251 list but the browser calls it, so it checks the caller too.
[PR #279](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/279) (issue #268) moved the
PDF-only reads out of `queries.ts` into `webapp/lib/pdf/reportQueries.ts`, a server-only module
that is not a server action (see
[Server-only report reads](#server-only-report-reads-webapplibpdfreportqueriests)), and made
`getNextFormInspectionNumber` private. No exported function in `queries.ts` on `main` reads data
without a caller check: each one calls `requireApprovedAdmin`, `requireApprovedCaller` or
`requireReportWriter` first, or reads with the signed-in client under RLS (`getCurrentUserUid`,
`getSitePageFields` and `getSiteLinks`). Unless the table says otherwise, an action throws an
`Error` with the database message when a query fails.

#### Site inspection reports (`webapp/utils/supabase/queries.ts`)

| Action | Caller check | Input | Returns | Errors |
|---|---|---|---|---|
| `addSiteInspectionReport` | `requireApprovedCaller` | `siteId`, `inspectionDate` | `{id}` of the new `form_responses` row. `user_id` is the caller. `inspection_no` is `<year>-<NNN>` from the private helper `getNextFormInspectionNumber`, which calls `get_max_inspection_number`. | `Only approved users can submit reports.`, `This site is not accepting new reports.` (archived or deactivated site). |
| `uploadSiteInspectionAnswers` | `requireReportWriter` for each `response_id` | A list of `{response_id, question_id, obs_value, obs_comm, is_hidden}` | The insert result. | `You are not allowed to change this report.` |
| `insertInspectionAttachments` | `requireReportWriter` for each `response_id` | A list of attachment rows | The insert result. | `You are not allowed to change this report.` (also for a `null` `response_id`), `The photo storage key is not valid.` (the key is not in the folder of that site, report and question, or `site_id` does not match the report). |
| `rollbackSiteInspectionSubmission` | `requireReportWriter` | `responseId` | Nothing. Deletes the attachments, answers and report, then the S3 objects of the attachments. | `You are not allowed to change this report.`, also when the report is more than 30 minutes old. |
| `updateSiteInspectionAnswers` | `requireReportWriter` | `responseId`, a list of answers, `inspectionDate` | The insert result. Sets the date, deletes the old answers and inserts the new ones. | `You are not allowed to change this report.` |
| `updateAttachmentMetadata` | `requireApprovedCaller`, then `requireReportWriter` on the report of the attachment | `attachmentId`, `{caption?, identifier?}` | Nothing. | `You are not allowed to change this report.` |
| `setFormResponseActive` | `requireApprovedAdmin` | `responseId`, `isActive` | Nothing. Archived reports do not change. | `Only admins can edit sites.` |
| `getSiteInspectionReportDeleteImpact` | `requireApprovedAdmin` | `responseId` | `{responseId, inspectionNo, inspectionDate, siteName, answerCount, attachmentCount}` | `Only approved admins can manage reports.`, `A valid report ID is required.`, `Site Inspection Report not found.` |
| `archiveSiteInspectionReport` | `requireApprovedAdmin` | `responseId` | `{responseId, archivedAt}`. Hides the report. Its answers and images stay. | The same first two messages, or the database message (no report, or already archived). |
| `restoreSiteInspectionReport` | `requireApprovedAdmin` | `responseId` | `{responseId}` | The same first two messages, or the database message (no report, or not archived). |
| `permanentlyDeleteSiteInspectionReport` | `requireApprovedAdmin` | `responseId` | `{impact, storageCleanupComplete}`. The database delete runs first, then the S3 delete. An S3 failure is logged and gives `storageCleanupComplete: false`. | The same first two messages, or the database message (no report, or not archived). |
| `getArchivedSiteInspectionReports` | `requireApprovedAdmin` | None | A list of `{id, inspectionNo, inspectionDate, createdAt, isActive, archivedAt, siteId, siteName, submitterId, submitterName}`, newest archive first. | `Only approved admins can manage reports.` |
| `getFormResponsesBySiteAdmin` | `requireApprovedAdmin` | `siteName` | The reports of the site that are not archived, active and inactive, with `is_active`. | `Only admins can edit sites.`, `Site not found`. |
| `getAllSiteReports` | Signed-in user. No approval check. | None | A list of `SiteReportSummary`: active reports that are not archived, with site and submitter. It reads in pages of 1000 rows until a short page, so no report past the first 1000 is cut off. | `Sign in to view inspection reports.` |
| `getFormResponsesBySite` | `requireApprovedCaller` | `siteName` | The active reports of the site that are not archived. Owners and admins receive all answers. Other approved stewards do not receive answers with `is_hidden: true`. | `Only approved users can view this data.`, `Site not found` |
| `getFormResponseById` | `requireReportWriter`: the owner of the report or an approved admin, never an archived report | `responseId` | The answers of the report as `{questionId: value}`. | `You are not allowed to view this report.` (signed out, not approved, another user's report, archived or missing report), `A valid report ID is required.` |
| `getHiddenQuestionIdsByResponseId` | `requireReportWriter`: the owner of the report or an approved admin, never an archived report | `responseId` | The unique question ids whose answers have `is_hidden: true`. | `You are not allowed to view this report.`, `A valid report ID is required.` |
| `getResponseOwnerId` | `requireApprovedCaller` | `responseId` | The `user_id` of a report that is not archived, or `null`. | `Only approved users can view this data.` |
| `getSiteIdForResponse` | `requireApprovedCaller` | `responseId` | The `site_id` of a report that is not archived, or `null`. | `Only approved users can view this data.` |
| `getQuestionResponseType` | `requireApprovedCaller` | None | `{question_id, obs_value, obs_comm}` for each active question. | `Only approved users can view this data.` |
| `getQuestionsOnline` | `requireApprovedCaller` | None | The active questions with their options and sections. | `Only approved users can view this data.` |
| `getDateOfVisitQuestionId` | `requireApprovedCaller` | None | The id of `Q21_Date_Of_Visit`, or `null`. | `Only approved users can view this data.` |
| `getTotalInspectionCount` | `requireApprovedCaller` | None | The count of reports that are not archived. | `Only approved users can view this data.` |
| `getLastInspectionDate` | `requireApprovedCaller` | None | The newest `created_at` of a report that is not archived, or `null`. | `Only approved users can view this data.` |
| `getInspectionDetailsOnline` | `requireApprovedCaller` | `namesite` | Rows of the legacy view `sites_detail_fnr_test`. | `Only approved users can view this data.` |

`addSiteInspection` is deleted. It had no caller and wrote the legacy table `sites_list_fnr` with
the service role.

#### Server-only report reads (`webapp/lib/pdf/reportQueries.ts`)

Server-only module, not a server action. The file starts with `import 'server-only';`, so a build
fails if a client file imports it, and it has no `'use server'`, so Next.js never gives the browser an
action id for these functions. They read with the service role and do not check the caller. The
caller of the module checks first: `POST /api/pdf` allows an approved admin, or an approved steward
who exports one report they submitted, and `queries.ts` calls them only after its own check. Issue #268 moved them here from `queries.ts`.

| Function | Used by | Input | Returns | Errors |
|---|---|---|---|---|
| `getSitesByNames` | `lib/pdf/pdfDataFetcher.ts` | `siteNames` | `{id, namesite, ab_county, ab_counties}[]` | The database message. |
| `getFormResponsesForSiteIds` | `lib/pdf/pdfDataFetcher.ts` | `siteIds`, `keyMap` | Active reports that are not archived, by site. It reads in pages of 1000 rows. | The database message. |
| `getAttachmentsForResponseIds` | `lib/pdf/pdfDataFetcher.ts` | `responseIds` | The attachment rows of the reports, read in chunks of 300 ids and pages of 1000 rows. | The database message. |
| `getAttachmentsByResponseId` | `lib/pdf/pdfDataFetcher.ts`, `rollbackSiteInspectionSubmission` (after `requireReportWriter`) | `responseId` | The attachment rows of the report, with `storage_key`. | The database message. |
| `getReportQuestionKeyMap` | `lib/pdf/pdfDataFetcher.ts`, `getFormResponsesBySite`, `getFormResponsesBySiteAdmin` | None | The ids of `Q31_Naturalness`, `Q32_Natural_Comm` and `Q13_FirstandLastNameForGuests`. The result is cached for the life of the server. A failed lookup is not cached, so the next call tries again. | The database message. |
| `reduceAnswers` | `getFormResponsesForSiteIds`, `getFormResponsesBySite`, `getFormResponsesBySiteAdmin` | The answer rows of one report, the key map ids | The grouped answers, special values, and their hidden flags. Not async, no database read. | None. |

The PDF job calls read actions inside `after()`, when the response is already sent. When the access
token refreshes there, `createClient` in `utils/supabase/server.ts` cannot write the new cookies.
Its `setAll` now skips the write in that case, as in the Supabase SSR template, and the middleware
refreshes the session on the next request.

#### Sites (`webapp/utils/supabase/queries.ts`)

PRs [#160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160),
[#162](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/162),
[#163](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/163),
[#167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167). `createSite`, `updateSite`
and `updateSitePageFields` return `{ok: true}` or `{ok: false, error}` instead of throwing, because
a production build of Next.js hides the message of a thrown error.

| Action | Caller check | Input | Returns | Errors |
|---|---|---|---|---|
| `createSite` | `requireApprovedAdmin` | `namesite`, `ab_county`, `protectedAreaId` (default `null`) | `{ok}` or `{ok: false, error}`. Inserts an active site with the trimmed name. | `Only admins can edit sites.`, `Site name is required.`, `The protected area is not valid.`, `A site with this name already exists.`, `That protected area is already linked to a site.`, `The selected protected area does not exist.` |
| `updateSite` | `requireApprovedAdmin` | `id`, `namesite`, `ab_county`, `protectedAreaId` (default `null`) | `{ok}` or `{ok: false, error}` | The same as `createSite`. |
| `toggleSiteActive` | `requireApprovedAdmin` | `id`, `is_active` | Nothing. | `Only admins can edit sites.` |
| `getAllSites` | `requireApprovedAdmin` | None | `SiteSummary[]` of the sites that are not archived, active and inactive. | `Only admins can edit sites.` |
| `getSiteByNameAdmin` | `requireApprovedAdmin` | `namesite` | `SiteSummary[]` (0 or 1), archived and inactive sites too. | `Only admins can edit sites.` |
| `findSitesWithName` | `requireApprovedAdmin` | `namesite` | The existing names (archived too) that equal the name, contain it, or are in it, ignoring case. A contained name has at least 4 characters. `[]` for a blank name. | `Only admins can edit sites.` |
| `getSiteSuggestions` | `requireApprovedAdmin` | None | `{name, category}` for each protected area whose name is not a site name, sorted. `category` is `protected_areas.folder`. | `Only admins can edit sites.` |
| `getCounties` | `requireApprovedAdmin` | None | `{id, county}[]` sorted by county. | `Only admins can edit sites.` |
| `getProtectedAreaChoices` | `requireApprovedAdmin` | None | `{id, name, fid, area_type}[]` sorted by name. | `Only admins can edit sites.` |
| `getProtectedAreaBoundaries` | `requireApprovedCaller` | None | A GeoJSON `FeatureCollection` with the county and site status of each area. It reads `protected_areas` with the signed-in client. A user who is not an admin does not get an area whose linked site is inactive. | `You must be signed in to view site boundaries.` |
| `getSiteDeleteImpact` | `requireApprovedAdmin` | `siteId` | `{siteId, siteName, inspectionCount, answerCount, attachmentCount, homepageImageCount, siteStewardCount}` | `A valid site ID is required.`, `Site not found.` |
| `archiveSite` | `requireApprovedAdmin` | `siteId` | `{siteId, siteName, archivedAt}`. Hides the site. Nothing else changes. | `A valid site ID is required.`, or the database message (no site, or already archived). |
| `restoreSite` | `requireApprovedAdmin` | `siteId` | `{siteId, siteName}` | `A valid site ID is required.`, or the database message (no site, or not archived). |
| `permanentlyDeleteSite` | `requireApprovedAdmin` | `siteId` | The delete-impact counts from before the delete. See [Delete behavior](#delete-behavior). | `A valid site ID is required.`, or the database message (no site, or not archived). |
| `getArchivedSites` | `requireApprovedAdmin` | None | `SiteSummary[]` of the archived sites, newest archive first. | `Only admins can edit sites.` |
| `updateSitePageFields` | `requireApprovedAdmin` | `siteId`, `fields: {fieldKey, value, isVisible}[]` | `{ok}` or `{ok: false, error}`. Upserts one row for each field on `(site_id, field_key)` with `updated_by`. A link field keeps its value. Any other field stores `null`. | `A valid site ID is required.`, `The site page fields are not valid.`, `Unknown site page field: <key>`, `Site page field listed twice: <key>`, `Visibility must be true or false: <key>`, `Links must start with http:// or https://` |
| `getSitePageFields` | No check in the action. It reads with the signed-in client (RLS on `site_page_fields`). | `siteId` | `{fieldKey, value, isVisible}[]` | The database message. |
| `getSiteLinks` | The same as `getSitePageFields`. | `siteId` | `{sapaaWebsiteUrl, iNaturalistUrl}`. A hidden link is `null`. A field with no row gets its default link. | The database message. |
| `getSitesOnline` | `requireApprovedCaller`: approved users only. `/sites` and `UploadImages` call it from the browser. | None | `SiteSummary[]` of the active sites that are not archived. `inspectdate` comes from two embedded reads that each return one row: the newest dated report and the newest undated report of the site, not every report. | The database message. |
| `getSiteByName` | `requireApprovedCaller` | `namesite` | `SiteSummary[]` (0 or 1) of a site that is not archived. | `Only approved users can view this data.`, or the database message. |
| `getCurrentSiteId` | `requireApprovedCaller` | `siteName` | The id of an active site that is not archived. | `Only approved users can view this data.`, or the database message (also when no site matches). |
| `getNaturalnessDistribution` | `requireApprovedAdmin` | None | `{naturalness_score, count}[]` from `get_naturalness_distribution`. | `Only admins can edit sites.` |
| `getTopSitesDistribution` | `requireApprovedAdmin` | None | The five sites with the most reports, `{namesite, count}[]`. | `Only admins can edit sites.` |

#### Other actions in `queries.ts`

| Action | Caller check | Input | Returns | Errors |
|---|---|---|---|---|
| `insertHomepageImageUpload` | `requireApprovedCaller` | A list of homepage image rows | The insert result. `user_id` is the caller. | `Only approved users can upload images.`, `The photo storage key is not valid.` (the key is not `homepage-image-uploads/<site_id>/<caller>/...`). |
| `getCurrentUserUid` | Reads the session of the caller only. | None | The id of the caller, or `undefined`. | The auth message. |
| `isSteward` | `requireApprovedCaller`. It takes no argument and reads the email of the signed-in user, so a caller cannot test other email addresses. | None | `true` when `luperson` has the email of the caller. `false` when the caller has no email. | `Only approved users can view this data.`, or the database error. |

#### Site stewards (`webapp/utils/steward-actions.ts`, #133, US 3.0.2)

| Action | Caller check | Input | Returns | Errors |
|---|---|---|---|---|
| `searchStewards` | `getAdminUserId`. Other callers get `[]`. | `query` | Up to 10 `{id, displayName}` from `people` whose name contains the query. `*` is removed and `%`, `_`, `\` are escaped. | The database message. |
| `assignSiteSteward` | `getAdminUserId` | `siteId`, `personId` | `{success: true}` or `{success: false, error}`. Upserts `site_stewards` with the service-role client. A new assignment replaces the old one. | `Only admins can assign a steward.`, `Invalid site or person.`, `The steward was not assigned. Try again.` (database error; the database message goes to the server log). |
| `getSiteSteward` | No check in the action. Signed-in client: RLS allows approved users only. | `siteId` | `{id, displayName}` or `null` | The database message. |
| `getSitesForSteward` | No check in the action. Signed-in client: RLS allows approved users only. | `personId` | `{siteId, namesite, isActive}[]`. Archived sites are left out. `isActive` is false for a deactivated site. | The database message. |
| `getPersonByAuthUserId` | No check in the action. Signed-in client: RLS allows approved users, and the owner for their own row. | `authUserId` | `{id, displayName}` or `null` | The database message. |

#### User accounts (`webapp/utils/admin-actions.ts`, #144)

Each action uses `supabaseAdmin` (the service role) after `isApprovedAdmin`.

| Action | Caller check | Input | Returns | Errors |
|---|---|---|---|---|
| `getAllUsers` | `isApprovedAdmin`. Other callers get `[]`. | None | `{id, email, role, authenticated}[]` read from `app_metadata`. It calls `auth.admin.listUsers` page by page, 1000 users a page, until a page is not full. Before, it read only the first page (50 users by default). | Returns `[]` when any page fails, so the page never shows a part of the list. |
| `addUser` | `isApprovedAdmin` | `{email, password, role?, authenticated?}` | `{success: true}` or `{success: false, error}`. Writes `role` (default `steward`) and `authenticated` (default `false`) to `app_metadata`. | `Only admins can manage user accounts.` or the auth message. |
| `updateUser` | `isApprovedAdmin` | `{id, email, password?, role, authenticated}` | `{success: true, data}` or `{success: false, error}`. Keeps the other `app_metadata` keys. | `Only admins can manage user accounts.`, `User not found.` or the auth message. |
| `deleteUser` | `isApprovedAdmin` | `userId` | `{success: true}` or `{success: false, error}` | `Only admins can manage user accounts.` or the auth message. |

#### Form editor (`webapp/utils/form-actions.ts`)

Each action calls `requireApprovedAdmin` and throws `Only admins can edit the form.` for any other
caller. Then it uses the service-role client. `saveQuestion` and `addQuestion` return their errors
instead of throwing them, because Next.js hides the message of an error thrown by a server action
in production.

The form editor page (`app/admin/form-editor/page.tsx`) calls `fetchFormSections` and
`fetchFormQuestions` once when it opens. Only the newest `fetchFormQuestions` call may set the
questions, so a late response cannot undo a newer change, for example an active toggle.

| Action | Input | Returns | Errors |
|---|---|---|---|
| `fetchFormSections` | None | `{id, title, description, header}[]` | `Failed to load sections: <message>` |
| `fetchFormQuestions` | None | All questions with their active options, by `formorder`. | `Failed to load questions: <message>` |
| `getMaxFormOrder` | None | The highest `formorder`, or 0. | None. A database error gives 0. |
| `saveQuestion` | A `FormQuestion` | `{success: true}` or `{success: false, error}`. Updates the question, then sets removed options inactive, then updates or inserts the other options with their position (these writes run in parallel). Every write is checked, and a failure is logged with `console.error`. The writes are not one transaction, so a failure can leave some options saved. | `The question was not saved. Try again.` (question update) or `Some answer options were not saved. Try again.` (any option write). The form editor shows the message and keeps the editor open. |
| `toggleQuestionActive` | `questionId`, `currentState` | Nothing. Sets `is_active` to the opposite value. | `Failed to update question status: <message>` |
| `addQuestion` | `sectionId`, `{form_question, subtext, question_type, is_required, options, question_key}` | `{success: true}` or `{success: false, error}`. Calls `add_question_atomically`, which inserts the `question_keys` row, the `questions` row at the end of the form, and the options of an `option` or `selectall` question in one transaction. A failure leaves no row behind, so the admin can try again with the same key. | `This question key or one of its options already exists.` (Postgres `23505`) or `The question was not added. Try again.` The form editor shows the message. |
| `reorderQuestions` | `{questionId, questionName, newOrder}[]` | Nothing. | `Failed to update question <id>: <message>` |

#### Protected areas (`webapp/utils/kml-import-actions.ts`, #152, US 6.0.1)

| Action | Caller check | Input | Returns | Errors |
|---|---|---|---|---|
| `importProtectedAreasFromStorage` | `isApprovedAdmin` | `storagePath`: a `.kml` or `.kmz` file in the `kml-imports` bucket, as `kml-imports/<uploadId>/<file>` | `{success, error?, upserted?, skipped?, warnings?}`. Upserts `protected_areas` on `(folder, fid)` in chunks of 50 with the service-role client. It always removes the staged file and old staged files (more than 24 hours). | `Only admins can import protected areas.`, `The import path is not valid.`, `The uploaded file could not be read from the staging bucket.`, `The file is larger than 50 MB.`, `The file holds no protected areas.`, `The import stopped after <n> of <total> rows.`, a parser message, or `The import failed. Try again, or check the file.` |

#### Login (`webapp/app/login/actions.ts`)

| Action | Caller check | Input | Returns | Errors |
|---|---|---|---|---|
| `login` | None (sign-in) | `FormData` with `email` and `password` | Redirects to `/`. | Redirects to `/error`. |
| `loginGithub` | None (sign-in) | None | Redirects to the GitHub OAuth URL. | Redirects to `/error`. |

No page imports these two actions. The login page uses `webapp/services/auth.ts` in the browser.

#### Delete behavior

A site has two levels of delete (US 2.0.4, [#160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160)). `archiveSite` is the default. A site must be archived before `permanentlyDeleteSite` accepts it. A report has the same two levels (US 7.0.8, [#165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165)). See [Software Design](software-design.md#delete-archive-by-default-and-an-admin-hard-delete) for the reason.

| Level | Site | Report |
|---|---|---|
| Archive | Sets `sites_pa.archived_at`. The site is hidden from the app. Reports, answers, images and the steward assignment are not changed. `restoreSite` clears it. | Sets `form_responses.archived_at`. The report is hidden and leaves the totals. Answers and images stay. `restoreSiteInspectionReport` clears it. |
| Permanent delete | Deletes the `sites_pa` row. Its reports, attachments and homepage images stay, with `site_id` set to `null`. The `site_stewards` and `site_page_fields` rows (the site's links) are deleted by `ON DELETE CASCADE`. The `people` row of the steward and the S3 files are not touched. | Deletes the attachments, answers and report in one transaction. Then the server deletes the S3 objects. |

---

### 3. Database RPC functions

A server action or route calls these functions with `supabase.rpc`, using the service-role client
from `createServerSupabase`. Every function is `security invoker`, so it runs with the rights of its
caller. The service role bypasses row level security, so the caller must be checked first. The
migrations are the source of truth for the SQL. A person with database access runs each migration
file in the Supabase dashboard for production. Each file is safe to run twice.

"`service_role` only" means that the migration revokes execute from `public`, `anon` and
`authenticated`, so a browser cannot call the function.

**Site delete and archive** (`20261008164223_delete_site.sql`, `set search_path = ''`).

| Function | Parameters | Returns | Grants | Caller |
|---|---|---|---|---|
| `get_site_delete_impact` | `p_site_id bigint` | `jsonb` `{siteId, siteName, inspectionCount, answerCount, attachmentCount, homepageImageCount, siteStewardCount}`. `null` when the site does not exist. `stable`. | `service_role` only. | `getSiteDeleteImpact`. `permanently_delete_site` also calls it. |
| `archive_site` | `p_site_id bigint` | `jsonb` `{siteId, siteName, archivedAt}`. It locks the site row. It raises `P0002` when the site does not exist and an error when the site is already archived. | `service_role` only. | `archiveSite` |
| `restore_site` | `p_site_id bigint` | `jsonb` `{siteId, siteName}`. It raises `P0002` when the site does not exist and an error when the site is not archived. | `service_role` only. | `restoreSite` |
| `permanently_delete_site` | `p_site_id bigint` | The `get_site_delete_impact` result from before the delete. It raises `P0002` when the site does not exist and an error when the site is not archived. It sets `site_id` to `null` on `form_responses`, `attachments` and `homepage_image_uploads`, then deletes the site. | `service_role` only. | `permanentlyDeleteSite` |

**Site inspection report archive and delete** (`20261009000000_archive_site_inspection_reports.sql`,
`set search_path = ''`).

| Function | Parameters | Returns | Grants | Caller |
|---|---|---|---|---|
| `get_site_inspection_report_delete_impact` | `p_response_id bigint` | `jsonb` `{responseId, inspectionNo, inspectionDate, siteName, answerCount, attachmentCount}`. `null` when the report does not exist. `stable`. | `service_role` only. | `getSiteInspectionReportDeleteImpact`. `permanently_delete_site_inspection_report` also calls it. |
| `archive_site_inspection_report` | `p_response_id bigint` | `jsonb` `{responseId, archivedAt}`. It raises `P0002` when the report does not exist and an error when the report is already archived. | `service_role` only. | `archiveSiteInspectionReport` |
| `restore_site_inspection_report` | `p_response_id bigint` | `jsonb` `{responseId}`. It raises `P0002` when the report does not exist and an error when the report is not archived. | `service_role` only. | `restoreSiteInspectionReport` |
| `permanently_delete_site_inspection_report` | `p_response_id bigint` | The delete-impact object plus `storageKeys`, the S3 keys of the deleted attachments. It raises `P0002` when the report does not exist and an error when the report is not archived. All deletes run in one transaction. | `service_role` only. | `permanentlyDeleteSiteInspectionReport`, which then calls `deleteObjectsByKeys` |

**Form editor** (`20261012000000_add_question_atomically.sql`, `set search_path = ''`, #273).

| Function | Parameters | Returns | Grants | Caller |
|---|---|---|---|---|
| `add_question_atomically` | `p_section_id bigint, p_form_question text, p_subtext text, p_question_type text, p_is_required boolean, p_question_key text, p_category text, p_comment boolean, p_obs_value boolean, p_obs_comm boolean, p_options text[]` | `bigint`: the new `questions.id`. Inserts the `question_keys` row (`definition` null), the `questions` row (`is_active` true, `autofill_key` null, `formorder` the highest plus 1) and one `question_options` row for each entry of `p_options`, with its 0-based index as `position`. All three inserts run in one transaction. `addQuestion` works out the other values: `p_category` is the first digit of the `(Q<n>)` number in the title, `p_comment` is true for a `text` or `image` question, `p_obs_value` and `p_obs_comm` are true for the answer columns that the type uses (both for `option` and `selectall`) and null otherwise, and `p_options` is empty unless the type is `option` or `selectall`. | `service_role` only. | `addQuestion` |

**Totals and numbers** (`set search_path = public`). The report archive migration redefines the
first three functions so that archived reports are not counted.

| Function | Parameters | Returns | Grants | Caller |
|---|---|---|---|---|
| `get_naturalness_distribution` | None | A table of `(naturalness_score text, count bigint)`, from the answers to `Q31_Naturalness` of active reports that are not archived. `stable`. | `authenticated` and `service_role`. `20261011010000_revoke_public_execute_on_dashboard_functions.sql` revokes execute from `public` and `anon`. `authenticated` keeps it, because the StewardLog admin dashboard calls the function with the anon key client after sign-in. | `getNaturalnessDistribution`; StewardLog `DashboardScreen.tsx` and `AnalyticsScreen.tsx` |
| `get_top_sites_distribution` | None | A table of `(namesite text, count bigint)`: the five sites with the most active reports that are not archived. `stable`. | The same as `get_naturalness_distribution` (`20261011010000_revoke_public_execute_on_dashboard_functions.sql`). | `getTopSitesDistribution`; StewardLog `DashboardScreen.tsx` and `AnalyticsScreen.tsx` |
| `get_distinct_inspected_site_count` | `p_user_id uuid` | `bigint`: the number of distinct sites in the active reports of the user that are not archived. `stable`. First made by `20261005000000_profile_distinct_site_count.sql`. | `service_role` only. `20261011000000_revoke_public_execute_on_report_functions.sql` revokes execute from `public`, `anon` and `authenticated`. | `GET /api/profile` (see [User Model](user-model.md#inspection-counts)) |
| `get_max_inspection_number` | `p_year integer` | `integer`: the highest number after `<year>-` in `form_responses.inspection_no`, compared as a number. 0 when the year has no report. Archived reports count, so a number is never used twice. `stable`. Made by `20261009130000_get_max_inspection_number.sql`. | `service_role` only, by the same `20261011000000` migration. | `getNextFormInspectionNumber` |

`get_naturalness_distribution` and `get_top_sites_distribution` are `security invoker`, so row
level security still applies to an `authenticated` caller.

**Triggers.** `create_person_for_new_user()` (`security definer`, `set search_path = ''`) runs after
an insert on `auth.users` and adds a `people` row. `set_updated_at()` sets `updated_at` on `people`
and `socials`. Execute on `create_person_for_new_user()` is revoked from `public`, `anon` and
`authenticated`.

---

### 4. Access matrix

This matrix shows who can read and write each table and bucket through Supabase. It is built from
the policies and grants in `webapp/supabase/migrations/`. Read it with the
[middleware](#middleware) and the [server action checks](#2-server-actions): the app gives an
unapproved user no page and no action, but a direct call to the Supabase REST API with the user's
token is limited only by this matrix.

Roles:

- **anon:** a request with no session.
- **Unapproved:** signed in, `app_metadata.authenticated` is not `true`.
- **Approved:** signed in and approved, any role.
- **Owner:** the user that the row belongs to (`auth_user_id`, `person_id`, `user_id` or `created_by`).
- **Admin:** approved and `app_metadata.role` is `admin`.
- **Service role:** the server with `SUPABASE_SECRET`. It bypasses row level security. Only server
  code uses it.

Every table below has row level security on. "None" means no policy allows it.

| Table or bucket | anon | Unapproved | Approved | Owner (extra) | Admin (extra) | Service role | Source |
|---|---|---|---|---|---|---|---|
| `people` | None (revoked) | Read own row | Read all | Update own row: `display_name`, `skills`, `focus_areas` only. An unapproved owner can also do this. | None | All | `20261004000000`, `20261010000100` |
| `socials` | None (revoked) | Read own row | Read all | Insert and update own row (not `updated_at`) | None | All | `20261005010000`, `20261010000100` |
| `site_stewards` | None (revoked) | None | Read all | None | None. `assignSiteSteward` writes with the service role. | All | `20261004000000`, `20261010000100` |
| `form_responses` | None | None | Read rows that are not archived | None | Read archived rows | All. Every write goes through a server action. | `20261010000000` |
| `answers` | None | None | None | None | None | All | `20260925000000`, `20261022000000` (`is_hidden`) |
| `attachments` | None | None | Read all | None | Delete | All | `20261005020000` |
| `homepage_image_uploads` | None | None | Read all | None | Delete | All | `20261005020000` |
| `sites_pa` | None | None | Read all (archived and inactive too; the app filters them) | None | None | All | `20261005020000` |
| `site_page_fields` | None | Read all | Read all | None | None. `updateSitePageFields` writes with the service role. | All | `20261008000000` |
| `protected_areas` | None (revoked) | Read all | Read all | None | None. The KML import writes with the service role. | All | `20261004010000` |
| `ab_counties`, `questions`, `question_options`, `question_keys`, `form_sections` | None | None | None | None | None | All | `20260925000000` |
| `S26_pdf_jobs` | None | Read and insert own jobs | Read and insert own jobs | Same | None | All | `20260925000000` |
| `luperson` | None | None | None | None | None | All | `20260925000000` (local only) |
| Storage bucket `kml-imports` (private, 50 MiB) | None | None | None | None | Upload `.kml`/`.kmz`, read, delete | All | `20261006000000` |
| RPC functions | See [Database RPC functions](#3-database-rpc-functions) | | | | | | |

Limits of this matrix:

- `20260925000000_local_app_schema.sql` builds the legacy and inherited tables for a local database
  only. Production made these tables before the migrations existed, so production can have
  policies or grants for `answers`, `questions`, `ab_counties`, `luperson`, `S26_pdf_jobs` and the
  legacy views that are not in the repository. Check `pg_policies` in production before you depend
  on a row of this matrix for those tables.
- The mobile app (StewardLog) and the deployed Google Sheets script use the legacy tables with
  their own keys. This matrix does not cover them.
- An unapproved user can read `protected_areas`, `site_page_fields` and their own PDF jobs through
  the REST API, because those policies do not check approval.

---

## API Documentation From Winter 2026

Interactive API documentation is available through Swagger.

**Swagger (Local)**: http://localhost:3000/api-docs

You can explore the API, view request/response formats, and test endpoints directly from the browser.

For a detailed explanation of the API endpoints, see:

[Media Storage Architecture](aws-architecture.md)

---

## API Documentation From Fall 2025

The Fall 2025 routes (`GET /api/geocode`, `GET /api/heatmap`, `GET /auth/callback` and
`GET /auth/confirm`) are now in the [route reference](#1-api-routes) above, corrected to match the
code on `main`.
