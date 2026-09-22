# Project Requirements


## Executive summary

SAPAA currently manages site inspection data through a manual pipeline. Stewards submit observations via Google Forms, Admin converts them in MS Excel, and the results are stored in a local MS Access database. This project replaces that temporary setup with a sustainable, low-cost cloud data infrastructure that automatically ingests inspection data into a PostgreSQL database, enables Admin to manage the data, and generate PDF reports. A major focus of our implementation is scalable and cost-aware image management: inspection images are stored in AWS S3, providing a reliable, secure, and affordable solution for handling large volumes of media.

This work also advances the client's original vision of People and Place Management for v2.0, though with a narrower scope this semester: Admin's new ability to approve and manage user accounts lays the groundwork for People Management, and updated Site profiles are a first step toward Place Management.

The primary user is the Admin, who needs a reliable, maintainable system that eliminates manual data handling while retaining access to the data, report generation, and distribution. Longer-term, the project aims to extend this to Android and iOS apps so stewards can log observations offline in the field if time permits in the semester.



## Project glossary

- **SAPAA:** Stewards of Alberta’s Protected Areas Association. A volunteer society that supports the stewardship of Alberta’s protected natural areas.

- **Natural Area:** A provincially designated protected land, such as a Provincial Park, Wildland Park, Wilderness Area, Ecological Reserve, or Natural Area, managed by Alberta Parks.

- **Site:** A specific Natural Area monitored and reported on by SAPAA stewards.

- **Site Inspection:** A record of field observations, ecological conditions, safety notes, and steward activities for a given Site.

- **Steward** A SAPAA volunteer responsible for visiting Sites and submitting inspection data.

- **Admin:** The SAPAA administrator responsible for managing Site Inspection data, generating official reports, and distributing information to stewards.

- **SAPAA Stewards:** The web application that allows stewards to submit Site Inspection data easily and automatically uploads data to the PostgreSQL database.

- **SAPAA Stewards Mobile:** The mobile application, usable on both Android and iOS, that stewards can use while offline to submit their Site Inspection data
- **People Management**: A planned v2.0 capability to support and track the community of volunteer stewards, including individual activity history — intended to support future volunteer recognition. Partially addressed this semester via Admin user-approval workflows.

-  **Place Management**: A planned v2.0 capability to better display where a Site is and what activity has occurred there, extending the geographic presentation on the SAPAA website. Partially addressed this semester via Site profile editing.



     

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




## Open-source Projects
* [Supabase](https://supabase.com/)
    - **What it is:** Open-source backend (managed Postgres + Auth + Storage + Edge Functions).
    - **How we’ll use it (external interface):**  
      - PostgreSQL as the **system of record** for inspections/sites.  
      - Storage for **images** and generated **PDF reports**.  
      - Auth + **Row-Level Security (RLS)** to separate Admin vs Reader access.  
      - **Edge Functions / cron** to build nightly **offline data bundles** (JSON + thumbnails + PDFs).
    - **Reference/inspiration:** Supabase’s PostgREST and RLS patterns for secure CRUD without a custom API layer.
    - **Source of insights:** Example implementations for file storage policies and signed URLs.
    - **Risks/notes:** Free-tier and pricing limits can change; large media can impact storage/egress. We’ll set a monthly budget cap in the Project Plan and monitor usage.

* [LimeSurvey](https://www.limesurvey.org/)
    - **What it is:** Open-source alternative to survey platforms like Google Forms
    - **How we’ll use it (external interface):**  
      - Get ideas from the code about how we can structure our web application to handle the Site Inspection form
     

* [Ecorismap](https://ecorismap-pro.web.app/)
    - **What it is:** Open-source offline application for recording and checking location information during field surveys
    - **How we’ll use it (external interface):**  
      - Analyze the way the code handles offline data recording and the cross-platform React Native app structure

## Cloud Services & Infrastructure
* [AWS S3](https://aws.amazon.com/s3/)
    - **What it is:** Object storage service for scalable and cost-effective file storage.
    - **How we’ll use it (external interface):**  
      - Store all uploaded site inspection images.  
      - Serve images via signed URLs for secure, time-limited access.  
      - Separate media storage from the core database to reduce costs.
    - **Reference/inspiration:** Standard architecture pattern for media-heavy applications.
    - **Source of insights:** AWS S3 best practices for IAM policies, bucket privacy, and lifecycle rules.
    - **Risks/notes:** Misconfigured permissions can expose data; billing alerts and access policies will be enforced.

## Technical Resources
### Backend: Supabase + PostgreSQL + AWS
  * [Supabase Documentation](https://supabase.com/docs)  
  * [PostgreSQL Documentation](https://www.postgresql.org/docs/) 
  * [Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) 


### Cloud Infrastructure & Cost Control
  * [AWS IAM](https://docs.aws.amazon.com/iam/)
  * [AWS Budgets & Billing Alerts](https://docs.aws.amazon.com/cost-management/)

### Deployment: Cybera
  * [Cybera Documentation](https://wiki.cybera.ca/spaces/RAC/pages/8880558/Rapid+Access+Cloud)

### Mobile: React Native
  * [React Native Documentation](https://reactnative.dev/docs/getting-started)

### Testing & Tools
  * [Jest Testing Framework](https://jestjs.io/)
  * [Postman](https://www.postman.com/) for API testing

## Similar Products

* [Park Protector](https://playgroundguardian.com/solutions/playground-inspection-software/)  
    - High/low frequency inspections, multi-site management, reporting, and scheduling  
    - Scheduling inspections across many sites and recurring inspection plans
    - Inspiration: Similar inspection history for each site and export capabilities
    - Useful to SAPAA: A system that monitors inspection reports is similar to SAPAA’s site inspection reports
* [iNaturalist](https://www.inaturalist.org/)  
    - A community platform for sharing and identifying nature observations.
    - Inspiration: offers ideas for building intuitive photo galleries, tagging ecological attributes, and storing long-term environmental data.
    - Relevant to SAPAA: helps shape how inspection data can be organized to show ecological change over time.
* [Avenza Maps](https://store.avenza.com/)  
    - A mobile app for offline maps and PDF map layers.
    - Inspiration: highlights clear workflows for downloading, caching, and updating large data bundles for offline use.
    - Relevant to SAPAA: directly applicable to the Field Notes Reader, which requires offline access to inspection data and reports.
 

