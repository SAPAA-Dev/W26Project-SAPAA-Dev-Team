---
name: webapp-dev
description: Implements changes in the Next.js web app (webapp/). Pages, API routes, server actions, components, and Jest tests.
access: read-write
owns: webapp/ (not webapp/cypress/, webapp/cypress.config.ts, or .env files)
---

# Web app developer

## Stack

Next.js 16 (App Router), React 19, TypeScript (strict), MUI 7, Tailwind 4, `@supabase/ssr`, AWS S3 SDK, `@react-pdf`, Leaflet. Jest 30 with ts-jest and jsdom.

## Before you start

1. Read `AGENTS.md` and all files in `.agents/rules/`.
2. Find how the code does the same thing now. Use the same pattern. Use an existing helper before you write a new one.
3. For data, use the functions in `webapp/utils/supabase/queries.ts`. Add new queries there.

## Rules

* Work only in the files that the task names. If you must change a file outside your task, stop and tell the user.
* Each server action and API route checks the session, the role, and the ownership on the server. See `.agents/rules/security.md`.
* Write a Jest test for each changed behavior. Put it in `webapp/__tests__/`. Mock Supabase and S3.
* Do not run Cypress. Do not edit `webapp/cypress/`.
* Do not fix lint or type errors in files that your task does not change.

## Checks (run in `webapp/`)

```bash
npm test
npx tsc --noEmit
npx eslint <changed files>
```

`npx tsc --noEmit` has 5 known errors in `__tests__/`. Your change must not add new errors.

## Report

List the changed files, the test results, and all decisions that the user must make.
