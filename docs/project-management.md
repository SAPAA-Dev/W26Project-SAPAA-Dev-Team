# Project Management

This page provides an overview of the assigned tasks and roles for the duration of five sprints
(subject to change).

> **Sprint 1 is due September 29, 2026, confirmed in the September 19 working session.**
> Sprints 2 to 5 are proposed on a two week cadence from that date and need confirming.
> They are worked backwards from the client's commitment to field testing in early December 2026.

## Story Map

The full story set is in [User Stories](user-stories.md): 34 user stories in seven feature areas,
157 story points, prioritised with MoSCoW. The set follows the September 25, 2026 client meeting
(see [Meeting Minutes](meeting-minutes.md)), plus the 8 stories added on `main` in #42 from the
unprioritised spreadsheet items. This map arranges the same stories by sprint. The
number after each story is its story points.

| Feature area | Sprint 2 | Sprint 3 | Sprint 4 | Sprint 5 | Unscheduled | Won't Have |
|---|---|---|---|---|---|---|
| 1 - People Management | - | - | 1.0.1 (5), 1.0.2 (3), 1.0.3 (2), 1.0.4 (2) | - | 1.0.5 (5) | - |
| 2 - Place Management | 2.0.5 (5), 2.0.9 (5) | 2.0.1 (8), 2.0.2 (3) | 2.0.6 (5), 2.0.8 (3), 2.0.10 (1) | 2.0.3 (3) | 2.0.4 (8), 2.0.11 (5), 2.0.12 (8), 2.0.13 (3) | - |
| 3 - Admin Persona | - | - | - | 3.0.3 (8) | - | 3.0.2 (5) |
| 4 - General Features | 4.0.4 (5), 4.0.6 (1) | - | - | 4.0.5 (5) | 4.0.7 (5) | 4.0.2 (13) |
| 5 - Access and Accounts | 5.0.2 (2) | - | 5.0.4 (2) | - | - | - |
| 6 - Data and Places | - | 6.0.1 (5) | - | - | - | - |
| 7 - Inspections and Media | - | - | 7.0.4 (5) | 7.0.1 (2), 7.0.3 (5), 7.0.5 (5) | 7.0.6 (5), 7.0.7 (5), 7.0.8 (5) | - |
| **Points** | **18** | **16** | **28** | **28** | **49** | **18** |
| **Planned velocity** | 23 | 22 | 29 | 32 | - | - |

By MoSCoW:

| Priority | Stories | Points | Where |
|---|---|---|---|
| Must Have | 10 | 38 | All in Sprints 2 to 4 |
| Should Have | 13 | 55 | 10 in Sprints 2 to 5. 2.0.11, 7.0.7 and 7.0.8 are unscheduled |
| Could Have | 9 | 46 | 7.0.1, 7.0.3 and 7.0.4 in a sprint. 1.0.5, 2.0.4, 2.0.12, 2.0.13, 4.0.7 and 7.0.6 are unscheduled |
| Won't Have | 2 | 18 | Not planned |

Sprint 1 carries no user stories because it is documentation and discovery.

**How the stories are placed.**

- **Stories that only changed their number keep their sprint.** On September 25 some stories got
  new numbers. The team's earlier placement stays: 2.0.9 (was 2.0.12) and 5.0.2 (was 5.0.5) in
  Sprint 2; 6.0.1 (was 6.0.8), 2.0.1 and 2.0.2 in Sprint 3; 1.0.1, 1.0.2, 2.0.8 (was 2.0.10) and
  5.0.4 (was 5.0.7) in Sprint 4; 2.0.3 and 7.0.5 (was 7.0.7) in Sprint 5.
- **The other stories are a proposal.** They had no sprint. The team confirms or changes them at
  Sprint 2 planning:
  - 1.0.3 and 1.0.4 go in Sprint 4, because they are parts of the profile page (1.0.1).
  - 2.0.6 and 2.0.10 go in Sprint 4, after the map (2.0.1) in Sprint 3.
  - 2.0.5, 4.0.4 and 4.0.6 go in Sprint 2. They change pages that exist today, and they use
    the spare capacity in Sprint 2.
  - 3.0.3, 4.0.5, 7.0.1 and 7.0.3 go in Sprint 5, and 7.0.4 goes in Sprint 4, by priority and
    capacity.
  - 2.0.4 (Delete a Site, 8 points) is unscheduled. It needs a team decision on what happens to
    the inspections and images of a deleted site, and no sprint has 8 points of spare capacity.
- **The 8 stories added on `main` in #42 are unplaced.** They arrived after this map was built,
  so the team places them at Sprint 2 planning:
  - 1.0.5 (Earn Points for Inspection Activity, 5 points, Could).
  - 2.0.11 (Show Safety Information for a Site, 5 points, Should), 2.0.12 (Score a Site for
    To-Visit Priority, 8 points, Could) and 2.0.13 (Flag Site Points That Are a Year Old,
    3 points, Could).
  - 4.0.7 (Show the Top iNaturalist Observations for a Site, 5 points, Could).
  - 7.0.6 (Export More Than 50 Site Inspection Reports, 5 points, Could), 7.0.7 (Hide Fields
    on a SIR Before Export, 5 points, Should) and 7.0.8 (Delete a Site Inspection Report,
    5 points, Should).
- **Dependencies.** 2.0.9 (GPX upload) comes before 2.0.1 (map with tracks), because Frank asked
  for GPS files in one of the first sprints. 6.0.1 (site geometry) is in the same sprint as 2.0.1
  and 2.0.2, which use it. 2.0.6 and 2.0.8 come after the map. 2.0.13 builds on the priority
  points of 2.0.12, so the two stay in that order wherever they land.

**MoSCoW is provisional.** Frank has not confirmed the priorities yet (issue #23).

The ranked backlog of defects and tasks is in [Issues Backlog](issues.md).

## Project Plan

Scrum Master and Product Owner rotate each sprint. The full rotation is on the
[Teamwork](teamwork.md) page.

**Sprint 1 Scrum Master:** Chris

**Sprint 1 Product Owner:** Alissa

**Team:** Saumya, Chris, Zanab, Abhinav, Alissa, Aaron, Jayden

### Sprint 1
**Due:** *September 29, 2026*

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
**Due:** *October 13, 2026 (proposed)*

Foundations and quick wins. The stories change pages that exist today. The security stories were
removed from the story list on September 25, so the access control work stays in the task list
below until the team decides if it returns as stories.

#### User stories

|User Story|Story points|Suggested owner|
|:---:|:---:|:---:|
|US 2.0.9 - Upload a GPX Track of a Site Visit|5|TBD|
|US 5.0.2 - Reset a Forgotten Password|2|Saumya, Abhinav|
|US 2.0.5 - Update a Site|5|TBD|
|US 4.0.4 - Edit My Previous Inspections|5|TBD|
|US 4.0.6 - Demote Photo Identifier to optional field|1|TBD|

**Sprint Velocity:** 18

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Add owner filter to user gallery routes|Gallery leak|TBD|Oct 2nd|
|Migrate Cypress suite to team-owned test accounts|Remove secrets|TBD|Oct 3rd|
|Scrub keys from docs and rotate|Remove secrets|TBD|Oct 3rd|
|Move service role calls behind a server endpoint|Rotate key|TBD|Oct 6th|
|Add caller checks to all server actions|Caller identity|TBD|Oct 8th|
|Create roles table and RLS policies|Role table|TBD|Oct 8th|
|Seed first admin as a database record|Role table|TBD|Oct 8th|
|Add role change audit table|Log role changes|TBD|Oct 9th|
|Fix delete to use the real key, not list index|Mobile delete bug|TBD|Oct 6th|
|Write `.env.example` and update README setup|Setup guide|TBD|Oct 9th|
|Add password reset route and login link|Password reset|TBD|Oct 8th|
|Add an answer history table and stop delete-and-reinsert|Edit history|TBD|Oct 9th|
|Sprint 2 review and retrospective|All US|Everyone|Oct 10th|

### Sprint 3
**Due:** *October 27, 2026 (proposed)*

Place management foundations. Sites have no coordinates today, so the map stories need the site
geometry (6.0.1) first.

#### User stories

|User Story|Story points|Suggested owner|
|:---:|:---:|:---:|
|US 6.0.1 - Store Each Site's Geometry From the Shared Source|5|Saumya, Aaron|
|US 2.0.1 - View Sites and Past Visits on an Interactive Map|8|Jayden, Aaron|
|US 2.0.2 - Allow Admins to Add New Sites|3|Jayden, Aaron|

**Sprint Velocity:** 16

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Write schema decision record and agree it with the team|Schema spike|TBD|Oct 15th|
|Add latitude and longitude columns to sites|Site coordinates|TBD|Oct 17th|
|Backfill coordinates for existing sites|Site coordinates|TBD|Oct 20th|
|Read map from stored coordinates instead of geocoding|Site coordinates|TBD|Oct 21st|
|Expose the map to stewards, not just admins|Steward map|TBD|Oct 22nd|
|Move site detail routing to id|Site detail by id|TBD|Oct 20th|
|Fix site search|Site search|TBD|Oct 21st|
|Add migrations directory and commit current schema|Schema in VCS|TBD|Oct 23rd|
|Add pagination to the sites list|Paginate sites|TBD|Oct 22nd|
|Sprint 3 review and retrospective|All US|Everyone|Oct 24th|

### Sprint 4
**Due:** *November 10, 2026 (proposed)*

People management and the map. Stewards get profiles, and the map gets site details, filters and
links.

#### User stories

|User Story|Story points|Suggested owner|
|:---:|:---:|:---:|
|US 1.0.1 - Add User Profiles|5|Alissa, Zanab|
|US 1.0.2 - Allow Editing Own Profile|3|Alissa, Zanab|
|US 1.0.3 - Show history of Site Inspections on a Steward's Profile|2|Alissa, Zanab|
|US 1.0.4 - Aggregate User Activity and Contributions on a user's profile|2|Alissa, Zanab|
|US 2.0.8 - View a Site's Details From the Map|3|Jayden, Aaron|
|US 2.0.6 - Search and Filter Sites by County on the Map|5|Jayden, Aaron|
|US 2.0.10 - Add links to Site Page|1|Jayden, Aaron|
|US 5.0.4 - Sign Out Properly|2|Saumya, Abhinav|
|US 7.0.4 - Compare One Question Across Years|5|TBD|

**Sprint Velocity:** 28

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Design and add activity event recording|Instrument events|TBD|Oct 30th|
|Build profile page using existing name and avatar fields|Profile page|TBD|Nov 4th|
|Port sites inspected, naturalness, top five, needs attention|Port KPIs|TBD|Nov 5th|
|Add a local write queue to the mobile app|Offline edits|TBD|Nov 5th|
|Flush queued writes on reconnect|Offline edits|TBD|Nov 6th|
|Send approval email or remove the promise|Approval email|TBD|Nov 3rd|
|Fix logout and move the control out of the homepage|Fix logout|TBD|Nov 4th|
|Build the compare by question view|Compare by question|TBD|Nov 6th|
|Sprint 4 review and retrospective|All US|Everyone|Nov 7th|

### Sprint 5
**Due:** *November 24, 2026 (proposed)*

Inspections, media and exports, and field test readiness. Leaves a buffer before December field
testing.

#### User stories

|User Story|Story points|Suggested owner|
|:---:|:---:|:---:|
|US 2.0.3 - Deactivate and Reactivate a Site|3|Jayden, Aaron|
|US 7.0.5 - Delete an Image and Clean Up After It|5|Zanab, Alissa|
|US 3.0.3 - Export all digital files from SIR-SAPAA|8|TBD|
|US 4.0.5 - iNaturalist integration|5|TBD|
|US 7.0.1 - Let Stewards Export Their Own Reports|2|TBD|
|US 7.0.3 - See All Inspections in One View|5|TBD|

**Sprint Velocity:** 28

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Add image delete plus storage cleanup on report delete|Image deletion|TBD|Nov 18th|
|Create a staging environment and document promotion|Staging|TBD|Nov 19th|
|Fix form element, labels, autocomplete and contrast on auth pages|Accessibility|TBD|Nov 17th|
|Open PDF export to stewards|Steward PDF|TBD|Nov 17th|
|Add lint, build and E2E to CI and fix branch triggers|CI gating|TBD|Nov 19th|
|Confirm field test date, testers and scenarios with client|Field testing|TBD|Nov 14th|
|Make Sync Now actually refresh site data|Sync Now|TBD|Nov 18th|
|Write the backup and recovery runbook|Backup runbook|TBD|Nov 20th|
|Sprint 5 review and retrospective|All US|Everyone|Nov 21st|
|Finalise documentation and handover|Documentation|Everyone|Nov 21st|

### Milestones

|Milestone|Target|
|:---:|:---:|
|Requirements and design agreed with client|End of Sprint 1|
|Authorisation enforced server side|End of Sprint 2|
|Sites have real coordinates and stewards can use the map|End of Sprint 3|
|Stewards have profiles and the app measures activity|End of Sprint 4|
|Release candidate ready for field testing|End of Sprint 5|
|Client field testing|Early December 2026|

### Notes on estimation

Story points map from the effort scale in [Issues Backlog](issues.md): S is 2 points, M is 5,
L is 8, XL is 13. Estimates assume LLM assistance, so a point reflects judgement and review effort
rather than typing.

Velocity rises across the sprints (23, 22, 29, 32) on the assumption that the team speeds up once
the codebase is familiar and the access control work is behind us. Revisit after Sprint 2 with
real numbers.

There are 34 stories and 157 points: Must 38, Should 55, Could 46 and Won't 18. The committed points are 18, 16, 28 and 28 (90 in
total) against a planned velocity of 23, 22, 29 and 32 (106). All Must stories are in a sprint.
The 3 new Should stories (2.0.11, 7.0.7, 7.0.8) and the 5 new Could stories (1.0.5, 2.0.12,
2.0.13, 4.0.7, 7.0.6) await placement at Sprint 2 planning. The spare capacity is for the task
work, for example the access control tasks in Sprint 2, and for 2.0.4 if the team agrees how a
site delete works.

Owners in the story tables are suggestions based on how Sprint 1 work was split. "TBD" means the story has no suggested owner yet. They are a
starting point for planning, not a commitment, and the team confirms them at each sprint planning
session. Task level assignees stay TBD until then.

---

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
