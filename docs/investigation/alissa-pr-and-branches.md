# Investigation: Alissa's user-stories PR + remote branch survey

*Generated 2026-09-21 from git data + `gh`. Read-only investigation; nothing was merged or pushed.*

## 1. What the PR is

| Field | Value |
|---|---|
| PR | **#2** on `UAlberta-CMPUT401/F26project-SAPAA` |
| Title | `(docs): revised, deduplicated initial US - wrote comments, questions` |
| Author | `AlissaPepino` (amp) |
| State | **OPEN, DRAFT** |
| Created | 2026-09-20T03:05:03Z |
| Base → Head | `main` ← `docs/project-requirements/user-stories` |
| Comments / reviews | **none** (0 comments, 0 reviews) |
| Head commit | `cd2726d` — "(docs): revised, deduplicated initial US - wrote comments, questions" (2026-09-19) |

### PR description (verbatim)

> docs/index-WINTER2026.md - renamed from index.md. This is a copy of the previous semester's project requirements doc, kept as a format reference but should be removed later
>
> docs/index.md - updated the previous index.md file with our discussed user stories. I combined some, and excluded some that were describing the same story. Also kept a few that were vague, missing a "so that" clause, or had followup questions for the team/frank
>
> DEV, scrum master, and  product tasks not yet included

### Diff vs `main`

```
docs/images/team_canvas.png | Bin 564705 -> 861336 bytes   (M)  <- from lamersc's commit 4f2f8d3, already on origin/main
docs/index-WINTER2026.md    | 725 ++++++++++++++++++++++++++  (A)  <- byte-identical copy of the OLD docs/index.md
docs/index.md               | 627 +++++-------------------------  (M)  <- the actual work
```

Verified: `docs/index-WINTER2026.md` on the branch is **byte-identical** to `docs/index.md` on `main`. It is a pure archive copy — zero new content. All real content is the rewritten `docs/index.md`.

The branch is **1 ahead / 1 behind** `origin/main`.

---

## 2. FULL VERBATIM user stories on Alissa's branch

Everything below is the `## User Stories` section of `docs/index.md` at `origin/docs/project-requirements/user-stories`, copied exactly.

---

## User Stories
---
### **1 - People Management**
---

#### US 1.0.1 – Add User Profiles | Story Points: x  
> **As** a User, **I want** to be able to view my profile and profiles of other stewards, **so that** I can see their details and contributions

> **Acceptance Tests**

> 1. Should be able to navigate to own profile by clicking "my profile" in the menu under pages
> 2. Should be able to navigate to a users profile by clicking on their email via their inspection report
> 3. Profile information matches what is stored in the database
> 4. Should be able to return to the previous page after navigating to a user's profile

#### US 1.0.2 - Allow Editing Own Profile | Story Points: x
> **As** a User, **I want** to be able to edit my own profile information, **so that** I can I can keep my details and interests up-to-date

> **Acceptance Tests**

> 1. Should only be able to edit own profile
> 2. Required information is removed -> Prevents user from saving updates and required fields are highlighted
> 3. Valid entries in updated profile fields on save -> UI refreshes with updated information
> 4. Changes to profile details persist when revisiting page, on log in, etc.

#### TODO: DISCUSS WITH FRANK
- Remaining user stories are TBD from the following suggestions (Discuss with frank):
    - If we are introducing an organization structure (i.e manager roles that can assign inspections to stewards under their supervision), what places in the application should this relationship be displayed? (user profile, manager-restricted view, organization page)
    - Should we allow users to favourite sites? Display the # of favourites on a site in the map or site profile
    - How do we want to display user activity and contributions:
        - Top inspector leaderboard (on all or a single site?):
        - Daily, Weekly streak
        - Rank user’s top activities
            - how many activities (top 5)? what date range do we determine this data from?
            - expand to view timeline of all activities or table of activities and their count
        - Other stats or badges:
            - Hours on site (ex. KPI card on user profile or badges for reaching x number of hours)
            - Sites visited (ex. KPI card on user profile or badges for visiting x number of sites)
            - Badge for being the first inspector for a site
            - Badges for visiting sites that “need attention”
            - Badges for including more information on an inspection report (ex. including an image)
            - Badges for doing x or more activities at a single site
            - Badges for inspecting a site x or more times

---
### **2 – Place Management**
---
#### US 2.0.1 - View Sites on an Interactive Map | Story Points: x
> **As** a User, **I want** to view a map with landmarked sites, , **so that** I can easily see where it is located

> **Acceptance Tests**

> 1. Should be able to navigate to a map view through the menu
> 2. Clicking on location in the site profile -> Should display site on the map in "selected" mode (i.e showing its details)
> 3. Clicking on a site on the map -> Should show additional information on the site
> 4. Should highlight the site if it is selected on the map

#### US 2.0.2 - Allow Admins to Add New Sites | Story Points: x
> **As** an Admin, **I want** to be able to add a new site through the app UI, **so that** I am not limited to direct database inserts.

> **Acceptance Tests**

> 1. Existing site name or existing location is entered -> Warn user of possible duplicate
> 2. Required Information is missing (name, description, location, etc.) -> Prevents user from adding site and required fields are highlighted 

#### US 2.0.3 -  | Story Points: x
> **As** an Admin, **I want** to deactivate and reactivate a site, **so that** I can toggle its visibility throughout the app

#### US 2.0.4 - | Story Points: x
> **As** an admin, **I want** to delete a site, **so that** I can remove incorrect or duplicate site information
>  TODO, ADDRESS COMMENTS: How does this cascade, and affect user stats (site visits, their inspection history)?

#### US 2.0.5 - | Story Points: x
> TODO: As an admin I just want to be able to edit the sites if a steward was the one who inspected the site, so that _______

> Needs clarification on if the admin can edit steward-submitted inspections (limited to certain fields?), or the site’s details?

#### US 2.0.6 - | Story Points: x
> As a the admin i want to see sites classified by controlled types, regions, subregions, and counties, so that filtering and reporting remain consistent.
> TODO, ADDRESS COMMENTS: This is somewhat implemented in the homepage but can also be added to the map. Additional filters can include which sites “Need Attention”.
> REVISED SUGGESTION: 2.0.6 As a user, I want to be able to search and filter sites on a map by county, so that I can easily find the site I am looking for

#### US 2.0.7 - | Story Points: x
> As a user, I want to be able to upload images of a site directly, so that others can see the recent state of the site

#### US 2.0.8 - | Story Points: x
> As a user, I want a section in the inspection form to upload images, so that I can easily submit images with other inspection details

#### US 2.0.9 - | Story Points: x
> As a user, I want to be able to remove images, so that inaccurate depictions of a site are not shown to others
> TODO, ADDRES COMMENTS: Allow permission to certain stewards or only admin roles? 

#### US 2.0.10 - | Story Points: x
> As a SAPAA user, I want to view a place’s identity, location, classification, status, assigned people, and related inspections so that I can understand the place before taking action.
> TODO, ADDRES COMMENTS: This is implemented in the homepage, clicking a site shows its details. Additionally we can add user story:
> REVISED SUGGESTION: 2.0.10 As a user, I want to be able to see a site’s details by clicking on the site from the map view, so that I can easily gather context on the site while exploring the map

#### US 2.0.11 - | Story Points: x
> As an admin I want to view significant changes made to a place so that I can understand how and why its record changed.
> TODO, ADDRESS COMMENTS: Need clarificarion: Update history? changes to naturalness and other stats overtime?

---
### **3 - Admin Persona**
---
#### US 3.0.1 - | Story Points: x
> As an admin, I want to see what a steward can access and what they cannot and have special permissions set for them
> TODO, ADDRESS COMMENTS: Viewing permission roles already implemented, possible additions can be:
> 3.0.x As an admin, I want to switch my view to “as a steward”, so that I can see what the steward role sees
> 3.0.y As an admin, I want to revoke a users access, so that they can no longer use the app
    > Acceptance Criteria:
        > When a user with revoked access attempts to log in, they should see a message that “do not have access”
        > When a user with revoked access attempts to sign up with the same email,  they should see a message that the email is taken
        > When a user is revoked access, I should still be able to view their profile and historical contributes with their profile status as “deactivated”
    > The current workaround to this is to set user access back to “pending”. There should be a separate status to denote if a user was removed. There is a similar story to deactivate a users account, is that satisfied by this?
> Follow up questions:
    > Do want to distinguish roles + use cases in the website for different types of stewards? for example, government stewards vs those that are just interested? What entities in the app can a steward edit?

#### US 3.0.2 - | Story Points: x
> As an admin, I want to assign one or more users to one or more places, so that stewardship responsibility is explicit and maintainable.
> TODO, ADDRESS COMMENTS: Is assigning a user to inspect a site an intended use case? If so, what are the types of inspections, does the assigner set this type? Should all admins be allowed to assign a user or do we want to differentiate admins (can assign) vs superadmins (developers)?
> Additional user stories should be made to surface who is assigned where (to the manager), progress of assigned inspections (to the manager), the assignees own progress on assigned inspections

#### US 3.0.3 - | Story Points: x
> As an admin, I want to be able to search and filter users, so that ________
> TODO, ADDRESS COMMENTS:  Search and filters are already implemented in Account management. What additional filters do we want, if any? Is this functionality desired on other pages? fill in reason in “so that …”

#### US 3.0.4 - | Story Points: x
> As an admin, I want to group steward by permissions and traits, so that _____
> TODO, ADDRESS COMMENTS: Group where and what traits? Assign then to an organization group, and if so we need to plan that organization in the db? Is this satisfied by the search and filters user story, if we allow filtering on permissions (i.e “Approval Status”)?

#### US 3.0.5 - | Story Points: x
> As an admin, I want to export stewards names and their positions in bulk so that I can know what is going on with my memberships and whatnot, so we can gamify shit.
> TODO, ADDRESS COMMENTS: - How does this scale, do we allow export for all stewards?
> Is this use case geared towards admins who can assign stewards to inspect sites, limiting the export to users they manage? see US 3.0.2

#### US 3.0.6 - | Story Points: x
> As an admin, I want to be able to update a person’s information so that member records are up-to-date
> TODO, ADDRESS COMMENTS: What information?

#### US 3.0.7 - | Story Points: x
> As an admin, I want to see a history of admin actions I have performed such as role changes, status changes, site assignments, and etc., so that I can keep track of my work and hold myself accountable

---
### **4 - General Features**
---
#### US 4.0.1 - | Story Points: x
> As a user, I want to be able to view site data offline, so that I can read its details during my visit without needing to be online
#### US 4.0.2 - | Story Points: x
> As a steward, I want offline/online map layers, so that I can navigate complex areas.
#### US 4.0.3 - | Story Points: x
> As a steward, I should be able to see and continue drafts of my site inspections that are autosaved, so that I can resume my progress in the event I lose connection
#### US 4.0.4 - | Story Points: x
> As a steward, I want to be able to edit my previous inspections, so that I can easily fix incorrectly submitted entries
> TODO, ADDRESS COMMENT: Should this go through admin approval?


---

## 3. MoSCoW section as it stands on the branch (verbatim, UNCHANGED from Winter 2026)

## MoSCoW

The **MoSCoW method** is used to prioritize user stories based on their criticality and impact.  
Each user story is categorized into one of the following priority levels:

- **Must-have**  
  Essential requirements that are critical for the application to function.

- **Should-have**  
  Important features that are not strictly essential but add significant value.

- **Could-have**  
  Desirable features that enhance the application but are not required for core functionality.

- **Would Like But Won’t Get**  
  Features that are out of scope for the current project or deferred for future consideration.

### Must Have
* US 1.0.1 – Access Site Inspection Form on Web Application
* US 1.0.2 – Add Personal Information to Site Inspection Form (Q11, Q12, Q13, Q14, Q16, Q24)
* US 1.0.3 – Liability Check (Q2)
* US 1.0.4 - Have Access to the Terms and Conditions of Inputting Information (Q3) 
* US 1.0.5 – Add Details Regarding the Overview of my Visit (Q21, Q22, Q23, Q25)
* US 1.0.6 - Rank the Health of the Site (Q31, Q32, Q33)
* US 1.0.7 - Add Details Regarding How the Trip Went (Q41, Q41.1, Q42, Q43)
* US 1.0.8 - Address What Amenities are in the Site (Q51)
* US 1.0.9 – Designation as a Protected Site (Q55)
* US 1.0.10 - Indicate submissions to iNaturalist (Q53, Q68)
* US 1.0.11 - Address details of Landscape changes (Q54)
* US 1.0.12 - Address any Biological Observations that are in the Site (Q52, Q68)
* US 1.0.13 - Address Any Human Disturbances  (Q61 - Q66)
* US 1.0.14 - Add Other Comments (Q56, Q67, Q74, Q82)
* US 1.0.15 – Inform SAPAA of Any Restorative Work that Needs to be Done / Was Done (Q71, Q72)
* US 1.0.16 - Add Any Photography Captured During Visit (Q81)
* TASK 1.0.21 - View and understand the Supabase and decide if it is suitable
* US 1.0.22 - (User) Edit My Site Inspections Form 
* US 1.0.23 - Non-Public Information (Q73, Q83)
* US 1.0.26 – Persist Site Inspection Form Draft
* US 1.0.27 – Enforce Required Questions on Site Inspection Form
* US 1.0.28 – Autofill Applicable Form Questions
* TASK 1.0.29 - Refactor the Database Schema and Produce an Updated ER Diagram
* US 2.0.1 - Manage the uploading and storing of site inspection images
* TASK 2.0.5 - Discover other suitable image storage platforms
* US 2.0.7 - Admin Management of Media Files
* US 2.0.8 - User Upload of Standalone Site Images

### Should Have
* US 1.0.24 – Modify my Site Inspections Form Questions
* US 1.0.25 – Hide a Site Inspections Form Question
* US 1.0.30 - Rich Text Editor for Site Inspection Form Description
* US 2.0.2 – Image Metadata
* US 2.0.3 - Gallery View
* TASK 2.0.6 - Refactor Report Rendering to Use Updated Database Schema
* US 4.0.1 - PDF Generation
* US 4.0.3 - Update Site Profile of a Particular Site
* US 4.0.4 - Disable Site Profile of a Particular Site
* US 5.0.1 - Admin Approval of Users
* TASK 6.0.1 – Web Application Responsiveness
* TASK 6.0.2 – Front-End Error Handling & Validation 
* TASK 6.0.3 – Inspection Fields Integration

### Could Have
* US 1.0.17 - (Admin) Add Questions Site Inspections Form
* US 1.0.18 - Adding image caption
* US 1.0.19 - Admin Viewing Images and Metadata
* US 2.0.9 – Homescreen Gallery View
* US 5.0.2 - Sign out feature

### Would Like But Won't Get
* US 1.0.20 - Admin Editing Image Metadata
* US 2.0.4 - Offline Image Viewing
* US 3.0.1 - Access the mobile version of the Site Inspection Form
* US 3.0.2 - Offline Data Syncing



---

## 4. Gaps and contradictions in the PR

### 4.1 The MoSCoW section was not touched — it prioritizes stories that no longer exist
This is the biggest problem. The new `## User Stories` section defines **23 stories across 4 new sections** (1 People Management, 2 Place Management, 3 Admin Persona, 4 General Features). The `## MoSCoW` section directly below it still lists the **Winter 2026** backlog: `US 1.0.1 – Access Site Inspection Form on Web Application`, `US 1.0.16 - Add Any Photography`, `US 2.0.7 - Admin Management of Media Files`, `TASK 6.0.1`, etc. None of those IDs exist in the new list, and every new ID is either absent from MoSCoW or **collides with a different Winter story**:

| New ID (Alissa) | Winter ID, same number, different story |
|---|---|
| US 1.0.1 Add User Profiles | US 1.0.1 Access Site Inspection Form on Web Application |
| US 1.0.2 Allow Editing Own Profile | US 1.0.2 Add Personal Information to Site Inspection Form |
| US 2.0.1 View Sites on an Interactive Map | US 2.0.1 Manage uploading/storing of site inspection images |
| US 2.0.8 Upload images in inspection form | US 2.0.8 User Upload of Standalone Site Images |
| US 3.0.1 Steward permissions visibility | US 3.0.1 Access the mobile version of the Site Inspection Form |
| US 4.0.1 View site data offline | US 4.0.1 PDF Generation |

Every new story is unprioritized, and the MoSCoW list now reads as prioritizing the *previous* team's completed work.

### 4.2 Downstream docs still point at the old numbering
`docs/project-management.md` contains **80 references** to the Winter US IDs (sprint tables, task assignments, story points: `US 1.0.1 – Access Site Inspection Form on Web Application|3|`, etc.). The renumbering silently invalidates all of them. `docs/meeting-minutes.md` also references US numbers. Neither is updated in this PR.

### 4.3 Merge collision with Zanab's work already on `origin/main`
`origin/main` moved ahead to `18e1785` ("Update executive summary and add similar products section", Zanab-Akbar, 2026-09-21) **after** Alissa branched. That commit:
- rewrote the Executive summary into 3 paragraphs (adds the People/Place Management v2.0 framing, marks mobile as out of scope this semester),
- added **People Management** and **Place Management** glossary entries,
- moved `## Similar Products` from before `## Open-source Projects` to the end of the file.

Alissa's branch still carries the **old single-paragraph exec summary**, no People/Place glossary entries, and Similar Products in the old position. Merging as-is will conflict, and a careless resolution silently reverts Zanab's edits. Note the irony: Zanab's new glossary defines "People Management" and "Place Management" — exactly the section names Alissa introduced — so the two PRs are describing the same reorganization from opposite ends and neither references the other.

There is also **PR #3** (`Zanab-Akbar-patch-1`, OPEN) on top of `origin/main`, which adds a single whitespace line to `docs/index.md` at line 30 — inside the glossary block Alissa's branch does not have. Also conflicts.

### 4.4 Story-point column is a placeholder everywhere
Every single story reads `| Story Points: x`. No estimation has happened. Sprint planning cannot proceed from this document.

### 4.5 Many stories are malformed as user stories
- **Missing titles:** US 2.0.3 through 2.0.11, and all of section 3 and 4, have an empty title (`#### US 2.0.3 -  | Story Points: x`). Only 1.0.1, 1.0.2, 2.0.1, 2.0.2 have titles.
- **Missing "so that":** US 3.0.1 ("I want to see what a steward can access and what they cannot and have special permissions set for them") has no benefit clause. US 3.0.3 and 3.0.4 have literal `so that ________` / `so that _____` blanks left for the client.
- **Acceptance tests only exist for 4 stories** (1.0.1, 1.0.2, 2.0.1, 2.0.2). The other 19 have none. The Winter doc had acceptance tests for every story — this is a regression in document quality that a marker will notice.
- **US 2.0.5 is not a story at all**, it is a note to self: `TODO: As an admin I just want to be able to edit the sites if a steward was the one who inspected the site, so that _______`.

### 4.6 Unprofessional text that will be read by the client
US 3.0.5 ends: *"so that I can know what is going on with my memberships and whatnot, so we can gamify shit."* This is a verbatim quote from an elicitation session left in the requirements doc. It is in a PR whose stated purpose is to raise questions **with Frank Potter**. Must be rewritten before the client sees it.

Typos: "ADDRES COMMENTS" (twice, US 2.0.9 and 2.0.10), "clarificarion" (US 2.0.11), "a map with landmarked sites, , so that" (double comma, US 2.0.1), "so that I can I can keep my details" (US 1.0.2).

### 4.7 Internal contradictions / open loops flagged by Alissa herself
- **US 3.0.1 vs "deactivate a user":** Alissa writes "There is a similar story to deactivate a users account, is that satisfied by this?" — that sibling story does not appear anywhere in the document. It was either dropped in the dedup pass or never written.
- **US 2.0.4 (delete a site)** asks how deletion cascades into user stats — which depends on the gamification stats in section 1's TODO block, which are themselves undecided. Circular dependency between two unresolved items.
- **US 2.0.7 (upload images directly) vs US 2.0.8 (upload images in the inspection form)** overlap with the already-shipped Winter `US 2.0.8 – User Upload of Standalone Site Images` and `US 1.0.16 – Add Any Photography`. The PR does not say whether these are new work or re-statements of shipped features. Several of Alissa's own TODO notes admit this ("This is implemented in the homepage", "Search and filters are already implemented in Account management", "Viewing permission roles already implemented"), which raises the question of how much of this backlog is actually new scope.
- **Section 1 has only 2 real stories** plus a bullet list of ~15 undecided gamification ideas. If the client says yes to the leaderboard/streak/badge set, section 1 roughly triples in size and the semester's scope changes materially. This is the single largest scoping risk in the document.

### 4.8 Missing entirely (acknowledged by the PR author)
"DEV, scrum master, and product tasks not yet included." The Winter doc had `TASK 1.0.21`, `TASK 1.0.29`, `TASK 2.0.5`, `TASK 2.0.6`, `TASK 6.0.1-3` — infrastructure/refactor work items. None carried forward.

### 4.9 Mechanical / build issues
- `mkdocs.yml` is **not updated**. `docs/index-WINTER2026.md` is not in the `nav:` block, so MkDocs will emit a "not included in the nav configuration" warning on every build (the gh-pages workflow runs `mkdocs build --clean`, without `--strict`, so it will not fail the build — but it is noise, and the page ships publicly at an unlinked URL).
- `mkdocs.yml` still reads `site_name: Winter 2026 SAPAA Project`. Stale for a Fall 2026 team; unrelated to this PR but visible on the published docs site.
- PR #2 is still marked **DRAFT**, so it cannot be merged without being marked ready.

---

## 5. Questions for Frank Potter extracted from the PR

These are the client-facing questions Alissa embedded in the document, consolidated:

**People / organization structure**
1. Are we introducing an organization structure (manager roles that assign inspections to stewards under their supervision)? If so, where should that relationship be displayed — user profile, manager-restricted view, or a dedicated organization page?
2. Should users be able to favourite sites, and should the favourite count show on the map or site profile?
3. How should user activity and contributions be displayed? Options raised: top-inspector leaderboard (per-site or global), daily/weekly streaks, ranked top activities (how many? over what date range?), expandable activity timeline or table.
4. Which stats/badges are wanted: hours on site, sites visited, first-inspector-for-a-site badge, badges for "needs attention" sites, badges for richer reports (e.g. including an image), badges for N+ activities at one site, badges for inspecting a site N+ times.
5. Do we distinguish steward types (e.g. government stewards vs. interested members)? What entities can a steward edit?

**Sites / places**
6. When an admin deletes a site, how does it cascade — what happens to user stats (site visits, inspection history)?
7. Can an admin edit a steward-submitted inspection? Limited to certain fields? Or only the site's own details? (US 2.0.5 is unresolved on this point.)
8. Who can remove images — all stewards, certain stewards, or admins only?
9. For "view significant changes made to a place": does this mean an update/audit history, or tracking naturalness and other stats over time?
10. Should stewards be able to edit their previous inspections directly, or does that go through admin approval?

**Admin**
11. Should admins be able to switch to an "as a steward" view?
12. Revoking access: current workaround is setting the user back to "pending" — do we want a distinct "removed/deactivated" status? (Proposed acceptance criteria are in US 3.0.1.)
13. Is assigning a user to inspect a site an intended use case? What are the inspection types, and does the assigner set the type?
14. Do we differentiate admins (can assign) from superadmins (developers)?
15. What additional user search/filter criteria are wanted beyond what Account Management already has, and on which pages?
16. "Group stewards by permissions and traits" — group where, and which traits? Is this satisfied by filtering on approval status instead?
17. Bulk export of steward names/positions: does this scale to all stewards, or is it scoped to the users a given admin manages?
18. "Update a person's information" — which fields?

---

## 6. Other remote branches

Local `main` was **2 commits behind** `origin/main` at the start of this investigation (`4f2f8d3` team canvas, `18e1785` Zanab exec summary).

### On `origin` (UAlberta-CMPUT401/F26project-SAPAA) — the course repo
| Branch | What it is |
|---|---|
| `main` | `18e1785`, current. Fall 2026 starting point: Winter's full codebase + docs. |
| `docs/project-requirements/user-stories` | Alissa's PR #2 (above). Docs only. |
| `Zanab-Akbar-patch-1` | PR #3, OPEN. One whitespace line added to `docs/index.md` glossary. Trivial; the substantive part of her work (`18e1785`) is already on `main`. |

No `Sprint-*` or `public-sprint-5` branches exist on `origin` — those live only on `upstream`.

### On `upstream` (SAPAA-Dev/W26Project-SAPAA-Dev-Team) — the client's repo
`upstream/main` is **10 commits behind** `origin/main` and contains **no commits absent from** `origin/main`. Everything below is history, not pending work.

| Branch | Content |
|---|---|
| `Sprint-4` | 266 commits behind `origin/main`, 0 ahead. Fully merged Winter Sprint 4 work. PR #3 upstream was CLOSED. Nothing unique. |
| `Sprint-4-test` | 311 behind / 10 ahead of `origin/main`, but the 10 are Winter-era webapp churn (package.json, tsconfig, ~17 files) already superseded. Test-integration branch, dead. |
| `public-sprint-5` | 120 behind / 15 ahead. Its 15 commits are Winter Sprint 5 UI fixes (responsive help button, duplicate header removal, ~20 files) — **all merged upstream via PRs #4, #5, #6 in March 2026** and carried into `main`. **Nothing here is missing from `main`.** There is no `Sprint-5` branch. |
| `image_extract` | 14 behind / 2 ahead. `vishalsivakumar2809`, Aug 2026: "cleaner admin UI for image downloads" + deps. **Never PR'd, never merged.** The only branch with plausibly-unlanded feature work — worth a look before anyone rebuilds admin image download UI. |
| `pdf_fix` | 12 behind / 0 ahead. "bulk and site pdf use job queue". Merged as upstream PR #29 (Aug 2026). Nothing unique. |
| `gh-pages` | 752 behind / 4 ahead. Build artifact branch — the MkDocs `site/` output deployed by `.github/workflows/gh-pages.yaml`. Not source. |

**Answer to "does public-sprint-5 contain features not on main":** No. It is fully merged and 120 commits behind. The only branch carrying anything not on `main` is `image_extract` (2 unmerged commits, admin image-download UI).

---

## 7. `.github/` contents

Only two files exist, on every branch:

- `.github/workflows/gh-pages.yaml` — MkDocs Material build, deploys `./site` to `gh-pages` via `peaceiris/actions-gh-pages@v4`. Triggers on push to `main` or `dev`, and on **every** pull_request. Runs on a `self-hosted` runner.
- `.github/workflows/test.yaml` — "Webapp CI". `npm ci` + `npm test -- --forceExit` in `webapp/`. Triggers on push to `main`/`Sprint-2`..`Sprint-5` and PRs from any branch. A `deploy` job (main pushes only) runs `docker-compose down && up -d --build` in `/home/ubuntu/deploy`. Also `self-hosted`.

**No** issue templates, **no** PR template, **no** CODEOWNERS, **no** project board config, **no** dependabot. Worth adding a PR template given the team is running doc-heavy PRs with no review checklist — PR #2 has sat as a draft with zero comments.

Note: `test.yaml` references branches `Sprint-2` through `Sprint-5` that do not exist on `origin`. Fall 2026 branch naming (`docs/project-requirements/...`) does not match, though the `pull_request: branches: ['**']` rule means PRs still get tested.

---

## 8. Repo-history search for prior requirements docs

`git log --all --diff-filter=A --name-only | grep -iE "story|requirement|backlog|epic"` returns **nothing**. No file has ever been added under those names. All requirements have always lived in `docs/index.md` (plus the story map images `docs/images/F25_SAPAA_Storymap.png` and `docs/images/W26-SAPAA-Storymap.png`, and the externally-hosted Google Sheets traceability matrix embedded in `docs/traceability-matrix.md`).

This means Alissa's `docs/index-WINTER2026.md` is the **first** time the requirements doc has been forked rather than edited in place — and per her own PR description it "should be removed later". If it is not removed, the repo ships two competing requirements documents.
