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
GPX tracks and the offline layers are one connected piece of work.

| Team | Members | Ownership area | Points |
|---|---|---|---|
| Red | Saumya, Chris | Platform / CI/CD / releases | 26 |
| Blue | Aaron, Zanab, Abhinav | Quality / reliability / dev experience | 18 |
| Green | Alissa, Jayden | Architecture / backend / data | 16 |

## Story map

The full story set is in [User Stories](user-stories.md): 35 user stories in seven feature areas,
162 story points, prioritised with MoSCoW. The set follows the September 25, 2026 client meeting
(see [Meeting Minutes](meeting-minutes.md)), plus later additions. Placement follows
[User Story Summaries](user-stories-summaries.md).

| Feature area | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Sprint 5 | Unscheduled | Won't Have |
|---|---|---|---|---|---|---|---|
| 1 - People Management | - | 1.0.1 (5, M) ✓, 1.0.2 (3, M) ✓ | 1.0.3 (2, S), 1.0.4 (2, M) | 1.0.5 (5, C) | - | - | - |
| 2 - Place Management | - | 2.0.2 (3, M) (partial), 2.0.3 (3, S) ✓, 2.0.4 (8, M), 2.0.5 (5, M), 2.0.6 (5, S), 2.0.10 (1, M) ✓ | 2.0.1 (8, S), 2.0.8 (3, M), 2.0.9 (5, M), 2.0.11 (5, M) | 2.0.12 (8, C), 2.0.13 (3, C) | - | - | - |
| 3 - Admin Persona | - | 3.0.2 (5, S) ✓ | - | 3.0.3 (8, M) | - | - | - |
| 4 - General Features | - | 4.0.6 (1, M) ✓ | 4.0.2 (13, S), 4.0.4 (5, S), 4.0.5 (5, S), 4.0.7 (5, C) | - | - | - | - |
| 5 - Access and Accounts | - | 5.0.4 (2, S) (partial) | 5.0.2 (2, M) | - | - | - | - |
| 6 - Data and Places | - | - | 6.0.1 (5, M) | - | - | - | - |
| 7 - Inspections and Media | - | 7.0.1 (2, C) ✓, 7.0.5 (5, S) ✓, 7.0.6 (5, S), 7.0.7 (5, M) ✓, 7.0.8 (5, S) | - | 7.0.3 (5, C) | - | - | 7.0.4 (5, W), 7.0.9 (5, W) |
| **Points** | **0** | **63** | **60** | **29** | **0** | **0** | **10** |
| **Planned velocity** | 0 | 63 | 60 | 29 | 30 (estimated) | - | - |

Numbers in brackets: story points and MoSCoW priority (M = Must Have, S = Should Have, C = Could Have, W = Won't Have).

✓ = done (merged on main, and the merged work covers each AT) as of October 7, 2026. Partial on
that date: 2.0.2 and 5.0.4. See [Sprint 2 status](#sprint-2-status-as-of-october-7-2026).

The **Points** row gives the total story points that the team committed to each sprint. The
**Planned velocity** row gives the story points that the team plans to finish in each sprint. For
Sprints 1 to 4, the two values are the same (see [Velocity re-estimate](#velocity-re-estimate)).
Sprint 5 has no committed stories yet, so its points are 0 and its planned velocity is an estimate
of 30 points.

By MoSCoW:

| Priority | Stories | Points | Where |
|---|---|---|---|
| Must Have | 15 | 61 | 8 in Sprint 2, 6 in Sprint 3, 3.0.3 in Sprint 4 |
| Should Have | 12 | 63 | 7 in Sprint 2, 5 in Sprint 3 |
| Could Have | 6 | 28 | 7.0.1 in Sprint 2, 4.0.7 in Sprint 3, 4 in Sprint 4 (1.0.5, 2.0.12, 2.0.13, 7.0.3) |
| Won't Have | 2 | 10 | Not planned (7.0.4, 7.0.9) |

Sprint 1 has no user stories because it is documentation and discovery. The team keeps Sprint 5
free on purpose: the client said that more work can come, and the sprint is also for final
polish, deployment and field-test fixes.

**Open conflicts with the plan.** The team confirms or changes placement at Sprint 3 planning
(October 14):

- 2.0.6 (map filter, Sprint 2) now comes before the map (2.0.1, Sprint 3).
- 2.0.4 (Delete a Site, 8 points) is in Sprint 2, but the team has not agreed what happens
  to the inspections and images of a deleted site.
- 2.0.2 (Add New Sites, Sprint 2) suggests boundaries from the Alberta government KML (AT6), but
  6.0.1 (site geometry from that source) is in Sprint 3.
- **Dependencies that still hold.** 2.0.9 (GPX upload) shares Sprint 3 with 2.0.1
  (map with tracks) and still comes first, because Frank asked for GPS files in one of the
  first sprints. 6.0.1 (site geometry) is in the same sprint as 2.0.1, which uses it.
  2.0.13 builds on the priority points of 2.0.12, so the two stay together in Sprint 4.

**MoSCoW is provisional.** Frank has not confirmed the priorities yet (issue #23).

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

### Milestones

All releases are GitHub releases at 20:00 on the due date.

| Sprint | Sprint goal | Code freeze | Release | Stories | Planned velocity |
|---|---|---|---|---|---|
| Sprint 1 | Documentation and discovery: requirements, design, plan and teamwork | - | September 29, 2026 | 0 (documentation and discovery) | 0 |
| Sprint 2 | Steward profiles, site administration, and SIR export and delete | October 11, 2026 | October 13, 2026 | 16 | 63 |
| Sprint 3 | Interactive map with site geometry and GPX tracks, inspection history, iNaturalist and password reset | October 25, 2026 | October 27, 2026 | 12 | 60 |
| Sprint 4 | Activity points, to-visit priority, export of all files and the all-SIR summary | November 15, 2026 | November 17, 2026 | 5 | 29 |
| Sprint 5 | New client requests, final polish, deployment and field-test fixes | November 29, 2026 | December 1, 2026 | 0 (not planned yet) | 30 (estimated) |

### Velocity re-estimate

Re-estimated on October 7, 2026, from the Sprint 2 results so far. A story counts as done only
when its PR is merged on `main` and the merged work covers each AT of the story.

| Sprint | Planned | Done / actual | Re-estimate |
|---|---|---|---|
| Sprint 2 | 63 | 30 done, 5 partial and 0 in review (as of October 7) | 30 |
| Sprint 3 | 60 | Not started | 60 |
| Sprint 4 | 29 | Not started | 29 |
| Sprint 5 | 30 (estimated) | Not started | 30 |

Sprint 2 reached the 30-point re-estimate on October 7, when the last story PR in review merged. This is
about half of the 63 planned points. The first week of Sprint 2 went to four setup dev tasks that
have no story points (branch model, admin auth checks, the Invalid Identifier fix and the `W26_`
rename) and to the two user model tasks of 1.0.1. Most story PRs merged only on October 5 to 7.

Sprint 3 stays at 60 points. This is twice the Sprint 2 result. The team keeps 60 because the
setup work is done, no Sprint 2 work is in the Sprint 3 plan, and the three map stories (2.0.1,
2.0.9, 4.0.2) are one piece of work for one team. Sprint 3 is the sprint with the highest risk. If
the team is behind at the mid-point (October 20), 4.0.7 (5, Could Have) moves to Sprint 4 first,
then 4.0.5 (5, Should Have).

Sprint 4 stays at 29 points and Sprint 5 at 30 points (no stories yet). No Sprint 2 carry-over is
assumed. If work is not merged at the October 11 freeze, the Product Owner places it at the
Sprint 3 planning on October 14.

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

#### Sprint 2 status (as of October 7, 2026)

Sprint 2 is still in progress. The code freeze is October 11 and the release is October 13 at
20:00. A story or task is **Done** when its PR is merged on `main` and the merged work covers each
AT of the story. **Partial** means that a PR is merged, but some ATs are not covered yet. **Not
verified** means that the issue is closed, but no PR, commit or comment shows the work. The test of
each AT is in the [Traceability Matrix](traceability-matrix.md). A gap in the tests of a Done story
is listed below the table. It does not change the status.

| Status | Stories | Points |
|---|---|---|
| Done | 1.0.1, 1.0.2, 2.0.3, 2.0.10, 3.0.2, 4.0.6, 7.0.1, 7.0.5, 7.0.7 | 30 |
| Partial | 2.0.2, 5.0.4 | 5 |
| In review | - | 0 |
| In progress | 2.0.6 | 5 |
| Not started | 2.0.4, 2.0.5, 7.0.8 | 18 |
| Not verified | 7.0.6 | 5 |
| **Total** | **16 stories** | **63** |

Test coverage of each acceptance test is in the [Traceability Matrix](traceability-matrix.md).

- **Done.** 30 of the 63 committed points (9 of 16 stories). The setup dev tasks are also done: the branch model ([PR #125](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/125)), the admin auth checks ([PR #144](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/144)), the Invalid Identifier fix
  ([PR #128](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/128)), the `W26_` rename ([PR #129](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129)) and the two user model tasks of 1.0.1: create the
  model ([#74](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/74); [PR #116](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/116), and [PR #130](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/130), which reached `main` in [PR #129](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129)) and
  migrate it ([#75](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/75); [PR #131](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131)).
- **Test gaps in Done stories.** 1.0.1 AT2 and AT5 and 1.0.2 AT5 have no test. Owner: Alpha.
  7.0.5 AT4 and 7.0.7 AT3 have no test. Owner: Beta. The 7.0.7 AT2 test in
  `__tests__/app/api/pdf.test.ts` that failed on `d18f3bd` passes on `main` now (CI on `576f93f`:
  971 passed of 971).
- **Partial.** 2.0.2: [PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153) covers AT2 to AT5. AT1 (select a boundary) and AT6 (suggest
  sites from the government KML) are open, because `protected_areas` has no rows yet. 5.0.4:
  [PR #120](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/120) adds the admin navigation, with sign-out, to the admin site details page. The
  profile, people, new-report and edit-report pages have no sign-out control (AT3). No change on
  `main` handles the Back button after sign-out (AT2).
- **In review.** No story PRs are in review. [PR #151](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151) (1.0.2 AT3, blank name check), [PR #155](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/155) (7.0.1,
  Steward PDF export) and [PR #150](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150) (2.0.3, Admin view of inactive sites) merged on October 7. [PR #154](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/154)
  (reviewer gate status), a dev fix, also merged.
- **Still open before the October 11 freeze.** 2.0.6 has its data groundwork on `main` ([PR #132](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/132),
  [PR #137](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137), [PR #152](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152)), but there is no map page for signed-in users and no county filter or site search on a
  map (only the inherited admin dashboard heatmap). 2.0.4, 2.0.5 and 7.0.8
  have no branch or PR. The 4.0.6 task [#87](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87) (the form keeps its current page) has no PR. The release
  ([#97](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97), October 12) and the demo ([#98](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/98), October 14) are still ahead.
- **7.0.6 is not verified.** [#66](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/66) and [#90](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/90) are closed as completed, but no PR, commit or comment
  shows the fix. [PR #148](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148) adds 51 seed inspections to test the export above 50 reports, so it is
  probably related. The story does not count as done until the owner team checks 7.0.6 AT1 to AT4.

**Issue state does not match the evidence.** This list is a report only. The owner team corrects
its issues.

- [#66](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/66) (7.0.6) and [#90](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/90) are closed as completed with no PR or check. Owner: Gamma.
- [#81](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/81) (2.0.4) and [#93](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/93) (7.0.8) are closed as duplicates, but no work exists. Their stories
  [#58](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/58) and [#69](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/69) are open. Owner: Gamma.
- [#67](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/67) (7.0.7) and [#91](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/91) are open, but [PR #146](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/146) merged on October 7. Its body says "Closes #42", so
  GitHub did not close them. Owner: Beta.
- [#88](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/88) (4.0.6) is open, but [PR #147](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/147) merged. [PR #147](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/147) closes the story [#63](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/63), not the task. Owner: Beta.
- [#63](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/63) (4.0.6) is closed, but its task [#87](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87) is open and not started. The story ATs are covered by
  [PR #147](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/147). Owner: Beta.
- [#56](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/56) (2.0.2) is closed as completed, but 2.0.2 AT1 and AT6 are not done ([PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153) says so).
  Owner: Gamma.
- [#64](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/64) (5.0.4) and [#94](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/94) are closed as completed, but [PR #120](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/120) does not put sign-out on every
  page (AT3), and nothing shows that AT2 was checked. Owner: Alpha.
- [#95](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/95) was closed on September 30, but [#80](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/80), [#81](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/81), [#83](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/83), [#84](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/84), [#85](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/85), [#87](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87) and [#93](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/93) have no PR
  that refers to them. Owner: everyone.
- [#73](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/73), [#79](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/79) and [#86](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/86) were closed as duplicates before their work merged in [PR #129](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129), [PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153) and
  [PR #145](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/145). The close reason does not name the PR. Owners: Alpha ([#73](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/73)), Gamma ([#79](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/79), [#86](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/86)).

#### User stories

|User Story|Story points|Status|
|:---:|:---:|:---:|
|US 1.0.1 - Add User Profiles|5|Done ([#54](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/54); [PR #131](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131), [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138), [PR #141](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/141), [PR #142](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/142))|
|US 1.0.2 - Allow Editing Own Profile|3|Done ([#55](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/55); [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138), [PR #151](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151))|
|US 2.0.2 - Allow Admins to Add New Sites|3|Partial ([#56](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/56); AT2 to AT5 merged in [PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153); AT1 and AT6 open, need `protected_areas` data)|
|US 2.0.3 - Deactivate and Reactivate a Site|3|Done ([#57](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/57); [PR #150](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150))|
|US 2.0.4 - Delete a Site|8|Not started ([#58](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/58))|
|US 2.0.5 - Update a Site|5|Not started ([#59](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/59))|
|US 2.0.6 - Search and Filter Sites by County on the Map|5|In progress ([#60](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/60); data in [PR #132](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/132), [PR #137](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137), [PR #152](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152))|
|US 2.0.10 - Add links to Site Page|1|Done ([#61](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/61); [PR #145](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/145))|
|US 3.0.2 - Steward Designation|5|Done ([#62](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/62); [PR #133](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/133), [PR #139](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/139), [PR #140](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/140))|
|US 4.0.6 - Demote Photo Identifier to optional field|1|Done ([#63](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/63); [PR #147](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/147))|
|US 5.0.4 - Sign Out Properly|2|Partial ([#64](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/64); [PR #120](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/120) adds sign-out to the admin site details page; profile, people, new-report and edit-report pages have no sign-out; AT2 not checked)|
|US 7.0.1 - Let Stewards Export Their Own Reports|2|Done ([#68](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/68); [PR #155](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/155))|
|US 7.0.5 - Delete an Image and Clean Up After It|5|Done ([#65](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/65); [PR #148](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148))|
|US 7.0.6 - Export More Than 50 Site Inspection Reports|5|Not verified ([#66](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/66); no PR)|
|US 7.0.7 - Hide Fields on a SIR Before Export|5|Done ([#67](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/67); [PR #146](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/146))|
|US 7.0.8 - Delete a Site Inspection Report|5|Not started ([#69](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/69))|

**Sprint Velocity:** 63

#### Tasks

|Task|Related US|Assignee|Due|Status|
|:---:|:---:|:---:|:---:|:---:|
|Set up development, release, and feature branches|Dev Task|Gamma (Zanab, Chris, Jayden)|Oct 4th|Done ([#70](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/70); [PR #125](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/125))|
|Improve authentication checks for admin routes|Dev Task|Beta (Abhinav, Alissa)|Oct 4th|Done ([#71](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/71); [PR #144](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/144))|
|Investigate and fix Invalid Identifier Supabase error|Dev Task|Alpha (Saumya, Aaron)|Oct 4th|Done ([#72](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/72); [PR #128](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/128))|
|Update db names to not include "W26" as prefix|Dev Task|Alpha (Saumya, Aaron)|Oct 4th|Done ([#73](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/73); [PR #129](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129))|
|Create user model that supports profiles, steward assignments, and gamified stats|US 1.0.1|Alpha (Saumya, Aaron)|Oct 4th|Done ([#74](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/74); [PR #116](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/116), [PR #130](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/130))|
|Migrate user model|US 1.0.1|Alpha (Saumya, Aaron)|Oct 5th|Done ([#75](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/75); [PR #131](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131))|
|Profile page|US 1.0.1|Alpha (Saumya, Aaron)|Oct 6th|Done ([#76](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/76); [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138), [PR #141](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/141), [PR #142](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/142))|
|Add Steward to site page and link to their profile|US 3.0.2|Alpha (Saumya, Aaron)|Oct 7th|Done ([#77](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/77); [PR #133](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/133), [PR #139](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/139), [PR #140](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/140))|
|Edit profile/user info page and functionality|US 1.0.2|Alpha (Saumya, Aaron)|Oct 7th|Done ([#78](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/78); [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138), [PR #151](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151))|
|Add new site page and functionality|US 2.0.2|Gamma (Zanab, Chris, Jayden)|Oct 5th|Partial ([#79](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/79); [PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153); AT1 and AT6 open)|
|Edit existing site page fields|US 2.0.5|Gamma (Zanab, Chris, Jayden)|Oct 6th|Not started ([#80](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/80))|
|Delete site button and confirmation|US 2.0.4|Gamma (Zanab, Chris, Jayden)|Oct 6th|Not started ([#81](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/81))|
|Deactivate/Activate button and confirmation|US 2.0.3|Beta (Abhinav, Alissa)|Oct 6th|Done ([#82](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/82); [PR #150](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150))|
|Set up map|US 2.0.6|Beta (Abhinav, Alissa)|Oct 7th|In progress ([#83](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/83); data in [PR #132](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/132), [PR #137](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137), [PR #152](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152))|
|Add sites to the map|US 2.0.6|Beta (Abhinav, Alissa)|Oct 6th|Not started ([#84](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/84))|
|Add Search and Filtering on Map view|US 2.0.6|Beta (Abhinav, Alissa)|Oct 7th|Not started ([#85](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/85))|
|Add links to site page|US 2.0.10|Gamma (Zanab, Chris, Jayden)|Oct 7th|Done ([#86](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/86); [PR #145](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/145))|
|Fix site inspection page resetting current page when app is exited temporarily|US 4.0.6|Beta (Abhinav, Alissa)|Oct 6th|Not started ([#87](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87))|
|Change Photo Identifier field on SIR to not required|US 4.0.6|Beta (Abhinav, Alissa)|Oct 5th|Done ([#88](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/88); [PR #147](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/147))|
|Add a delete option on images|US 7.0.5|Beta (Abhinav, Alissa)|Oct 7th|Done ([#89](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/89); [PR #148](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148))|
|Increase export limit to over 50|US 7.0.6|Gamma (Zanab, Chris, Jayden)|Oct 9th|Not verified ([#90](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/90); no PR)|
|Screen to select hidden fields on SIR before export|US 7.0.7|Beta (Abhinav, Alissa)|Oct 9th|Done ([#91](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/91); [PR #146](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/146))|
|Grant Steward permission to export PDFs|US 7.0.1|Gamma (Zanab, Chris, Jayden)|Oct 7th|Done ([#92](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/92); [PR #155](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/155))|
|Delete site inspection report button and confirmation|US 7.0.8|Gamma (Zanab, Chris, Jayden)|Oct 7th|Not started ([#93](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/93))|
|Fix logging out functionality outside the home page|US 5.0.4|Alpha (Saumya, Aaron)|Oct 5th|Partial ([#94](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/94); [PR #120](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/120) covers the admin site details page only; AT2 not checked)|
|Open a PR for each task and request 2 reviews|All US|Everyone|Oct 10th|In progress ([#95](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/95))|
|Code freeze: all Sprint 2 PRs reviewed and merged|All US|Everyone|Oct 11th|In progress ([#96](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/96))|
|Write the release notes and make the Sprint 2 release on GitHub|Release|Gamma (Zanab, Chris, Jayden)|Oct 12th|Not started ([#97](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97))|
|Sprint 2 demo, review and retrospective|All US|Everyone|Oct 14th|Not started ([#98](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/98))|

#### Sprint 2 task details

Each task is done when its PR is merged on `main` and the merged work covers the listed acceptance
tests (AT) of its story. The acceptance tests are in [User Stories](user-stories.md). The test of
each AT is in the [Traceability Matrix](traceability-matrix.md).

**Setup and foundations (due October 4 to 5)**

- **Set up development, release, and feature branches**. Assignee: Gamma (Zanab, Chris, Jayden).
  Make the branch model for the team: a development branch, a release branch, and feature branches
  from development. Add the branch rules on GitHub and write the model in
  [Contributing](contributing.md). Done when a feature PR can merge into development and development
  can merge into the release branch.
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
  Admin confirms the delete and sees how many inspections and images the delete affects. The team
  must agree on what happens to those records before this task starts. Done when 2.0.4 AT1 to AT4
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

|User Story|Story points|
|:---:|:---:|
|US 1.0.3 - Show history of Site Inspections on a Steward's Profile|2|
|US 1.0.4 - Aggregate User Activity and Contributions on a user's profile|2|
|US 2.0.1 - View Sites and Past Visits on an Interactive Map|8|
|US 2.0.8 - View a Site's Details From the Map|3|
|US 2.0.9 - Upload a GPX Track of a Site Visit|5|
|US 2.0.11 - Show Safety Information for a Site|5|
|US 4.0.2 - Offline and Online Map Layers|13|
|US 4.0.4 - Edit My Previous Inspections|5|
|US 4.0.5 - iNaturalist integration|5|
|US 4.0.7 - Show the Top iNaturalist Observations for a Site|5|
|US 5.0.2 - Reset a Forgotten Password|2|
|US 6.0.1 - Store Each Site's Geometry From the Shared Source|5|

**Sprint Velocity:** 60

The sprint starts on October 14, after the Sprint 2 demo, review and retrospective. All Sprint 3
work is finished and merged by **October 25** (code freeze), two days before the deadline. Red
makes the release on October 26. October 27 is spare time before the 20:00 deadline. Tasks are
assigned to teams, not to people. Each team divides its tasks between its members. No Sprint 2 carry-over
is assumed in this plan.

GitHub issues for these tasks are created at the Sprint 3 planning on October 14. On October 7, the
Sprint 3 milestone has no issues.

**Teams:** Red (Saumya, Chris), Blue (Aaron, Zanab, Abhinav), Green (Alissa, Jayden). See
[Sprint 3 teams](#sprint-3-teams).

**Scrum roles:** Scrum Master Jayden, Product Owner Aaron. See [Scrum roles](#scrum-roles).

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Link each site to its boundary from the Alberta government KML and store a centre point (migration)|US 6.0.1|Blue (Aaron, Zanab, Abhinav)|Oct 16th|
|Write the Sprint 3 test plan|Dev Task|Blue (Aaron, Zanab, Abhinav)|Oct 16th|
|Review the schema of the site geometry columns, the GPX track table and the safety information fields|Dev Task|Green (Alissa, Jayden)|Oct 16th|
|Show all active sites with their boundaries on a map page for signed-in users|US 2.0.1|Red (Saumya, Chris)|Oct 17th|
|Create the GPX track table and file storage with access rules (migration)|US 2.0.9|Red (Saumya, Chris)|Oct 17th|
|Add the safety information fields of a site, with Admin-only write access (migration)|US 2.0.11|Blue (Aaron, Zanab, Abhinav)|Oct 17th|
|Link each inspection in the profile history to its SIR|US 1.0.3|Green (Alissa, Jayden)|Oct 17th|
|Add "Forgot password" to the sign-in page and send a reset link|US 5.0.2|Green (Alissa, Jayden)|Oct 17th|
|Choose the tile source and the offline tile cache|US 4.0.2|Red (Saumya, Chris)|Oct 18th|
|Match sites in the KML import and list unmatched sites for an Admin|US 6.0.1|Blue (Aaron, Zanab, Abhinav)|Oct 18th|
|Add a "View on map" link to the site page and highlight only the selected site|US 2.0.1|Red (Saumya, Chris)|Oct 19th|
|GPX upload server action: check the extension, the GPX format, the track points and the size|US 2.0.9|Red (Saumya, Chris)|Oct 19th|
|Cache geocoding results and stay under the OpenCage daily limit, with tests for 6.0.1|US 6.0.1|Blue (Aaron, Zanab, Abhinav)|Oct 19th|
|Open a past SIR in edit mode, and check on the server that only its author can edit it|US 4.0.4|Blue (Aaron, Zanab, Abhinav)|Oct 19th|
|Show activity aggregates on the profile and update them on a new SIR, with tests for 1.0.4|US 1.0.4|Green (Alissa, Jayden)|Oct 19th|
|Add a CI check that fails when a diagram SVG does not match its Mermaid source|Dev Task|Red (Saumya, Chris)|Oct 20th|
|Admin form and server action to save the safety information|US 2.0.11|Blue (Aaron, Zanab, Abhinav)|Oct 20th|
|Hide the fields that a steward chose to hide in their past SIRs, with tests for 1.0.3|US 1.0.3|Green (Alissa, Jayden)|Oct 20th|
|Verify a code, then set the new password, with tests for 5.0.2|US 5.0.2|Green (Alissa, Jayden)|Oct 20th|
|Connect a user's iNaturalist account and read their observations|US 4.0.5|Green (Alissa, Jayden)|Oct 20th|
|GPX upload control on the site page, with tests for 2.0.9|US 2.0.9|Red (Saumya, Chris)|Oct 21st|
|Safety section on the site page, with tests for 2.0.11|US 2.0.11|Blue (Aaron, Zanab, Abhinav)|Oct 21st|
|Open a site detail view when a site is selected on the map|US 2.0.8|Blue (Aaron, Zanab, Abhinav)|Oct 21st|
|Block an edit that clears a required answer and list the missing questions|US 4.0.4|Blue (Aaron, Zanab, Abhinav)|Oct 21st|
|Server route that reads the top 5 iNaturalist observations of a site, with a cache|US 4.0.7|Green (Alissa, Jayden)|Oct 21st|
|Draw the uploaded GPX tracks on the map, with tests for 2.0.1|US 2.0.1|Red (Saumya, Chris)|Oct 22nd|
|Download a map area for offline use and show its download status|US 4.0.2|Red (Saumya, Chris)|Oct 22nd|
|"View SIRs" link from the site detail view, with tests for 2.0.8|US 2.0.8|Blue (Aaron, Zanab, Abhinav)|Oct 22nd|
|Show the downloaded tiles offline and mark the missing tiles outside the downloaded area|US 4.0.2|Red (Saumya, Chris)|Oct 23rd|
|Show saved edits everywhere the report is rendered, with tests for 4.0.4|US 4.0.4|Blue (Aaron, Zanab, Abhinav)|Oct 23rd|
|Select iNaturalist photos in the SIR and autofill the identifier, with tests for 4.0.5|US 4.0.5|Green (Alissa, Jayden)|Oct 23rd|
|iNaturalist section on the site page, with tests for 4.0.7|US 4.0.7|Green (Alissa, Jayden)|Oct 23rd|
|Use live tiles when online, with tests for offline and online mode|US 4.0.2|Red (Saumya, Chris)|Oct 24th|
|Update the traceability matrix for the Sprint 3 stories|Dev Task|Blue (Aaron, Zanab, Abhinav)|Oct 24th|
|Open a PR for each task and request 2 reviews|All US|Everyone|Oct 24th|
|Code freeze: all Sprint 3 PRs reviewed and merged|All US|Everyone|Oct 25th|
|Write the release notes and make the Sprint 3 release on GitHub|Release|Red (Saumya, Chris)|Oct 26th|
|Sprint 3 demo, review and retrospective|All US|Everyone|Oct 28th|

#### Sprint 3 task details

Each task is done when its PR is merged and the listed acceptance tests (AT) of its story pass.
The acceptance tests are in [User Stories](user-stories.md).

**Dependencies.** The work that other tasks build on is due first:

- 6.0.1 (site boundary and centre point, October 16) comes before the map page (2.0.1), the
  boundaries on the map and the iNaturalist observations of a site (4.0.7).
- The base map of 2.0.1 (October 17) comes before the site detail view (2.0.8), the GPX tracks on
  the map (2.0.1 AT2) and the offline layers (4.0.2).
- The GPX track table (2.0.9, October 17) comes before the GPX upload and the tracks on the map.
- Green reviews the schema of the new columns and tables (October 16) before their migrations
  merge. The review also records which SIR fields a steward can hide (1.0.3 AT3).

**Red (Saumya, Chris): map, GPX tracks, offline layers and the release**

- **Show all active sites with their boundaries on a map page for signed-in users** (US 2.0.1).
  Use Leaflet, which is already in `webapp/package.json`, and the geometry from 6.0.1. Done when
  2.0.1 AT1 passes.
- **Add a "View on map" link to the site page and highlight only the selected site** (US 2.0.1).
  Done when 2.0.1 AT3 and AT4 pass.
- **Draw the uploaded GPX tracks on the map** (US 2.0.1). Draw a track as a line in a different
  style from the site boundary. Done when 2.0.1 AT1 to AT4 pass.
- **Create the GPX track table and file storage with access rules** (US 2.0.9). Link each track to
  a site and to the user who uploaded it. Done when the migration runs on a clean local database
  and Green has reviewed the schema.
- **GPX upload server action** (US 2.0.9). Refuse a file without the .gpx extension, a file that is
  not valid GPX or has no track points, and a file above the stated maximum size. Save nothing when
  a file is refused. Done when 2.0.9 AT2, AT3 and AT5 pass.
- **GPX upload control on the site page** (US 2.0.9). Done when 2.0.9 AT1 to AT5 pass, including
  the read-back of the same track points (AT4).
- **Choose the tile source and the offline tile cache** (US 4.0.2). Compare the options and write
  the decision and its limits in the PR. Done when the team agrees on the approach.
- **Download a map area for offline use and show its download status** (US 4.0.2). Done when 4.0.2
  AT1 passes.
- **Show the downloaded tiles offline and mark the missing tiles** (US 4.0.2). Done when 4.0.2 AT2
  and AT3 pass.
- **Use live tiles when online** (US 4.0.2). Done when 4.0.2 AT1 to AT4 pass.
- **Add a CI check that fails when a diagram SVG does not match its Mermaid source** (dev task).
  The check runs on PRs that change `docs/assets/*.mmd` or `docs/images/*.svg`. Done when a PR with
  an out-of-date SVG fails the check.

**Blue (Aaron, Zanab, Abhinav): site geometry, site details, safety information and SIR edits**

- **Link each site to its boundary and store a centre point** (US 6.0.1). This continues the KML
  parser and import from [PR #137](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137) and [PR #152](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152). Done when 6.0.1 AT1 and AT2 pass and Green has
  reviewed the schema.
- **Match sites in the KML import and list unmatched sites for an Admin** (US 6.0.1). Done when
  6.0.1 AT3 passes.
- **Cache geocoding results and stay under the OpenCage daily limit** (US 6.0.1). Done when 6.0.1
  AT1 to AT4 pass.
- **Open a site detail view when a site is selected on the map** (US 2.0.8). Use the same data as
  the site page. This task needs the base map of 2.0.1. Done when 2.0.8 AT1 and AT2 pass.
- **"View SIRs" link from the site detail view** (US 2.0.8). Done when 2.0.8 AT1 to AT3 pass.
- **Add the safety information fields of a site** (US 2.0.11). Nearest hospital, known hazards and
  other safety information. Only an Admin can write them. Done when the migration runs on a clean
  local database and Green has reviewed the schema.
- **Admin form and server action to save the safety information** (US 2.0.11). Check the Admin role
  on the server. Done when 2.0.11 AT3 and AT4 pass.
- **Safety section on the site page** (US 2.0.11). Show an empty value as not recorded. Done when
  2.0.11 AT1 to AT4 pass.
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

**Green (Alissa, Jayden): profiles, password reset, iNaturalist and the schema review**

- **Review the schema of the site geometry columns, the GPX track table and the safety information
  fields** (dev task). Check names, keys, access rules and the migration order. Review the 6.0.1
  site boundary and centre point first (October 16). Review the 2.0.9 and 2.0.11 migrations when
  their PRs open. Done when each of these migrations has a review from Green before it merges. If
  the iNaturalist work (4.0.5, 4.0.7) adds a cache or token table, Green reviews it when its PR
  opens. That review is not part of this task.
- **Link each inspection in the profile history to its SIR** (US 1.0.3). The history list (site
  and date) is already on the profile from [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138). Done when 1.0.3 AT1 and AT2 pass.
- **Hide the fields that a steward chose to hide in their past SIRs** (US 1.0.3). Done when 1.0.3
  AT1 to AT3 pass.
- **Show activity aggregates on the profile and update them on a new SIR** (US 1.0.4). The profile
  already shows the SIR count from [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138). Add the reported activities. Done when 1.0.4 AT1 and AT2
  pass.
- **Add "Forgot password" to the sign-in page and send a reset link** (US 5.0.2). Done when 5.0.2
  AT1 passes.
- **Verify a code, then set the new password** (US 5.0.2). No Admin step is needed. Done when 5.0.2
  AT1 to AT4 pass.
- **Connect a user's iNaturalist account and read their observations** (US 4.0.5). Find out early
  if the iNaturalist API needs a registered application. If it does, tell the Product Owner on the
  first day. Done when a signed-in user sees a list of their own observations.
- **Select iNaturalist photos in the SIR and autofill the identifier** (US 4.0.5). Done when 4.0.5
  AT1 and AT2 pass.
- **Server route that reads the top 5 iNaturalist observations of a site** (US 4.0.7). Use the site
  location from 6.0.1, sort by engagement and cache the result. Done when 4.0.7 AT1, AT2 and AT5
  pass.
- **iNaturalist section on the site page** (US 4.0.7). Show the empty state, and show the
  observations to users without an iNaturalist account. Done when 4.0.7 AT1 to AT5 pass.

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
|US 2.0.12 - Score a Site for To-Visit Priority|8|
|US 2.0.13 - Flag Site Points That Are a Year Old|3|
|US 3.0.3 - Export all digital files from SIR-SAPAA|8|
|US 7.0.3 - See All Inspections in One View|5|

**Sprint Velocity:** 29

#### Tasks

Tasks are planned at the start of the sprint.

### Sprint 5
**Due:** *December 1, 2026, 20:00 (GitHub release). Code freeze November 29.*

Sprint 5 is kept free on purpose. The client said that more work can come. The sprint is also for
final polish, deployment and fixes for the client field test in early December.

#### User stories

No stories planned yet. New client requests go here.

**Sprint Velocity:** 30 (estimated)

Estimated velocity: 30 points. No stories are committed yet. The capacity is reserved for new
client requests, carry-over from Sprint 4, deployment and field-test fixes.

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
