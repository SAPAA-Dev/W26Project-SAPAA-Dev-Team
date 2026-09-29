# What the team needs to review

Most of the Sprint 1 documentation was drafted with LLM assistance and has not been checked by a
human yet. This file lists what to look at, in what file, and what specifically to judge.

Work top to bottom. The first section is the one that changes decisions.

---

## 1. The claims that shaped the plan

**Why first:** the sprint order, the priorities and several story estimates all rest on four
findings. If one of them is wrong, the plan is wrong.

| Claim | Where to check it | How to verify |
|---|---|---|
| Any signed in user can make themselves an admin | `docs/investigation/codebase-audit.md`, then `webapp/utils/admin-actions.ts` and `webapp/middleware.ts` | Look for any caller or role check in those server actions. There should be none. |
| Web app and mobile app use different database tables | `docs/investigation/THE-SCHEMA-SPLIT.md` | `grep -r "W26_" webapp` versus `grep -r "inspectheader" FNR` |
| Sites have no latitude or longitude anywhere | `docs/investigation/codebase-audit.md` | `webapp/app/admin/dashboard/page.tsx` around line 130. It geocodes the site name as text. |
| A Google Sheet has write access to the database | `docs/investigation/google-sheets-backdoor.md` | `googleSheets/code.gs` |

**Reviewer:** anyone comfortable reading the codebase. Saumya wrote these, so ideally not Saumya.

---

## 1a. Story changes after the September 25 client meeting

**Files:** `docs/investigation/story-changelog-2026-09-25.md` and
`docs/investigation/sapaastewards-site-inventory.md`

The changelog lists every story change made after the September 25 meeting with Frank. That is
8 added, 11 modified, 1 de-scoped, 4 merged and 43 fixed. It also has the new MoSCoW totals: Must
is 28 stories, 105 points plus the unsized US 9.0.8. Every change cites a transcript quote or a URL.

- Check the quotes against `docs/meetings/week4/meeting_25th_frank_team.txt`. The transcript has
  no speaker labels, so check who said each line too.
- **Open questions for Frank** (20 of them) are meant to be pasted into an email. Before anyone
  sends them, check the wording and drop any we can answer ourselves.
- The MoSCoW is provisional until Frank's fix/fault spreadsheet arrives. Must Have now roughly fills
  planned capacity.
- The site inventory covers SAPAA's public website, not our app. Check that the charter
  quotes the stories rely on match the live pages.
- Five GitHub issues need updating by hand. They are listed in the changelog, and none were edited.

**Reviewer:** Alissa as product owner, plus whoever sends the email to Frank.

---

## 2. User stories

**File:** `docs/index.md`, the `## User Stories` section. 68 stories in 10 groups.

**Alissa's stories, groups 1 to 4.** Her wording, TODO notes and questions for Frank were kept
exactly. What was added: titles where they were blank, point estimates, and acceptance tests.

- Check the estimates. Do they match the size of the work as you understand it?
- Check the acceptance tests. Are they testable, and do they test the right thing?
- Three stories had a literal `so that ________` blank. Those were filled in and marked
  `(TODO: confirm with Frank)`. Confirm the benefit clause is what you meant: US 2.0.5, US 3.0.3,
  US 3.0.4.
- **US 3.0.5 still reads "so we can gamify shit".** It was preserved deliberately rather than
  silently edited. Reword it before this goes to Frank.
- US 2.0.5 was ambiguous between editing inspections and editing site details. It was written for
  inspections. Confirm.

**New stories, groups 5 to 10.** These came out of the codebase audit.

- Are any of them out of scope for what Frank actually asked for?
- Section 8, mobile and offline, may be entirely out of scope this term. Frank asked for the web
  app first. Decide whether to keep them as Won't Have or drop them.
- Several carry notes saying they are blocked on another story or overlap an existing one. Check
  those are right.

**Reviewer:** Alissa as product owner, plus one other.

---

## 3. MoSCoW

**File:** `docs/index.md`, the `## MoSCoW` section.

All 68 stories are categorised. 57 points Must, 88 Should, 116 Could, 63 Won't.

- **Must Have is the MVP.** Is that the right MVP? It is heavy on access control and site
  coordinates, on the argument that nothing else is safe or buildable without them. That argument
  is worth challenging.
- Anything in Could that should be Must, or the reverse?
- The Won't list includes migrating forty years of historical inspections and everything mobile.
  Confirm you are comfortable telling Frank those are out of scope this term.
- Frank has not seen any of this. Priorities may change after the client call.

**Reviewer:** whole team, then confirm with Frank.

---

## 4. Sprint plan

**File:** `docs/project-management.md`

- **Sprint 1 is due September 29.** Sprints 2 to 5 are proposed on a two week cadence: October 13,
  October 27, November 10, November 24. Check those against the course schedule.
- **Velocities are 19, 22, 27, 29.** These are guesses. Nobody has measured our real throughput.
  Re-estimate after Sprint 2, which the Sprint 2 rubric requires anyway.
- **Suggested owners on stories are suggestions only.** Confirm or change at planning.
- Sprint 1 task owners came from the September 19 meeting. Check they match what you agreed.
- The Winter 2026 plan is archived at the bottom. Confirm you want to keep it rather than delete it.

**Reviewer:** Chris as Sprint 1 Scrum Master.

---

## 5. Story map

**File:** `docs/project-management.md`, the `## Story Map` section.

This is a rough text map by feature area and sprint. It is a starting point, not a finished
artifact. The rubric expects a story map covering all five sprints with Must, Should, Could and
Won't categorisation.

- Decide whether to keep the text version or rebuild it visually the way both previous teams did.
- Check the sprint assignment per feature area makes sense.

---

## 6. Project overview

**File:** `docs/index.md`, sections before the user stories.

- **Executive summary** and **glossary**: written by Zanab, already reviewed once.
- **Similar products** and **open source projects**: check the analysis actually says how each one
  informs our work, since that is what the rubric asks for.
- **Technical resources**: newly written, not reviewed by anyone. Check the links are relevant and
  that nothing important is missing.

**Reviewer:** Zanab.

---

## 7. Issues backlog

**File:** `docs/issues.md`, 52 entries ranked by impact against effort.

- The ranking is a judgement call. Argue with it.
- Five entries were corrected after Saumya reviewed them and found the original claims overstated.
  Worth checking whether others have the same problem.
- Decide which become GitHub issues for Sprint 2. Milestones and labels already exist.

---

## 8. Meeting minutes

**File:** `docs/meeting-minutes.md`, the Fall 2026 section.

- Two meetings recorded: September 18 handover, September 19 working session.
- Check the decisions and action items match what you remember. They were reconstructed from
  transcripts.
- The September 19 raw transcript is referenced but **not yet in the repo**. Someone needs to add
  it at `docs/meetings/week3/sep19-working-session.txt`.

---

## 9. Teamwork

**File:** `docs/teamwork.md`

- **The Belbin table, the role lists below it, and the canvas image disagree with each other** in
  about six places. Pick one source of truth.
- **Saumya is in neither Scrum rotation.** Ten slots, seven people, and some people have two.
- Canvas has minor typos: "Coordinatorm", "Abhinav::", ":earning curve".

---

## 10. Known problems nobody has fixed yet

These are real and documented, but out of scope for Sprint 1.

- `docs/webapp-deployment.md` contains a live Supabase key, pasted four times, and is published to
  GitHub Pages. It needs rotating and scrubbing.
- About 20 Cypress test files log into production using two former students' personal accounts and
  plaintext passwords, one of them an admin.
- `FNR/src/services/openCage.ts` has a hardcoded API key.
- The mobile app config passes the service role key into the app bundle.
- `docs/Deployment-manual.md` has a typo, `W26_form_reponses`, that would silently break any new
  environment built from it.

---

## Not in this review

- **Low fidelity wireframes and the UI flow diagram.** Abhinav is doing these.
- **High level design, UML and sequence diagrams.** Jayden is doing these.
