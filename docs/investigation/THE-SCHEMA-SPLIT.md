# The Schema Split — three systems, one database, almost no overlap

**This is the most important finding in the investigation.** It is invisible from any single
vantage point; it only appears when you put the web app, the mobile app and the Google Sheet
side by side. Verified by direct grep, not inference.

## The evidence

**Web app** (`webapp/`) reads and writes a `W26_*` schema, and *only* that schema:

```
W26_sites            W26_form_responses   W26_answers        W26_attachments
W26_questions        W26_questions_category  W26_form_sections
W26_question_keys    W26_question_options W26_homepage       W26_ab_counties
```

It touches the legacy schema at **exactly one place in the entire codebase**:
`webapp/utils/supabase/queries.ts:352` → `.from('luperson')`.

**Mobile app** (`FNR/`, real name **StewardLog**) reads and writes the legacy schema:

```
inspectheader        inspectdetails       inspectquestions   luperson
inspectheader_fnr_test  inspectdetails_fnr_test  luperson_fnr_test
sites_list_fnr       sites_report_fnr_test
```

**Google Apps Script** (`googleSheets/code.gs`) writes the legacy schema:

```
inspectheader        inspectdetails       inspectquestions
inspectqcategory     questionmapping      luperson           lumembertype
```

## What this means

```
                    ┌──────────────────────────────┐
   Web app  ───────▶│  W26_sites, W26_form_responses, W26_answers,
                    │  W26_attachments, W26_questions, W26_form_sections …
                    └──────────────────────────────┘
                                   │
                            luperson  ◀── the ONLY shared table
                                   │
                    ┌──────────────────────────────┐
   Mobile   ───────▶│  inspectheader, inspectdetails,
   Sheets   ───────▶│  inspectquestions, inspectqcategory, questionmapping
                    └──────────────────────────────┘
```

1. **There are two inspection systems in one database.** An inspection submitted on the web app
   does not exist as far as the mobile app is concerned, and an inspection bulk-loaded from the
   Google Sheet does not exist as far as the web app is concerned. They do not share a table,
   a key, or a foreign key.

2. **The question bank is duplicated.** `inspectquestions` / `inspectqcategory` /
   `questionmapping` (legacy — synced from a Google Sheet, read by mobile) versus
   `W26_questions` / `W26_questions_category` / `W26_form_sections` (web). **Editing questions in
   the Google Sheet does not change the web form.** Anyone who believes the Sheet is the source
   of truth for the form is wrong, and has been for a semester.

3. **The 40+ years of legacy inspection data live in the legacy schema, so the web app cannot
   see any of it.** This is the concrete reason the "legacy migration" item is still open, and
   it is why `sites_list_fnr` / `sites_report_fnr_test` exist — the mobile app was built against
   the historical data, the web app was built against a clean new schema.

4. **`luperson` is the only seam between the two worlds.** That single table is where People
   Management necessarily lands. This is a strong argument that the People-management epic is not
   a CRUD feature — it is the *integration point* of the whole system, and it should be designed
   as such.

5. **Production code reads `_test` views.** Mobile reads `sites_report_fnr_test`,
   `inspectheader_fnr_test`, `luperson_fnr_test`; the web app's site detail path reads
   `sites_detail_fnr_test`. Views named `_test` are in the production read path of both apps.

## Why nobody told us this

The Week 3 handoff call was with the Winter 2026 team, who built the **web app**. The mobile app
and the map were built by the **Fall 2025** team (Mehrdad, Gabriel). Neither team owned both
sides, so neither could see the split. The Google Sheet was never mentioned by anyone.

## Stories this forces

These are not "nice to have" — without a decision here, People and Place Management get built
twice or built on the wrong half.

- **Decide the target schema.** Does `W26_*` become canonical and legacy gets migrated into it,
  or does the web app learn to read legacy? This is a one-way door and it blocks most of the
  Place-management backlog. It should be an explicit spike with a written decision (ADR), not a
  drive-by choice inside a feature ticket.
- **Migrate legacy inspections into the canonical schema** (40+ years), with a reversible,
  re-runnable migration and a row-count reconciliation report.
- **Unify the question bank** so there is one definition of the inspection form, and so the
  Q-numbers that legacy data depends on survive. (Q-numbers must never change — legacy data
  is keyed on them.)
- **Give the mobile app and the web app one shared read model** for sites and inspections, so a
  steward sees the same inspection history in both.
- **Promote `_test` views to real, named production views**, or delete them.
- **Reconcile `luperson` with Supabase Auth accounts** — this is the only shared table, so it is
  the only place identity can be unified. Invite/claim flow, person-without-login detection,
  login-without-person detection, duplicate merge.
- **Decide the fate of the Google Sheet pipeline** (see `google-sheets-backdoor.md`) — it writes
  the legacy schema, so whichever schema wins determines whether the Sheet keeps working at all.
