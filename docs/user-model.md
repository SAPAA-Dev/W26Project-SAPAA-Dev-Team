# User Model (Sprint 2, Team Alpha)

Status: **applied**. Approved in PR #116 (Aaron and lamersc, 2026-09-30). Migrated by PR #131
(closes #75) in `webapp/supabase/migrations/20261004000000_create_user_model.sql`. Contact details
added by PR #142. Status as of October 7, 2026.

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
| `people` | `id` (bigint identity) | `auth_user_id` (unique, nullable, references `auth.users`), `display_name` (1 to 29 characters after trim), `skills`, `focus_areas`, `activity_points`, `created_at`, `updated_at` | Signed-in users. | A user updates only their own row, and only `display_name`, `skills` and `focus_areas`. The sign-up trigger inserts rows. |
| `site_stewards` | `site_id` (references `sites_pa`) | `steward_id` (references `people`), `assigned_by` (references `auth.users`), `assigned_at` | Signed-in users. | No user policy. Only the admin server action `assignSiteSteward` writes it, with the service-role client. |
| `socials` | `person_id` (references `people`) | `email`, `phone`, `website`, `instagram`, `facebook`, `x`, `linkedin`, `updated_at`. All optional. Links must start with `https://`. | Signed-in users. | A user inserts or updates only the row of their own person record. |

The profile does not read the email or phone in `auth.users`. The contact email in
`socials.email` is optional and separate from the login email (#142). `GET /api/profile` reads
`people` and embeds `socials` with the service-role client. See
[API Documentation](api-documentation.md).

`luperson` is not linked. In the review of PR #116, lamersc asked to drop it from this model,
because the mobile app has not changed in two years. The web app only uses `luperson` to check if
an email belongs to a steward. If backlog item 38 imports legacy people later, it adds a link
column then.

## SQL

The source of truth is the migration files. This page does not copy the SQL.

| File | What it does |
|---|---|
| `webapp/supabase/migrations/20261004000000_create_user_model.sql` | Creates `people` and `site_stewards`, the RLS policies and the column grants. Adds the `people_set_updated_at` trigger (function `set_updated_at()`) and the sign-up trigger `create_person_on_signup` (function `create_person_for_new_user()`, execute revoked from `public`, `anon` and `authenticated`). Gives every existing user a person record. |
| `webapp/supabase/migrations/20261005000000_profile_distinct_site_count.sql` | Creates `get_distinct_inspected_site_count(p_user_id uuid)` (#78). |
| `webapp/supabase/migrations/20261005010000_create_socials.sql` | Creates `socials`, its RLS policies and column grants (#142). |

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
| `inspectionCount` | The number of active `form_responses` rows for the user. |
| `distinctSiteCount` | The SQL function `get_distinct_inspected_site_count(p_user_id uuid)`. It counts the distinct `site_id` values of the active `form_responses` rows for the user. The migration grants execute to `service_role`, and the route calls it with the service-role client (#78). |

The inspection count is the same as this query:

```sql
select count(*)
from public.form_responses responses
join public.people person on person.auth_user_id = responses.user_id
where person.id = $1 and responses.is_active;
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
| 2 | Can other users see contact info? | Yes. All `socials` fields are visible to signed-in users. A user fills in only the fields they want to show. | Decided in #142. |
| 3 | Where is `role` stored? | In `app_metadata`, which only the server can write. Only admin server actions write `site_stewards`, with the same admin check as the other admin actions. | Approved in PR #116. All checks moved to `app_metadata` by PR #144 (closes GitHub #71). |
| 4 | Separate profile email? | Yes. An optional contact email in `socials.email`, separate from the login email in `auth.users`. | Changed in #142. lamersc's review of PR #116 first said no. |
| 5 | How many stewards per site? | One. A new assignment replaces the old one (`site_id` is the primary key). | US 3.0.2 AT2 (#62). If the client wants more, change the key to `(site_id, steward_id)`. |
| 6 | Table names? | No `W26_` prefix. | #73, done by #129. |
| 7 | Can a profile use the current role? | It may display the role from `app_metadata`, but only as information; it must never authorize any action. `GET /api/profile` follows this rule. | Fixed by the move to `app_metadata` (GitHub #71, PR #144). |
