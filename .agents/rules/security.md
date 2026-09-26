# Security rules

These rules apply to all code in this repository. Read them before you change auth, database, or upload code.

## Keys and secrets

* Do not put keys, tokens, or passwords in code, tests, or docs. Use environment variables.
* Do not read or change `.env*` files or `webapp/cypress.env.json`. If you need a value, ask the user.
* The Supabase service-role key bypasses Row Level Security (RLS). Use it only in server code in `webapp/`. Never use it in client components, in `FNR/`, or in `googleSheets/`.
* Known problems. Do not copy these patterns. Do not "fix" them without an issue:
  * `FNR/app.config.js` puts the service-role key in the mobile bundle. `FNR/src/services/adminAuth.ts` uses it on the device.
  * `FNR/src/services/supabase.ts` and `docs/webapp-deployment.md` have a committed Supabase URL and anon key.
  * Many specs in `webapp/cypress/e2e/` have plaintext passwords.

## Authorization

* Check the role and the ownership on the server in every server action and every API route. Do not trust the client.
* The role (`steward` or `admin`) and the approval flag (`authenticated`) are in Supabase `user_metadata`. A user can change their own `user_metadata`. Thus it is not a safe source for authorization. See `docs/investigation/README.md`.
* `webapp/utils/supabase/server.ts` (`createServerSupabase`) and `webapp/utils/supabase/admin.ts` bypass RLS. When you call them, you must do the authorization check yourself, before the call.
* `webapp/utils/admin-actions.ts` and `webapp/utils/form-actions.ts` do not check authorization now. If your change touches them, tell the user.

## Live data

* There is one Supabase project. There is no staging database. All code that writes to Supabase writes to production.
* Do not run Cypress (`webapp/cypress/`). Its tasks delete and update rows in production tables.
* Do not run `webapp/temp-supabase.py` or `googleSheets/code.gs`. They write to production.
* Jest tests must mock Supabase and S3. Use the mocks in `webapp/__tests__/` as the pattern.
