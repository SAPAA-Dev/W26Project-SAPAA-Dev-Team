# The Google Sheets → Supabase Pipeline (`googleSheets/code.gs`)

**Nobody flagged this in the handoff call, and it is the single biggest hidden dependency
in the project.** 570 lines of Google Apps Script that reads and writes SAPAA's production
Supabase database directly over PostgREST.

## What it does

Adds a "Supabase Functions" menu to a Google Sheet (`code.gs:1-24`) with three groups:

**Pull from Supabase into the sheet** (`fetchAndWriteToSheet`, `code.gs:117-186`)
- `luperson` → LUPerson sheet
- `lumembertype` → LUMemberType sheet
- `inspectqcategory` → InspectQCategory sheet
- `inspectquestions` → InspectQuestions sheet
- `questionmapping` → QuestionMapping sheet

**Push sheet → Supabase** (`syncTableWithSupabase`, `code.gs:216-…`) for those same five tables.

**Bulk-load a historical inspection** (`uploadInspectionBundle`, `code.gs:386-566`)
- Step 1 `replaceNamesWithIDs` (`code.gs:60-113`) — resolves steward names to `luperson` IDs
- Step 2 uploads one `inspectheader` row + N `inspectdetails` rows

## Tables this reveals

`luperson`, `lumembertype`, `inspectqcategory`, `inspectquestions`, `questionmapping`,
`inspectheader`, `inspectdetails`.

Two things follow:

1. **The inspection form is data-driven.** Questions, categories and question→section mapping
   live in database tables, not in code. That is why the prior team had stories for admin
   question CRUD (US 1.0.17 / 1.0.24 / 1.0.25 / 1.0.34).
2. **`luperson` is a People table that is separate from Supabase Auth users.** A *person*
   record and a *login account* are different things. This is almost certainly the root of the
   "data inconsistency between Google OAuth and email sign-up" reported in the Week 3 call —
   and it means People Management is not just CRUD, it is **identity reconciliation**.

## Risks found by reading the code

### 1. Destructive full-table sync — data loss waiting to happen
`syncTableWithSupabase` diffs the sheet against the table and **deletes every Supabase row
whose key is absent from the sheet** (`code.gs:252-258`). Anyone who filters, sorts-and-truncates,
or accidentally clears rows in the Sheet and then runs "Sync" will delete production people
records. The only guard is a Yes/No dialog showing counts (`code.gs:262-274`).

### 2. Client-side `max(id)+1` primary keys — race condition
`getMaxId` fetches the largest existing id and the script assigns `maxId + 1`
(`code.gs:450-476`). Two concurrent writers — or the web app writing while a sheet upload runs —
produce duplicate-key failures or overwritten rows. The database is not owning its own
sequence.

### 3. Non-atomic two-step write with best-effort rollback
Header is inserted, then details (`code.gs:506-545`). If details fail, it tries to DELETE the
header (`code.gs:548-556`); if that delete also fails it just shows an alert and leaves an
orphaned inspection header (`code.gs:556-558`).

### 4. Env switching is a manual source edit
`checkSupabaseConnection` reads `PROD_URL` / `PROD_KEY` from Script Properties with the comment
`REPLACE WITH DEV_URL FOR TESTING WITH SECONDARY DB` (`code.gs:27-29`). Testing against dev
requires editing code. This is exactly the missing staging-environment problem from the Week 3 call,
showing up in a second place.

### 5. A long-lived Supabase key lives in a Google Sheet
The key is held in Apps Script Properties and sent as both `apikey` and `Bearer`
(`code.gs:141-147`). Whoever can open that Sheet inherits that database access. Given it can
DELETE from `luperson`, this is a privileged credential outside the repo, outside CI, and
outside any access review. (No key value appears in the repo — only the property lookup.)

### 6. `resolution=ignore-duplicates` hides partial failures
Both uploads send `Prefer: return=representation,resolution=ignore-duplicates`
(`code.gs:512, 533`). Rows that collide are silently skipped, so a "successful" upload can
have written fewer rows than the operator thinks.

## Why this matters for our requirements

The client's ask for "People Management" is, in practice, **replacing this spreadsheet**.
Any People-management design that doesn't say what happens to this pipeline leaves SAPAA with
two sources of truth for the same table.

Stories this generates that are in no version of our backlog:
- Admin-managed inspection **question bank** in the app (create/edit/reorder/retire questions,
  categories and mappings) — removing the need to sync `inspectquestions` from a Sheet.
- **Bulk import** of people and of historical/paper inspections, in-app, with validation,
  a dry-run preview, and a per-row error report instead of an all-or-nothing alert.
- **Bulk export** of people (the draft backlog has this, but ties it to gamification — the real
  driver is that export already exists as a Sheet pull that admins depend on).
- **Reconcile `luperson` with auth accounts**: invite/claim flow, detect a person with no login,
  detect a login with no person record, merge duplicates.
- **Retire or fence the Apps Script**: decide explicitly whether it keeps write access, and
  rotate/scope the key it uses.
- **Database owns its keys**: move to DB-generated identifiers so concurrent web + bulk writes
  cannot collide.
