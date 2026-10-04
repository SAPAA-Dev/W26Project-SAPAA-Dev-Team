# Database rules

Read `docs/software-design.md` (the ER diagrams) before you change a query.

## The schema split

One Supabase database holds two different inspection systems:

| Client | Tables | Where the code is |
| --- | --- | --- |
| Web app | `form_responses`, `answers`, `questions`, and the other tables in `webapp/supabase/migrations/` | `webapp/utils/supabase/queries.ts` |
| Mobile app (StewardLog) | Legacy: `inspectheader`, `inspectdetails`, `inspectquestions`, and `*_fnr_test` tables | `FNR/src/services/` |
| Google Apps Script | Legacy: `inspectheader`, `inspectdetails`, `inspectquestions`, `inspectqcategory`, `questionmapping` | `googleSheets/code.gs` |

`luperson` is the only table that all three use.

* Data written by one client is not visible to the other clients. Do not assume that a change in one client shows in the other clients.
* Before you add a query, find out which system owns the table. If you are not sure, ask the user.

## Schema changes

* The repository has no migrations and no RLS policy files. The schema lives only in the Supabase dashboard.
* Do not write DDL (`CREATE`, `ALTER`, `DROP`) or RLS policies to run against the database. Write the proposed SQL in the pull request description and ask the user. A human applies it in the dashboard.
* Do not rename or remove a column that another client uses. Search `webapp/`, `FNR/`, and `googleSheets/` for the name first.
