# SAPAA live site walkthrough (black-box, unauthenticated)

**Target:** https://w26-project-sapaa-dev-team.vercel.app
**Date:** 2026-09-21
**Method:** read-only navigation with browser tools + HTTP status probes. No accounts created, no credentials
entered, no forms submitted, no write actions. No cookie/consent banner appeared (nothing to decline).

## Headline

**The deployed app is 100% gated.** Every route except `/login` and `/signup` returns `307 → /login` to an
unauthenticated visitor. The `/sites` list, the map, and site detail pages **could not be observed** in this
pass. Questions 2, 3, 4 and most of 7 from the brief are unanswerable black-box and need a second pass with a
test login.

Where this report states something that was *not* directly observed in the browser, it is labelled
**[code-derived]** — read from the team's own repo at `webapp/` to say what is behind the wall and what to
re-test. Those are pointers, not verified runtime behaviour.

---

## 1. Reachable surface

HTTP status probed directly (`curl`, no redirect following):

| Path | Result |
|---|---|
| `/` | 307 → `/login` |
| `/sites` | 307 → `/login` |
| `/login` | **200** (18.7 KB HTML) |
| `/signup` | **200** (20.0 KB HTML) |
| `/map` | 307 → `/login` |
| `/admin` | 307 → `/login` |
| `/dashboard` | 307 → `/login` |
| `/profile` | 307 → `/login` |
| `/reports` | 307 → `/login` |
| `/gallery` | 307 → `/login` |
| `/inspections` | 307 → `/login` |
| `/about` | 307 → `/login` |
| `/sites/1` | 307 → `/login` |
| `/api/sites` | 307 → `/login` |
| `/zzz-does-not-exist` | 307 → `/login` |
| `/robots.txt` | 307 → `/login` |
| `/sitemap.xml` | 307 → `/login` |
| `/api/auth/session` | 307 → `/login` |

Notes:

- **Nothing 404s.** A genuinely nonexistent path (`/zzz-does-not-exist`) is indistinguishable from a real
  gated route. There is no reachable 404 page for logged-out users.
- **`/robots.txt` and `/sitemap.xml` are redirected to login.** Crawlers get an HTML redirect instead of the
  file. This is a middleware-matcher bug, not intentional.
- **API routes return a 307 HTML redirect instead of `401 JSON`.** Any unauthenticated `fetch()` against an
  API route receives a login page, so client code parsing JSON will fail with a confusing parse error rather
  than a clean auth error.
- Real routes that exist behind the wall **[code-derived]** (`webapp/app/**/page.tsx`): `/`, `/login`,
  `/signup`, `/sites`, `/detail/[namesite]`, `/detail/[namesite]/new-report`,
  `/detail/[namesite]/edit-report/[responseId]`, `/gallery`, `/terms`, `/api-docs`, `/error`,
  `/auth/auth-code-error`, `/private`, and admin: `/admin/dashboard`, `/admin/sites`, `/admin/sites/[id]`,
  `/admin/gallery`, `/admin/form-editor`, `/admin/account-management`.
- Note there is **no `/map`, `/dashboard`, `/profile`, `/reports` or `/inspections` route at all** — those
  paths 307 only because the catch-all middleware fires before routing. The nav names in the brief do not
  match the real route table.

### Root cause of the over-broad gate **[code-derived]**

`webapp/middleware.ts` matcher:

```
'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
```

It excludes only Next static assets and image extensions. `robots.txt`, `sitemap.xml`, `/api/*`, and any
public marketing page are all swept in. The handler then redirects anything that is not `/login`, `/signup`,
`/auth`, `/error`.

---

## 2. Sites list

**Not observable.** `/sites` redirects to `/login`. Count of sites, columns, search/filter/sort/pagination
behaviour, and duplicate entries could not be checked.

What to re-test with a login, and why **[code-derived]** (`webapp/app/sites/page.tsx`, 519 lines):

- There **is** a search box and a sort menu (`search`, `sortBy` by `name`/`date`, asc/desc, `showSortMenu`).
- **There is no pagination.** `filteredSites` is a `useMemo` that filters and sorts the *entire* `sites`
  array in the browser. The page fetches every site, then narrows client-side. Verify how many rows that is
  and how long the first paint takes — this is the most likely source of the "slow list" feeling.
- The fetch goes to Supabase views `sites_list_fnr` / `sites_detail_fnr_test`
  (`webapp/utils/supabase/queries.ts`). Note `sites_detail_fnr_test` — a **`_test`-suffixed view is being read
  by the deployed app**, which is worth confirming is intentional.
- Detail pages are keyed by **site name**, not id: `/detail/[namesite]`. See Data Quality below.

## 3. Map

**Not observable.** There is no `/map` route, and the map is not on `/sites`.

**[code-derived]:** `leaflet`, `react-leaflet` and `leaflet.heat` are in `webapp/package.json`, and the only
consumer is `webapp/app/admin/dashboard/components/Map.tsx`. So the map **and the heatmap exist, but only on
the admin dashboard** — a regular steward looking at `/sites` gets no map at all. Whether pins are plotted,
clickable, and linked to detail pages needs an admin login to confirm. This asymmetry (map is admin-only) is
itself worth a product conversation.

None of the login/signup JS bundles reference leaflet, mapbox, maplibre or Google Maps, consistent with the
map living entirely behind auth.

## 4. Site detail

**Not observable.** `/detail/[namesite]` and `/sites/1` both redirect to `/login`. Photos, geo info,
inspection history, activity, likes, and empty/placeholder states could not be checked.

---

## 5. UI/UX defects

Only `/login` and `/signup` were visible, so this list covers those two pages. The "UI looks weird" complaint
is presumably about the authenticated app, which still needs its own pass. Screenshots were taken at desktop
(1024x768 viewport) and mobile (375x812) but the browser tooling could not write image files to disk, so each
is described inline.

Numbered, each independently ticketable:

1. **Primary button colour is inconsistent between login and signup.** "Sign In" on `/login` is dark green
   (`#1e4620`-ish). "Create Account" on `/signup` is **orange**. Same design system, adjacent pages in one
   flow, two different primary colours. Looks like a stray token or a hardcoded hex.

2. **No `<form>` element exists on either page.** `document.querySelectorAll('form').length === 0`, yet the
   email/password inputs and the "Sign In" / "Create Account" buttons are `type="submit"`. Consequences:
   pressing **Enter in the password field does not submit** (keyboard-only users are stuck), browser and
   1Password/Bitwarden password managers will not reliably offer to save credentials, and `type="submit"`
   outside a form is inert. This is a functional bug, not cosmetic.

3. **Password inputs have no `autocomplete` attribute.** `email`, `password`, `confirmPassword` all have
   `autocomplete=""`. Should be `autocomplete="email"`, `"current-password"` (login) and `"new-password"`
   (signup). Without these, password managers cannot autofill and browsers cannot offer to generate a
   password. Field volunteers on phones will feel this most.

4. **Password visibility toggle buttons are completely unlabeled.** Three `<button type="button">` elements
   (one on login, two on signup) with **empty text content, no `aria-label`, no `title`**. A screen reader
   announces only "button". WCAG 4.1.2 failure.

5. **Two `<h1>` elements per page, and the heading level jumps h1 → h3.** On `/signup`: `h1 "Protect
   Alberta'sNatural Heritage"` (marketing panel) and `h1 "Create Account"` (form card), then two `h3`s with no
   `h2` between. Same shape on `/login`. Breaks screen-reader document outline.

6. **Missing word break in the signup `h1`.** Its accessible name is literally `"Protect Alberta'sNatural
   Heritage"` — no space. Visually it's two lines so nobody notices, but it is read aloud as
   "Alberta's-Natural" and indexed that way. Caused by a `<br>`/nested-span with no whitespace.

7. **The "Or continue with email" / "Or sign up with email" divider label has a mismatched opaque
   background.** The label sits on a flat grey-green pill that does not match the page gradient behind it,
   so it reads as a misplaced chip rather than a divider break. Visible at both desktop and mobile. Classic
   hardcoded `bg-` colour on a gradient parent — this is the single most "unstyled-looking" thing on the
   public pages.

8. **Low contrast on the dark green marketing panel.** "Natural Heritage" (the second line of the signup h1)
   is rendered in a pale grey-green on the dark green gradient, and the footer line "Stewards of Alberta's
   Protected Areas Association · Alberta, Canada" is noticeably dimmer still. Needs a contrast check against
   WCAG AA (4.5:1); both look under it by eye.

9. **The left panel's footer text is clipped at the viewport bottom.** At 1024x768 the footer line renders as
   "Stewards of Alberta's Protected Areas Association · Alberta," with the rest cut off by the panel edge —
   the panel is a fixed-height flex column that overflows rather than scrolls.

10. **Signup content overflows below the fold with no visual affordance.** At 1024x768 the "Create Account"
    button is half-cut at the bottom edge and the "Already have an account? Sign in" link is entirely below
    the fold. Nothing indicates there is more content.

11. **Different logo mark at mobile vs desktop.** Desktop shows the full SAPAA logo image
    (`sapaa-full-white.png`, alt text present and correct). Mobile shows a completely different green
    rounded-square leaf glyph plus a letter-spaced "SAPAA" wordmark. Two different brand marks for the same
    app depending on screen width.

12. **Large dead vertical gap on mobile.** Between "Sign in to access site inspections." and the Google
    button there is roughly 100px of empty space, while the rest of the form is tightly packed. Reads as a
    layout bug rather than deliberate rhythm.

13. **Two decorative `<svg>` icons are exposed to assistive tech** — no `<title>`, no `aria-hidden="true"`.
    Minor, but they add noise to the screen-reader pass.

14. **No visible "Forgot password?" link on `/login`.** For a volunteer-steward audience this is a guaranteed
    support burden.

Things that are fine and should not be "fixed": `lang="en"` is set, `<title>` and `meta description` are
present and sensible, the logo `<img>` has real alt text, all three inputs have correctly associated
`<label for>` elements and are `required`, and the overall visual design of both pages is genuinely decent.

---

## 6. Console + network errors

Clean on the public surface:

- **Console: zero errors, zero warnings, zero logs** on both `/login` and `/signup`.
- **Network: 66 requests, all 200 or 304.** No 4xx, no 5xx, no failed or aborted requests.
- Timing on `/login`: TTFB 126 ms, DOMContentLoaded 291 ms, load 529 ms. Fast.
- Transfer on a warm load: ~13 KB. **Uncompressed JS across the 11 chunks is ~780 KB**, which is heavy for a
  login screen but compresses and caches well, so it is a low-priority note, not a defect.

### Client-visible config (values deliberately not recorded)

Scanned the login/signup HTML and all 11 JS chunks for key-shaped material:

- The **Supabase project URL** is present in the client bundle. Expected and not sensitive by itself.
- **No JWT-shaped string** (`eyJ...`) was found in any bundle served on these pages — the Supabase publishable
  key is not inlined here.
- **No `service_role` reference anywhere.** Good — that is the one that would matter.
- No `NEXT_PUBLIC_*` variable names inlined in the served HTML.
- 11 incidental matches on the words `api_key`/`secret`, all consistent with library source strings rather
  than literal values.

Nothing requiring rotation was observed. This only covers the two public pages; the authenticated bundles
were not reachable and should get the same scan once a login is available.

---

## 7. Data quality observations

Duplicate site entries could not be checked directly (list is gated). Two structural risks worth flagging now:

1. **Site detail pages are keyed by site name, not by id** — the route is `/detail/[namesite]`, and there is a
   `getSitesByNames()` query. If the data really does contain near-identical site names (the brief suspects
   it does), then two sites whose names differ only by whitespace, case, or punctuation will collide on the
   same URL, and whichever record the query returns first wins. It also means **renaming a site silently
   breaks every existing link and bookmark to it**. This should be a ticket regardless of what the duplicate
   audit finds.

2. **The app reads a view named `sites_detail_fnr_test`** alongside `sites_list_fnr`. A `_test`-suffixed
   object in the production read path is worth confirming is deliberate, since the list and the detail page
   may be sourced from views with different filtering or freshness.

---

## What this pass could not answer

Needs a second pass with a working test login (ideally one steward account and one admin account):

- Site count, columns, and whether search/sort actually work on real data
- Pagination behaviour and first-paint time for the full site list (suspected unpaginated full-table fetch)
- Duplicate / near-identical site names — the actual audit
- Map: does it load, are pins plotted and clickable, does the heatmap render (admin dashboard only)
- Site detail: geo info, photos, inspection history, activity, likes, empty and placeholder states
- Console/network errors and payload sizes on the authenticated pages — the interesting half
- The "UI looks weird" complaint itself, which is almost certainly about screens not reachable here
