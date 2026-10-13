# User Model (Sprint 2, Team Alpha)

Status: **applied**. Approved in PR #116 (Aaron and lamersc, 2026-09-30). Migrated by PR #131
(closes #75) in `webapp/supabase/migrations/20261004000000_create_user_model.sql`. Contact details
added by PR #142. Reads limited to approved users by PR #238. Status as of October 11, 2026.

This model is used by US 1.0.1 (profiles), US 1.0.2 (edit own profile) and US 3.0.2 (steward
designation). It also keeps a field for US 1.0.5 (activity points, Sprint 4).

## State before Sprint 2

This table shows the data before the user model was applied. The last column shows where each item
is now.

| Data | Where it was | Problem | Now |
|---|---|---|---|
| Login identity | `auth.users` | None. | Not changed. |
| Name, phone, avatar | `auth.users.user_metadata` | A user cannot read the `user_metadata` of another user without the service-role key, so US 1.0.1 cannot show other profiles from it. | Name in `people.display_name` (#131). Phone and other contact details in `socials` (#142). Both are edited through `PATCH /api/profile` (#138, #142). |
| Role, approval flag | `auth.users.app_metadata` | Only the server can write `app_metadata`, so a user cannot change their own role or approval flag (backlog item 5 in [Issues](issues.md)). | All role and approval checks read `app_metadata` (GitHub #71, closed by PR #144). |
| Legacy people | `luperson` | Mobile app writes `displayname` (`FNR/src/services/database.ts:312`). The Google Sheets Apps Script synced the full table by `id`. PR #118 removed that script from the repository, but the deployed script can still sync the table. The production columns are not in the repository. It has no link to `auth.users` (backlog item 38). | Not changed. The web app only checks that an email exists (`isSteward` in `webapp/utils/supabase/queries.ts`). |
| Inspections of a user | `form_responses.user_id` references `auth.users.id` | None. The inspection count can be calculated from this. | The profile calculates the counts from this (see [Inspection counts](#inspection-counts)). |
| Steward of a site | Nothing | US 3.0.2 needs it. | `site_stewards` (#131). Written by `assignSiteSteward` in `webapp/utils/steward-actions.ts` (#133). Shown on the site page and on the profile under "Steward of" (#139, #140). |
| Skills, focus areas | Nothing | US 1.0.1 and 1.0.2 need them. | `people.skills` and `people.focus_areas` (#131). Edited through `PATCH /api/profile` (#138). |

## Options considered

| Option | Summary | Result |
|---|---|---|
| A | New `profiles` table, keyed by the login id. `luperson` not changed. | Rejected. A person cannot exist without a login, so the legacy people in `luperson` can never move into it. The system keeps two people tables. |
| B | Add a login link and profile columns to `luperson`. | Rejected for now. The mobile app and the Sheets sync write to `luperson`, the production columns are not known, and the Sheets sync writes full rows. The risk is high and the change touches clients that Alpha does not own this sprint. |
| C | Keep profile data in `user_metadata`. | Rejected. Other users cannot read it without the service-role key (fails 1.0.1 AT1), and the user can change it without a server check. |
| **D** | **New `people` table with its own id. The login link is an optional column.** | **Approved and applied (#131).** |

## Model

`people` holds one row for each person with a login. `site_stewards` links one steward to each
site. `socials` holds the optional contact details of a person. `auth_user_id` is nullable, so a
person without a login can be added later without a schema change.

| Table | Key | Columns | Who can read | Who can write |
|---|---|---|---|---|
| `people` | `id` (bigint identity) | `auth_user_id` (unique, nullable, references `auth.users`), `display_name` (1 to 29 characters after trim), `skills`, `focus_areas`, `activity_points`, `created_at`, `updated_at` | Approved users. A user who is not approved reads only their own row. | A user updates only their own row, and only `display_name`, `skills` and `focus_areas`. The sign-up trigger inserts rows. |
| `site_stewards` | `site_id` (references `sites_pa`) | `steward_id` (references `people`), `assigned_by` (references `auth.users`), `assigned_at` | Approved users. | No user policy. Only the admin server action `assignSiteSteward` writes it, with the service-role client. |
| `socials` | `person_id` (references `people`) | `email`, `phone`, `website`, `instagram`, `facebook`, `x`, `linkedin`, `updated_at`. All optional in the table. `PATCH /api/profile` requires `email` when it saves contact details (US 1.0.2 AT3). Links must start with `https://`. | Approved users. A user who is not approved reads only their own row. | A user inserts or updates only the row of their own person record. |

The profile does not read the email or phone in `auth.users`. The contact email in
`socials.email` is optional and separate from the login email (#142). `GET /api/profile` checks that
the caller is approved, then reads `people` and embeds `socials` with the service-role client. See
[API Documentation](api-documentation.md). The profile page shows the inspection history 10
reports at a time, with Previous and Next buttons. The rules for every table, by role, are in the
[Access matrix](api-documentation.md#4-access-matrix).

`luperson` is not linked. In the review of PR #116, lamersc asked to drop it from this model,
because the mobile app has not changed in two years. The web app only uses `luperson` in
`isSteward()`, which checks if the email of the signed-in user belongs to a steward. If backlog item 38 imports legacy people later, it adds a link
column then.

## SQL

The source of truth is the migration files. This page does not copy the SQL.

| File | What it does |
|---|---|
| `webapp/supabase/migrations/20261004000000_create_user_model.sql` | Creates `people` and `site_stewards`, the RLS policies and the column grants. Adds the `people_set_updated_at` trigger (function `set_updated_at()`) and the sign-up trigger `create_person_on_signup` (function `create_person_for_new_user()`, execute revoked from `public`, `anon` and `authenticated`). Gives every existing user a person record. |
| `webapp/supabase/migrations/20261005000000_profile_distinct_site_count.sql` | Creates `get_distinct_inspected_site_count(p_user_id uuid)` (#78). |
| `webapp/supabase/migrations/20261005010000_create_socials.sql` | Creates `socials`, its RLS policies and column grants (#142). |
| `webapp/supabase/migrations/20261009000000_archive_site_inspection_reports.sql` | Redefines `get_distinct_inspected_site_count` so that archived reports are not counted (#165). |
| `webapp/supabase/migrations/20261010000100_require_approval_for_people_reads.sql` | Replaces the read policies of `people`, `socials` and `site_stewards`. Approved users read all rows. A user who is not approved reads only their own `people` and `socials` rows, so that `PATCH /api/profile` can read the row back (#238). |
| `webapp/supabase/migrations/20261011000000_revoke_public_execute_on_report_functions.sql` | Revokes execute on `get_distinct_inspected_site_count` and `get_max_inspection_number` from `public`, `anon` and `authenticated`, so that only the service role can call them. Before it, Postgres and Supabase gave execute to every role by default, so a request with the anon key could call them. Safe to run twice. |

The other tables are not part of this model. Their rules, for example `protected_areas`
(`20261004010000`, `20261006010000`) and the read policies of the gallery tables
(`20261005020000`), are in the [Access matrix](api-documentation.md#4-access-matrix).

A human runs the same files in the Supabase dashboard for production, after
`20261003000000_remove_w26_prefix.sql` (see the header comment of each migration). Every step is safe to run
twice.

The update policy limits a user to their own row. The column grants limit them to `display_name`,
`skills` and `focus_areas`, so a user cannot change `activity_points`, `id`, `auth_user_id` or the
timestamps. The policies use `(select auth.uid())`. `set_updated_at()` and
`create_person_for_new_user()` use `set search_path = ''`. `get_distinct_inspected_site_count` uses
`set search_path = public`.

## Inspection counts

The counts are calculated, not stored, so that they cannot become incorrect. `GET /api/profile`
returns both counts in `stats`.

| Field | How it is calculated |
|---|---|
| `inspectionCount` | The number of `form_responses` rows for the user that are active and not archived (`is_active` is true and `archived_at` is null). |
| `distinctSiteCount` | The SQL function `get_distinct_inspected_site_count(p_user_id uuid)`. It counts the distinct `site_id` values of the same rows. Only `service_role` can execute it, and the route calls it with the service-role client (#78). |

The inspection count is the same as this query:

```sql
select count(*)
from public.form_responses responses
join public.people person on person.auth_user_id = responses.user_id
where person.id = $1 and responses.is_active and responses.archived_at is null;
```

## Migration of current users

The user model migration gives every existing user a person record:

```sql
insert into public.people (auth_user_id, display_name)
select id,
       left(coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
                     nullif(split_part(email, '@', 1), ''), 'New user'), 29)
from auth.users
on conflict (auth_user_id) do nothing;
```

Done when `select count(*) from auth.users` equals
`select count(*) from public.people where auth_user_id is not null`.
No existing table is changed, so no data can be lost.

## Decisions

| # | Question | Decision | Source |
|---|---|---|---|
| 1 | Which model? | Option D: a `people` table with its own id. | Approved by Aaron and lamersc in PR #116. Applied in #131. |
| 2 | Can other users see contact info? | Yes. All `socials` fields are visible to approved users. A user who is not approved sees only their own. A user fills in only the fields they want to show. | Decided in #142. Limited to approved users by #238 (`20261010000100_require_approval_for_people_reads.sql`). |
| 3 | Where is `role` stored? | In `app_metadata`, which only the server can write. Only admin server actions write `site_stewards`, with the same admin check as the other admin actions. | Approved in PR #116. All checks moved to `app_metadata` by PR #144 (closes GitHub #71). |
| 4 | Separate profile email? | Yes. An optional contact email in `socials.email`, separate from the login email in `auth.users`. | Changed in #142. lamersc's review of PR #116 first said no. |
| 5 | How many stewards per site? | One. A new assignment replaces the old one (`site_id` is the primary key). | US 3.0.2 AT2 (#62). If the client wants more, change the key to `(site_id, steward_id)`. |
| 6 | Table names? | No `W26_` prefix. | #73, done by #129. |
| 7 | Can a profile use the current role? | It may display the role from `app_metadata`, but only as information; it must never authorize any action. `GET /api/profile` follows this rule. | Fixed by the move to `app_metadata` (GitHub #71, PR #144). |

## Gamification proposal

Status: **proposed for Sprint 4**. Nothing in this section is built. This is the current design of US
1.0.5. The [proposed ER diagram](software-design.md#proposed-schema-for-the-user-stories), the
[US 1.0.5 sequence diagram](software-design.md#us-105-earn-points-for-inspection-activity) and the
services class diagram show it: calculated metrics and a scoreboard, with no points table. The client asked for a simple gamification
that uses the data that already exists, and he asked to see how it flows, what a user sees and which
stats are shown ([Oct 2 meeting](<meetings/week5/2026_10_02 _meeting_Frank.txt>), lines 891 to 940).
The TA asked us to start from the behaviours that we want to reward, and suggested a bounty board
([TA lab notes](meetings/week5/Meeting_Notes.md)). The team showed a mockup on October 9
([Oct 9 meeting](meetings/week6/2026_10_09_meeting_frank.txt), lines 387 to 422), and the client said
the direction was right.

### Behaviours and metrics

Each metric rewards one behaviour. All of them can be calculated from `form_responses`, `sites_pa`
and `people`, like the counts in [Inspection counts](#inspection-counts). None of them needs a new
table.

| Metric | Behaviour it rewards | How it is calculated | Who asked |
|---|---|---|---|
| Inspections submitted | Keep inspecting. | Count the active, unarchived `form_responses` of the person. The profile already shows this as `inspectionCount`. | Client, Oct 2 |
| Different counties visited | Visit sites in more of Alberta. | Count the distinct `sites_pa.ab_county` of the sites in the reports of the person. | Client, Oct 2 |
| Site variety | Inspect different kinds of sites. | Count the distinct site types and subtypes in the reports of the person. The client also named the natural region. We still have to confirm which column holds each of them. | Client, Oct 2 and Oct 9 |
| Site explorer | Be the first to report a site. | The person with the earliest active report of a site. | Oct 9 meeting |
| Top contributor | Be the person with the most inspections, counties or site variety. | Rank the metrics above. | Client, Oct 2 and Oct 9 |

Each ranking can cover all time or the last year, so that a new contributor can lead the board
(client, Oct 9). The team also listed scoreboard totals in its Oct 9 plan.

### Considered and not chosen yet

| Idea | Reason |
|---|---|
| Bounty board: more points for visiting chosen sites, so that not every site is worth the same. | The TA suggested it. It needs a decision about who picks the sites and how the points change. It also uses `people.activity_points`, which US 1.0.5 owns. Ask the client first. |
| Points for photos and other activity (US 1.0.5 as written). | The client prefers a simple version that uses existing data over a complete design. `people.activity_points` stays unused until he decides. |

### Plan

1. Show this proposal and the mockup to the client and ask which metrics he wants first.
2. Rewrite the acceptance tests of US 1.0.5 to match the chosen metrics. The story is about points today.
3. Build the first version as US 1.0.5 in Sprint 4 (planned, see [Project Management](project-management.md)). The counts are calculated, like the inspection counts, so no stored value can become incorrect.

Open questions for the client: what makes two sites "different", and whether a hard-deleted site
(site not known) still counts toward a person's totals.
