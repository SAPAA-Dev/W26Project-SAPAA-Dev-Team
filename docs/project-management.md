# Project Management

> **Sprint deadlines are from the CMPUT 401 course calendar.** Each sprint ends with a GitHub
> release at 20:00: Sprint 1 on September 29, Sprint 2 on October 13, Sprint 3 on October 27,
> Sprint 4 on November 17 (after reading week) and Sprint 5 on December 1, 2026.
> From Sprint 2, all work of a sprint is merged two days before its deadline (code freeze):
> October 11, October 25, November 15 and November 29. The release is made after the freeze.
> The client plans field testing in early December 2026.

## Teamwork Model

From Sprint 2, the team works in **rotating full-stack mini-teams**. Each mini-team also owns one
technical area.

- **Full stack.** Each mini-team does frontend and backend work. LLM tools do most of the frontend
  work, so most of the effort is in the backend.
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
  all three areas. Tell Saumya if you have a problem with the arrangement.

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

## Story Map

The full story set is in [User Stories](user-stories.md): 35 user stories in seven feature areas,
162 story points, prioritised with MoSCoW. The set follows the September 25, 2026 client meeting
(see [Meeting Minutes](meeting-minutes.md)), plus later additions. Placement follows
[User Story Summaries](user-stories-summaries.md); numbers are story points.

| Feature area | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Sprint 5 | Unscheduled | Won't Have |
|---|---|---|---|---|---|---|---|
| 1 - People Management | - | 1.0.1 (5), 1.0.2 (3) | 1.0.3 (2), 1.0.4 (2) | 1.0.5 (5) | - | - | - |
| 2 - Place Management | - | 2.0.2 (3), 2.0.3 (3), 2.0.4 (8), 2.0.5 (5), 2.0.6 (5), 2.0.10 (1) | 2.0.1 (8), 2.0.8 (3), 2.0.9 (5), 2.0.11 (5) | 2.0.12 (8), 2.0.13 (3) | - | - | - |
| 3 - Admin Persona | - | 3.0.2 (5) | - | 3.0.3 (8) | - | - | - |
| 4 - General Features | - | 4.0.6 (1) | 4.0.2 (13), 4.0.4 (5), 4.0.5 (5), 4.0.7 (5) | - | - | - | - |
| 5 - Access and Accounts | - | 5.0.4 (2) | 5.0.2 (2) | - | - | - | - |
| 6 - Data and Places | - | - | 6.0.1 (5) | - | - | - | - |
| 7 - Inspections and Media | - | 7.0.1 (2), 7.0.5 (5), 7.0.6 (5), 7.0.7 (5), 7.0.8 (5) | - | 7.0.3 (5) | - | - | 7.0.4 (5), 7.0.9 (5) |
| **Points** | **0** | **63** | **60** | **29** | **0** | **0** | **10** |
| **Planned velocity** | 0 | 63 | 60 | 29 | 0 | - | - |

By MoSCoW:

| Priority | Stories | Points | Where |
|---|---|---|---|
| Must Have | 15 | 61 | 8 in Sprint 2, 6 in Sprint 3, 3.0.3 in Sprint 4 |
| Should Have | 12 | 63 | 7 in Sprint 2, 5 in Sprint 3 |
| Could Have | 6 | 28 | 7.0.1 in Sprint 2, 4.0.7 in Sprint 3, 4 in Sprint 4 (1.0.5, 2.0.12, 2.0.13, 7.0.3) |
| Won't Have | 2 | 10 | Not planned (7.0.4, 7.0.9) |

Sprint 1 has no user stories because it is documentation and discovery. Sprint 5 has no user
stories yet, so its planned velocity is 0. The team keeps Sprint 5 free on purpose: the client
said that more work can come, and the sprint is also for final polish and deployment.

**Open conflicts with the plan.** The team confirms or changes placement at
Sprint 2 planning:

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

## Project Plan

Scrum Master and Product Owner rotate each sprint. The full rotation is on the
[Teamwork](teamwork.md) page.

**Sprint 1 Scrum Master:** Chris

**Sprint 1 Product Owner:** Alissa

**Team:** Saumya, Chris, Zanab, Abhinav, Alissa, Aaron, Jayden

### Milestones

All releases are GitHub releases at 20:00 on the due date.

| Sprint | Code freeze | Release | Stories | Planned velocity |
|---|---|---|---|---|
| Sprint 1 | - | September 29, 2026 | 0 (documentation and discovery) | 0 |
| Sprint 2 | October 11, 2026 | October 13, 2026 | 16 | 63 |
| Sprint 3 | October 25, 2026 | October 27, 2026 | 12 | 60 |
| Sprint 4 | November 15, 2026 | November 17, 2026 | 5 | 29 |
| Sprint 5 | November 29, 2026 | December 1, 2026 | 0 (not planned yet) | 0 |

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
|Mobile application user stories|Documentation|Chris|Sep 27th|
|Confirm scope and open questions with client|Documentation|Saumya, Alissa|Sep 26th|

### Sprint 2
**Due:** *October 13, 2026, 20:00 (GitHub release). Code freeze October 11.*

All Sprint 2 work is finished and merged by **October 11** (code freeze), two days before the
deadline. Gamma makes the release on October 12. October 13 is spare time before the 20:00
deadline. Tasks are assigned to teams, not to people. The teams were chosen at random: each team got a share
of the work in proportion to its number of members, and the tasks in its ownership area. Each team
divides its tasks between its members.

**Teams:** Alpha (Saumya, Aaron), Beta (Abhinav, Alissa), Gamma (Zanab, Chris, Jayden). See
[Teamwork Model](#teamwork-model).

The security stories were removed from the story list on September 25, so the access control work
stays in the task list below until the team decides if it returns as stories.

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 1.0.1 - Add User Profiles|5|
|US 1.0.2 - Allow Editing Own Profile|3|
|US 2.0.2 - Allow Admins to Add New Sites|3|
|US 2.0.3 - Deactivate and Reactivate a Site|3|
|US 2.0.4 - Delete a Site|8|
|US 2.0.5 - Update a Site|5|
|US 2.0.6 - Search and Filter Sites by County on the Map|5|
|US 2.0.10 - Add links to Site Page|1|
|US 3.0.2 - Steward Designation|5|
|US 4.0.6 - Demote Photo Identifier to optional field|1|
|US 5.0.4 - Sign Out Properly|2|
|US 7.0.1 - Let Stewards Export Their Own Reports|2|
|US 7.0.5 - Delete an Image and Clean Up After It|5|
|US 7.0.6 - Export More Than 50 Site Inspection Reports|5|
|US 7.0.7 - Hide Fields on a SIR Before Export|5|
|US 7.0.8 - Delete a Site Inspection Report|5|

**Sprint Velocity:** 63

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Set up development, release, and feature branches|Dev Task|Gamma (Zanab, Chris, Jayden)|Oct 4th|
|Improve authentication checks for admin routes|Dev Task|Beta (Abhinav, Alissa)|Oct 4th|
|Investigate and fix Invalid Identifier Supabase error|Dev Task|Alpha (Saumya, Aaron)|Oct 4th|
|Update db names to not include “W26” as prefix|Dev Task|Alpha (Saumya, Aaron)|Oct 4th|
|Create user model that supports profiles, steward assignments, and gamified stats|US 1.0.1|Alpha (Saumya, Aaron)|Oct 4th|
|Migrate user model|US 1.0.1|Alpha (Saumya, Aaron)|Oct 5th|
|Profile page|US 1.0.1|Alpha (Saumya, Aaron)|Oct 6th|
|Add Steward to site page and link to their profile|US 3.0.2|Alpha (Saumya, Aaron)|Oct 7th|
|Edit profile/user info page & functionality|US 1.0.2|Alpha (Saumya, Aaron)|Oct 7th|
|Add new site page & functionality|US 2.0.2|Gamma (Zanab, Chris, Jayden)|Oct 5th|
|Edit existing site page fields|US 2.0.5|Gamma (Zanab, Chris, Jayden)|Oct 6th|
|Delete site button & confirmation|US 2.0.4|Gamma (Zanab, Chris, Jayden)|Oct 6th|
|Deactivate/Activate button & confirmation|US 2.0.3|Beta (Abhinav, Alissa)|Oct 6th|
|Set up map|US 2.0.6|Beta (Abhinav, Alissa)|Oct 5th|
|Add sites to the map|US 2.0.6|Beta (Abhinav, Alissa)|Oct 6th|
|Add Search and Filtering on Map view|US 2.0.6|Beta (Abhinav, Alissa)|Oct 7th|
|Add links to site page|US 2.0.10|Gamma (Zanab, Chris, Jayden)|Oct 7th|
|Fix site inspection page resetting current page when app is exited temporarily|Dev Task|Beta (Abhinav, Alissa)|Oct 6th|
|Change Photo Identifier field on SIR to not required|US 4.0.6|Beta (Abhinav, Alissa)|Oct 5th|
|Add a delete option on images|US 7.0.5|Beta (Abhinav, Alissa)|Oct 7th|
|Increase export limit to over 50|US 7.0.6|Gamma (Zanab, Chris, Jayden)|Oct 9th|
|Screen to select hidden fields on SIR before export|US 7.0.7|Beta (Abhinav, Alissa)|Oct 9th|
|Grant Steward permission to export PDFs|US 7.0.1|Gamma (Zanab, Chris, Jayden)|Oct 7th|
|Delete site inspection report button & confirmation|US 7.0.8|Gamma (Zanab, Chris, Jayden)|Oct 7th|
|Fix logging out functionality outside the home page|US 5.0.4|Alpha (Saumya, Aaron)|Oct 5th|
|Open a PR for each task and request 2 reviews|All US|Everyone|Oct 10th|
|Code freeze: all Sprint 2 PRs reviewed and merged|All US|Everyone|Oct 11th|
|Write the release notes and make the Sprint 2 release on GitHub|Release|Gamma (Zanab, Chris, Jayden)|Oct 12th|
|Sprint 2 demo, review and retrospective|All US|Everyone|Oct 14th|

#### Sprint 2 task details

Each task is done when its PR is merged and the listed acceptance tests (AT) of its story pass.
The acceptance tests are in [User Stories](user-stories.md).

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

**Site inspection reports (US 4.0.6, 7.0.1, 7.0.5, 7.0.6, 7.0.7, 7.0.8, and one dev task)**

- **Change Photo Identifier field on SIR to not required** (US 4.0.6). Assignee: Beta (Abhinav,
  Alissa). Remove the required rule and the "required" note. Done when 4.0.6 AT1 and AT2 pass.
- **Fix site inspection page resetting current page when app is exited temporarily** (dev task).
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
  merged moves to Sprint 3.
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

#### Tasks

Tasks are planned at the start of the sprint.

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
final polish and deployment before the client field test in early December.

#### User stories

No stories planned yet. New client requests go here.

**Sprint Velocity:** 0

#### Tasks

Tasks are planned at the start of the sprint.

-----

## Archive: Winter 2026 Project Plan (previous team)

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
