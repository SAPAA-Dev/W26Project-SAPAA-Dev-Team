# Prior Team (W26) Story Map — Decoded

Source: `docs/images/W26-SAPAA-Storymap.png` (Winter 2026 team, 5 sprints, due Feb 1 – Mar 31).
Read by cropping/zooming the image. This is the **inherited backlog** — our story list must not
re-invent these, and must account for the ones that were planned but never finished.

## Main activities (their epics)

1. Site Inspection Workflow
2. Image Management System
3. Mobile Inspection App
4. Site Profile Management
5. User Account Management
6. User Accessibility

## User journey steps they mapped

- Access the Site Inspection Form from the SAPAA website
- Fill out the Site Inspection Form on the created web application
- Optionally upload images of their site inspection experience on the form
- Edit and manage previous inspections
- Admin control over form questions
- Upload and store inspection images
- Preserve and edit image metadata
- View images in gallery format
- Offline image access and caching
- Explore alternative storage platforms
- Mobile access to inspection form
- Offline data collection and syncing
- View site profiles
- Update/Delete site profiles
- PDF Generation of Site Reports
- Sign in/out
- UI Consistency with Error Handling and Responsiveness

## Sprint 1 (spikes / research)

- TASK 1.0.01 — Discover and understand the Supabase and decide if it is suitable
- Cross-reference questions with user stories
- Define form schema + validation rules
- TASK 2.0.0 — Discover other suitable image storage platforms ("budget is under CAD$50 per year")
- Research for a suitable image storage system
- Plan out architecture for the Site Inspection mobile application
- Define offline sync strategy
- Define site profile schema
- Map relational schema between sites and inspections

## Sprint 2 — Site Inspection Form stories (US 1.0.x)

| ID | Story | SP |
|---|---|---|
| US 1.0.1 | Access Site Inspection Form on Web Application | 3 |
| US 1.0.2 | Add Personal Information to SIR [Q11-14 + Q16 + Q24 — Section: WhoRYou] | 1 |
| US 1.0.3 | Liability Check [Q2 — Section: General] — verify not a volunteer / not an emergency | 1 |
| US 1.0.4 | Access to Terms and Conditions of inputting information [Q3 — The Fine Print Up Front] | 1 |
| US 1.0.5 | Add Details Regarding the Overview of my Visit [Q21, Q22, Q23, Q25 — WhereRYou] | 1 |
| US 1.0.6 | Rank the Health of the Site [Q31-33 — Impression] | 1 |
| US 1.0.7 | Add Details Regarding How the Trip Went [Q41-43 — How Visit] | 1 |
| US 1.0.8 | Address What Amenities are in the Site [Q51 — Be There] | 1 |
| US 1.0.9 | Designation as a Protected Site [Q55 — Be There] | 1 |
| US 1.0.10 | **Indicate submissions to iNaturalist [Q53, Q68]** | 1 |
| US 1.0.11 | Address details of Landscape changes [Q54 — Be There] | 2 |
| US 1.0.12 | Address any Biological Observations in the Site [Q52, Q68 — Be There] | 1 |
| US 1.0.13 | Address Any Human Disturbances — Section 8 [Q61-Q66 — Not There] | 1 |
| US 1.0.14 | Add Other Comments [Q56, Q67, Q74, Q82] | 2 |
| US 1.0.15 | Inform SAPAA of Restorative Work that Needs to be Done / Was Done [Q71, Q72 — 2B Done] | 2 |
| US 1.0.23 | **Non-Public Information [Q73, Q83]** — write info that won't be published publicly so sensitive / SAPAA-only info isn't leaked | 2 |
| US 1.0.26 | **Persist Site Inspection Form Draft** — answers auto-saved as a draft so progress isn't lost on refresh/navigate/tab close | 5 |
| US 1.0.27 | Enforce Required Questions on Site Inspection Form | 3 |
| US 1.0.28 | Autofill Applicable Form Questions | 3 |
| TASK 1.0.29 | Refactor the Database schema and produce an Updated ER Diagram | — |

## Sprint 3 (pink row)

- US 1.0.18 — Add Any Photography Captured During Visit
- US 1.0.17 — Add Questions Site Inspections Form
- US 1.0.19 — Edit My Site Inspections Form
- US 1.0.24 — Delete Site Inspections Form Questions
- US 1.0.25 — Hide a Site Inspections Form Questions
- US 2.0.1 — Manage the uploading and storing of site inspection images
- US 2.0.5 — Image Metadata
- US 2.0.3 — Gallery View
- US 2.0.2 — Adding Image Identifier
- US 1.0.16 — Admin Viewing Images and Metadata

## Sprint 4 (orange row)

| ID | Story | SP |
|---|---|---|
| US 1.0.34 | **Rich Text Editor** — admin applies bold/underline/italic/link formatting to question subtext and section descriptions in the **form editor**, without knowing HTML | 3 |
| US 2.0.7 | Admin Management of Media Files — store with standardized metadata, linked to a site, search and manage images whether uploaded through an SIR or as standalone media | 13 |
| US 2.0.8 | User Upload of Standalone Site Images — upload standalone image without creating an SIR, store site-related photos with metadata even when not tied to a specific inspection report | 8 |
| US 4.0.1 | PDF Generation of SIRs — customizable PDF export of Site Inspection Reports, review historical site data, documentation for audits or stakeholders | 8 |
| US 4.0.3 | Update Site Profile of a Particular Site | 3 |
| US 4.0.4 | Disable Site Profile of a Particular Site | 3 |

## Sprint 5 (red row — last sprint, most likely to be unfinished)

| ID | Story | SP |
|---|---|---|
| US 1.0.20 | Admin Editing Image Metadata | 3 |
| US 2.0.6 | Home-screen Gallery View | 5 |
| US 3.0.1 | **Access the mobile version of the Site Inspection Form** — make observations and reports while in the field | 5 |
| US 3.0.2 | **Offline Data Syncing** — info gathered while offline automatically syncs once I regain connection, no manual re-keying | 8 |
| US 2.0.4 | **Offline Image Viewing** — reference previously viewed images without internet access | 5 |
| US 5.0.2 | Sign out feature — sign out of the app so the next person can't use the app through a different account | 2 |
| TASK 6.0.1 | Web Application Responsiveness — no horizontal scrolling, all features usable at any display size | — |
| TASK 6.0.2 | Front-End Error Handling & Validation — toast/alert banners for API failures, real-time field validation, prevent crashes | — |
| TASK 6.0.3 | Inspection Fields Integration — add `inspection_number` and `inspection_date` as required fields on every entry; modify schema + submission logic | — |

## What this tells us

- Their numbering scheme is `US <epic>.0.<n>`: 1 = Site Inspection Form, 2 = Images/Media,
  3 = Mobile, 4 = Site Profiles, 5 = Accounts/Auth, 6 = UI/accessibility tasks.
  **We should not collide with it** — pick a new scheme or continue it deliberately.
- Sprint 5 is where mobile + offline + responsiveness + error handling all landed. Per the
  Week 3 handoff call, the previous team did **no work on mobile at all** last semester, which
  means US 3.0.1, US 3.0.2 and US 2.0.4 are very likely **unfinished and inherited by us**.
- Several capabilities our draft backlog treats as new were already specified by them:
  autosave drafts (US 1.0.26), admin form-question CRUD (US 1.0.17/24/25/34), site profile
  update/disable (US 4.0.3/4.0.4), standalone image upload (US 2.0.8), image metadata
  management (US 1.0.20/2.0.5/2.0.7). **Verify what actually shipped before rewriting them.**
- Two ideas in their map are absent from our draft backlog entirely:
  **non-public / SAPAA-only fields (US 1.0.23)** and **iNaturalist submission indication (US 1.0.10)**.
