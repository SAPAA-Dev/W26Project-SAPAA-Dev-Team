# API Documentation

*The Winter 2026 and Fall 2025 sections are inherited from those teams. The Fall 2026 section lists
the endpoints and server actions that Fall 2026 added, as of October 9, 2026. The Fall 2025 section
is corrected to match the code on `main`.*

## API Documentation From Fall 2026

### Admin rule

An action or route that is "admin only" reads the signed-in session on the server. It allows the
call only when `app_metadata.role` is `admin` and `app_metadata.authenticated` is `true`. It never
reads `user_metadata` and never trusts a value that the caller sends. Only the server can write
`app_metadata` (PR #144, closes #71).

**Swagger:** `webapp/lib/swagger.ts` does not list `GET /api/profile`, `PATCH /api/profile` or
`DELETE /api/site-images` yet. This page is the reference for them until the owner of each route
adds them.

---

### 1. Get a profile

**Endpoint:** `GET /api/profile`

**Description:** Returns a profile, its contact details, its inspection counts and one page of its
inspection history (#138, #142). See [User Model](user-model.md).

**Query Parameters:**

- `personId` (optional): The `people.id` of the profile. Without it, the route returns the profile
  of the signed-in user.
- `page` (optional): The page of the history. The default is 1. A page has 10 inspections.

**Example Request:**
```bash
GET /api/profile?personId=12&page=1
```

**Example Response:**
```json
{
  "profile": {
    "id": 12,
    "displayName": "Jane Doe",
    "skills": ["Botany"],
    "focusAreas": ["Wetlands"],
    "socials": {
      "email": null,
      "phone": null,
      "website": "https://example.org",
      "instagram": null,
      "facebook": null,
      "x": null,
      "linkedin": null
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
      "inspectionDate": "2026-09-30"
    }
  ],
  "pagination": { "page": 1, "pageSize": 10, "total": 14 }
}
```

`role` is `Admin` or `Steward`. It is for display only and never authorizes a request. A person
with no linked login gets zero counts and an empty history.

**Error Responses:**

| Status | Body | When |
|---|---|---|
| 401 | `{"error": "Sign in to view profiles."}` | No signed-in user. |
| 404 | `{"error": "Profile not found."}` | `personId` is not a number, or no person has that id. |
| 500 | `{"error": "Unable to load this profile."}` or `{"error": "Unable to load inspection history."}` | A database error. |
| 503 | `{"error": "Profile data is being prepared. ..."}` | The `people` table does not exist (the migration is not applied). |

**Authentication:**

- Any signed-in user. The route reads with the service-role client.

---

### 2. Edit your own profile

**Endpoint:** `PATCH /api/profile`

**Description:** Updates the profile of the signed-in user (#138, #142). The route writes with the
signed-in client, so row level security and the column grants on `people` and `socials` stop any
other write.

**Request Body:**

| Field | Required | Rule |
|---|---|---|
| `displayName` | Yes | 1 to 29 characters after trim. |
| `skills` | Yes | A list of at most 12 tags. Each tag is 1 to 40 characters after trim. Duplicates are removed. |
| `focusAreas` | Yes | The same rule as `skills`. |
| `socials` | No | An object with `email`, `phone`, `website`, `instagram`, `facebook`, `x`, `linkedin`. Blank fields become `null`. `email` must be a valid address (at most 254 characters). `phone` is at most 30 characters. Links must start with `https://` (at most 300 characters). Without `socials`, the stored contact details do not change. |

**Example Request:**
```bash
PATCH /api/profile
{
  "displayName": "Jane Doe",
  "skills": ["Botany"],
  "focusAreas": ["Wetlands"],
  "socials": { "website": "https://example.org" }
}
```

**Example Response:**
```json
{
  "profile": {
    "id": 12,
    "displayName": "Jane Doe",
    "skills": ["Botany"],
    "focusAreas": ["Wetlands"],
    "socials": { "email": null, "phone": null, "website": "https://example.org", "instagram": null, "facebook": null, "x": null, "linkedin": null }
  }
}
```

**Error Responses:**

| Status | Body | When |
|---|---|---|
| 400 | `{"error": "<validation message>"}` | The body is not JSON, or a field breaks a rule above. |
| 401 | `{"error": "Sign in to edit your profile."}` | No signed-in user. |
| 404 | `{"error": "Profile not found."}` | The user has no person record. |
| 500 | `{"error": "Unable to save your profile."}` or `{"error": "Unable to save your contact details."}` | A database error. |
| 503 | `{"error": "Profile data is being prepared. ..."}` | The `people` table does not exist. |

**Authentication:**

- Any signed-in user. A user can edit only their own profile.

---

### 3. Delete an image

**Endpoint:** `DELETE /api/site-images`

**Description:** Deletes one image row and its S3 object (#148, closes #65, US 7.0.5). The S3
object is removed by `deleteObjectsByKeys` in `webapp/utils/media/s3Delete.ts`.

**Query Parameters:**

- `id` (required): The numeric id of the image row.
- `kind` (optional): `attachments` (default) or `homepage_image_uploads`.

**Example Request:**
```bash
DELETE /api/site-images?id=88&kind=attachments
```

**Example Response:**
```json
{
  "deleted": true
}
```

**Error Responses:**

| Status | Body | When |
|---|---|---|
| 400 | `{"error": "Provide a valid image kind"}` | `kind` is not one of the two values. |
| 400 | `{"error": "Provide a numeric attachment id"}` | `id` is missing or not a number. |
| 401 | `{"error": "Unauthorized"}` | No signed-in user. |
| 403 | `{"error": "Forbidden"}` | The user is not an approved admin. |
| 404 | `{"error": "Attachment not found"}` or `{"error": "Homepage image not found"}` | No row has that id. |
| 500 | `{"error": "Failed to delete site image"}` | The row or the S3 object could not be deleted. |

**Authentication:**

- Admin only (see [Admin rule](#admin-rule)).

**Note:** `rollbackSiteInspectionSubmission` in `webapp/utils/supabase/queries.ts` also deletes the
S3 objects of the report that it removes (#148).

---

### 4. Export PDFs

**Endpoint:** `POST /api/pdf`

**Description:** The Winter 2026 endpoint. Fall 2026 added the option `hiddenQuestionIds`, a list
of question ids that the export leaves out (#146). Swagger documents the full body.

**Authentication:**

- Approved admins and approved stewards (see [Admin rule](#admin-rule)). It returns 401 with no
  signed-in user and 403 (`Forbidden - steward or admin access required`) for any other user. A
  steward can export only one SIR that they submitted (`mode: "single"`). Site and multi-site mode
  return 403 for a steward, and so does a SIR of another person (US 7.0.1, #68, closed by PR #155
  on October 7, 2026). `GET /api/pdf/status/[jobId]` returns 403 for the job of another user.

---

### 5. Server actions

A server action is an exported function in a `'use server'` file. The page calls it directly. It is
still a public endpoint, so each action below checks the caller on the server.

**Site stewards** (`webapp/utils/steward-actions.ts`, #133, US 3.0.2):

| Action | Input | Output | Auth rule | Errors |
|---|---|---|---|---|
| `searchStewards` | `query: string` | Up to 10 `{id, displayName}` from `people` whose name contains the query. | Admin only. Other callers get `[]`. | Throws the database message. |
| `assignSiteSteward` | `siteId: number`, `personId: number` | `{success: true}` or `{success: false, error}` | Admin only. Writes `site_stewards` with the service-role client. A new assignment replaces the old one. | `Only admins can assign a steward.`, `Invalid site or person.`, or the database message. |
| `getSiteSteward` | `siteId: number` | `{id, displayName}` or `null` | Any signed-in user (RLS). | Throws the database message. |
| `getSitesForSteward` | `personId: number` | A list of `{siteId, namesite}` | Any signed-in user (RLS). | Throws the database message. |
| `getPersonByAuthUserId` | `authUserId: string` | `{id, displayName}` or `null` | Any signed-in user (RLS). | Throws the database message. |

**User accounts** (`webapp/utils/admin-actions.ts`, #144):

| Action | Input | Output | Auth rule | Errors |
|---|---|---|---|---|
| `getAllUsers` | None | A list of `{id, email, role, authenticated}`, read from `app_metadata` | Admin only. Other callers get `[]`. | Returns `[]` on a database error. |
| `addUser` | `{email, password, role?, authenticated?}` | `{success: true}` or `{success: false, error}` | Admin only. Writes `role` and `authenticated` to `app_metadata`. | `Only admins can manage user accounts.` or the auth error. |
| `updateUser` | `{id, email, password?, role, authenticated}` | `{success: true, data}` or `{success: false, error}` | Admin only. Keeps the other `app_metadata` keys. | `Only admins can manage user accounts.`, `User not found.` or the auth error. |
| `deleteUser` | `userId: string` | `{success: true}` or `{success: false, error}` | Admin only. | `Only admins can manage user accounts.` or the auth error. |

**Protected areas** (`webapp/utils/kml-import-actions.ts`, #152):

| Action | Input | Output | Auth rule | Errors |
|---|---|---|---|---|
| `importProtectedAreasFromStorage` | `storagePath: string`, a `.kml` or `.kmz` file in the `kml-imports` bucket, in the form `kml-imports/<uploadId>/<file>` | `{success, error?, upserted?, skipped?, warnings?}` | Admin only. Reads the file and upserts `protected_areas` with the service-role client. | `Only admins can import protected areas.`, `The import path is not valid.`, a file larger than 50 MB, a file with no protected areas, or a partial write. |

**Sites** (`webapp/utils/supabase/queries.ts`, [#160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160), [#162](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/162), [#167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167), US 2.0.2, 2.0.3, 2.0.4, 2.0.5, 2.0.6). An action marked "Admin only" calls `requireApprovedAdmin` before it creates the service-role client. It throws `Only admins can edit sites.` for any other caller.

| Action | Input | Output | Auth rule | Errors |
|---|---|---|---|---|
| `createSite` | `namesite: string`, `ab_county: number \| null`, `protectedAreaId: number \| null` (default `null`) | Nothing. Inserts an active site with the trimmed name. | Admin only. | `Site name is required.`, `The protected area is not valid.`, `A site with this name already exists.`, `That protected area is already linked to a site.`, `The selected protected area does not exist.`, or the database message. |
| `updateSite` | `id: number`, `namesite: string`, `ab_county: number \| null`, `protectedAreaId: number \| null` (default `null`) | Nothing. | Admin only. | The same errors as `createSite`, except the blank-name check. |
| `toggleSiteActive` | `id: number`, `is_active: boolean` | Nothing. | Admin only. | The database message. |
| `findSitesWithName` | `namesite: string` | The names of existing sites (archived ones too) that equal the name, contain it, or are contained in it, ignoring case. A contained name must have at least 4 characters. `[]` for a blank name. | Admin only. | The database message. |
| `getSiteSuggestions` | None | A list of `{name, category}`: the protected areas whose name is not yet a site name, sorted by name. `category` is `protected_areas.folder`. | Admin only. | The database message. |
| `getCounties` | None | A list of `{id, county}` sorted by county. | Admin only. | The database message. |
| `getProtectedAreaChoices` | None | A list of `{id, name, fid, area_type}` sorted by name. | Admin only. | The database message. |
| `getProtectedAreaBoundaries` | None | A GeoJSON `FeatureCollection` of the protected area boundaries, with the linked county and site status in each feature. It reads with the signed-in client, so RLS on `protected_areas` applies. | Any approved user (`app_metadata.authenticated` is `true`). A non-admin does not get an area whose linked site is inactive. | `You must be signed in to view site boundaries.` or the database message. |
| `getSiteDeleteImpact` | `siteId: number` | `{siteId, siteName, inspectionCount, answerCount, attachmentCount, homepageImageCount, siteStewardCount}` from `get_site_delete_impact`. | Admin only. | `A valid site ID is required.`, `Site not found.` or the database message. |
| `archiveSite` | `siteId: number` | `{siteId, siteName, archivedAt}` from `archive_site`. Hides the site. Nothing else changes. | Admin only. | `A valid site ID is required.`, or the database message (the site does not exist, or it is already archived). |
| `restoreSite` | `siteId: number` | `{siteId, siteName}` from `restore_site`. | Admin only. | `A valid site ID is required.`, or the database message (the site does not exist, or it is not archived). |
| `permanentlyDeleteSite` | `siteId: number` | The `SiteDeleteImpact` counts from before the delete, from `permanently_delete_site`. It deletes the `sites_pa` row, and the cascade removes the site's link rows. See [Delete behavior](#delete-behavior). | Admin only. | `A valid site ID is required.`, or the database message (the site does not exist, or it is not archived). |
| `getArchivedSites` | None | A list of `SiteSummary` for the sites with `archived_at` set, newest archive first. | Admin only. | The database message. |

**Site page fields** (`webapp/utils/supabase/queries.ts`, [#163](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/163), US 2.0.5). The fields are fixed in `webapp/lib/sitePageFields.ts`: `sapaa_website`, `inaturalist` and `designated_steward`.

| Action | Input | Output | Auth rule | Errors |
|---|---|---|---|---|
| `getSitePageFields` | `siteId: number` | A list of `{fieldKey, value, isVisible}`. | Any signed-in user (RLS on `site_page_fields`). | The database message. |
| `updateSitePageFields` | `siteId: number`, `fields: {fieldKey, value, isVisible}[]` | Nothing. It upserts one row for each field on `(site_id, field_key)` and records `updated_by`. A link field keeps its value. Any other field stores `null`. An empty list writes nothing. | Admin only. | `Unknown site page field: <key>`, `Links must start with http:// or https://`, or the database message. |
| `getSiteLinks` | `siteId: number` | `{sapaaWebsiteUrl, iNaturalistUrl}`. A link that is hidden or empty is `null`. | Any signed-in user (RLS on `site_page_fields`). | The database message. |

**Site inspection reports** (`webapp/utils/supabase/queries.ts`, [#165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165), US 7.0.8). Each action is admin only and throws `Only approved admins can manage reports.` for any other caller. Each action that takes `responseId` also throws `A valid report ID is required.` when it is not a positive integer.

| Action | Input | Output | Errors |
|---|---|---|---|
| `getSiteInspectionReportDeleteImpact` | `responseId: number` | `{responseId, inspectionNo, inspectionDate, siteName, answerCount, attachmentCount}` | `Site Inspection Report not found.` or the database message. |
| `archiveSiteInspectionReport` | `responseId: number` | `{responseId, archivedAt}`. Hides the report. Its answers and images stay. | The database message (the report does not exist, or it is already archived). |
| `restoreSiteInspectionReport` | `responseId: number` | `{responseId}` | The database message (the report does not exist, or it is not archived). |
| `permanentlyDeleteSiteInspectionReport` | `responseId: number` | `{impact, storageCleanupComplete}`. The database delete runs first, then `deleteObjectsByKeys` removes the S3 objects. If the S3 step fails, the action does not throw. It logs the error and returns `storageCleanupComplete: false`. | The database message (the report does not exist, or it is not archived). |
| `getArchivedSiteInspectionReports` | None | A list of `{id, inspectionNo, inspectionDate, createdAt, isActive, archivedAt, siteId, siteName, submitterId, submitterName}`, newest archive first. | The database message. |

**Dashboard totals** (`webapp/utils/supabase/queries.ts`). Both actions are admin only and throw `Only admins can edit sites.` for any other caller.

| Action | Input | Output | Errors |
|---|---|---|---|
| `getNaturalnessDistribution` | None | A list of `{naturalness_score, count}` from `get_naturalness_distribution`. | The database message. |
| `getTopSitesDistribution` | None | The five sites with the most reports, as `{namesite, count}`, from `get_top_sites_distribution`. | The database message. |

#### Delete behavior

A site has two levels of delete (US 2.0.4, [#160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160)). `archiveSite` is the default. A site must be archived before `permanentlyDeleteSite` accepts it. A report has the same two levels (US 7.0.8, [#165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165)). See [Software Design](software-design.md#delete-archive-by-default-and-an-admin-hard-delete) for the reason.

| Level | Site | Report |
|---|---|---|
| Archive | Sets `sites_pa.archived_at`. The site is hidden from the app. Reports, answers, images and the steward assignment are not changed. `restoreSite` clears it. | Sets `form_responses.archived_at`. The report is hidden and leaves the totals. Answers and images stay. `restoreSiteInspectionReport` clears it. |
| Permanent delete | Deletes the `sites_pa` row. Its reports, attachments and homepage images stay, with `site_id` set to `null`. The `site_stewards` and `site_page_fields` rows (the site's links) are deleted by `ON DELETE CASCADE`. The `people` row of the steward and the S3 files are not touched. | Deletes the attachments, answers and report in one transaction. Then the server deletes the S3 objects. |

**Other admin actions:** the form editor actions in `webapp/utils/form-actions.ts` and the other
site and report actions in `webapp/utils/supabase/queries.ts` that call `requireApprovedAdmin` use
the same admin rule. They throw when the caller is not an approved admin. Some write actions in
`queries.ts` still have no caller check (backlog item 4 in [Issues](issues.md)).

---

### 6. Database RPC functions

A server action calls these functions with `supabase.rpc`, using the service-role client from
`createServerSupabase`. Every function is `security invoker`, so it runs with the rights of its
caller. The service role bypasses row level security, so the action must check the admin first (see
[Admin rule](#admin-rule)). A browser cannot call the eight functions marked "`service_role` only",
because their migration revokes execute from `public`, `anon` and `authenticated`. The migrations
are the source of truth for the SQL.

**Site delete and archive** (`webapp/supabase/migrations/20261008164223_delete_site.sql`). The
functions use `set search_path = ''`.

| Function | Parameters | Returns | Grants | Caller |
|---|---|---|---|---|
| `get_site_delete_impact` | `p_site_id bigint` | `jsonb` `{siteId, siteName, inspectionCount, answerCount, attachmentCount, homepageImageCount, siteStewardCount}`. `null` when the site does not exist. `stable`. | `service_role` only. | `getSiteDeleteImpact`. `permanently_delete_site` also calls it. |
| `archive_site` | `p_site_id bigint` | `jsonb` `{siteId, siteName, archivedAt}`. It locks the site row. It raises `P0002` when the site does not exist and an error when the site is already archived. | `service_role` only. | `archiveSite` |
| `restore_site` | `p_site_id bigint` | `jsonb` `{siteId, siteName}`. It raises `P0002` when the site does not exist and an error when the site is not archived. | `service_role` only. | `restoreSite` |
| `permanently_delete_site` | `p_site_id bigint` | The `get_site_delete_impact` result from before the delete. It raises `P0002` when the site does not exist and an error when the site is not archived. It sets `site_id` to `null` on `form_responses`, `attachments` and `homepage_image_uploads`, then deletes the site. | `service_role` only. | `permanentlyDeleteSite` |

**Site inspection report archive and delete**
(`webapp/supabase/migrations/20261009000000_archive_site_inspection_reports.sql`). The functions use
`set search_path = ''`.

| Function | Parameters | Returns | Grants | Caller |
|---|---|---|---|---|
| `get_site_inspection_report_delete_impact` | `p_response_id bigint` | `jsonb` `{responseId, inspectionNo, inspectionDate, siteName, answerCount, attachmentCount}`. `null` when the report does not exist. `stable`. | `service_role` only. | `getSiteInspectionReportDeleteImpact`. `permanently_delete_site_inspection_report` also calls it. |
| `archive_site_inspection_report` | `p_response_id bigint` | `jsonb` `{responseId, archivedAt}`. It raises `P0002` when the report does not exist and an error when the report is already archived. | `service_role` only. | `archiveSiteInspectionReport` |
| `restore_site_inspection_report` | `p_response_id bigint` | `jsonb` `{responseId}`. It raises `P0002` when the report does not exist and an error when the report is not archived. | `service_role` only. | `restoreSiteInspectionReport` |
| `permanently_delete_site_inspection_report` | `p_response_id bigint` | The delete-impact object plus `storageKeys`, the S3 keys of the deleted attachments. It raises `P0002` when the report does not exist and an error when the report is not archived. All deletes run in one transaction. | `service_role` only. | `permanentlyDeleteSiteInspectionReport`, which then calls `deleteObjectsByKeys` |

**Totals.** The report migration above redefines all three functions so that archived reports are
not counted. The functions use `set search_path = public`.

| Function | Parameters | Returns | Grants | Caller |
|---|---|---|---|---|
| `get_naturalness_distribution` | None | A table of `(naturalness_score text, count bigint)`, from the answers to `Q31_Naturalness` of active, unarchived reports. `stable`. | Execute to `service_role`. The migrations do not revoke the default execute right. | `getNaturalnessDistribution` |
| `get_top_sites_distribution` | None | A table of `(namesite text, count bigint)`: the five sites with the most active, unarchived reports. `stable`. | Execute to `service_role`. The migrations do not revoke the default execute right. | `getTopSitesDistribution` |
| `get_distinct_inspected_site_count` | `p_user_id uuid` | `bigint`: the number of distinct sites in the active, unarchived reports of the user. `stable`. First created by `20261005000000_profile_distinct_site_count.sql`. | Execute to `service_role`. The migrations do not revoke the default execute right. | `GET /api/profile` (see [User Model](user-model.md#inspection-counts)) |

A person with database access runs each migration file in the Supabase dashboard for production. Each
file is safe to run twice.

---

## API Documentation From Winter 2026

Interactive API documentation is available through Swagger.

**Swagger (Local)**: http://localhost:3000/api-docs

You can explore the API, view request/response formats, and test endpoints directly from the browser.

For a detailed explanation of the API endpoints, see:

[Media Storage Architecture](aws-architecture.md)

---

## API Documentation From Fall 2025

The web application exposes the following API endpoints:

### 1. Geocoding API

**Endpoint:** `GET /api/geocode`

**Description:** Geocodes a location name to coordinates using OpenCage API.

**Query Parameters:**

- `q` (required): Location name to geocode

**Example Request:**
```bash
GET /api/geocode?q=Elk Island Provincial Park
```

**Example Response:**
```json
{
  "latitude": 53.5731,
  "longitude": -112.8583
}
```

**No Result Response:**
```json
{
  "coords": null
}
```
Status: 200

**Error Response:**
```json
{
  "error": "Missing q param"
}
```
Status: 400. A failed OpenCage call returns `{"error": <message>}` with status 500.

**Rate Limits:**

- Limited by OpenCage API quota (2,500 requests/day on free tier)

---

### 2. Heatmap API

**Endpoint:** `GET /api/heatmap`

**Description:** Searches for sites matching a keyword and returns counts for heatmap visualization.
It reads the view `sites_report_fnr_test`.

**Query Parameters:**

- `keyword` (required in practice): Search term to match against site names. Without it, the route
  returns `{"data": []}`.

**Example Request:**
```bash
GET /api/heatmap?keyword=park
```

**Example Response:**
```json
{
  "data": [
    {
      "namesite": "Elk Island Provincial Park",
      "count": 15
    },
    {
      "namesite": "Writing-on-Stone Provincial Park",
      "count": 12
    }
  ]
}
```

**Empty Response:**
```json
{
  "data": [],
  "message": "No sites found"
}
```

**Error Response:**
```json
{
  "error": "<Supabase or exception message>"
}
```
Status: 400 for a Supabase error, 500 for an exception.

**Authentication:**

- Requires authenticated user session (handled by middleware)

---

### 3. Authentication

Login, signup and sign-out are not API routes:

- Login: the server actions `login` and `loginGithub` in `webapp/app/login/actions.ts`.
- Signup: a client page, `webapp/app/signup/page.tsx`.
- Sign-out: calls `supabase.auth.signOut()` in `webapp/services/auth.ts`.

The only auth route handlers are:

- `GET /auth/callback` - OAuth callback handler
- `GET /auth/confirm` - Email confirmation handler

**Note:** These are internal routes. Use the frontend login/signup pages instead of calling these directly.

---
