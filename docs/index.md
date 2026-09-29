# Project Requirements
<!--
Note this is based off: https://ualberta-cmput401.github.io/course-docs/project-expectations/#project-requirements

Fall 2026 checkboxes (2/6):
- Executive summary ☑
- Project glossary ☑
- User stories ☐
- Similar products ☑
- Open-source products ☑
- Technical resources ☑
-->


## Executive summary

SAPAA Stewards manage site inspections and observations in-app using sustainable, low-cost cloud data infrastructure that automatically ingests inspection data into a PostgreSQL database, enables Admin to manage the data, and generate PDF reports. One major focus of the implementation is towards scalable and cost-aware image management: inspection images are stored in AWS S3, providing a reliable, secure, and affordable solution for handling large volumes of media. This projects focuses to enhance overall file management as the app expands to integrate with iNaturalist and offers interactive maps that require storing files containing geographic location data like tracks, routes, and points of interest. 

For this semester, we are advancing the client's original vision with a version 1.1 and version 2.0 of the application.

Version 1.1 will be about fixing existing bugs pain points in the application, and improving the user experience. Below
you can find more detailed stories about these pain points, but the general focus is to polish the application for both
and users to the fullest extent so that it's ready for public release.

Version 2.0 will be about building out more ambitious features, such as the client's vision of People and Place
Management for v2.0, though with a narrower scope this semester: Admin's new ability to approve and manage user accounts
lays the groundwork for People Management, and updated Site profiles are a first step toward Place Management.
Additionally, there will be a focus on gamification throughout the application to enhance steward engagement.

The primary user is the Admin, who needs a reliable, maintainable system that eliminates manual data handling while retaining access to the data, report generation, and distribution. Further enhancements to user experience should motivate stewards to plan more visits and submit reports. Longer-term, the project aims to extend this to Android and iOS apps so stewards can easily log observations offline in the field if time permits in the semester.



## Project glossary

- **SAPAA:** Stewards of Alberta’s Protected Areas Association. A volunteer society that supports the stewardship of 
Alberta’s protected natural areas.

- **Natural Area:** One of the about 260 protected areas under Alberta's Wilderness Areas, Ecological Reserves, Natural
Areas and Heritage Rangelands (WAERNAHR) Act, which SAPAA primarily stewards. Provincial parks fall under the Parks Act
and are not SAPAA's focus.

- **Site:** A specific Natural Area monitored and reported on by SAPAA stewards.

- **Site Inspection:** A record of field observations, ecological conditions, safety notes, and steward activities for a
given Site.

- **Steward** A SAPAA volunteer responsible for visiting Sites and submitting inspection data.

- **Admin:** The SAPAA administrator responsible for managing Site Inspection data, generating official reports, and
distributing information to stewards.

- **SAPAA Stewards:** The web application that allows stewards to submit Site Inspection data easily and automatically
uploads data to the PostgreSQL database.

- **SIR-SAPAA:** same definition as "Sapaa Stewards"

- **SAPAA Stewards Mobile:** The mobile application, usable on both Android and iOS, that stewards can use while offline to submit their Site Inspection data

- **People Management**: A planned v2.0 capability to support and track the community of volunteer stewards, including individual activity history — intended to support future volunteer recognition. Partially addressed this semester via Admin user-approval workflows.

-  **Place Management**: A planned v2.0 capability to better display where a Site is and what activity has occurred
there, extending the geographic presentation on the SAPAA website. Partially addressed this semester via Site profile
editing.



     

## User Stories

### **1 - People Management**
---

#### US 1.0.1 - Add User Profiles | Story Points: 5
> As a **Steward**, **I want** to view my own profile and the profiles of other stewards, including their skills, focus areas and how many SIRs they have submitted, **so that** I can judge how credible an observer someone is and know whom to ask about a topic

> **Acceptance Tests**

> 1. Given I am viewing a profile, I am able to see the user's name, skills, focus area, contact info, and inspection count.
> 2. Given I am currently not viewing my profile, I can navigate to their own profile from the main menu.
> 3. Given I am on a site page, I can navigate to a profile by clicking on a user's inspection
> 4. Given I opened a users profile via their site inspection, I can navigate back to my previous page
> 5. Given the users details are changed in the database, When the profile page is reloaded, it shows the most recent stored value

#### US 1.0.2 - Allow Editing Own Profile | Story Points: 3
> As a **Steward**, **I want** to edit my own profile, including my skills and focus areas, **so that** my details stay up to date and other stewards know what I can help with

> **Acceptance Tests**

> 1. The user can only edit their own information. 
> 2. Requests to edit another users information should fail
> 3. Given I remove my name or email, When I select Save, Then the save is blocked and the name or email field is highlighted.
> 4. Given I enter valid values, When I select Save, Then the page shows the new values
> 5. Given I saved changes, When I sign out and sign in again, Then my profile shows the saved values
> 6. Given I add skills or focus areas, When I select Save, Then they are shown on my profile

#### US 1.0.3 - Show history of Site Inspections on a Steward's Profile | Story Points: 2
> As a **Steward**, **I want** to view the site inspections a steward has submitted across all sites, **so that** I know their level of contributions and experience

> **Acceptance Tests**

> 1. Given I am viewing a Stewards profile, I see a list of their previous inspections with corresponding site, and date submitted.
> 2. Given I am viewing a Stewards profile, I can click on a past inspection and view the submitted information
> 3. Given that a steward has chosen to hide certain fields, I am not able to see their answers when reading through their past SIRs

#### US 1.0.4 - Aggregate User Activity and Contributions on a user's profile | Story Points: 2
> As a **Steward**, **I want** to see quick stats on a user's activity, **so that** I can get a quick overview of their activity, and common activities

> **Acceptance Tests**

> 1. Aggregates accurately reflect the user's data (SIR count, Activities reported) 
> 2. Given that a steward has submitted a new report, their SIR count updates +1. 

#### US 1.0.5 - Earn Points for Inspection Activity | Story Points: 5
> As a **Steward**, **I want** to earn points for visiting Sites, contributing photos, and other inspection activity, **so that** I have a reason to visit more natural areas

> **Acceptance Tests**

> 1. Given I submit a SIR, When the submission succeeds, Then my activity points increases by the amount of activity-specific points I earend from the site 
> 2. Given I contribute a photo directly, When the upload succeeds, Then my activity points increase by the amount specified for uploading a photo for that site
> 3. Given I have activity points, When I open my profile, Then the current total is shown

---
### **2 - Place Management**
---

#### US 2.0.1 - View Sites and Past Visits on an Interactive Map | Story Points: 8
> As a **Steward**, **I want** a map that shows where a natural area is, if it has been visited and what other stewards have done there, **so that** I can know what to expect and do on my next visit

> **Acceptance Tests**

> 1. Given the map view is open, When it loads, Then every active Site is drawn with its boundary
> 2. Given a GPX track was uploaded for a Site, When I zoom to that Site, Then the track is drawn as a line in a style different from the Site boundary
> 3. Given I am on a Site's page, I can navigate where to view its location on the map
> 4. Given a Site is selected on the map, When the selection changes, Then only the newly selected Site is highlighted

#### US 2.0.2 - Allow Admins to Add New Sites | Story Points: 3
> As an **Admin**, **I want** to be able to add a new Site through the app UI, **so that** I am not limited to direct database inserts.

> **Acceptance Tests**

> 1. Given I am an Admin creating a site, I can manually select the boundary for a site
> 2. Given a Site with the same name already exists, When I enter it, Then a possible-duplicate warning is shown before the Site is saved
> 3. Given a required field (ex. name) is empty, site creation is blocked and the empty fields are highlighted
> 4. Given I am signed in as a Steward, When I send the create-Site request directly to the server, Then it is refused and no Site is created
> 5. Given a site was added, it appears in the search results for the site.
> 6. Given I am selecting a boundary for a site, site suggestions are given taking what already exists in the Alberta government KML but not in SIR-SAPAA

#### US 2.0.3 - Deactivate and Reactivate a Site | Story Points: 3
> As an **Admin**, **I want** to deactivate and reactivate a site, **so that** I can toggle its visibility throughout the app

> **Acceptance Tests**

> 1. Should be able to toggle a site between active and inactive
> 2. Site is deactivated -> Site no longer appears in site pickers, search results
> 3. Site is reactivated -> Site reappears everywhere it was previously listed
> 4. Given a site was deactivated, the inspections on the site can still be viewed
> 5. Given a new site was created, by default it should be active

#### US 2.0.4 - Delete a Site | Story Points: 8
> As an **Admin**, **I want** to delete a site, **so that** I can remove incorrect or duplicate site information

> **Acceptance Tests**

> 1. Given I am an admin deleting a site, I should be asked to confirm the delete before it occurs
> 2. Site has existing inspection reports or images -> Should show a confirmation naming how many records are affected before the delete proceeds
> 3. Site is deleted -> The agreed cascade behaviour is applied consistently to its inspections, images, and any user visit counts
> 4. Cascade cannot complete -> Deletion is rejected with an error and the site and all of its records are left unchanged

#### US 2.0.5 - Update a Site | Story Points: 5
> As an **Admin**, **I want** to update an existing site page with new fields from a designated steward, **so that** I can direct stewards where to seek out more information

> **Acceptance Tests**
 
> 1. Given that I am an admin, I can enter 'edit mode' on a site page 
> 2. Given that I am not an admin, I am prevented from entering edit mode
> 3. Given that I am on edit mode for a site page, I can easily tell which fields I have selected to be included/excluded from the site page.
> 4. On saving the update, the site page should have the new fields and remove those that were hidden

#### US 2.0.6 - Search and Filter Sites by County on the Map | Story Points: 5
> As a **Steward**, **I want** to search and filter Sites on the map by county, **so that** I can easily find the Site I am looking for

> **Acceptance Tests**

> 1. Given the map view is open, When I apply one or more filters, Then only Sites matching those filters stay on the map
> 2. Given a filter is applied, When I clear it, Then all active Sites reappear
> 3. Given I type a Site name in the search box, When I select the match, Then the map centres on that Site

#### US 2.0.8 - View a Site's Details From the Map | Story Points: 3
> As a **Steward**, **I want** to see a Site's details by selecting the Site on the map, **so that** I can gather context on the Site while exploring the map

> **Acceptance Tests**

> 1. Given the map view is open, When I select a Site, Then that Site's detail view opens
> 2. Given the detail view is open, When it loads, Then it shows the same name, county and last inspection date as the Site page reached from the home page
> 3. Given the detail view is open, When I select "View SIRs", Then I am directed to the past SIRs

#### US 2.0.9 - Upload a GPX Track of a Site Visit | Story Points: 5
> As a **Steward**, **I want** to upload the GPX file my GPS device or phone app recorded during a Site visit, **so that** the visit is logged and the next steward can see which part of the Site was already covered

> **Acceptance Tests**

> 1. Given I am a signed-in Steward on a Site's page, When I upload a valid .gpx file, Then the track is saved and linked to that Site and to my account
> 2. Given I upload a file that does not have a .gpx extension, a message pops up that only GPX files are accepted
> 3. Given I upload a file named .gpx that is not valid GPX or has no track points, then it is refused with a message and nothing is saved
> 4. Given I uploaded a track, When the stored track is read back, Then it has the same track points as the uploaded file
> 5. Given I choose a .gpx file larger than the stated maximum size, When I upload it, Then it is refused with a message that names the limit

#### US 2.0.10 - Add links to Site Page | Story Points: 1
> As a **Steward**, **I want** to click on a link to the SAPAA Website and iNaturalist from a site page, **so that** I can quickly navigate to learn more about natural areas

> **Acceptance Tests**
 
> 1. Given I am on the site page, I should see a clear link (shortened url) to SAPAA Website 
> 2. Given I am on the site page, I should see a clear link (shortened url) to iNaturalist
> 3. Given I click on a link from the site page, a new window should open to the site instead of using my current window

#### US 2.0.11 - Show Safety Information for a Site | Story Points: 5
> As a **Steward**, **I want** to know the nearest hospital, the known hazards at a Site, and other safety information, **so that** I can prepare for an emergency

> **Acceptance Tests**

> 1. Given safety information is stored for a Site, When I open the Site page, Then I see the nearest hospital, the known hazards, and the other safety information
> 2. Given a safety value is empty, When I open the Site page, Then that value is shown as not recorded
> 3. Given I am an Admin, When I save new safety information for a Site, Then a reload shows the new values
> 4. Given I am a Steward, When I try to change the safety information, Then the server refuses and the stored values stay unchanged

#### US 2.0.12 - Score a Site for To-Visit Priority | Story Points: 8
> As an **Admin**, **I want** to give a Site points for abuses, biological imperatives, and time since the last visit, and combine those points into a to-visit priority, **so that** a Steward can see the state of the Site and decide whether to prioritize contributions to it

> **Acceptance Tests**

> 1. Given I am an Admin on a Site, When I enter points for abuses, biological imperatives, and time since the last visit, Then those points are saved
> 2. Given the three scores are saved, When the Site page loads, Then it shows one to-visit priority calculated from those scores
> 3. Given two Sites have the same three scores, When both pages load, Then they show the same to-visit priority
> 4. Given I am a Steward, When I open the Site, Then I can see the to-visit priority and the three scores
> 5. Given I am a Steward, When I try to change the scores, Then the server refuses and the scores stay unchanged

#### US 2.0.13 - Flag Site Points That Are a Year Old | Story Points: 3
> As an **Admin**, **I want** to know when a Site's points have not been updated for a year, **so that** I have a reminder to reassess them

> **Acceptance Tests**

> 1. Given a Site's priority points (US 2.0.12) were last saved more than one year ago, When I open that Site as an Admin, Then I see a reminder to reassess the points
> 2. Given the points were saved less than one year ago, When I open the Site as an Admin, Then the reminder is absent
> 3. Given the reminder is showing, When I save new points, Then the reminder is absent and the saved date is the new date
> 4. Given I am a Steward, When I open the Site, Then the Admin reminder is not shown

---
### **3 - Admin Persona**
---

#### US 3.0.2 - Steward Designation | Story Points: 5
> As an **Admin**, **I want** to assign an individual for a site, **so that** other stewards can reach out to them for more information
> **Acceptance Tests**

> 1. Given I am an admin, I can search for a steward to assign to a site
> 2. Given I am an admin, I can assign a new steward, replacing the previous one
> 3. Given a steward is assigned to a site, The assigned relationship is visible on both the site's page and the steward's profile
> 4. Given a user who is not permitted to assign attempts to designate a steward, the action is rejected and no assignment is created

#### US 3.0.3 - Export all digital files from SIR-SAPAA | Story Points: 8
> As an **Admin**, **I want** to be able to extract all images and other digital files in the app at once, **so that** I can back them up and use them for business processing

> **Acceptance Tests**

> 1. Extracting files -> Should zip files 
> 2. Extraction should include all images, at minimum

---
### **4 - General Features**
---

#### US 4.0.2 - Offline and Online Map Layers | Story Points: 13
> As a **Steward**, **I want** offline/online map layers, **so that** I can navigate complex areas.

> **Acceptance Tests**

> 1. Should be able to download a map area for offline use and see its download status
> 2. Device is offline -> Downloaded tiles render and the map stays pannable and zoomable inside the downloaded area
> 3. Device is offline and the user pans outside the downloaded area -> Missing tiles are indicated rather than failing silently
> 4. Device is online -> The map uses live tiles and does not fall back to the cached layer

#### US 4.0.4 - Edit My Previous Inspections | Story Points: 5
> As a **Steward**, **I want** to be able to edit my previous inspections, **so that** I can easily fix incorrectly submitted entries

> **Platform:** Web

> **Acceptance Tests**

> 1. Given I have previously submitted a SIR, I can open it and enter edit mode
> 2. Given I am viewing another steward's SIR, I am prevented from entering edit mode and making changes
> 3. A required answer is cleared and submit is attempted -> submission is blocked and the missing questions are listed
> 4. An edit is saved -> The updated answers are reflected everywhere the report is rendered

#### US 4.0.5 - iNaturalist integration | Story Points: 5
> As a **Steward**, **I want** to be able to see the photos I took on iNaturalist in the app, **so that** I do not have to upload them a second time in my SIR

> **Acceptance Tests**

> 1. User can upload an image inside their SIR, by selecting imzges from their iNaturalist account
> 2. Identifier field is autofilled from iNaturalist observation


#### US 4.0.6 - Demote Photo Identifier to optional field | Story Points: 1
> As a **Steward**, **I want** to skip entering a photo Identifier, **so that** I do not have to repeat my description in this field

> **Acceptance Tests**

> 1. Given I leave the Identifier field empty and fill in all required fields in valid format, the report submits successfully
> 2. Given I am filling out a site inspection report, there is no note beside the identifier field that reads "required"

#### US 4.0.7 - Show the Top iNaturalist Observations for a Site | Story Points: 5
> As a **Steward**, **I want** to see up to the top 5 iNaturalist observations for a Site, **so that** I can see more information in the app without an iNaturalist account

> **Acceptance Tests**

> 1. Given a Site has iNaturalist observations, When I open the Site page, Then I see at most 5 observations
> 2. Given a Site has more than 5 observations, When the page loads, Then the 5 shown are the 5 most popular (engagement-wise) observations for that Site
> 3. Given a Site has no observations, When the page loads, Then the page says that no iNaturalist observations were found
> 4. Given I am a Steward with no iNaturalist account, When I open the Site page, Then the observations are still shown
> 5. Given an observation is shown, When I read it, Then it shows the species name from iNaturalist

---
### **5 - Access and Accounts**
--- 

#### US 5.0.2 - Reset a Forgotten Password | Story Points: 2
> As a **User**, **I want** to reset my password myself, **so that** I do not need an Admin to get back in

> **Acceptance Tests**

> 1. Given I am on the sign-in page, When I select "Forgot password" and enter my email, Then a reset link is sent to that email
> 2. given I requested to reset my password, I am asked to verify with a code before I can proceed to reset my password 
> 3. Given I received a reset link, When I open it and set a new password, Then I can sign in with the new password and not with the old one
> 4. No admin intervention is required at any step of resetting my password


#### US 5.0.4 - Sign Out Properly | Story Points: 2
> As a **User**, **I want** signing out to keep me signed out, **so that** the next person on a shared device cannot use my account

> **Acceptance Tests**

> 1. Given I signed out of the web app, When I open the app again in the same browser, Then the sign-in page is shown and I am not signed in
> 2. Given I signed out of the web app, When I press the browser Back button, Then no signed-in page is shown
> 3. Given I am on any page of the web app, I can sign out without navigating to a specific page

---
### **6 - Data and Places**
---

#### US 6.0.1 - Store Each Site's Geometry From the Shared Source | Story Points: 5
> As a **Steward**, **I want** each Site stored with its real boundary and location, taken from the same source the SAPAA website uses, **so that** the I can use either maps to tell where a site really is and the website and app never disagree about a Site's shape

> **Acceptance Tests**

> 1. Given a site already exists in the Alberta government KML the website uses, the site geometry the app uses is the exact same
> 2. Given the geometries are loaded, When a Site is read from the database, Then it has a stored boundary and a centre point (latitude and longitude)
> 3. Given the list of active Sites, When the load is finished, Then each Site has a geometry or is on a list of unmatched Sites for an Admin to fix
> 4. Given geocoding is still used for any Site (for example to fill a missing point), When it runs, Then results are cached and requests stay under the OpenCage free tier of 2,500 per day

---
### **7 - Inspections and Media**
---

#### US 7.0.1 - Let Stewards Export Their Own Reports | Story Points: 2
> As a **Steward**, **I want** to export my own SIR as a PDF, **so that** I can keep or share a copy of my report

> **Acceptance Tests**

> 1. Given I submitted a SIR, When I select Export PDF on it, Then a PDF of that SIR is downloaded
> 2. Given I am a Steward, When I request a PDF of a SIR I did not submit, Then the server refuses
> 3. Given a PDF of my SIR is generated, When I open it, Then it contains the same answers and photos as the SIR page

#### US 7.0.3 - See All Inspections in One View | Story Points: 5
> As an **Admin**, **I want** a summary across all SIRs rather than one Site at a time, **so that** I can report on the state of all Sites at once

> **Acceptance Tests**

> 1. Given SIRs exist for many Sites, When I open the all-SIR summary, Then it shows SIR counts per Site, per steward and per reason for the visit (Q42), and the spread of naturalness scores (Q31)
> 2. Given the summary is open, When I set a date range, Then every figure is recalculated for that range
> 3. Given I am a Steward, When I request the summary data directly, the request fails

#### US 7.0.4 - Compare One Question Across Years | Story Points: 5
> As a **Steward**, **I want** to pick one question and see how its answers changed over the years at a Site, **so that** I can see what is getting better or worse

> **Acceptance Tests**

> 1. Given a Site with SIRs from several years, When I choose one question, Then its answers are listed by date, oldest to newest
> 2. Given I choose Q63 (motorized disturbance), When the list loads, Then answers from every SIR for that Site are shown (SAPAA's own check: "Compare historical motorized disturbances across all inspections (Question 63)")
> 3. Given a question's wording was changed in the form editor, When I choose it, Then old and new answers stay grouped under the same Q-number

#### US 7.0.5 - Delete an Image and Clean Up After It | Story Points: 5
> As an **Admin**, **I want** deleting an image to remove it from view and remove the stored file, **so that** inaccurate images are not shown to others and deleted images stop costing storage money

> **Acceptance Tests**

> 1. Given I am an Admin, When I delete an image from a Site, Then it no longer appears in the Site gallery or in any report that shows that gallery
> 2. Given I am not allowed to delete images, When I view a Site gallery, Then no delete control is shown, and When I send a delete request directly, Then the server refuses
> 3. Given an image was deleted, When the S3 bucket is checked, Then its file is gone
> 4. Given an Admin deactivates a SIR, When the S3 bucket is checked, Then the SIR's image files are still there, so reactivating restores its photos
> 5. Given a SIR submission fails and is rolled back (rollbackSiteInspectionSubmission), When the S3 bucket is checked, Then the files uploaded for that SIR are gone

#### US 7.0.6 - Export More Than 50 Site Inspection Reports | Story Points: 5
> As an **Admin**, **I want** to export more than 50 Site Inspection Reports at once, **so that** I can back them up for my records faster

> **Acceptance Tests**

> 1. Given more than 50 SIRs exist, When I select more than 50 and export them, Then the export completes and contains each selected SIR
> 2. Given I export a set of SIRs, When I open the export, Then each SIR has the same answers as its page
> 3. Given I am a Steward, When I request the bulk export, Then the server refuses and no export is created
> 4. Given the export fails, When I check the SIRs, Then the stored reports are unchanged

#### US 7.0.7 - Hide Fields on a SIR Before Export | Story Points: 5
> As an **Admin**, **I want** to select fields to hide on a SIR before export, **so that** confidential or non-public fields stay out of the export

> **Acceptance Tests**

> 1. Given I am an Admin exporting a SIR, When I select fields to hide, Then those fields are marked for the export
> 2. Given I hid fields, When the export is generated, Then the hidden fields are absent and the other fields are present
> 3. Given I hid fields for an export, When I open the SIR page, Then the stored answers are still there
> 4. Given I am a Steward, When I request an export with hidden fields, Then the server refuses
> 5. Given I select no fields to hide, When I export, Then the export contains the full SIR

#### US 7.0.8 - Delete a Site Inspection Report | Story Points: 5
> As an **Admin**, **I want** to delete a Site Inspection Report, **so that** I can remove a report that is out of date or inaccurate

> **Acceptance Tests**

> 1. Given I am an Admin deleting a SIR, When I choose delete, Then I must confirm before the report is removed
> 2. Given I confirm the delete, When it succeeds, Then the report no longer appears on the Site or in report lists
> 3. Given the report has images, When the delete succeeds, Then those images are no longer shown with that report
> 4. Given I am a Steward, When I request the delete, Then the server refuses and the report stays unchanged
> 5. Given the delete cannot complete, an error is shown and the report and its answers stay unchanged

## MoSCoW

### Must Have

*10 stories, 38 story points.*

| ID | Story | Points |
|---|---|---|
| US 1.0.1 | Add User Profiles | 5 |
| US 1.0.2 | Allow Editing Own Profile | 3 |
| US 1.0.3 | Show history of Site Inspections on a Steward's Profile | 2 |
| US 1.0.4 | Aggregate User Activity and Contributions on a user's profile | 2 |
| US 2.0.1 | View Sites and Past Visits on an Interactive Map | 8 |
| US 2.0.2 | Allow Admins to Add New Sites | 3 |
| US 2.0.8 | View a Site's Details From the Map | 3 |
| US 2.0.9 | Upload a GPX Track of a Site Visit | 5 |
| US 5.0.2 | Reset a Forgotten Password | 2 |
| US 6.0.1 | Store Each Site's Geometry From the Shared Source | 5 |

### Should Have

*13 stories, 55 story points.*

| ID | Story | Points |
|---|---|---|
| US 2.0.3 | Deactivate and Reactivate a Site | 3 |
| US 2.0.5 | Update a Site | 5 |
| US 2.0.6 | Search and Filter Sites by County on the Map | 5 |
| US 2.0.10 | Add links to Site Page | 1 |
| US 2.0.11 | Show Safety Information for a Site | 5 |
| US 3.0.3 | Export all digital files from SIR-SAPAA | 8 |
| US 4.0.4 | Edit My Previous Inspections | 5 |
| US 4.0.5 | iNaturalist integration | 5 |
| US 4.0.6 | Demote Photo Identifier to optional field | 1 |
| US 5.0.4 | Sign Out Properly | 2 |
| US 7.0.5 | Delete an Image and Clean Up After It | 5 |
| US 7.0.7 | Hide Fields on a SIR Before Export | 5 |
| US 7.0.8 | Delete a Site Inspection Report | 5 |

### Could Have

*9 stories, 46 story points.*

| ID | Story | Points |
|---|---|---|
| US 1.0.5 | Earn Points for Inspection Activity | 5 |
| US 2.0.4 | Delete a Site | 8 |
| US 2.0.12 | Score a Site for To-Visit Priority | 8 |
| US 2.0.13 | Flag Site Points That Are a Year Old | 3 |
| US 4.0.7 | Show the Top iNaturalist Observations for a Site | 5 |
| US 7.0.1 | Let Stewards Export Their Own Reports | 2 |
| US 7.0.3 | See All Inspections in One View | 5 |
| US 7.0.4 | Compare One Question Across Years | 5 |
| US 7.0.6 | Export More Than 50 Site Inspection Reports | 5 |

### Would Like But Won't Get

*2 stories, 18 story points.*

| ID | Story | Points |
|---|---|---|
| US 3.0.2 | Steward Designation | 5 |
| US 4.0.2 | Offline and Online Map Layers | 13 |

## Open-source Projects
* [LimeSurvey](https://www.limesurvey.org/)
    - **What it is:** Open-source alternative to survey platforms like Google Forms
    - **How we’ll use it (external interface):**  
      - Get ideas from the code about how we can structure our web application to handle the Site Inspection form
     

* [Ecorismap](https://ecorismap-pro.web.app/)
    - **What it is:** Open-source offline application for recording and checking location information during field surveys
    - **How we’ll use it (external interface):**  
      - Analyze the way the code handles offline data recording and the cross-platform React Native app structure

## Technical Resources

Documentation and references the team expects to rely on this term.

**Platform and backend**

* [Supabase documentation](https://supabase.com/docs) - Postgres, Auth, Storage and Row Level Security. The Row Level Security guide matters most to us, since our current authorisation gap is that permissions are not enforced server side.
* [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - the mechanism we plan to use to stop users editing their own roles.
* [PostgREST](https://postgrest.org/) - Supabase's query layer. Worth reading because a Google Apps Script in this repo writes to the database through it directly.
* [What is Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) - inspection images and generated PDFs are stored here. Presigned URL docs are the relevant part.

**Frontend and mobile**

* [Next.js App Router](https://nextjs.org/docs/app) - the web application is built on this. The Server Actions page is important: every exported function in a `'use server'` file is a public endpoint, which is the root of our authorisation problem.
* [React documentation](https://react.dev/)
* [Expo documentation](https://docs.expo.dev/) - the mobile application uses Expo. EAS Build is what we would need for publishing.
* [Leaflet](https://leafletjs.com/reference.html) - the existing map and heat map.

**Geographic data**

* [OpenStreetMap wiki](https://wiki.openstreetmap.org/) - the tile source the map uses.
* [OpenCage geocoding API](https://opencagedata.com/api) - currently used to look up site positions from their names. The free tier allows 2,500 requests a day, which is a constraint on any map work.

**Testing and delivery**

* [Jest](https://jestjs.io/docs/getting-started) and [Cypress](https://docs.cypress.io/) - the test frameworks already in the repository.
* [GitHub Actions](https://docs.github.com/en/actions) - including self hosted runners, which the Sprint 3 rubric requires.
* [Vercel documentation](https://vercel.com/docs) - the deployment platform.

**Process**

* [Belbin team roles](https://www.belbin.com/about/belbin-team-roles)
* [Nielsen's ten usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) - required by the Sprint 3 user interface rubric.
* [WCAG contrast checker](https://accessibilityaid.com/free-tools/colour-contrast-checker) - also Sprint 3.

## Backend: Supabase + PostgreSQL + AWS
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
 

