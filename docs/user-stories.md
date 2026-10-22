# User Stories

## Charter Projects

The client's project charters are on the SAPAA page [Student Opportunities – 2026 to 2027](https://sapaastewards.com/2026/06/03/student-opportunities-2026-to-2027/). The charter projects are:

- 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements
- 2 – SIR-SAPAA v2.0: 2a – Development Environment, 2b – Person Management, 2c – Map Management
- 3 – SAPAA and iNaturalist: 3a – iNaturalist Internal Improvements, 3b – iNaturalist for non-Naturalist

The line below each story title names the one charter project that is the best match for the story. If the line says "none (team request)", the story is not in a charter project.

---
## 1 - People Management
---

### US 1.0.1 - Add User Profiles | Story Points: 5
*Charter project: 2b – Person Management*

> As a **Steward**, **I want** to view my own profile and the profiles of other stewards, including their skills, focus areas and how many SIRs they have submitted, **so that** I can judge how credible an observer someone is and know whom to ask about a topic

> **Acceptance Tests**

> 1. Given I am viewing a profile, I am able to see the user's name, skills, focus area, contact info, and inspection count.
> 2. Given I am currently not viewing my profile, I can navigate to my own profile from the main menu.
> 3. Given I am on a site page, I can navigate to a profile by clicking on a user's inspection
> 4. Given I opened a user's profile via their site inspection, I can navigate back to my previous page
> 5. Given the user's details are changed in the database, When the profile page is reloaded, Then it shows the most recent stored values

### US 1.0.2 - Allow Editing Own Profile | Story Points: 3
*Charter project: 2b – Person Management*

> As a **Steward**, **I want** to edit my own profile, including my skills and focus areas, **so that** my details stay up to date and other stewards know what I can help with

> **Acceptance Tests**

> 1. The user can only edit their own information.
> 2. Requests to edit another user's information should fail
> 3. Given I remove my name or email, When I select Save, Then the save is blocked and the name or email field is highlighted.
> 4. Given I enter valid values, When I select Save, Then the page shows the new values
> 5. Given I saved changes, When I sign out and sign in again, Then my profile shows the saved values
> 6. Given I add skills or focus areas, When I select Save, Then they are shown on my profile

### US 1.0.3 - Show history of Site Inspections on a Steward's Profile | Story Points: 2
*Charter project: 2b – Person Management*

> As a **Steward**, **I want** to view the site inspections a steward has submitted across all sites, **so that** I know their level of contributions and experience

> **Acceptance Tests**

> 1. Given I am viewing a Steward's profile, I see a list of their previous inspections with the corresponding site and date submitted.
> 2. Given I am viewing a Steward's profile, I can click on a past inspection and view the submitted information
> 3. Given that a steward has chosen to hide certain fields, I am not able to see their answers when reading through their past SIRs

### US 1.0.4 - Aggregate User Activity and Contributions on a user's profile | Story Points: 2
*Charter project: 2b – Person Management*

> As a **Steward**, **I want** to see quick stats on a user's activity, **so that** I can get a quick overview of their activity and common activities

> **Acceptance Tests**

> 1. Aggregates accurately reflect the user's data (SIR count, activities reported)
> 2. Given that a steward has submitted a new report, their SIR count updates +1.

### US 1.0.5 - Earn Points for Inspection Activity | Story Points: 5
*Charter project: 2b – Person Management*

> As a **Steward**, **I want** to earn points for visiting Sites, contributing photos, and other inspection activity, **so that** I have a reason to visit more natural areas

> **Acceptance Tests**

> 1. Given I submit a SIR, When the submission succeeds, Then my activity points increase by the amount of activity-specific points I earned from the site
> 2. Given I contribute a photo directly, When the upload succeeds, Then my activity points increase by the amount specified for uploading a photo for that site
> 3. Given I have activity points, When I open my profile, Then the current total is shown

### US 1.0.6 - Select and Edit Skills and Focus Areas | Story Points: 2
*Charter project: 2b – Person Management*

> As a **Steward**, **I want** to select and edit my skills and focus areas from an existing list, **so that** skill names and focus areas are consistent across the app

> **Acceptance Tests**

> 1. Given I edit my profile, When I open skills or focus areas, Then I can select values from dropdowns with an "Other" option
> 2. Given I type a skill or focus area, Then similar existing values are suggested
> 3. Given I have chosen a skill or focus area, When I edit it and save, Then the changed value appears on my profile

---
## 2 - Place Management
---

### US 2.0.1 - View Sites and Past Visits on an Interactive Map | Story Points: 8
*Charter project: 2c – Map Management*

> As a **Steward**, **I want** a map that shows where a natural area is, if it has been visited and what other stewards have done there, **so that** I can know what to expect and do on my next visit

> **Acceptance Tests**

> 1. Given the map view is open, When it loads, Then every active Site is drawn with its boundary
> 2. Given a GPX track was uploaded for a Site, When I zoom to that Site, Then the track is drawn as a line in a style different from the Site boundary
> 3. Given I am on a Site's page, I can navigate to view its location on the map
> 4. Given a Site is selected on the map, When the selection changes, Then only the newly selected Site is highlighted

### US 2.0.2 - Allow Admins to Add New Sites | Story Points: 3
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to be able to add a new Site through the app UI, **so that** I am not limited to direct database inserts.

> **Acceptance Tests**

> 1. Given I am an Admin creating a site, I can manually select the boundary for a site
> 2. Given a Site with the same name already exists, When I enter it, Then a possible-duplicate warning is shown before the Site is saved
> 3. Given a required field (ex. name) is empty, site creation is blocked and the empty fields are highlighted
> 4. Given I am signed in as a Steward, When I send the create-Site request directly to the server, Then it is refused and no Site is created
> 5. Given a site was added, it appears in the search results for the site.
> 6. Given I am selecting a boundary for a site, site suggestions are given based on what already exists in the Alberta government KML but not in SIR-SAPAA

### US 2.0.3 - Deactivate and Reactivate a Site | Story Points: 3
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to deactivate and reactivate a site, **so that** I can toggle its visibility throughout the app

> **Acceptance Tests**

> 1. Should be able to toggle a site between active and inactive
> 2. Site is deactivated -> Site no longer appears in site pickers or search results
> 3. Site is reactivated -> Site reappears everywhere it was previously listed
> 4. Given a site was deactivated, the inspections on the site can still be viewed
> 5. Given a new site was created, by default it should be active

### US 2.0.4 - Delete a Site | Story Points: 8
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to delete a site, **so that** I can remove incorrect or duplicate site information

> **Acceptance Tests**

> 1. Given I am an admin deleting a site, I should be asked to confirm the delete before it occurs
> 2. Site has existing inspection reports or images -> Should show a confirmation naming how many records are affected before the delete proceeds
> 3. Site is deleted -> The agreed cascade behaviour is applied consistently to its inspections, images, and any user visit counts
> 4. Cascade cannot complete -> Deletion is rejected with an error and the site and all of its records are left unchanged

> **Design note.** Delete archives the site by default (`sites_pa.archived_at`), as the TA advised, so the inspections, images and visit counts stay and the site can be restored. This is the cascade behaviour that AT3 refers to. A separate admin hard delete also exists, because the client asked for more than one level of delete. It works only on an archived site and removes the site, its steward link and its links (SAPAA website and iNaturalist). The inspections and images stay, with no site. See [Software Design](software-design.md#delete-archive-by-default-and-an-admin-hard-delete) for the reasons.

### US 2.0.5 - Update a Site | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to update an existing site page with new fields from a designated steward, **so that** I can direct stewards where to seek out more information

> **Acceptance Tests**

> 1. Given that I am an admin, I can enter 'edit mode' on a site page
> 2. Given that I am not an admin, I am prevented from entering edit mode
> 3. Given that I am in edit mode for a site page, I can easily tell which fields I have selected to be included/excluded from the site page.
> 4. On saving the update, the site page should have the new fields and remove those that were hidden

### US 2.0.6 - Search and Filter Sites by County on the Map | Story Points: 5
*Charter project: 2c – Map Management*

> As a **Steward**, **I want** to search and filter Sites on the map by county, **so that** I can easily find the Site I am looking for

> **Acceptance Tests**

> 1. Given the map view is open, When I apply one or more filters, Then only Sites matching those filters stay on the map
> 2. Given a filter is applied, When I clear it, Then all active Sites reappear
> 3. Given I type a Site name in the search box, When I select the match, Then the map centres on that Site

### US 2.0.8 - View a Site's Details From the Map | Story Points: 3
*Charter project: 2c – Map Management*

> As a **Steward**, **I want** to see a Site's details by selecting the Site on the map, **so that** I can gather context on the Site while exploring the map

> **Acceptance Tests**

> 1. Given the map view is open, When I select a Site, Then that Site's detail view opens
> 2. Given the detail view is open, When it loads, Then it shows the same name, county and last inspection date as the Site page reached from the home page
> 3. Given the detail view is open, When I select "View SIRs", Then I am directed to the past SIRs

### US 2.0.9 - Upload a GPX Track of a Site Visit | Story Points: 5
*Charter project: 2c – Map Management*

> As a **Steward**, **I want** to upload the GPX file my GPS device or phone app recorded during a Site visit, **so that** the visit is logged and the next steward can see which part of the Site was already covered

> **Acceptance Tests**

> 1. Given I am a signed-in Steward on a Site's page, When I upload a valid .gpx file, Then the track is saved and linked to that Site and to my account
> 2. Given I upload a file that does not have a .gpx extension, a message pops up that only GPX files are accepted
> 3. Given I upload a file named .gpx that is not valid GPX or has no track points, Then it is refused with a message and nothing is saved
> 4. Given I uploaded a track, When the stored track is read back, Then it has the same track points as the uploaded file
> 5. Given I choose a .gpx file larger than the stated maximum size, When I upload it, Then it is refused with a message that names the limit
> 6. Given I choose several .gpx files at once, When I upload them, Then every valid file is saved and linked to that Site and to my account, and each refused file is listed with the reason

*AT6 follows the October 9, 2026 client meeting, where Frank asked for bulk upload of GPX files (`docs/meetings/week6/2026_10_09_meeting_frank.txt`).*

### US 2.0.10 - Add links to Site Page | Story Points: 1
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As a **Steward**, **I want** to click on a link to the SAPAA website and iNaturalist from a site page, **so that** I can quickly navigate to learn more about natural areas

> **Acceptance Tests**

> 1. Given I am on the site page, I should see a clear link (shortened URL) to the SAPAA website
> 2. Given I am on the site page, I should see a clear link (shortened URL) to iNaturalist
> 3. Given I click on a link from the site page, a new window should open to the site instead of using my current window

### US 2.0.11 - Show Safety Information for a Site | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As a **Steward**, **I want** to know the nearest hospital, the known hazards at a Site, and other safety information, **so that** I can prepare for an emergency

> **Acceptance Tests**

> 1. Given safety information is stored for a Site, When I open the Site page, Then I see the nearest hospital, the known hazards, and the other safety information
> 2. Given a safety value is empty, When I open the Site page, Then that value is shown as not recorded
> 3. Given I am an Admin, When I save new safety information for a Site, Then a reload shows the new values
> 4. Given I am a Steward, When I try to change the safety information, Then the server refuses and the stored values stay unchanged

### US 2.0.12 - Score a Site for To-Visit Priority | Story Points: 8
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to give a Site points for abuses, biological imperatives, and time since the last visit, and combine those points into a to-visit priority, **so that** a Steward can see the state of the Site and decide whether to prioritize contributions to it

> **Acceptance Tests**

> 1. Given I am an Admin on a Site, When I enter points for abuses, biological imperatives, and time since the last visit, Then those points are saved
> 2. Given the three scores are saved, When the Site page loads, Then it shows one to-visit priority calculated from those scores
> 3. Given two Sites have the same three scores, When both pages load, Then they show the same to-visit priority
> 4. Given I am a Steward, When I open the Site, Then I can see the to-visit priority and the three scores
> 5. Given I am a Steward, When I try to change the scores, Then the server refuses and the scores stay unchanged

### US 2.0.13 - Flag Site Points That Are a Year Old | Story Points: 3
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to know when a Site's points have not been updated for a year, **so that** I have a reminder to reassess them

> **Acceptance Tests**

> 1. Given a Site's priority points (US 2.0.12) were last saved more than one year ago, When I open that Site as an Admin, Then I see a reminder to reassess the points
> 2. Given the points were saved less than one year ago, When I open the Site as an Admin, Then the reminder is absent
> 3. Given the reminder is showing, When I save new points, Then the reminder is absent and the saved date is the new date
> 4. Given I am a Steward, When I open the Site, Then the Admin reminder is not shown

### US 2.0.14 - Match Map Marker Colours to the Website | Story Points: 2
*Charter project: 2c – Map Management*

> As a **Steward**, **I want** to see map marker colours that match the SAPAA website, **so that** I can tell site types apart

> **Acceptance Tests**

> 1. Given sites of different types are on the map, Then provincial parks, recreation areas and other site types use their matching SAPAA website marker colours
> 2. Given a site type has a colour on the SAPAA website, When I view a marker for that type, Then its colour matches the website

---
## 3 - Admin Persona
---

### US 3.0.2 - Steward Designation | Story Points: 5
*Charter project: 2b – Person Management*

> As an **Admin**, **I want** to assign an individual to a site, **so that** other stewards can reach out to them for more information

> **Acceptance Tests**

> 1. Given I am an admin, I can search for a steward to assign to a site
> 2. Given I am an admin, I can assign a new steward, replacing the previous one
> 3. Given a steward is assigned to a site, the assigned relationship is visible on both the site's page and the steward's profile
> 4. Given a user who is not permitted to assign attempts to designate a steward, the action is rejected and no assignment is created

### US 3.0.3 - Export all digital files from SIR-SAPAA | Story Points: 8
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to be able to extract all images and other digital files in the app at once, **so that** I can back them up and use them for business processing

> **Acceptance Tests**

> 1. Extracting files -> Should zip files
> 2. Extraction should include all images, at minimum

### US 3.0.4 - Add a Steward Without an Account | Story Points: 3
*Charter project: 2b – Person Management*

> As a **Admin**, **I want** to add a steward by name, email and phone number without an account and show these details on a site page, **so that** a site can list its steward even when that person has no account

> **Acceptance Tests**

> 1. Given I am an Admin, When I add a steward with only a name, email and phone number, Then I can save the steward without a user account
> 2. Given I have added a steward without an account, When I assign the steward to a site, Then I can click their name and view their contact info
> 3. Given I save a steward without an account, Then the person does not need to sign up or sign in to be listed

*Design suggestion: a Contacts table could store these details without an account link. The table design is not decided.*

---
## 4 - General Features
---

### US 4.0.2 - Offline and Online Map Layers | Story Points: 13
*Charter project: none (team request)*

> As a **Steward**, **I want** offline/online map layers, **so that** I can navigate complex areas.

> **Acceptance Tests**

> 1. Should be able to download a map area for offline use and see its download status
> 2. Device is offline -> Downloaded tiles render and the map stays pannable and zoomable inside the downloaded area
> 3. Device is offline and the user pans outside the downloaded area -> Missing tiles are indicated rather than failing silently
> 4. Device is online -> The map uses live tiles and does not fall back to the cached layer

### US 4.0.4 - Edit My Previous Inspections | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As a **Steward**, **I want** to be able to edit my previous inspections, **so that** I can easily fix incorrectly submitted entries

> **Platform:** Web

> **Acceptance Tests**

> 1. Given I have previously submitted a SIR, I can open it and enter edit mode
> 2. Given I am viewing another steward's SIR, I am prevented from entering edit mode and making changes
> 3. A required answer is cleared and submit is attempted -> submission is blocked and the missing questions are listed
> 4. An edit is saved -> The updated answers are reflected everywhere the report is rendered

### US 4.0.5 - iNaturalist integration | Story Points: 5
*Charter project: 3a – iNaturalist Internal Improvements*

> As a **Steward**, **I want** to be able to see the photos I took on iNaturalist in the app, **so that** I do not have to upload them a second time in my SIR

> **Acceptance Tests**

> 1. User can upload an image inside their SIR by selecting images from their iNaturalist account
> 2. Identifier field is autofilled from the iNaturalist observation

### US 4.0.6 - Demote Photo Identifier to optional field | Story Points: 1
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As a **Steward**, **I want** to skip entering a photo Identifier, **so that** I do not have to repeat my description in this field

> **Acceptance Tests**

> 1. Given I leave the Identifier field empty and fill in all required fields in valid format, the report submits successfully
> 2. Given I am filling out a site inspection report, there is no note beside the identifier field that reads "required"

### US 4.0.7 - Show the Top iNaturalist Observations for a Site | Story Points: 5
*Charter project: 3a – iNaturalist Internal Improvements*

> As a **Steward**, **I want** to see up to the top 5 iNaturalist observations for a Site, **so that** I can see more information in the app without an iNaturalist account

> **Acceptance Tests**

> 1. Given a Site has iNaturalist observations, When I open the Site page, Then I see at most 5 observations
> 2. Given a Site has more than 5 observations, When the page loads, Then the 5 shown are the 5 most popular (engagement-wise) observations for that Site
> 3. Given a Site has no observations, When the page loads, Then the page says that no iNaturalist observations were found
> 4. Given I am a Steward with no iNaturalist account, When I open the Site page, Then the observations are still shown
> 5. Given an observation is shown, When I read it, Then it shows the species name from iNaturalist

---
## 5 - Access and Accounts
---

### US 5.0.2 - Reset a Forgotten Password | Story Points: 2
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As a **User**, **I want** to reset my password myself, **so that** I do not need an Admin to get back in

> **Acceptance Tests**

> 1. Given I am on the sign-in page, When I select "Forgot password" and enter my email, Then a reset link is sent to that email
> 2. Given I requested to reset my password, I am asked to verify with a code before I can proceed to reset my password
> 3. Given I received a reset link, When I open it and set a new password, Then I can sign in with the new password and not with the old one
> 4. No admin intervention is required at any step of resetting my password

### US 5.0.4 - Sign Out Properly | Story Points: 2
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As a **User**, **I want** signing out to keep me signed out, **so that** the next person on a shared device cannot use my account

> **Acceptance Tests**

> 1. Given I signed out of the web app, When I open the app again in the same browser, Then the sign-in page is shown and I am not signed in
> 2. Given I signed out of the web app, When I press the browser Back button, Then no signed-in page is shown
> 3. Given I am on any page of the web app, I can sign out without navigating to a specific page

### US 5.0.5 - Request Access During Email Sign-Up | Story Points: 8
*Charter project: 2b – Person Management*

> As a **prospective user**, **I want** to request access while I create my account, **so that** I do not need to complete a separate website form.

> **Acceptance Tests**

> 1. Given I open the sign-up page, I see fields for:
>    - Full name: required
>    - Email: required
>    - Phone: optional
>    - Reason for access: required
>    - Other details: optional
>    - Password: required
>    - Password confirmation: required
> 2. Both access terms are visible and unchecked by default.
> 3. I cannot submit the form until I accept both terms.
> 4. Invalid or missing required values show clear errors.
> 5. A valid submission creates an unapproved account and a linked pending access request.
> 6. The request records which terms version I accepted and when I accepted it.
> 7. The success message explains email verification and administrator approval.
> 8. A partial failure does not report success. The user can safely resume or retry.
> 9. The phone number and access details are not available to stewards or other applicants.
> 10. Existing accounts are not changed and do not need to accept the new terms.
> 11. Include the terms and conditions from [Say Hello to SIR-SAPAA!](https://sapaastewards.com/2026/03/13/say-hello-to-sir-sapaa/).

### US 5.0.6 - Complete an Access Request With Google or Microsoft | Story Points: 5
*Charter project: 2b – Person Management*

> As a **prospective user**, **I want** to use Google or Microsoft while I request access, **so that** I can use my preferred sign-in method without bypassing the access process.

> **Acceptance Tests**

> 1. Google and Microsoft buttons remain available.
> 2. After the first successful OAuth sign-in, an applicant without an access request is sent to the access-request form.
> 3. The form uses the provider name and email when they are available.
> 4. The applicant must still enter a reason and accept both terms.
> 5. Phone and other details remain optional.
> 6. The applicant cannot access protected application pages before completing the request and receiving approval.
> 7. An applicant who leaves the form can return and continue the process.
> 8. An existing approved OAuth user continues to use the application without accepting the new terms.
> 9. An existing pending account is not automatically rejected or approved.
> 10. A failed or cancelled OAuth sign-in does not create an access request.

### US 5.0.7 - Review and Decide Access Requests | Story Points: 8
*Charter project: 2b – Person Management*

> As an **administrator**, **I want** to review each access request and approve or reject it, **so that** only eligible applicants receive access.

> **Acceptance Tests**

> 1. The account-management page has separate pending, approved, and rejected states.
> 2. A pending request shows:
>    - Full name
>    - Email
>    - Phone, when supplied
>    - Reason for access
>    - Other details, when supplied
>    - The two accepted terms
>    - Acceptance date
>    - Request date
> 3. An administrator can approve a pending request.
> 4. Approval changes both the request status and the existing account approval flag.
> 5. An administrator can reject a pending request.
> 6. Rejection keeps application access disabled.
> 7. The system records the administrator and time for each decision.
> 8. A repeated approval or rejection does not create duplicate records.
> 9. A non-admin cannot list requests, read private request details, approve, or reject.
> 10. If part of a decision fails, the system reports the error and does not show a false final state.
> 11. Legacy accounts without request data remain visible and manageable.

### US 5.0.8 - Manage Access Terms | Story Points: 5
*Charter project: 2b – Person Management*

> As an **administrator**, **I want** to edit the two access terms from the administration page.

> **Acceptance Tests**

> 1. An administrator can view and edit both terms.
> 2. Neither term can be saved as empty.
> 3. A saved change becomes the active version for new access requests.
> 4. Each access request keeps the version that the applicant accepted.
> 5. Changing the terms does not require existing users to accept them again.
> 6. A terms edit records the administrator and update time.
> 7. A non-admin cannot read the editor or save changes.
> 8. Failed updates leave the previous active terms unchanged.
> 9. The sign-up and OAuth onboarding forms always show the active terms.

### US 5.0.9 - View My Access-Request Status | Story Points: 3
*Charter project: 2b – Person Management*

> As an **applicant**, **I want** to know whether my request is pending, approved, or rejected, **so that** I understand why I cannot use the application.

> **Acceptance Tests**

> 1. A pending applicant sees a pending-review message.
> 2. A rejected applicant sees a rejected status instead of the pending message.
> 3. An approved applicant enters the application normally.
> 4. An applicant can see only their own status.
> 5. Private administrator information is not shown.
> 6. A signed-out visitor cannot read a request status.
> 7. Existing approved users do not see an onboarding or terms prompt.

---
## 6 - Data and Places
---

### US 6.0.1 - Store Each Site's Geometry From the Shared Source | Story Points: 5
*Charter project: 2c – Map Management*

> As a **Steward**, **I want** each Site stored with its real boundary and location, taken from the same source the SAPAA website uses, **so that** I can use either map to tell where a site really is and the website and app never disagree about a Site's shape

> **Acceptance Tests**

> 1. Given a site already exists in the Alberta government KML the website uses, the site geometry the app uses is exactly the same
> 2. Given the geometries are loaded, When a Site is read from the database, Then it has a stored boundary and a centre point (latitude and longitude)
> 3. Given the list of active Sites, When the load is finished, Then each Site has a geometry or is on a list of unmatched Sites for an Admin to fix
> 4. Given geocoding is still used for any Site (for example to fill a missing point), When it runs, Then results are cached and requests stay under the OpenCage free tier of 2,500 per day

---
## 7 - Inspections and Media
---

### US 7.0.1 - Let Stewards Export Their Own Reports | Story Points: 2
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As a **Steward**, **I want** to export my own SIR as a PDF, **so that** I can keep or share a copy of my report

> **Acceptance Tests**

> 1. Given I submitted a SIR, When I select Export PDF on it, Then a PDF of that SIR is downloaded
> 2. Given I am a Steward, When I request a PDF of a SIR I did not submit, Then the server refuses
> 3. Given a PDF of my SIR is generated, When I open it, Then it contains the same answers and photos as the SIR page

### US 7.0.3 - See All Inspections in One View | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** a summary across all SIRs rather than one Site at a time, **so that** I can report on the state of all Sites at once

> **Acceptance Tests**

> 1. Given SIRs exist for many Sites, When I open the all-SIR summary, Then it shows SIR counts per Site, per steward and per reason for the visit (Q42), and the spread of naturalness scores (Q31)
> 2. Given the summary is open, When I set a date range, Then every figure is recalculated for that range
> 3. Given I am a Steward, When I request the summary data directly, Then the request fails

### US 7.0.4 - Compare One Question Across Years | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As a **Steward**, **I want** to pick one question and see how its answers changed over the years at a Site, **so that** I can see what is getting better or worse

> **Acceptance Tests**

> 1. Given a Site with SIRs from several years, When I choose one question, Then its answers are listed by date, oldest to newest
> 2. Given I choose Q63 (motorized disturbance), When the list loads, Then answers from every SIR for that Site are shown (SAPAA's own check: "Compare historical motorized disturbances across all inspections (Question 63)")
> 3. Given a question's wording was changed in the form editor, When I choose it, Then old and new answers stay grouped under the same Q-number

### US 7.0.5 - Delete an Image and Clean Up After It | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** deleting an image to remove it from view and remove the stored file, **so that** inaccurate images are not shown to others and deleted images stop costing storage money

> **Acceptance Tests**

> 1. Given I am an Admin, When I delete an image from a Site, Then it no longer appears in the Site gallery or in any report that shows that gallery
> 2. Given I am not allowed to delete images, When I view a Site gallery, Then no delete control is shown, and When I send a delete request directly, Then the server refuses
> 3. Given an image was deleted, When the S3 bucket is checked, Then its file is gone
> 4. Given an Admin deactivates a SIR, When the S3 bucket is checked, Then the SIR's image files are still there, so reactivating restores its photos
> 5. Given a SIR submission fails and is rolled back (rollbackSiteInspectionSubmission), When the S3 bucket is checked, Then the files uploaded for that SIR are gone

### US 7.0.6 - Export More Than 50 Site Inspection Reports | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to export more than 50 Site Inspection Reports at once, **so that** I can back them up for my records faster

> **Acceptance Tests**

> 1. Given more than 50 SIRs exist, When I select more than 50 and export them, Then the export completes and contains each selected SIR
> 2. Given I export a set of SIRs, When I open the export, Then each SIR has the same answers as its page
> 3. Given I am a Steward, When I request the bulk export, Then the server refuses and no export is created
> 4. Given the export fails, When I check the SIRs, Then the stored reports are unchanged

### US 7.0.7 - Hide Fields on a SIR Before Export | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to select fields to hide on a SIR before export, **so that** confidential or non-public fields stay out of the export

> **Acceptance Tests**

> 1. Given I am an Admin exporting a SIR, When I select fields to hide, Then those fields are marked for the export
> 2. Given I hid fields, When the export is generated, Then the hidden fields are absent and the other fields are present
> 3. Given I hid fields for an export, When I open the SIR page, Then the stored answers are still there
> 4. Given I am a Steward, When I request an export with hidden fields, Then the server refuses
> 5. Given I select no fields to hide, When I export, Then the export contains the full SIR

### US 7.0.8 - Delete a Site Inspection Report | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As an **Admin**, **I want** to delete a Site Inspection Report, **so that** I can remove a report that is out of date or inaccurate

> **Acceptance Tests**

> 1. Given I am an Admin deleting a SIR, When I choose delete, Then I must confirm before the report is removed
> 2. Given I confirm the delete, When it succeeds, Then the report no longer appears on the Site or in report lists
> 3. Given the report has images, When the delete succeeds, Then those images are no longer shown with that report
> 4. Given I am a Steward, When I request the delete, Then the server refuses and the report stays unchanged
> 5. Given the delete cannot complete, an error is shown and the report and its answers stay unchanged

### US 7.0.9 - Record Audio During a Site Inspection | Story Points: 5
*Charter project: 1 – Critical SIR-SAPAA Bug Fixes & Minor Enhancements*

> As a **Steward**, **I want** to record audio during a site inspection, **so that** I can capture observations without typing in the field

> **Acceptance Tests**

> 1. Given I am filling out a SIR, When I start an audio recording, Then the recording is saved and linked to that SIR
> 2. Given a recording is saved, When I open the SIR, Then I can play back the recording
> 3. Given I am a Steward, When I request a recording from a SIR I did not submit, Then the server refuses
> 4. Given the recording fails to save, When I check the SIR, Then the stored report is unchanged and an error is shown

## MoSCoW

### Must Have

*19 stories, 85 story points.*

| ID | Story | Points |
|---|---|---|
| US 1.0.1 | Add User Profiles | 5 |
| US 1.0.2 | Allow Editing Own Profile | 3 |
| US 1.0.4 | Aggregate User Activity and Contributions on a user's profile | 2 |
| US 2.0.2 | Allow Admins to Add New Sites | 3 |
| US 2.0.4 | Delete a Site | 8 |
| US 2.0.5 | Update a Site | 5 |
| US 2.0.8 | View a Site's Details From the Map | 3 |
| US 2.0.9 | Upload a GPX Track of a Site Visit | 5 |
| US 2.0.10 | Add links to Site Page | 1 |
| US 3.0.3 | Export all digital files from SIR-SAPAA | 8 |
| US 4.0.6 | Demote Photo Identifier to optional field | 1 |
| US 5.0.2 | Reset a Forgotten Password | 2 |
| US 5.0.5 | Request Access During Email Sign-Up | 8 |
| US 5.0.6 | Complete an Access Request With Google or Microsoft | 5 |
| US 5.0.7 | Review and Decide Access Requests | 8 |
| US 5.0.8 | Manage Access Terms | 5 |
| US 5.0.9 | View My Access-Request Status | 3 |
| US 6.0.1 | Store Each Site's Geometry From the Shared Source | 5 |
| US 7.0.7 | Hide Fields on a SIR Before Export | 5 |

### Should Have

*14 stories, 65 story points.*

| ID | Story | Points |
|---|---|---|
| US 1.0.3 | Show history of Site Inspections on a Steward's Profile | 2 |
| US 2.0.1 | View Sites and Past Visits on an Interactive Map | 8 |
| US 2.0.3 | Deactivate and Reactivate a Site | 3 |
| US 2.0.6 | Search and Filter Sites by County on the Map | 5 |
| US 3.0.2 | Steward Designation | 5 |
| US 4.0.2 | Offline and Online Map Layers | 13 |
| US 4.0.4 | Edit My Previous Inspections | 5 |
| US 5.0.4 | Sign Out Properly | 2 |
| US 7.0.5 | Delete an Image and Clean Up After It | 5 |
| US 7.0.6 | Export More Than 50 Site Inspection Reports | 5 |
| US 7.0.8 | Delete a Site Inspection Report | 5 |

| US 1.0.6 | Select and Edit Skills and Focus Areas | 2 |
| US 2.0.14 | Match Map Marker Colours to the Website | 2 |
| US 3.0.4 | Add a Steward Without an Account | 3 |

### Could Have

*5 stories, 23 story points.*

| ID | Story | Points |
|---|---|---|
| US 1.0.5 | Earn Points for Inspection Activity | 5 |
| US 2.0.12 | Score a Site for To-Visit Priority | 8 |
| US 2.0.13 | Flag Site Points That Are a Year Old | 3 |
| US 7.0.1 | Let Stewards Export Their Own Reports | 2 |
| US 7.0.3 | See All Inspections in One View | 5 |

### Won't Have

*5 stories, 25 story points.*

| ID | Story | Points |
|---|---|---|
| US 7.0.4 | Compare One Question Across Years | 5 |
| US 7.0.9 | Record Audio During a Site Inspection | 5 |
| US 4.0.5 | iNaturalist integration | 5 |
| US 2.0.11 | Show Safety Information for a Site | 5 |
| US 4.0.7 | Show the Top iNaturalist Observations for a Site | 5 |
