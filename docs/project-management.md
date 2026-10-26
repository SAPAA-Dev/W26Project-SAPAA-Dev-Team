# Project Management

> **Sprint deadlines are from the CMPUT 401 course calendar.** Each sprint ends with a GitHub
> release at 20:00: Sprint 1 on September 29, Sprint 2 on October 13, Sprint 3 on October 27,
> Sprint 4 on November 17 (after reading week) and Sprint 5 on December 1, 2026.
> From Sprint 2, all work of a sprint is merged two days before its deadline (code freeze):
> October 11, October 25, November 15 and November 29. The release is made after the freeze.
> The client plans field testing in early December 2026.

## Teamwork model

From Sprint 2, the team works in **rotating full-stack mini-teams**. Each mini-team also owns one
technical area.

- **Full stack.** Each mini-team does frontend and backend work.
- **One ownership area for each team.** A team that owns an area makes sure that the area stays
  organised and that the other teams know about changes to it. The owner team does not do every
  task in that area.
- **One work area for each sprint.** Each mini-team works on one main group of tasks in a sprint.
  The mini-teams assign their user stories themselves.
- **Offline sync meeting.** One member of each mini-team goes to an offline meeting, so that all
  teams know about the changes and there are no knowledge silos.
- **Keep your team informed.** If a member does not know what the team is doing, the other members
  of that team tell them about the work of (a) their mini-team and (b) the other teams.
- **Rotation.** The teams and the ownership areas change after each sprint, so each member works in
  all three areas.

### Ownership areas

| Area | What the owner team looks after |
|---|---|
| Platform / CI/CD / releases | CI pipelines, PR checks, deployments, environments, migrations, release notes and rollback. The owner team makes all releases. |
| Architecture / backend / data | The technical structure of the project: API conventions, database and schema changes, shared abstractions, large backend changes, refactors and dependencies. The owner team makes sure that the parts of the system stay consistent. |
| Quality / reliability / dev experience | Unit, integration and E2E tests, logging, error handling, performance checks, security checks, linting and formatting, local setup, docs and debugging workflows. |

### Sprint 2 teams

These teams are for Sprint 2 only. The ownership areas were assigned at random.

| Team | Members | Ownership area |
|---|---|---|
| Alpha | Saumya, Aaron | Architecture / backend / data |
| Beta | Abhinav, Alissa | Quality / reliability / dev experience |
| Gamma | Zanab, Chris, Jayden | Platform / CI/CD / releases |

### Sprint 3 teams

These teams are for Sprint 3 only. The ownership areas rotate, so that most members work in a new
area. Only Chris (Platform) and Abhinav (Quality) keep their Sprint 2 area. Red owns Platform /
CI/CD / releases and makes the Sprint 3 release. Red also has the map work, because the map, the
GPX tracks and the offline layers are one connected piece of work. On October 24, five stories (24 points)
moved from Sprint 4 to Sprint 3 and went to Red: 1.0.6, 2.0.12, 2.0.13, 3.0.3 and 3.0.4. On October 26, Frank required stewards to have an account and sign in. US 3.0.4 was removed and [PR #310](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/310) was closed without merge. The current scope is 14 stories and 68 points.

| Team | Members | Ownership area | Points |
|---|---|---|---|
| Red | Saumya, Chris | Platform / CI/CD / releases | 47 |
| Blue | Aaron, Zanab, Abhinav | Quality / reliability / dev experience | 15 |
| Green | Alissa, Jayden | Architecture / backend / data | 6 |

## Story map

The full story set is in [User Stories](user-stories.md): 43 user stories in seven feature areas,
198 story points, prioritised with MoSCoW. The set follows the September 25, 2026 client meeting
(see [Meeting Minutes](meeting-minutes.md)), plus later additions. Placement follows
[User Story Summaries](user-stories-summaries.md).

| Feature area | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Sprint 5 | Unscheduled | Won't Have |
|---|---|---|---|---|---|---|---|
| 1 - People Management | - | 1.0.1 (5, M) ✓, 1.0.2 (3, M) ✓ | 1.0.3 (2, S), 1.0.4 (2, M), 1.0.6 (2, S) | 1.0.5 (5, C) | - | - | - |
| 2 - Place Management | - | 2.0.2 (3, M) ✓, 2.0.3 (3, S) ✓, 2.0.4 (8, M) ✓, 2.0.5 (5, M) ✓, 2.0.6 (5, S) ✓, 2.0.10 (1, M) ✓ | 2.0.1 (8, S), 2.0.8 (3, M), 2.0.9 (5, M), 2.0.12 (8, C), 2.0.13 (3, C), 2.0.14 (2, S) | - | - | - | 2.0.11 (5, W) |
| 3 - Admin Persona | - | 3.0.2 (5, S) ✓ | 3.0.3 (8, M) | - | - | - | 3.0.4 (3, W) |
| 4 - General Features | - | 4.0.6 (1, M) ✓ | 4.0.2 (13, S), 4.0.4 (5, S) | - | - | - | 4.0.5 (5, W), 4.0.7 (5, W) |
| 5 - Access and Accounts | - | 5.0.4 (2, S) ✓ | 5.0.2 (2, M) | 5.0.5 (8, M), 5.0.6 (5, M), 5.0.7 (8, M), 5.0.8 (5, M), 5.0.9 (3, M) | - | - | - |
| 6 - Data and Places | - | - | 6.0.1 (5, M) | - | - | - | - |
| 7 - Inspections and Media | - | 7.0.1 (2, C) ✓, 7.0.5 (5, S) ✓, 7.0.6 (5, S) ✓, 7.0.7 (5, M) ✓, 7.0.8 (5, S) ✓ | - | 7.0.3 (5, C) | - | - | 7.0.4 (5, W), 7.0.9 (5, W) |
| **Committed points** | **0** | **63** | **68** | **39** | **0** | **0** | **28** |

Numbers in brackets: story points and MoSCoW priority (M = Must Have, S = Should Have, C = Could Have, W = Won't Have).

✓ = done (merged on main, and the merged work covers each AT) as of the October 11, 2026 code
freeze. All 16 Sprint 2 stories are done. See [Sprint 2 status](#sprint-2-status-as-of-october-11-2026).

The **Committed points** row gives the story points of the stories placed in each sprint. The
points that the team expects to finish in each sprint, from the Sprint 1 and Sprint 2 results, are
in [Velocity re-estimate](#velocity-re-estimate). Sprint 4 has 7 stories (39 points) and no
GitHub issues yet. The client's new access-request stories use the capacity that the plan kept
open in Sprint 4.

By MoSCoW:

| Priority | Stories | Points | Where |
|---|---|---|---|
| Must Have | 19 | 85 | 8 in Sprint 2, 6 in Sprint 3, 5 in Sprint 4 |
| Should Have | 13 | 62 | 7 in Sprint 2, 6 in Sprint 3 |
| Could Have | 5 | 23 | 1 in Sprint 2, 2 in Sprint 3, 2 in Sprint 4 |
| Won't Have | 6 | 28 | No sprint (2.0.11, 3.0.4, 4.0.5, 4.0.7, 7.0.4, 7.0.9) |

Sprint 1 has no user stories because it is documentation and discovery. The team keeps Sprint 5
free on purpose: the client said that more work can come, and the sprint is also for final
polish, deployment and field-test fixes.

**Open conflicts with the plan.** The Sprint 3 code freeze was missed. The release remains pending the checks in [Sprint 3 release checks](sprint-3-release.md). 2.0.6 (map filter) was placed before the map (2.0.1,
Sprint 3), and it is done in Sprint 2, so 2.0.1 builds on it. The team confirms or changes
placement at Sprint 3 planning (October 14).

- **Dependencies that still hold.** 2.0.9 (GPX upload) shares Sprint 3 with 2.0.1
  (map with tracks) and still comes first, because Frank asked for GPS files in one of the
  first sprints. 6.0.1 (site geometry) is in the same sprint as 2.0.1, which uses it.
  2.0.13 builds on the priority points of 2.0.12, so the two stay together in Sprint 3.

**MoSCoW is provisional.** Frank has not confirmed the priorities yet. Issue
[#23](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/23) is closed, but its last
comment says that no confirmation is recorded.

The ranked backlog of defects and tasks is in [Issues Backlog](issues.md).

## Project plan

Scrum Master and Product Owner rotate each sprint. The full rotation is on the
[Teamwork](teamwork.md) page.

**Team:** Saumya, Chris, Zanab, Abhinav, Alissa, Aaron, Jayden

### Scrum roles

The Scrum Master and the Product Owner change each sprint. The roles are described on the
[Teamwork](teamwork.md#scrum-roles) page.

| Sprint | Scrum Master | Product Owner |
|---|---|---|
| Sprint 1 | Chris | Alissa |
| Sprint 2 | Aaron | Chris |
| Sprint 3 | Jayden | Aaron |
| Sprint 4 | Abhinav | Zanab |
| Sprint 5 | Alissa | Abhinav |

### Sprint process

From Sprint 3, each sprint has its own branch, `sprint-N` (for example `sprint-3`), made from
`main`. The GitHub ruleset allows branch names that start with `sprint-`.

1. Each task is done on a feature branch. Its PR goes into `sprint-N` and needs 2 reviews.
2. At the end of the sprint, one PR merges `sprint-N` into `main`. The Scrum Master of the sprint
   reviews it (Sprint 2: Aaron; Sprint 3: Jayden).
3. Every sprint ends with a GitHub release built from `main`.

The steps are in [Contributing](contributing.md#branch-model). In Sprint 2, the PRs before #253
merged straight into `main`. The `sprint-2` branch was made on October 11 at `9009d0d`, the same
commit as `main`. The later PRs (#253 to #262 and #276) merged into `sprint-2`. [#284](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/284)
merged `sprint-2` into `main` on October 13 (squash commit `ceb5188`), and [#285](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/285) merged
`main` into `release`.

### Milestones

All releases are GitHub releases at 20:00 on the due date.

| Sprint | Sprint goal | Code freeze | Release | Stories | Committed points |
|---|---|---|---|---|---|
| Sprint 1 | Documentation and discovery: requirements, design, plan and teamwork | - | September 29, 2026 | 0 (documentation and discovery) | 0 |
| Sprint 2 | Steward profiles, site administration, and SIR export and delete | October 11, 2026 | October 13, 2026 | 16 | 63 |
| Sprint 3 | Interactive map with site geometry, boundary colors and GPX tracks, inspection history, password reset, to-visit priority, export of all files and skill dropdowns | October 25, 2026 | October 27, 2026 | 14 | 68 |
| Sprint 4 | Activity points, the all-SIR summary and integrated access requests | November 15, 2026 | November 17, 2026 | 7 | 39 |
| Sprint 5 | New client requests, final polish, deployment and field-test fixes | November 29, 2026 | December 1, 2026 | 0 (not planned yet) | 0 |

### Velocity re-estimate

Re-estimated on October 11, 2026, the Sprint 2 code freeze, from `main` at `9009d0d`. A story
counts as done only when its PR is merged on `main` and the merged work covers each AT of the
story. During Sprint 3, Frank removed US 2.0.11, US 4.0.5 and US 4.0.7 from scope. Each has 5 points. They are now Won't Have (Won't Do), with no sprint. The scope totals fell from 60 to 45 committed points and from 57 to 42 re-estimated points. US 2.0.14 then moved from Sprint 4 to Sprint 3, which brings the Sprint 3 commitment to 47 points. The recorded re-estimate stays at 42 points. The velocity-based capacity remains 57 points. On October 24, five Sprint 4 stories (1.0.6, 2.0.12, 2.0.13, 3.0.3 and 3.0.4, 24 points) moved to Sprint 3. At that date Sprint 3 had 71 points and Sprint 4 had 39 points. The recorded Sprint 3 re-estimate stays at 42 points. On October 26, US 3.0.4 was removed (3 points), so the current Sprint 3 scope is 68 points.

**Formula.**

- Done points = the sum of the story points of the stories that are Done.
- Velocity per person per week = Done points / number of members / weeks in the sprint.
- Re-estimate of a sprint = velocity per person per week × members × working weeks in the sprint.

**Measured velocity.** The team has 7 members in each sprint.

| Sprint | Committed | Done | Done per person | Notes |
|---|---|---|---|---|
| Sprint 1 | 0 | 0 | 0 | Documentation and discovery. No stories. |
| Sprint 2 | 63 | 63 | 9.0 | 51 points (7.3 per person) were done on October 9. The last 12 points (2.0.6, 5.0.4 and 7.0.6) were done on October 10 and 11. |

Sprint 2 by team. A team's points are the points of the stories that the plan gave to it. Some
PRs were written by members of another team: 2.0.3 by Jayden ([PR #150](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150)), 7.0.5 by Chris
([PR #148](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148)), and the last ATs of 2.0.6, 5.0.4 and 7.0.6 by Saumya ([PR #241](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241), [PR #238](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238), [PR #237](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/237)).

| Team | Members | Committed | Done on October 9 | Done on October 11 | Per person (October 11) |
|---|---|---|---|---|---|
| Alpha | 2 | 15 | 13 | 15 | 7.5 |
| Beta | 2 | 19 | 14 | 19 | 9.5 |
| Gamma | 3 | 29 | 24 | 29 | 9.7 |
| **Total** | **7** | **63** | **51** | **63** | **9.0** |

**Re-estimate.** Revised on October 12 for the length of each sprint
([#266](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/266)). Sprint 2 was 2 weeks
long and had 7 members, so it gives two measures per person per week:

| Measure | Arithmetic | Points per person per week |
|---|---|---|
| Done on October 9, before the freeze-week fixes | 51 / 7 / 2 | 3.6 |
| Done at the freeze, October 11 | 63 / 7 / 2 | 4.5 |
| **Planning rate** (midpoint of 51 and 63 = 57 points) | 57 / 7 / 2 | **4.07** |

The re-estimate uses the planning rate. The reasons:

- The first week of Sprint 2 went to setup: four dev tasks with no story points (branch model, admin
  auth checks, the Invalid Identifier fix and the `W26_` rename) and the two user model tasks of
  1.0.1. Sprint 3 has no setup work, so the team can do more than 7.3.
- The last 12 points of Sprint 2 needed fix PRs on October 10 and 11 from one member. The team
  cannot plan on that again, so it does not use 4.5.

Re-estimate of a sprint = 4.07 × 7 members × working weeks. Sprint 4 runs for 3 calendar weeks,
but one of them is reading week, and the plan counts no story work in reading week.

| Sprint | Dates | Working weeks | Arithmetic | Re-estimate | Committed | Difference | Plan |
|---|---|---|---|---|---|---|---|
| Sprint 3 | Oct 14 to Oct 27 | 2 | 57 − 15 (scope change) | 42 | 68 | 26 over | Three stories removed; US 2.0.14 and five Sprint 4 stories added. US 3.0.4 removed on October 26. Capacity remains 57. |
| Sprint 4 | Oct 28 to Nov 17 | 2 (3 weeks minus reading week) | 4.07 × 7 × 2 | 57 | 39 | 18 free | Room for Sprint 3 carry-over. |
| Sprint 5 | Nov 18 to Dec 1 | 2 | 4.07 × 7 × 2 | 57 | 0 | 57 free | 30 points for new client stories. The other 27 are for deployment, final polish and fixes from the December field test. |

If the team also works in reading week, Sprint 4 can take 4.07 × 7 × 3 = 85 points. The plan does
not count on it.

**Sprint 3 scope change.** The three removed stories are not carry-over to Sprint 4.
Their tasks are excluded from the current plan. US 3.0.4 was also removed on October 26; it is not carry-over.

**Sprint 3 risk.** Sprint 3 needs 68 / 7 = 9.7 points per person. This is above the 9.0 of
Sprint 2 on October 11 and the 7.3 of October 9. The load is not even:

| Team | Members | Points | Per person |
|---|---|---|---|
| Red | 2 | 47 (1.0.6: 2, 2.0.1: 8, 2.0.9: 5, 2.0.12: 8, 2.0.13: 3, 3.0.3: 8, 4.0.2: 13) | 23.5 |
| Blue | 3 | 15 | 5.0 |
| Green | 2 | 6 | 3.0 |

Red has 23.5 points per person, which is 2.4 times the highest team result of Sprint 2 (Gamma, 9.7).
4.0.2 alone is 13 points. The four moved stories that remain add 21 points to Red, so the offline layer tasks of 4.0.2 are the first work to move back.

**Mitigation (proposed for the October 14 planning; the Product Owner decides).**

- If Red has not merged the map page ([#184](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/184)) and the GPX track table
  ([#185](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/185)), both due October 17, by October 20: the offline layer tasks of 4.0.2
  ([#207](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/207), [#209](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/209), [#213](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/213)) move to Sprint 4. This move would raise Sprint 4 from 39 to 52 points, which is within the capacity of 57. Blue (5.0 points
  per person) takes the GPX upload tasks of 2.0.9 ([#192](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/192), [#201](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/201)).
- If the offline work moves, Sprint 3 has 55 points and Sprint 4 has 52 points. The Product Owner must review the load.

The base map, the protected area boundaries, the map filters and the map search
([PR #159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159), [PR #161](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161), [PR #166](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/166), [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167), [PR #241](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241)) are already on `main`. 2.0.1 builds on
them. No Sprint 2 work carries over into Sprint 3.

### Sprint 1
**Due:** *September 29, 2026, 20:00 (GitHub release).*

Sprint 1 is documentation and discovery. There is an existing codebase inherited from two previous
teams, so a large part of this sprint is establishing what actually exists before committing to a
backlog.

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|User Stories|Documentation|Alissa, Saumya|Sep 26th|
|Project Requirements Doc|Documentation|Alissa|Sep 26th|
|Project Overview: exec summary, glossary, similar products|Documentation|Zanab|Sep 26th|
|UML Class and Sequence Diagrams|Documentation|Jayden|Sep 26th|
|High-Level Architecture Diagram|Documentation|Saumya|Sep 26th|
|Low-Fidelity Wireframes and UI Flow Diagram|Documentation|Abhinav|Sep 27th|
|Software Design Doc|Documentation|Abhinav|Sep 27th|
|Project Management Doc|Documentation|Saumya|Sep 28th|
|Team Canvas|Documentation|Everyone|Sep 19th (done)|
|Teamwork Doc|Documentation|Chris|Sep 19th (done)|
|Handover investigation of inherited codebase|Documentation|Saumya|Sep 21st (done)|
|Issues backlog and prioritisation|Documentation|Saumya|Sep 21st (done)|
|Meeting minutes for Fall 2026 to date|Documentation|Chris|Sep 26th|
|UI audit of the deployed application|Documentation|Aaron|Sep 22nd (done)|
|Mobile application user stories|Documentation|Chris|Sep 27th (dropped, not needed)|
|Confirm scope and open questions with client|Documentation|Saumya, Alissa|Sep 26th|

### Sprint 2
**Due:** *October 13, 2026, 20:00 (GitHub release). Code freeze October 11.*

All Sprint 2 work is finished and merged by **October 11** (code freeze), two days before the
deadline. Gamma makes the release on October 12. October 13 is spare time before the 20:00
deadline. Tasks are assigned to teams, not to people. The teams were chosen at random: each team got a share
of the work in proportion to its number of members, and the tasks in its ownership area. Each team
divides its tasks between its members.

**Teams:** Alpha (Saumya, Aaron), Beta (Abhinav, Alissa), Gamma (Zanab, Chris, Jayden). See
[Teamwork model](#teamwork-model).

**Scrum roles:** Scrum Master Aaron, Product Owner Chris. See [Scrum roles](#scrum-roles).

The security stories were removed from the story list on September 25, so the access control work
stays in the task list below until the team decides if it returns as stories.

#### Sprint 2 release (October 13, 2026)

- **Merges.** PRs #253 to #262 and #276 merged into `sprint-2`. [#284](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/284) merged `sprint-2`
  into `main` on October 13 (squash commit `ceb5188`). [#285](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/285) merged `main` into
  `release`. The branches `chore/sprint-2-integration`, `sprint-2` and `test/fix-test-case-error`
  no longer exist.
- **Release.** The GitHub release
  [`sprint-2`](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/releases/tag/sprint-2) was
  published on October 13. The release notes issue ([#97](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97)) and the code freeze issue
  ([#96](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/96)) are closed.
- **Checks.** GitHub Actions cannot run, because the organisation's billing failed, so #284 and #285
  were merged with an admin bypass. The CI job list was run locally on `main` at `ceb5188` and
  passed: `tsc --noEmit`, `npm run test:ci` (111 suites, 1524 tests passed, 5 skipped, 0 failed),
  `npm run build`, ESLint with `--max-warnings 0`, `.githooks/test-hooks.sh`,
  `npm run diagrams:check` and `mkdocs build --clean`.
- **Follow-ups.** The Sprint 2 rubric follow-ups (#263, #265 to #270 and #272 to #274) are closed.
  Each was done by a PR that merged into `ci/lint-clean-and-blocking` and reached `main` through
  [#262](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/262) and [#284](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/284); see the table under
  [Other issues in the Sprint 2 milestone](#other-issues-in-the-sprint-2-milestone). No Sprint 2
  work carried over to Sprint 3. The only open Sprint 2 issue is the demo, review and
  retrospective ([#98](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/98)).

#### Sprint 2 status (as of October 11, 2026)

This status was read from `main` at `9009d0d` on October 11, the code freeze. The release was made
on October 13, see [Sprint 2 release](#sprint-2-release-october-13-2026). A story or task is **Done** when its PR is merged on `main` and the merged work
covers each AT of the story. The test of each AT is in the
[Traceability Matrix](traceability-matrix.md). A gap in the tests of a Done story is listed below
the table. It does not change the status.

**Tests.** A full local Jest run on `9009d0d` passes: 103 suites and 1367 tests. CI did not run on
the commits from `e39cc8f` (PR #243) to `9009d0d`, because GitHub did not start the jobs: the
account's Actions payments failed. The last CI run that ran the tests was on `2cf69c6` on
October 10 (96 suites, 1235 tests, all passed). CI has not run since. The local checks of the
release are under [Sprint 2 release](#sprint-2-release-october-13-2026).

**Sprint 2 fixes after the freeze.** The fixes of Alpha, Beta and Gamma, the caller checks on the
report read actions (#251, fixed by [PR #259](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/259)) and the CI changes were merged into
`sprint-2` as PRs #253 to #262 and #276. They change no story status. They are on `main` since
[#284](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/284). On `main` at `ceb5188`, local runs give `tsc` 0 errors, ESLint 0 problems,
`npm run build` passing, and `npm run test:ci` 111 suites passed (1 skipped) and 1524 tests passed
(5 skipped, 0 failed), with coverage of statements 85.06%, branches 74%, functions 78.61% and lines
87.56%. These are local results: GitHub Actions has not run since October 10.

**Quality gates** on `main` ([Contributing](contributing.md#ci)): lint fails the
`webapp-tests` job on any problem (`--max-warnings 0`), `npm run test:ci` fails below the
coverage thresholds in `webapp/jest.config.ts`, `e2e.yaml` runs seven Cypress specs against a
local Supabase on PRs into `main` and `release`, and the PR checks, the reviewer
gate and the diagrams workflow also run on PRs into `sprint-*`.

| Status | Stories | Points |
|---|---|---|
| Done | 1.0.1, 1.0.2, 2.0.2, 2.0.3, 2.0.4, 2.0.5, 2.0.6, 2.0.10, 3.0.2, 4.0.6, 5.0.4, 7.0.1, 7.0.5, 7.0.6, 7.0.7, 7.0.8 | 63 |
| Partial | - | 0 |
| Not started | - | 0 |
| **Total** | **16 stories** | **63** |

- **Done.** 63 of the 63 committed points (16 of 16 stories), up from 51 on October 9 and 30 on
  October 7. The last three stories were finished on October 10 and 11:
    - 2.0.6 AT3: the map search lists the matching protected areas, and picking one centres the map
      on it with `fitBounds` ([PR #241](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241), October 10). Tests: `SiteMap.test.tsx:442,455`
      and `Sites.test.tsx:775`.
    - 5.0.4 AT3: the terms page has the user menu with Logout ([PR #238](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238), October 11).
      `/api-docs` is the Swagger reference for developers. It is exempt, as the comment in
      `webapp/app/api-docs/page.tsx` says. All other signed-in pages have a sign-out control.
    - 7.0.6: the 50-site cap was removed before Fall 2026, in commit `dde6ccb` (July 22, 2026, by the
      Winter 2026 team). [PR #237](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/237) (October 10) makes the export read past the
      PostgREST limit of 1000 rows and adds tests for AT1 (a 60-report and a 51-report export, a
      60-site request), AT4 (a failed export of 51 reports writes only to the job table) and
      paging. AT3 was already tested. [PR #258](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/258) adds AT2 (51 reports have the same
      answers in the export as on the site page) and a 60-report steward refusal for AT3.
- **Work merged on October 10 and 11** ([PR #234](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/234) to [PR #250](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/250)). Besides the three stories above:
    - CI runs the build, the type check and lint ([PR #235](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/235)). At the freeze, lint
      reported its errors on `main` but did not fail the job. [PR #262](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/262) makes lint blocking
      and [PR #260](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/260) adds the coverage gate (see **Quality gates** above).
    - Fixes: gallery reads and a safe image delete ([PR #234](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/234)), drafts that restore
      reliably ([PR #236](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/236), #87), profile save errors, approved-only reads and steward search
      ([PR #238](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238)), archived and inactive sites ([PR #239](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/239)), auth gaps in the middleware, the OAuth
      callback and the admin layout ([PR #240](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/240)), caller checks on the report write actions
      ([PR #242](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/242)) and a test mock ([PR #249](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/249)).
    - Tests labelled with their stories and the AT gaps filled ([PR #243](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/243)).
    - Docs: meeting minutes and contributions ([PR #244](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/244)), interfaces and design
      decisions ([PR #245](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/245)), the release process and the production migration runbook
      ([PR #246](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/246)), diagrams ([PR #247](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/247)), this status ([PR #248](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/248)) and the October 9
      client slides ([PR #250](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/250)).
    - Manual steps in production: PR #234 and PR #238 each add a migration that a person runs
      in production. PR #240 asks for the passwords of the three Cypress test accounts to be
      rotated. See [Production database migrations](contributing.md#production-database-migrations).
- **Test gaps in Done stories.** On `main` at `9009d0d`, one AT had no test (2.0.2 AT5) and 15
  were tested only in part. The fixes after the freeze add tests for 2.0.2 AT5, 2.0.5 AT1, AT2 and
  AT4, 2.0.6 AT2 and 7.0.6 AT2. On `main` at `ceb5188` every AT has a test, and 5 ATs are tested
  only in part (2.0.3 AT4, 2.0.4 AT3, 7.0.1 AT3, 7.0.5 AT1 and AT3), for example 7.0.5 AT1: no test
  renders a report after an image delete. The list is in the
  [coverage summary](traceability-matrix.md#coverage-summary).
- **Known limit of 2.0.6.** The map draws protected areas. [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167) links a site to its area
  with a new column that the migration does not fill. A site shows on the map only when an Admin
  links it. Sprint 3 task [#181](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/181) fills the link from the KML.
- **Still open.** The code freeze issue ([#96](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/96)) and the release issue ([#97](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97)) are
  closed. The demo, review and retrospective ([#98](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/98), October 14) are ahead.

**Issue state does not match the evidence.** This list is a report only. The owner team corrects
its issues.

- [#66](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/66) (7.0.6) was closed on October 7 and [#90](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/90) on October 2, before the paging and the tests
  of [PR #237](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/237) merged. Neither issue names a PR. Owner: Gamma.
- [#60](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/60) (2.0.6) and its task [#85](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/85) were closed on October 9, before AT3 merged in
  [PR #241](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241). [#64](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/64) (5.0.4) was closed on October 4, before [PR #158](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/158) and
  [PR #238](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238). The work is now merged, so the closed state is correct.
- Six task issues were closed as duplicates, but their work merged in other PRs. The close reason does not name the PR:
  [#79](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/79) ([PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153), [PR #162](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/162), [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167)), [#81](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/81) ([PR #160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160)), [#82](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/82) ([PR #150](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150)), [#86](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/86) ([PR #145](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/145)), [#92](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/92) ([PR #155](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/155)) and
  [#93](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/93) ([PR #165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165)). Owners: Gamma ([#79](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/79), [#81](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/81), [#86](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/86), [#92](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/92), [#93](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/93)) and Beta ([#82](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/82)).
- The map task issues [#83](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/83), [#84](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/84) and [#85](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/85) were closed with no closing PR. Their work merged in [PR #159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159), [PR #161](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161), [PR #166](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/166),
  [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167) and [PR #241](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241). Owner: Beta.
- [#95](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/95) (open a PR for each task) was closed on September 29, before the work started.
- [#19](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/19), [#20](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/20) and [#23](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/23) are closed as completed, but their last comment says that the work
  is not done (see [Other issues in the Sprint 2 milestone](#other-issues-in-the-sprint-2-milestone)).

#### Sprint 1 TA feedback and revisions

The rows below are the TA's advice in the September 23 lab (see
[Meeting Minutes](meeting-minutes.md), Meeting #3) and in the week 5 lab notes of September 30
(`docs/meetings/week5/Meeting_Notes.md`, Meeting #6). Each row shows what the team did with the
advice. **Done** means the change is on `main` or in the docs. **Partial** means that part of the
advice is not applied yet, and the row names the plan for the rest. **Planned** means that the
work has an owner and a date and has not happened yet. **Deferred** means that the work moves to a
later sprint, for the reason given. **Decided** means that the team chose not to follow the
advice, for the reason given. **Not verifiable** means that no source records whether the team
followed the advice. The TA (Alex) is CC'd on all
client emails, so he sees the client's answers directly.

| TA point | Date | Action taken | Evidence | Status |
|---|---|---|---|---|
| Remove "As a Developer" stories. | Sep 23 | The story set has no developer stories. DevOps and release work is in the task tables as Dev Task rows. The September 19 question to the TA, whether DevOps work can be a story, has no answer in the minutes. | [User Stories](user-stories.md); task tables below | Done |
| Merge small stories and think at a higher level. | Sep 23 | Stories are grouped into seven feature areas and tied to charter projects. Two 1-point stories stay separate (2.0.10 and 4.0.6): each is its own item in charter project 1. | [Story map](#story-map); [User Stories](user-stories.md) | Decided: 2.0.10 and 4.0.6 stay separate, because each is its own charter item. Both are done. |
| Write stories that touch Frank's pain points, well developed and exciting, not general. | Sep 23 | The team presented its stories to Frank on September 25. Frank asked for each story to be mapped to the charter projects on the SAPAA website. Each of the 40 stories now names its charter project. | [User Stories](user-stories.md); [Meeting Minutes](meeting-minutes.md) (September 25) | Done |
| Frank may want geobounds for sites on a map. | Sep 23 | An Admin picks the boundary of a new site from the Alberta government KML ([PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153), [PR #162](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/162)), and the map draws the protected area boundaries ([PR #161](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161)). Linking each existing site to its boundary is US 6.0.1 in Sprint 3. | 2.0.2 AT1 and AT6; [#181](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/181) | Partial. Plan: Blue (Aaron, Zanab, Abhinav) links each existing site to its boundary in [#181](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/181), due October 16. |
| Pitch the mobile app as a PWA, and check offline use (Android supports offline PWAs, iOS needs a check). | Sep 23 | Not pitched. On September 25 Frank said that he needs offline capability on the web app, and that offline is not in a charter project. The team planned offline map layers for the web app (US 4.0.2, Sprint 3) and no PWA story. | [Meeting Minutes](meeting-minutes.md) (September 25); US 4.0.2 | Decided: offline is built as web map layers, because Frank asked for offline on the web app |
| Until Friday (September 25), write nothing new. | Sep 23 | Meeting #3 records the advice, but no source records whether the team stopped other writing until September 25. Meeting #4 does not mention it, and the git history cannot show what was written outside the repository. | - | Not verifiable: nothing recorded whether other writing stopped |
| The Sprint 1 deadline is Tuesday evening and must be a GitHub release. | Sep 23 | The GitHub release "Sprint 1 Release" (tag `sprint-1`) was published on September 29 at 17:15 MDT. Each later sprint also ends with a GitHub release built from `main`. | [Sprint process](#sprint-process) | Done |
| Use the GitHub project board for the filtered issues. | Sep 23 | Sprint 2 stories and tasks are issues in the Sprint 2 milestone, on the SAPAA project board (for example [#54](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/54)). The Sprint 3 issues are on the board too (for example [#169](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/169)). | [Sprint 2](#sprint-2) | Done |
| Prepare a presentation of about 15 minutes with the most interesting stories, and present it to Frank on Friday. | Sep 23 | The team presented its stories and plan to Frank on September 25. (This row merges two rows that both recorded this presentation.) | [Meeting Minutes](meeting-minutes.md) (September 25) | Done |
| In standups, teammates should know what the others are doing. | Sep 23 | The teamwork model has an offline sync meeting and a rule to keep the team informed. The Sep 23 minutes record that the TA (Alex) will run an exercise where each member describes another member's work. They do not record that it took place. Plan: at the October 14 lab, Aaron (Sprint 2 Scrum Master) asks Alex to run the exercise, and the minute-taker records it in Meeting #10. | [Teamwork model](#teamwork-model); [Meeting Minutes](meeting-minutes.md) (Meeting #10) | Planned: October 14 lab, owner Aaron |
| Ask Frank which behaviours the gamification should reward, and find metrics for them. Pitch a bounty board that gives more points for chosen sites. | Sep 23, Sep 30 | On October 9 the team showed Frank a gamification mock-up: top contributor, counties visited, variety of site types and subtypes, natural regions, a time dimension and the first reporter of a site. Frank said the direction is right. The bounty board is deferred. It was not raised with Frank on October 2 or October 9. On October 2 Frank asked for simple gamification built from data that already exists (Meeting #7). On October 9, about the mock-up metrics, he said: "use the data that you have". A bounty board needs new data, a points value for each chosen site, which is the to-visit priority of 2.0.12 in Sprint 4. Plan: Aaron (Sprint 3 Product Owner) asks Frank at the October 16 client meeting whether the 2.0.12 priority should give more activity points (1.0.5), and records the answer in the minutes. | `docs/meetings/week6/2026_10_09_meeting_frank.txt`; US 1.0.4 (Sprint 3), US 1.0.5 and US 2.0.12 (Sprint 4) | Partial. Bounty board deferred to Sprint 4 (2.0.12, 1.0.5); question to Frank on October 16, owner Aaron |
| Do not delete site data. Mark the site as deleted and hide it. | Sep 30 | A site can be archived (hidden, and it can be restored). An archived site can also be deleted for good. Frank asked for both levels on October 2 and approved them on October 9. | [PR #160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160); `docs/meetings/week5/2026_10_02 _meeting_Frank.txt`; `docs/meetings/week6/2026_10_09_meeting_frank.txt` | Done |
| Generate the UML from the code base. | Sep 30 | A diagram generator builds the diagrams from the migrations and the TypeScript, and updates them on every PR into `main`, `release` or `sprint-*`. A check that fails when a diagram is out of date exists: `npm run diagrams:check` (`node tools/diagrams/src/cli.mjs check`). The workflow `diagram-svg-check.yaml` runs the diagram tests and `check --svg-only` on every PR into `main`, `release` or `sprint-*`. It checks source and SVG hashes from the last successful render (Sprint 3 task [#196](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/196)). | [PR #157](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/157); [Contributing](contributing.md#diagrams) | Implementation in [PR #305](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/305); pending CI and review. Task [#196](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/196) stays open until the check is verified. |
| Build the map in layers: a static layer of polygons from Alberta open data, a dynamic layer of GPX tracks, and a data layer. | Sep 30 | The team chose OpenStreetMap data because Google Maps does not allow caching tiles offline. This reason is the team's own research: the Sep 30 notes record it, but do not say who raised it. The base map uses MapLibre GL with a Protomaps basemap (OpenStreetMap data). The protected area boundaries are imported and drawn. The GPX track layer is planned for Sprint 3 (2.0.9 and 2.0.1). No story covers the data layer yet. It was a Sprint 4 candidate, but the new access-request stories now leave Sprint 4 at 65 points, 8 points above its re-estimate. No source records which data Frank wants this layer to show. Plan: Aaron (Sprint 3 Product Owner) asks Frank which data the layer shows at the October 16 client meeting. Zanab (Sprint 4 Product Owner) brings it to Sprint 4 planning (October 28 lab), where adding it requires other work to move out. | [PR #159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159); [PR #137](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137); [PR #152](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152); [PR #161](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161); [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167) | Partial. Data layer: Sprint 4 candidate with no free capacity, question to Frank on October 16 (Aaron), story proposed on October 28 (Zanab) |
| Ambiguity in a story should not change its points. A story is not complete until its details are clear. | Sep 30 | The plan lists unclear stories as open conflicts and marks MoSCoW as provisional (issue [#23](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/23)). No change was made in Sprint 2: the points of the Sprint 2 stories are the same as in the Sprint 1 release (tag `sprint-1`, September 29), which came before this advice. The Sprint 3 plan now has an "open questions before pointing" step, owned by Aaron (Sprint 3 Product Owner) from the October 14 planning. | [Open questions before pointing](#open-questions-before-pointing) | Planned: October 14 planning, owner Aaron |

#### User stories

|User Story|Story points|Status|
|:---:|:---:|:---:|
|US 1.0.1 - Add User Profiles|5|Done ([#54](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/54); [PR #131](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131), [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138), [PR #141](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/141), [PR #142](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/142))|
|US 1.0.2 - Allow Editing Own Profile|3|Done ([#55](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/55); [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138), [PR #151](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151))|
|US 2.0.2 - Allow Admins to Add New Sites|3|Done ([#56](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/56); [PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153), [PR #162](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/162), [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167))|
|US 2.0.3 - Deactivate and Reactivate a Site|3|Done ([#57](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/57); [PR #150](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150))|
|US 2.0.4 - Delete a Site|8|Done ([#58](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/58); [PR #160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160))|
|US 2.0.5 - Update a Site|5|Done ([#59](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/59); [PR #163](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/163))|
|US 2.0.6 - Search and Filter Sites by County on the Map|5|Done ([#60](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/60); [PR #159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159), [PR #161](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161), [PR #166](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/166), [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167); data in [PR #132](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/132), [PR #137](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137), [PR #152](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152); AT3 in [PR #241](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241))|
|US 2.0.10 - Add links to Site Page|1|Done ([#61](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/61); [PR #145](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/145))|
|US 3.0.2 - Steward Designation|5|Done ([#62](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/62); [PR #133](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/133), [PR #139](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/139), [PR #140](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/140))|
|US 4.0.6 - Demote Photo Identifier to optional field|1|Done ([#63](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/63); [PR #147](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/147))|
|US 5.0.4 - Sign Out Properly|2|Done ([#64](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/64); [PR #120](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/120), [PR #158](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/158), [PR #238](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238))|
|US 7.0.1 - Let Stewards Export Their Own Reports|2|Done ([#68](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/68); [PR #155](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/155))|
|US 7.0.5 - Delete an Image and Clean Up After It|5|Done ([#65](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/65); [PR #148](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148))|
|US 7.0.6 - Export More Than 50 Site Inspection Reports|5|Done ([#66](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/66); cap removed in `dde6ccb` before Fall 2026; paging and tests in [PR #237](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/237))|
|US 7.0.7 - Hide Fields on a SIR Before Export|5|Done ([#67](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/67); [PR #146](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/146))|
|US 7.0.8 - Delete a Site Inspection Report|5|Done ([#69](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/69); [PR #165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165))|

**Committed:** 63 points. **Done:** 63 points (October 11).

#### Tasks

|Task|Related US|Assignee|Due|Status|
|:---:|:---:|:---:|:---:|:---:|
|Set up development, release, and feature branches (issue title: "Set up prod branch")|Dev Task|Gamma (Zanab, Chris, Jayden)|Oct 4th|Done ([#70](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/70); [PR #125](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/125))|
|Improve authentication checks for admin routes|Dev Task|Beta (Abhinav, Alissa)|Oct 4th|Done ([#71](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/71); [PR #144](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/144))|
|Investigate and fix Invalid Identifier Supabase error|Dev Task|Alpha (Saumya, Aaron)|Oct 4th|Done ([#72](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/72); [PR #128](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/128))|
|Update db names to not include "W26" as prefix|Dev Task|Alpha (Saumya, Aaron)|Oct 4th|Done ([#73](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/73); [PR #129](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129))|
|Create user model that supports profiles, steward assignments, and gamified stats|US 1.0.1|Alpha (Saumya, Aaron)|Oct 4th|Done ([#74](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/74); [PR #116](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/116), [PR #130](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/130))|
|Migrate user model|US 1.0.1|Alpha (Saumya, Aaron)|Oct 5th|Done ([#75](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/75); [PR #131](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131))|
|Profile page|US 1.0.1|Alpha (Saumya, Aaron)|Oct 6th|Done ([#76](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/76); [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138), [PR #141](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/141), [PR #142](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/142))|
|Add Steward to site page and link to their profile|US 3.0.2|Alpha (Saumya, Aaron)|Oct 7th|Done ([#77](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/77); [PR #133](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/133), [PR #139](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/139), [PR #140](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/140))|
|Edit profile/user info page and functionality|US 1.0.2|Alpha (Saumya, Aaron)|Oct 7th|Done ([#78](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/78); [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138), [PR #151](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151))|
|Add new site page and functionality|US 2.0.2|Gamma (Zanab, Chris, Jayden)|Oct 5th|Done ([#79](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/79); [PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153), [PR #162](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/162), [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167))|
|Edit existing site page fields|US 2.0.5|Gamma (Zanab, Chris, Jayden)|Oct 6th|Done ([#80](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/80); [PR #163](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/163))|
|Delete site button and confirmation|US 2.0.4|Gamma (Zanab, Chris, Jayden)|Oct 6th|Done ([#81](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/81); [PR #160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160))|
|Deactivate/Activate button and confirmation|US 2.0.3|Beta (Abhinav, Alissa)|Oct 6th|Done ([#82](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/82); [PR #150](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150))|
|Set up map|US 2.0.6|Beta (Abhinav, Alissa)|Oct 7th|Done ([#83](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/83); [PR #159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159))|
|Add sites to the map|US 2.0.6|Beta (Abhinav, Alissa)|Oct 6th|Done ([#84](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/84); [PR #161](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161), [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167); draws protected area boundaries, and a site shows only when linked to an area)|
|Add Search and Filtering on Map view|US 2.0.6|Beta (Abhinav, Alissa)|Oct 7th|Done ([#85](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/85); [PR #166](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/166), [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167), [PR #241](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241))|
|Add links to site page|US 2.0.10|Gamma (Zanab, Chris, Jayden)|Oct 7th|Done ([#86](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/86); [PR #145](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/145))|
|Fix site inspection page resetting current page when app is exited temporarily|US 4.0.6|Beta (Abhinav, Alissa)|Oct 6th|Done ([#87](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87); [PR #164](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/164))|
|Change Photo Identifier field on SIR to not required|US 4.0.6|Beta (Abhinav, Alissa)|Oct 5th|Done ([#88](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/88); [PR #147](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/147))|
|Add a delete option on images|US 7.0.5|Beta (Abhinav, Alissa)|Oct 7th|Done ([#89](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/89); [PR #148](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148))|
|Increase export limit to over 50|US 7.0.6|Gamma (Zanab, Chris, Jayden)|Oct 9th|Done ([#90](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/90); `dde6ccb`, [PR #237](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/237))|
|Screen to select hidden fields on SIR before export|US 7.0.7|Beta (Abhinav, Alissa)|Oct 9th|Done ([#91](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/91); [PR #146](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/146))|
|Grant Steward permission to export PDFs|US 7.0.1|Gamma (Zanab, Chris, Jayden)|Oct 7th|Done ([#92](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/92); [PR #155](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/155))|
|Delete site inspection report button and confirmation|US 7.0.8|Gamma (Zanab, Chris, Jayden)|Oct 7th|Done ([#93](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/93); [PR #165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165))|
|Fix logging out functionality outside the home page|US 5.0.4|Alpha (Saumya, Aaron)|Oct 5th|Done ([#94](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/94); [PR #120](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/120), [PR #158](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/158), [PR #238](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238))|
|Open a PR for each task and request 2 reviews|All US|Everyone|Oct 10th|Done ([#95](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/95), closed on September 29, before the work started. Each story and task has a merged PR)|
|Code freeze: all Sprint 2 PRs reviewed and merged|All US|Everyone|Oct 11th|Done on `main` at `9009d0d`; the issue is closed ([#96](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/96))|
|Write the release notes and make the Sprint 2 release on GitHub|Release|Gamma (Zanab, Chris, Jayden)|Oct 12th|Done ([#97](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97) is closed; [#284](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/284), [#285](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/285) and the [`sprint-2` release](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/releases/tag/sprint-2), published on October 13)|
|Sprint 2 demo, review and retrospective|All US|Everyone|Oct 14th|Not started ([#98](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/98))|

#### Other issues in the Sprint 2 milestone

The Sprint 2 milestone has 16 more issues. They are not in the task table because they are not
Sprint 2 stories or tasks: one is a removed story, four are Sprint 1 documentation checks that
were moved to Sprint 2, one ([#252](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/252))
tracks the fixes from the Sprint 2 rubric review, and 10 (#263, #265 to #270 and #272 to #274) are
the Sprint 2 rubric follow-ups. All 16 are closed. Issue [#264](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/264) (minute the October 14
lab) is in the Sprint 3 milestone, because it is future work.

| Issue | Title | State | Why it is not a Sprint 2 task |
|---|---|---|---|
| [#5](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/5) | US 3.0.8 - Separate app access from admin access | Closed as not planned (September 29) | The security stories were removed on September 25. The work continued in task [#71](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/71) and in [PR #240](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/240) (the approval gate in the middleware). |
| [#18](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/18) | Belbin roles contradict themselves in three places | Closed (September 29, PR #99) | Sprint 1 documentation. [Teamwork](teamwork.md#belbin-roles) now builds the role lists from the table. |
| [#19](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/19) | Add the September 19 transcript to the repo | Closed (October 9), no closing note | Sprint 1 documentation. The transcript is not in the repository: `docs/meetings/week3/week3.txt` is the September 18 handover call. |
| [#20](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/20) | Sanity check the four findings the whole plan rests on | Closed (September 29) | Sprint 1 discovery. The last comment says that no result is recorded for the four claims. |
| [#23](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/23) | Get Frank to confirm priorities before we commit to the MoSCoW | Closed (September 29) | Client question. The last comment says that the MoSCoW order is not confirmed, so the MoSCoW stays provisional. |
| [#252](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/252) | Close the Sprint 2 rubric review gaps | Closed | Tracks the fix PRs into `sprint-2` from the Sprint 2 rubric review. They change no story status. |
| [#263](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/263) | Merge the Sprint 2 PRs through sprint-2 and close out the sprint | Closed | Sprint 2 rubric follow-up. |
| [#265](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/265) | Give every open TA feedback row a plan or a reason | Closed. Done by [PR #277](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/277). | Sprint 2 rubric follow-up. |
| [#266](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/266) | Re-estimate velocity per sprint and fix the planning mismatches | Closed. Done by [PR #277](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/277). | Sprint 2 rubric follow-up. |
| [#267](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/267) | Remove leftover files, placeholder config and debug logs | Closed. Done by [PR #278](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/278). | Sprint 2 rubric follow-up. |
| [#268](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/268) | Move the PDF-only queries out of the use server file and page all-reports | Closed. Done by [PR #279](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/279). | Sprint 2 rubric follow-up. |
| [#269](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/269) | Run the Cypress specs locally and add E2E specs for 2.0.2 and 7.0.8 | Closed. Done by [PR #282](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/282). | Sprint 2 rubric follow-up. |
| [#270](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/270) | Fix the wrong traceability matrix rows and add missing failure tests | Closed. Done by [PR #281](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/281). | Sprint 2 rubric follow-up. |
| [#272](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/272) | Test the database access rules against the local Supabase | Closed. Done by [PR #282](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/282). | Sprint 2 rubric follow-up. |
| [#273](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/273) | Stop the form editor reporting saved when option writes fail | Closed. Done by [PR #280](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/280). | Sprint 2 rubric follow-up. |
| [#274](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/274) | Add E2E specs for 2.0.3 and 2.0.6 and a 2.0.3 AT3 failure test | Closed. Done by [PR #282](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/282). | Sprint 2 rubric follow-up. |

#### Sprint 2 task details

Each task is done when its PR is merged on `main` and the merged work covers the listed acceptance
tests (AT) of its story. The acceptance tests are in [User Stories](user-stories.md). The test of
each AT is in the [Traceability Matrix](traceability-matrix.md).

**Setup and foundations (due October 4 to 5)**

- **Set up development, release, and feature branches**. Assignee: Gamma (Zanab, Chris, Jayden).
  Make the branch model for the team: a development branch, a release branch, and feature branches
  from development. Add the branch rules on GitHub and write the model in
  [Contributing](contributing.md). Done when a feature PR can merge into development and development
  can merge into the release branch. Result: [PR #125](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/125) kept `main` as the development branch and
  added `release`. From Sprint 3, a `sprint-N` branch sits between the feature branches and `main`
  (see [Sprint process](#sprint-process)).
- **Improve authentication checks for admin routes**. Assignee: Beta (Abhinav, Alissa). Make sure
  that each admin page and admin server action checks on the server that the caller is an Admin.
  Done when a Steward who calls an admin route directly gets a refusal. This supports 2.0.2 AT4,
  2.0.5 AT2, 3.0.2 AT4, 7.0.5 AT2, 7.0.6 AT3, 7.0.7 AT4 and 7.0.8 AT4.
- **Investigate and fix Invalid Identifier Supabase error**. Assignee: Alpha (Saumya, Aaron). Find
  the cause of the error, fix it, and write the cause in the PR. Done when the error does not occur
  again.
- **Update db names to not include "W26" as prefix**. Assignee: Alpha (Saumya, Aaron). Rename the
  database objects with a migration, and change each query that uses the old names. Done when the
  app works with the new names and no code uses the "W26" names.
- **Create user model that supports profiles, steward assignments, and gamified stats**. Assignee:
  Alpha (Saumya, Aaron). Design the user data: name, email, skills, focus areas, contact info,
  inspection count, the sites that the user stewards, and fields for later activity points. Done
  when the model is reviewed by the team, because 1.0.1, 1.0.2 and 3.0.2 use it.
- **Migrate user model**. Assignee: Alpha (Saumya, Aaron). Write the migration for the new user
  model and move the data of the current users. Done when all current users have a profile record
  and no data is lost.

**Profiles (US 1.0.1, 1.0.2, 3.0.2)**

- **Profile page** (US 1.0.1). Assignee: Alpha (Saumya, Aaron). Show name, skills, focus area,
  contact info and inspection count. Open it from the main menu and from an inspection on a site
  page, with a way back. Done when 1.0.1 AT1 to AT5 pass.
- **Edit profile/user info page and functionality** (US 1.0.2). Assignee: Alpha (Saumya, Aaron). A
  user edits only their own profile. Name and email are required. Skills and focus areas can be
  added. Done when 1.0.2 AT1 to AT6 pass, including the server refusal for another user's profile.
- **Add Steward to site page and link to their profile** (US 3.0.2). Assignee: Alpha (Saumya,
  Aaron). An Admin searches for a steward and assigns or replaces the steward of a site. The site
  page and the steward's profile both show the assignment. Done when 3.0.2 AT1 to AT4 pass.

**Sites (US 2.0.2, 2.0.3, 2.0.4, 2.0.5, 2.0.10)**

- **Add new site page and functionality** (US 2.0.2). Assignee: Gamma (Zanab, Chris, Jayden). An
  Admin makes a site, selects its boundary and gets a warning for a possible duplicate name.
  Required fields are checked. Done when 2.0.2 AT1 to AT6 pass.
- **Edit existing site page fields** (US 2.0.5). Assignee: Gamma (Zanab, Chris, Jayden). An Admin
  enters edit mode, sees which fields are shown or hidden, and saves. Other users cannot enter edit
  mode. Done when 2.0.5 AT1 to AT4 pass.
- **Delete site button and confirmation** (US 2.0.4). Assignee: Gamma (Zanab, Chris, Jayden). The
  Admin confirms the delete and sees how many inspections and images the delete affects. The
  site is archived first, and an Admin can restore it or delete it for good from the archive. Deleting
  for good removes the site and its steward link. Its reports, answers and photos stay in the
  database, detached from the site (`site_id` set to null) ([PR #160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160)). Done when 2.0.4 AT1 to AT4
  pass.
- **Deactivate/Activate button and confirmation** (US 2.0.3). Assignee: Beta (Abhinav, Alissa). An
  inactive site is not in site pickers or search, and its inspections can still be viewed. New sites
  are active. Done when 2.0.3 AT1 to AT5 pass.
- **Add links to site page** (US 2.0.10). Assignee: Gamma (Zanab, Chris, Jayden). Show short links
  to the SAPAA website and iNaturalist that open in a new window. Done when 2.0.10 AT1 to AT3 pass.

**Map (US 2.0.6)**

- **Set up map**. Assignee: Beta (Abhinav, Alissa). Add the map view to the web app. Done when the
  map loads for a signed-in user.
- **Add sites to the map**. Assignee: Beta (Abhinav, Alissa). Show all active sites on the map. Done
  when each active site with a location is shown.
- **Add Search and Filtering on Map view**. Assignee: Beta (Abhinav, Alissa). Filter sites by
  county, clear the filter, and search by name to centre the map on a site. Done when 2.0.6 AT1 to
  AT3 pass.

**Site inspection reports (US 4.0.6, 7.0.1, 7.0.5, 7.0.6, 7.0.7, 7.0.8)**

- **Change Photo Identifier field on SIR to not required** (US 4.0.6). Assignee: Beta (Abhinav,
  Alissa). Remove the required rule and the "required" note. Done when 4.0.6 AT1 and AT2 pass.
- **Fix site inspection page resetting current page when app is exited temporarily** (US 4.0.6).
  Assignee: Beta (Abhinav, Alissa). Keep the current page of the form when the user leaves the app
  and comes back. Done when the user returns to the same page with their answers.
- **Add a delete option on images** (US 7.0.5). Assignee: Beta (Abhinav, Alissa). An Admin deletes
  an image, and the file is removed from S3. Other users see no delete control and the server
  refuses them. Done when 7.0.5 AT1 to AT5 pass.
- **Increase export limit to over 50** (US 7.0.6). Assignee: Gamma (Zanab, Chris, Jayden). Find the
  cause of the limit of 50 and remove it. Only Admins can export in bulk. Done when 7.0.6 AT1 to AT4
  pass.
- **Screen to select hidden fields on SIR before export** (US 7.0.7). Assignee: Beta (Abhinav,
  Alissa). An Admin selects fields to leave out of the export. The stored answers do not change.
  Done when 7.0.7 AT1 to AT5 pass.
- **Grant Steward permission to export PDFs** (US 7.0.1). Assignee: Gamma (Zanab, Chris, Jayden). A
  Steward exports a PDF of their own SIR only. Done when 7.0.1 AT1 to AT3 pass.
- **Delete site inspection report button and confirmation** (US 7.0.8). Assignee: Gamma (Zanab,
  Chris, Jayden). An Admin confirms, then the SIR and its images are removed from the site and
  report lists. Stewards are refused. Done when 7.0.8 AT1 to AT5 pass.

**Accounts (US 5.0.4)**

- **Fix logging out functionality outside the home page** (US 5.0.4). Assignee: Alpha (Saumya,
  Aaron). Put sign-out on every page. After sign-out, the Back button and a new visit show the
  sign-in page. Done when 5.0.4 AT1 to AT3 pass.

**Review and release**

- **Open a PR for each task and request 2 reviews** (everyone, October 10).
- **Code freeze** (everyone, October 11). All Sprint 2 PRs are reviewed and merged. Work that is not
  merged is not assumed to carry over. The Product Owner places it at the October 14 planning.
- **Write the release notes and make the Sprint 2 release on GitHub** (October 12). Assignee:
  Gamma (Zanab, Chris, Jayden). The release lists the finished stories and tasks. The deadline is
  October 13 at 20:00.
- **Sprint 2 demo, review and retrospective** (everyone, October 14 lab). The Sprint 2 peer-review
  form is due October 14 at 23:59.

### Sprint 3
**Due:** *October 27, 2026, 20:00 (GitHub release). Code freeze October 25.*

#### User stories

|User Story|Story points|Issue or PR|
|:---:|:---:|:---:|
|US 1.0.3 - Show history of Site Inspections on a Steward's Profile|2|[#169](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/169)|
|US 1.0.4 - Aggregate User Activity and Contributions on a user's profile|2|[#170](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/170)|
|US 1.0.6 - Select and Edit Skills and Focus Areas|2|[PR #308](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/308)|
|US 2.0.1 - View Sites and Past Visits on an Interactive Map|8|[#171](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/171)|
|US 2.0.8 - View a Site's Details From the Map|3|[#172](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/172)|
|US 2.0.9 - Upload a GPX Track of a Site Visit|5|[#173](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/173)|
|US 2.0.12 - Score a Site for To-Visit Priority|8|[PR #307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307)|
|US 2.0.13 - Flag Site Points That Are a Year Old|3|[PR #307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307)|
|US 2.0.14 - Color Map Sites by Type|2|[PR #313](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/313)|
|US 3.0.3 - Export all digital files from SIR-SAPAA|8|[PR #309](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/309)|
|US 4.0.2 - Offline and Online Map Layers|13|[#175](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/175)|
|US 4.0.4 - Edit My Previous Inspections|5|[#176](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/176)|
|US 5.0.2 - Reset a Forgotten Password|2|[#179](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/179)|
|US 6.0.1 - Store Each Site's Geometry From the Shared Source|5|[#180](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/180)|

**Committed:** 68 points. **Re-estimate:** 42 points (see [Velocity re-estimate](#velocity-re-estimate)).

The sprint starts on October 14, after the Sprint 2 demo, review and retrospective. The planned code freeze was **October 25**, two days before the deadline. The freeze was missed;
[release checks](sprint-3-release.md) record the remaining checks and approvals. Red
makes the release on October 26. October 27 is spare time before the 20:00 deadline. Tasks are
assigned to teams, not to people. Each team divides its tasks between its members. No Sprint 2
work carried over to this sprint.

The issues are in the Sprint 3 milestone: the original stories were #169 to #180 and the original tasks were
[#181](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/181) to [#218](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/218).
US 2.0.11 (#174), US 4.0.5 (#177) and US 4.0.7 (#178) are excluded from the current plan. Their task issues are #186, #197, #200, #202, #205, #211 and #212. The lists below show the remaining work. GitHub issue states are not changed by this document update.

The milestone also has four issues that are not story tasks:

| Issue | Title | State |
|---|---|---|
| [#251](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/251) | Report read actions in queries.ts don't check the caller | Closed. Fixed by [PR #259](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/259), on `main` since #284. See [Issues Backlog](issues.md). |
| [#264](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/264) | Minute the Oct 14 lab, Sprint 2 retro and Sprint 3 planning | Open |
| [#271](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/271) | Use one shared admin check and one S3 client | Closed by PR #311. The export follow-up PR #318 also reuses the shared S3 client. |
| [#275](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/275) | Make S3 enforce the photo upload size and type limits | Closed by PR #291. |

**Teams:** Red (Saumya, Chris), Blue (Aaron, Zanab, Abhinav), Green (Alissa, Jayden). See
[Sprint 3 teams](#sprint-3-teams).

**Scrum roles:** Scrum Master Jayden, Product Owner Aaron. See [Scrum roles](#scrum-roles).

#### Open questions before pointing

This step follows the TA's advice of September 30: the ambiguity of a story must not change its
points, and a story is not complete until its details are clear. Owner: Aaron (Sprint 3 Product
Owner).

1. At Sprint 3 planning (October 14), each team adds an "Open questions" list to the issue of each
   of its Sprint 3 stories ([#169](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/169) to [#180](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/180)). An empty list says "None".
2. Aaron takes the questions for Frank to the October 16 client meeting and writes each answer in
   the issue.
3. The points of a story do not change because of its open questions. If an answer changes the
   scope of a story, the team re-points it at the next planning and records why.
4. From Sprint 4, a story is pointed only after its "Open questions" list is answered or says
   "None".

#### Tasks

|Task|Related US|Assignee|Due|Issue|
|:---:|:---:|:---:|:---:|:---:|
|Link each site to its boundary from the Alberta government KML (migration)|US 6.0.1|Blue (Aaron, Zanab, Abhinav)|Oct 16th|[#181](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/181)|
|Write the Sprint 3 test plan|Dev Task|Blue (Aaron, Zanab, Abhinav)|Oct 16th|[#182](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/182)|
|Review the schema of the site geometry columns, the GPX track table|Dev Task|Green (Alissa, Jayden)|Oct 16th|[#183](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/183)|
|Show all active sites with their boundaries on a map page for signed-in users|US 2.0.1|Red (Saumya, Chris)|Oct 17th|[#184](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/184)|
|Create the GPX track table and file storage with access rules (migration)|US 2.0.9|Red (Saumya, Chris)|Oct 17th|[#185](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/185)|
|Link each inspection in the profile history to its SIR|US 1.0.3|Green (Alissa, Jayden)|Oct 17th|[#187](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/187)|
|Add "Forgot password" to the sign-in page and send a verification email|US 5.0.2|Green (Alissa, Jayden)|Oct 17th|[#188](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/188)|
|Choose the tile source and the offline tile cache|US 4.0.2|Red (Saumya, Chris)|Oct 18th|[#189](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/189)|
|List the sites with no boundary for an Admin|US 6.0.1|Blue (Aaron, Zanab, Abhinav)|Oct 18th|[#190](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/190)|
|Add a "View on map" link to the site page and highlight only the selected site|US 2.0.1|Red (Saumya, Chris)|Oct 19th|[#191](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/191)|
|GPX upload server action: check the extension, the GPX format, the track points and the size|US 2.0.9|Red (Saumya, Chris)|Oct 19th|[#192](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/192)|
|Open a past SIR in edit mode, and check on the server that only its author can edit it|US 4.0.4|Blue (Aaron, Zanab, Abhinav)|Oct 19th|[#194](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/194)|
|Show activity aggregates on the profile and update them on a new SIR, with tests for 1.0.4|US 1.0.4|Green (Alissa, Jayden)|Oct 19th|[#195](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/195)|
|Add a CI check that fails when a diagram SVG does not match its Mermaid source|Dev Task|Red (Saumya, Chris)|Oct 20th|[#196](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/196)|
|Hide the fields that a steward chose to hide in their past SIRs, with tests for 1.0.3|US 1.0.3|Green (Alissa, Jayden)|Oct 20th|[#198](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/198)|
|Verify a code, then set the new password, with tests for 5.0.2|US 5.0.2|Green (Alissa, Jayden)|Oct 20th|[#199](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/199)|
|GPX upload control on the site page, with tests for 2.0.9|US 2.0.9|Red (Saumya, Chris)|Oct 21st|[#201](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/201)|
|Open a site detail view when a site is selected on the map|US 2.0.8|Blue (Aaron, Zanab, Abhinav)|Oct 21st|[#203](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/203)|
|Block an edit that clears a required answer and list the missing questions|US 4.0.4|Blue (Aaron, Zanab, Abhinav)|Oct 21st|[#204](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/204)|
|Draw the uploaded GPX tracks on the map, with tests for 2.0.1|US 2.0.1|Red (Saumya, Chris)|Oct 22nd|[#206](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/206)|
|Download a map area for offline use and show its download status|US 4.0.2|Red (Saumya, Chris)|Oct 22nd|[#207](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/207)|
|"View SIRs" link from the site detail view, with tests for 2.0.8|US 2.0.8|Blue (Aaron, Zanab, Abhinav)|Oct 22nd|[#208](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/208)|
|Show the downloaded tiles offline and mark the missing tiles outside the downloaded area|US 4.0.2|Red (Saumya, Chris)|Oct 23rd|[#209](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/209)|
|Show saved edits everywhere the report is rendered, with tests for 4.0.4|US 4.0.4|Blue (Aaron, Zanab, Abhinav)|Oct 23rd|[#210](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/210)|
|Use live tiles when online, with tests for offline and online mode|US 4.0.2|Red (Saumya, Chris)|Oct 24th|[#213](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/213)|
|Update the traceability matrix for the Sprint 3 stories|Dev Task|Blue (Aaron, Zanab, Abhinav)|Oct 24th|[#214](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/214)|
|Add the three priority scores and their saved date to a site, and calculate the to-visit priority on the server (migration)|US 2.0.12|Red (Saumya, Chris)|Oct 25th|[PR #307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307)|
|Admin score form and the to-visit priority on the site page. The server refuses a Steward's change. Tests for 2.0.12|US 2.0.12|Red (Saumya, Chris)|Oct 25th|[PR #307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307)|
|Show a reminder to an Admin when the points were saved more than a year ago, with tests for 2.0.13|US 2.0.13|Red (Saumya, Chris)|Oct 25th|[PR #307](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/307)|
|Export job that puts all stored images and files in one ZIP file|US 3.0.3|Red (Saumya, Chris)|Oct 25th|[PR #309](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/309)|
|Admin control to start the export and download the ZIP file, with tests for 3.0.3|US 3.0.3|Red (Saumya, Chris)|Oct 25th|[PR #309](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/309)|
|Skill and focus area dropdowns with an "Other" option and suggestions on the profile edit form, with tests for 1.0.6|US 1.0.6|Red (Saumya, Chris)|Oct 25th|[PR #308](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/308)|
|Open a PR for each task and request 2 reviews|All US|Everyone|Oct 24th|[#215](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/215)|
|Code freeze: all Sprint 3 PRs reviewed and merged|All US|Everyone|Oct 25th|[#216](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/216)|
|Write the release notes and make the Sprint 3 release on GitHub|Release|Red (Saumya, Chris)|Oct 26th|[#217](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/217)|
|Sprint 3 demo, review and retrospective|All US|Everyone|Oct 28th|[#218](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/218)|

#### Sprint 3 task details

Each task is done when its PR is merged and the listed acceptance tests (AT) of its story pass.
The acceptance tests are in [User Stories](user-stories.md).

**Dependencies.** The work that other tasks build on is due first:

- 6.0.1 (site-to-boundary link, October 16) comes before the map page (2.0.1), the
  boundaries on the map.
- The map page of 2.0.1 (October 17) comes before the site detail view (2.0.8), the GPX tracks on
  the map (2.0.1 AT2) and the offline layers (4.0.2). It builds on the base map of [PR #159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159).
- The GPX track table (2.0.9, October 17) comes before the GPX upload and the tracks on the map.
- Green reviews the schema of the new columns and tables (October 16) before their migrations
  merge. The review also records which SIR fields a steward can hide (1.0.3 AT3).

**Red (Saumya, Chris): map, GPX tracks, offline layers, the five stories moved from Sprint 4 and the release**

- **Show all active sites with their boundaries on a map page for signed-in users** (US 2.0.1).
  Use MapLibre GL and the Protomaps basemap from [PR #159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159). Build on the map in
  `webapp/components/map/SiteMap.tsx`, which already draws the protected area boundaries
  ([PR #161](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161), [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167)), and use the geometry from 6.0.1. Done when 2.0.1 AT1 passes.
- **Add a "View on map" link to the site page and highlight only the selected site** (US 2.0.1).
  Done when 2.0.1 AT3 and AT4 pass.
- **Draw the uploaded GPX tracks on the map** (US 2.0.1). Draw a track as a line in a different
  style from the site boundary. Done when 2.0.1 AT1 to AT4 pass.
- **Create the GPX track table and file storage with access rules** (US 2.0.9). Link each track to
  a site and to the user who uploaded it. Done when the migration runs on a clean local database
  and Green has reviewed the schema.
- **GPX upload server action** (US 2.0.9). Refuse a file without the .gpx extension, a file that is
  not valid GPX or has no track points, and a file above the stated maximum size. Save nothing when
  a file is refused. Accept several files in one upload and check each file on its own. Frank asked
  for bulk upload at the October 9 meeting (`docs/meetings/week6/2026_10_09_meeting_frank.txt`).
  Done when 2.0.9 AT2, AT3, AT5 and AT6 pass.
- **GPX upload control on the site page** (US 2.0.9). Let the user choose one or several files.
  Done when 2.0.9 AT1 to AT6 pass, including the read-back of the same track points (AT4).
- **Choose the tile source and the offline tile cache** (US 4.0.2). The tile source is decided:
  [PR #159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159) uses Protomaps with MapLibre GL. Choose the offline cache for those tiles and write
  the decision and its limits in the PR. Done when the team agrees on the approach.
- **Download a map area for offline use and show its download status** (US 4.0.2). Done when 4.0.2
  AT1 passes.
- **Show the downloaded tiles offline and mark the missing tiles** (US 4.0.2). Done when 4.0.2 AT2
  and AT3 pass.
- **Use live tiles when online** (US 4.0.2). Done when 4.0.2 AT1 to AT4 pass.
- **Add the three priority scores and their saved date to a site, and calculate the to-visit
  priority on the server** (US 2.0.12). Migration. Green reviews the schema. Done when 2.0.12 AT1
  to AT3 pass.
- **Admin score form and the to-visit priority on the site page** (US 2.0.12). An Admin saves the
  scores. A Steward sees the priority and the scores, and the server refuses a Steward's change.
  Done when 2.0.12 AT1 to AT5 pass.
- **Show a reminder to an Admin when the points are a year old** (US 2.0.13). Uses the saved date of
  2.0.12. Done when 2.0.13 AT1 to AT4 pass.
- **Export job that puts all stored images and files in one ZIP file** (US 3.0.3). Runs as a
  background job, see the sequence diagram in [Software Design](software-design.md). Done when
  3.0.3 AT1 and AT2 pass.
- **Admin control to start the export and download the ZIP file** (US 3.0.3). Admin only. Done
  when 3.0.3 AT1 and AT2 pass.
- **Skill and focus area dropdowns on the profile edit form** (US 1.0.6). Include an "Other"
  option and suggest similar existing values. Done when 1.0.6 AT1 to AT3 pass.
- **Add a CI check that fails when a diagram SVG does not match its Mermaid source** (dev task).
  The check runs on PRs that change `docs/assets/*.mmd` or `docs/images/*.svg`. Done when a PR with
  an out-of-date SVG fails the check.

**Blue (Aaron, Zanab, Abhinav): site geometry, site details, boundary colors and SIR edits**

- **Link each site to its boundary** (US 6.0.1). This continues the KML
  parser and import from [PR #137](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137) and [PR #152](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152), and the site-to-area link that [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167) added.
  That link is empty until an Admin sets it. This task fills it from the KML for the existing
  sites. Done when 6.0.1 AT1 and AT2 pass and Green has reviewed the schema.
- **List the sites with no boundary for an Admin** (US 6.0.1). Done when 6.0.1 AT3 and AT4 pass.
- **Open a site detail view when a site is selected on the map** (US 2.0.8). Use the same data as
  the site page. This task needs the base map of 2.0.1. Done when 2.0.8 AT1 and AT2 pass.
- **"View SIRs" link from the site detail view** (US 2.0.8). Done when 2.0.8 AT1 to AT3 pass.



- **Open a past SIR in edit mode, and check on the server that only its author can edit it** (US
  4.0.4). Done when 4.0.4 AT1 and AT2 pass.
- **Block an edit that clears a required answer** (US 4.0.4). List the missing questions. Done when
  4.0.4 AT3 passes.
- **Show saved edits everywhere the report is rendered** (US 4.0.4). This includes the site page,
  the profile history and the PDF export. Done when 4.0.4 AT1 to AT4 pass.
- **Write the Sprint 3 test plan** (dev task). Name the test type (unit, integration or E2E) for
  each acceptance test of the Sprint 3 stories. Done when the team has reviewed the plan.
- **Update the traceability matrix for the Sprint 3 stories** (dev task). Link each acceptance test
  to its test and its PR. Done when each Sprint 3 acceptance test has a row.

**Green (Alissa, Jayden): profiles, password reset and the schema review**


- **Link each inspection in the profile history to its SIR** (US 1.0.3). The history list (site
  and date) is already on the profile from [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138). Done when 1.0.3 AT1 and AT2 pass.
- **Hide the fields that a steward chose to hide in their past SIRs** (US 1.0.3). Done when 1.0.3
  AT1 to AT3 pass.
- **Show activity aggregates on the profile and update them on a new SIR** (US 1.0.4). The profile
  already shows the SIR count from [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138). Add the reported activities. Done when 1.0.4 AT1 and AT2
  pass.
- **Add "Forgot password" to the sign-in page and send a verification email** (US 5.0.2). Done when 5.0.2
  AT1 passes.
- **Verify a code, then set the new password** (US 5.0.2). No Admin step is needed. Done when 5.0.2
  AT1 to AT4 pass.





**Review and release**

- **Open a PR for each task and request 2 reviews** (everyone, October 24).
- **Code freeze** (everyone, October 25). All Sprint 3 PRs are reviewed and merged.
- **Write the release notes and make the Sprint 3 release on GitHub** (October 26). Assignee: Red
  (Saumya, Chris). The release lists the finished stories and tasks. The deadline is October 27 at
  20:00.
- **Sprint 3 demo, review and retrospective** (everyone, October 28 lab).

### Sprint 4
**Due:** *November 17, 2026, 20:00 (GitHub release). Code freeze November 15.*

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 1.0.5 - Earn Points for Inspection Activity|5|
|US 5.0.5 - Request Access During Email Sign-Up|8|
|US 5.0.6 - Complete an Access Request With Google or Microsoft|5|
|US 5.0.7 - Review and Decide Access Requests|8|
|US 5.0.8 - Manage Access Terms|5|
|US 5.0.9 - View My Access-Request Status|3|
|US 7.0.3 - See All Inspections in One View|5|

**Committed:** 39 points. **Re-estimate:** 57 points (see [Velocity re-estimate](#velocity-re-estimate)).

No Sprint 4 GitHub issues are made yet. The five access-request stories are Frank's new
version 3.0 request. They use the capacity that was reserved for new client requests. The sprint
is 18 points below the capacity estimate, which leaves room for Sprint 3 carry-over.

The October 16 requests are US 1.0.6, US 2.0.14 and US 3.0.4. Owner: Team.
US 2.0.14 is in Sprint 3, assigned to Team Blue (Aaron, Zanab, Abhinav).
US 1.0.6 and US 3.0.4 moved from Sprint 4 to Sprint 3 on October 24, with 5 points in total. US 3.0.4 was removed on October 26. US 1.0.6 remains assigned to Red.
All three have Should Have priority.

#### Tasks

Tasks are planned at the start of the sprint.

### Sprint 5
**Due:** *December 1, 2026, 20:00 (GitHub release). Code freeze November 29.*

Sprint 5 is kept free on purpose. The client said that more work can come. The sprint is also for
final polish, deployment and fixes for the client field test in early December.

#### User stories

No stories planned yet. New client requests go here.

**Committed:** 0 points. **Re-estimate:** 57 points (see [Velocity re-estimate](#velocity-re-estimate)).

No stories are committed yet. About 30 points are for new client requests and carry-over from
Sprint 4. The rest is for deployment, final polish and field-test fixes.

#### Tasks

Tasks are planned at the start of the sprint.

-----

## Archive: Winter 2026 project plan (previous team)

The plan below belongs to the **Winter 2026** team (Jason Liang, Raiyana Rahman, Vishal Sivakumar,
Harveer Deol, Braden Woods, Akib Zaman Choudhury, Zoe Prefontaine). It is kept as the delivery
record for the code this project inherited. It is **not** the Fall 2026 plan and the names, dates
and story numbers in it refer to their work, not ours.

Their Sprint 1 roles were Scrum Master Jason Liang, Product Owners Harveer Deol and
Raiyana Rahman. Their story map is at `images/W26-SAPAA-Storymap.png` and their MURAL board is on
a workspace we do not have access to.

### Sprint 2
**Due:** *February 15, 2026*

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 1.0.1 – Access Site Inspection Form on Web Application|3|
|US 1.0.2 – Add Personal Information to Site Inspection Form [Q11-Q14 + Q16 + Q24 - Section : WhoRYou]|1|
|US 1.0.3 - Liability Check [Q2 - Section : General]|1|
|US 1.0.4 - Have access to the Terms and Conditions of Inputting Information [Q3 - Section: The Fine Print Up Front]|1|
|US 1.0.5 - Add Details Regarding the Overview of my Visit [Q21, Q22, Q23, Q25 - Section : WhereRYou]|1|
|US 1.0.6 - Rank the Health of the Site [Q31-33 Section : Impression]|1|
|US 1.0.7 - Add Details Regarding How the Trip Went [Q41 - 43 - Section : How Visit]|1|
|US 1.0.8 - Address What Amenities are in the Site [Q51 : Section - Be There]|1|
|US 1.0.9 - Designation as a Protected Site [Q55 - Section : Be There]|1|
|US 1.0.10 - Indicate submissions to iNaturalist [Q53 - Section : Be There, Q68]|1|
|US 1.0.11 - Address details of Landscape changes [Q54 - Section : Be There]|2|
|US 1.0.12 - Address any Biological Observations that are in the Site [Q52 - Section : Be There, Q68]|1|
|US 1.0.13 - Address Any Human Disturbances - Section 8 [Q61 - Q66 - Section : Not There]|1|
|US 1.0.14 - Add Other Comments [Q56, Q67, Q74, Q82]|2|
|US 1.0.15 - Inform SAPAA of Any Restorative Work that Needs to be Done / Was Done [Q71, Q72 - Section : 2B Done]|2|
|US 1.0.23 - Non-Public Information [Q73, Q83]|2|
|US 1.0.26 - Persist Site Inspection Form Draft|5|
|US 1.0.27 - Enforce Required Questions on Site Inspection Form|3|
|US 1.0.28 - Autofill Applicable Form Questions|3|
|TASK 1.0.29 - Refactor the Database Schema and Produce an Updated ER Diagram|N/A|

**Sprint Velocity:** 33

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Build the Site Inspection Form entry point|US 1.0.1|Vishal, Jason, Raiyana|Feb 7th|
|Refactor the Database Schema|TASK 1.0.29|Raiyana, Zoe|Feb 7th|
|Understand previous team's implementation to repurpose for our schema|US 1.0.1|Vishal, Harveer, Jason, Braden|Feb 7th|
|Produce an Updated ER Diagram|TASK 1.0.29|Raiyana|Feb 7th|
|Add the liability check and access gate|US 1.0.3|Harveer|Feb 8th|
|Add the Terms & Conditions acceptance flow|US 6B.01|Harveer|Feb 8th|
|Create the personal information section|US 1.0.2|Braden|Feb 11th|
|Create the visit overview and site selection section|US 1.0.5|Vishal|Feb 11th|
|Add the non‑public information fields|US 1.0.23|Harveer|Feb 11th|
|Develop the site health and impression section|US 1.0.6|Zoe|Feb 11th|
|Develop the trip details and visit reasoning section|US 1.0.7|Braden|Feb 11th|
|Add the landscape change reporting fields|US 1.0.11|Braden|Feb 11th|
|Add the biological observations section|US 1.0.12|Jason|Feb 11th|
|Add the human disturbances reporting section|US 1.0.13|Zoe|Feb 11th|
|Create the amenities and ease‑of‑use section|US 1.0.8|Akib|Feb 11th|
|Create the protected site designation section|US 1.0.9|Akib|Feb 11th|
|Add the iNaturalist submission indicator|US 1.0.10|Akib|Feb 11th|
|Add the additional comments and free‑text section|US 1.0.14|Vishal, Raiyana|Feb 11th|
|Add the restoration actions and stewardship section|US 1.0.15|Zoe|Feb 12th|
|Persist Site Inspection Form Draft|US 1.0.26|Jason, Raiyana|Feb 12th|
|Enforce Required Questions on Site Inspection Form|US 1.0.27|Jason, Akib|Feb 12th|
|Autofill Applicable Form Questions|US 1.0.28|Zoe|Feb 12th|
|Assemble all sections into a unified form schema|All US|Everyone|Feb 14th|
|Finalize the submission flow and validation logic|All US|Everyone|Feb 14th|
|Write acceptance tests|All US|Everyone|Feb 14th|
|Update documentation|Documentation|Everyone|Feb 14th|

### Sprint 3
**Due:** *March 8, 2026*

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 1.0.16 – Add Any Photography Captured During Visit|5|
|US 1.0.17 – (Admin) Add Questions Site Inspections Form|3|
|US 1.0.18 – Adding Image Identifier|2|
|US 1.0.19 - Admin Viewing Images and Metadata|2|
|US 1.0.22 – (User) Edit My Site Inspections Form|5|
|US 1.0.24 – Modify my Site Inspections Form Questions|8|
|US 1.0.25 – Hide a Site Inspections Form Questions|3|
|US 2.0.1 – Manage the uploading and storing of site inspection images|8|
|US 2.0.2 – Image Metadata|2|
|US 2.0.3 – Gallery View|3|
|TASK 2.0.6 - Refactor Report Rendering to Use Updated Database Schema|N/A|

**Sprint Velocity:** 41

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Setup AWS account with client|All US|Harveer|Feb 20th|
|Setup developer email for vercel with client|All US|Harveer|Feb 20th|
|Add any photography captured during visit|US 1.0.16|Raiyana|Feb 25th|
|Allow admin to add Questions Site Inspections Form|US 1.0.17|Braden|Feb 27th|
|Adding Image Identifier to the inspection form|US 1.0.18|Raiyana, Zoe|Feb 27th|
|Add a dashboard for admin to view images and metadata|US 1.0.19|Raiyana|Mar 3rd|
|Add the ability to edit previous site inspections forms for users|US 1.0.22|Vishal|Mar 3rd|
|Let admin modify the site inspections form questions|US 1.0.24|Braden, Jason|Mar 3rd|
|Add ability to hide site inspection form questions|US 1.0.25|Braden, Jason|Mar 5th|
|Manage the uploading and storing of site inspection images onto S3|US 2.0.1|Raiyana, Harveer|Mar 5th|
|Image Metadata|US 2.0.2|Raiyana, Akib|Mar 5th|
|Gallery View|US 2.0.3|Raiyana, Akib|Mar 5th|
|Refactor Report Rendering to Use Updated Database Schema|TASK 2.0.6|Vishal|Mar 7th|
|Finalize the submission flow and validation logic|All US|Everyone|Mar 7th|
|Write acceptance tests|All US|Everyone|Mar 7th|
|Update documentation|Documentation|Everyone|Mar 8th|



### Sprint 4
**Due:** *March 22, 2026*

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 1.0.30 – Rich Text Formatting for Form Description Fields|3|
|US 2.0.7 – Admin Management of Media Files|13|
|US 2.0.8 – User Upload of Standalone Site Images|8|
|US 4.0.1 – PDF Generation of SIR's|8|
|US 4.0.3 – Update Site Profile of a Particular Site|3|
|US 4.0.4 – Disable Site Profile of a Particular Site|3|
|US 5.0.1 - Admin Approval of Users|5|

**Sprint Velocity:** 43

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Rich Text Editor|US 1.0.30|Akib, Braden|Mar 11th|
|Admin Management of Media Files|US 2.0.7|Jason, Raiyana, Zoe|Mar 12th|
|Enable user upload of standalone site images|US 2.0.8|Raiyana, Vishal|Mar 13th|
|PDF generation|US 4.0.1|Braden, Vishal, Jason|Mar 15th|
|Update existing site profiles|US 4.0.3|Braden, Jason|Mar 17th|
|Disable site profiles as needed|US 4.0.4|Braden, Jason|Mar 19th|
|Admin Approval of Users|US 5.0.1|Harveer|Mar 19th|
|Finalize Sprint 4 acceptance tests|All US|Everyone|Mar 21st|
|Update documentation|Documentation|Everyone|Mar 22nd|

### Sprint 5
**Due:** *March 31, 2026*

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 1.0.20 - Admin Editing Image Metadata|3|
|US 2.0.4 - Offline Image Viewing|5|
|US 2.0.9 – Homescreen Gallery View|5|
|US 3.0.1 - Access the mobile version of the Site Inspection Form|5|
|US 3.0.2 - Offline Data Syncing|8|
|US 5.0.2 – Sign Out Feature|2|
|TASK 6.0.1 – Web Application Responsiveness|N/A|
|TASK 6.0.2 – Front-End Error Handling & Validation|N/A|
|TASK 6.0.3 – Inspection Fields Integration|N/A|

**Sprint Velocity:** 28

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Homescreen Gallery View|US 2.0.9|Vishal|Mar 25th|
|Web Application Responsiveness|TASK 6.0.1|Raiyana|Mar 26th|
|Sign out feature|US 5.0.2|Harveer|Mar 27th|
|Inspection Fields Integration|TASK 6.0.3|Akib, Jason|Mar 27th|
|Front-End Error Handling & Validation|TASK 6.0.2|Akib|Mar 28th|
|Deployment Instructions|Documentation|Harveer, Raiyana|Mar 29th|
|Job Description|Documentation|Braden, Vishal|Mar 29th|
|User manual|Documentation|Braden|Mar 30th|
|Admin manual|Documentation|Braden, Jason|Mar 30th|
|UI Consistency|All US|Everyone|Mar 30th|
|Finalize Sprint 5 acceptance tests|All US|Everyone|Mar 30th|
|Project Portal Upload|Documentation|Harveer|Mar 29th|
|Finalize documentation|Documentation|Everyone|Mar 31st|
