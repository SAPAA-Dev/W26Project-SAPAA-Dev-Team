# SAPAA web app

The web app for the Stewards of Alberta's Protected Areas Association (SAPAA). Volunteer
stewards fill in site inspection reports for protected areas, attach photos, and look back at
earlier reports. Admins manage sites, users, the inspection form and the report data, and
export reports.

## Stack

* Next.js 16 (App Router) with React 19 and TypeScript
* Supabase for auth and the Postgres database
* AWS S3 for inspection photos (served with presigned URLs)
* Tailwind CSS and MUI for the UI, MapLibre for maps, Chart.js for the dashboard
* `@react-pdf/renderer` for PDF exports
* Jest and Testing Library for unit tests, Cypress for E2E tests

## Install

Needs Node.js 22 (the version CI uses).

```bash
cd webapp
npm install
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. `.env.local` is gitignored. Never
commit real values. [docs/Deployment-manual.md](../docs/Deployment-manual.md) explains
where each value comes from.

## Run locally

```bash
npm run dev
```

`npm run dev` runs `scripts/local_dev.js`. It checks the missing tools and installs them into
`scripts/.deps` (gitignored): the webapp npm packages go to `node_modules`, and the Supabase CLI is
installed non-globally into `scripts/.deps`. It then starts a local Supabase, applies the migrations,
loads `supabase/seed.sql`, creates the seed admin and steward accounts, starts LocalStack for S3
(the LocalStack 3.x Docker image, no `lstk` CLI and no login), and then starts `next dev` on
[http://localhost:3000](http://localhost:3000) with the local URLs and keys. Mailpit stays stopped:
the seed accounts are already confirmed, so no local mail inbox is needed.

The only tool you must install yourself is Docker. Docker is a system service, so the script cannot
install it. The script uses only the tools it downloaded; it does not use a global Supabase CLI,
a global LocalStack CLI, or a global `next`.

LocalStack has no authentication and is published on all interfaces, so anything on your network
can read or write the dev bucket. Run `npm run dev` on a network you trust.

To run against a hosted Supabase project instead, set the variables in `.env.local` and run
`npx next dev`. There is only one hosted Supabase project and it holds production data.

For deployment, see [docs/Deployment-manual.md](../docs/Deployment-manual.md).

## Tests and checks

Run these in `webapp/` before you open a PR. CI blocks on all of them.

```bash
npm test                          # Jest unit tests
npm run test:ci                   # Jest with coverage, as CI runs it
npm run lint -- --max-warnings 0  # ESLint
npx tsc --noEmit                  # type check
```

Jest tests mock Supabase and S3, so they never touch real data.

See [docs/contributing.md](../docs/contributing.md) for branches, commits and the PR process.

## Database rule tests

See `npm run test:db` (added by #272).

## Cypress tests

The e2e specs read test account logins from `Cypress.env()`. Copy `cypress.env.example.json` to
`cypress.env.json` (gitignored) and fill in an approved admin, an approved steward and an
unapproved account. Never commit real passwords, and never use production accounts.

### Run E2E locally (same as the `E2E` GitHub workflow)

Needs Docker and the Supabase CLI. The seed script creates local-only test users and prints the env.

```bash
cd webapp
supabase start -x studio,postgres-meta,edge-runtime,storage-api,imgproxy,logflare,vector,mailpit,realtime,supavisor
node scripts/e2e_seed.js > .env.e2e        # .env* is gitignored
set -a && . ./.env.e2e && set +a
npm run build && npx next start -p 3000 &
npx cypress run --spec "$(grep -o 'cypress/e2e/[^ ]*' ../.github/workflows/e2e.yaml | tail -1)"
supabase stop
```

CI runs only the specs listed in `E2E_SPECS` in `.github/workflows/e2e.yaml`. Most others need the
production inspection form, fixed report ids or S3, which the local seed does not have. The comment
above `E2E_SPECS` gives the reason for each excluded spec.

### Database rule tests

`__tests__/db/rls.test.ts` checks the row level security policies and function grants on the local
Supabase, signed in as the seeded users with the publishable key. It runs the seed script itself.
Without `SUPABASE_LOCAL_URL` it skips, so `npm test` and CI need no database.

```bash
cd webapp
supabase start -x studio,postgres-meta,edge-runtime,storage-api,imgproxy,logflare,vector,mailpit,realtime,supavisor
npm run test:db      # sets SUPABASE_LOCAL_URL=http://127.0.0.1:54321 unless you set it
supabase stop
```
