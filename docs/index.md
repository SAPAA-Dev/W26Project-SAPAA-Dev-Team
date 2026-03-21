# Project Requirements


## Executive summary

SAPAA currently manages site inspection data through a manual pipeline. Stewards submit observations via Google Forms, Admin converts them in MS Excel, and the results are stored in a local MS Access database. This project replaces that temporary setup with a sustainable, low-cost cloud data infrastructure that automatically ingests inspection data into a PostgreSQL database, enables Admin to manage the data and generate PDF reports. A major focus of our implementation is scalable and cost-aware image management. Inspection images are stored in AWS S3, providing a reliable, secure, and affordable solution for handling large volumes of media. The primary user is the Admin, who needs a reliable, maintainable system that eliminates manual data handling, while keeping his access to the data as well as report generation and distribution. This project also hopes to create Android and iOS versions of the web application for stewards to bring out into the field and be able to log their observations while offline.



## Project glossary

- **SAPAA:** Stewards of Alberta’s Protected Areas Association. A volunteer society that supports the stewardship of Alberta’s protected natural areas.

- **Natural Area:** A provincially designated protected land, such as a Provincial Park, Wildland Park, Wilderness Area, Ecological Reserve, or Natural Area, managed by Alberta Parks.

- **Site:** A specific Natural Area monitored and reported on by SAPAA stewards.

- **Site Inspection:** A record of field observations, ecological conditions, safety notes, and steward activities for a given Site.

- **Steward** A SAPAA volunteer responsible for visiting Sites and submitting inspection data.

- **Admin:** The SAPAA administrator responsible for managing Site Inspection data, generating official reports, and distributing information to stewards.

- **SAPAA Stewards:** The web application that allows stewards to submit Site Inspection data easily and automatically uploads data to the PostgreSQL database.

- **SAPAA Stewards Mobile:** The mobile application, usable on both Android and iOS, that stewards can use while offline to submit their Site Inspection data


     

## User Stories
---
### **P1 – Implement Site Inspection Web Application for SAPAA**
---

#### US 1.0.1 – Access Site Inspection Form on Web Application | Story Points: 3   
> **As** a User, **I want** to be able to access the Site Inspection form on the web page, **so that** I can fill out the Site Inspection Form with my information

> **Acceptance Tests**

> 1. Should have the New Site Inspection Report button visible and enabled
> 2. Should navigate to the new report page when clicking the "New Site Inspection Report" button
> 3. Blocks submission and shows the required questions popup when a mandatory field is missing 
> 4. Successfully calls uploadSiteInspectionAnswers when all required questions are answered

#### US 1.0.2 – Add Personal Information to Site Inspection Form | Story Points: 1    
> **As** a User, **I want** to be able to add my personal details, **so that** I can be identified for completing the Site Inspection.

> **Acceptance Tests**

> 1. User can enter steward name 
> 2. User can enter first and last names of guests 
> 3. User can enter contact information (email and phone) 
> 4. User can indicate SAPAA membership
> 5. Footer tracks progress correctly 

#### US 1.0.3 – Liability Check | Story Points: 1
**As** a User, **I want** to be prompted to verify that I am not a volunteer and this is not an emergency, **so that** I can ensure I am accessing the correct resource(s).

> **Acceptance Tests**

> 1. System displays a loading spinner followed by a mandatory verification popup before form access is granted
> 2. Popup explicitly displays an emergency notice regarding 911 and a "310-LAND" contact link
> 3. System requires the user to type an exact, case-sensitive phrase (shown in a code block) to proceed
> 4. System displays real-time validation errors for incorrect, partial, or trailing-space phrase entries
> 5. Verified stewards bypass the liability popup entirely and see a "Steward Badge" in the header
> 6. Users can click "Cancel" to exit the process, which triggers a navigation back to the previous page.
> 7. The popup state is fresh upon re-navigation, ensuring users cannot "trick" the system by going back and forward.

#### US 1.0.4 – Have access to the Terms and Conditions of Inputting Information | Story Points: 1
**As** a User, **I want** to be able to see the Terms and Conditions of filling out the Site Inspection Form, **so that** I am aware of how my information will be used for and the level of privacy I am agreeing to.

> **Acceptance Tests**

> 1. "Continue to Form" button remains disabled by default and only enables when the Terms and Conditions checkbox is explicitly checked
> 2. "Continue" button reacts dynamically to checkbox toggling, and non-steward verification blocks form access until all terms are accepted
> 3. Keyboard-accessible link to the Terms is available within the popup; clicking it allows viewing terms without closing the active verification state
> 4. The terms link includes a from query parameter for tracking, and the "checked" state is preserved after the popup is dismissed to record the agreement.

#### US 1.0.5 – Add Details Regarding the Overview of my Visit | Story Points: 1   
> **As** a User, **I want** to be able to add details regarding my visit, **so that** I can describe which site I went to and when I visited it.

> **Acceptance Tests**

> 1. User can enter date of visit 
> 2. User can enter which site they are inspecting
> 3. User can select their designated steward status 
> 4. User can select only ONE designated steward option (radio button behavior) 
> 5. Displays all required fields with Required badge
> 6. Footer tracks progress correctly 
> 7. Allows submission when all required fields are filled
> 8. Displays error when submitting without required fields

#### US 1.0.6 – Rank the Health of the Site | Story Points: 1   
> **As** a User, **I want** to be able to rank the state of the site during my visit, **so that** I can describe its health and my thoughts on its current condition.

> **Acceptance Tests**

> 1. Renders the overall impression section and reaches questions 2.1 to 2.3 
> 2. User can select naturalness score "4 = Great"
> 3. User can select naturalness score "3 = Good" 
> 4. User can select naturalness score "2 = Passable" 
> 5. User can select naturalness score "1 = Bad"
> 6. User can select naturalness score "0 = Terrible"
> 7. User can enter comments on how healthy they felt the site was
> 8. User can enter comments about changes from their previous visit 
> 9. User can clear change-in-conditions comments if not applicable

#### US 1.0.7 – Add Details Regarding How the Trip Went | Story Points: 1
> **As** a User, **I want** to be able to add details regarding how my trip went, **so that** I can describe the duration and the reason for my visit.

> **Acceptance Tests**

> 1. User can enter reasoning for visiting the site (Q41) and additional details (Q41.1) 
> 2. User can input duration of trip and comments (Q42) 
> 3. User can input visit details (Q43) 
> 4. Q41 and Q42 are required; Q41.1 and Q43 are not 
> 5. Footer shows error for missing required Q41/Q42 but accepts missing optional Q41.1/Q43

#### US 1.0.8 – Address What Amenities are in the Site | Story Points: 1 
> **As** a User, **I want** to be able to add details regarding ease of use of the site, **so that** I can be as detailed as possible in my report.

> **Acceptance Tests**

> 1. User can select amenities options for ease to visit 
> 2. User can select signage and trails options for ease-of-use details 
> 3. User can unselect a previously selected ease-to-visit option 

#### US 1.0.9 – Designation as a Protected Site | Story Points: 1 
> **As** a User, **I want** to indicate how I know the site is a protected area, **so that** it can be ensured that the sites are properly designated as protected areas.

> **Acceptance Tests**

> 1. User can indicate protected status by selecting signage
> 2. User can indicate protected status by selecting fencing
> 3. User can select "Signage" as protected-area evidence
> 4. User can select "Fencing" as protected-area evidence 
> 5. User can select "Exists but in disrepair" as protected-area evidence 
> 6. User can select "Not Applicable" as protected-area evidence
> 7. User can deselect a protected-area indicator option

#### US 1.0.10 – Indicate submissions to iNaturalist | Story Points: 1 
> **As** a User, **I want** to be told about iNaturalist and indicate if I am posting to it, **so that** it can be documented if my findings have yet been shared to iNaturalist (Q53).

> **Acceptance Tests** 

> 1. Renders section 4 and the 4.2 Submissions to iNaturalist question
> 2. User can select "Yes" for submissions to iNaturalist
> 3. User can select "No, Not this time" for submissions to iNaturalist
> 4. User can select "No, not a member of iNaturalist" for submissions to iNaturalist
> 5. User can select "What is iNaturalist?" for submissions to iNaturalist 
> 6. User can select "Other/Not Applicable" for submissions to iNaturalist 
> 7. Selecting a new iNaturalist option replaces the previous one

#### US 1.0.11 – Address details of Landscape changes | Story Points: 2 
> **As** a User, **I want** to be able to add details regarding any significant site changes, **so that** important or significant changes can be tracked in my report

> **Acceptance Tests**

> 1. User can enter details about recent landscape changes (Q54)
> 2. Q54 is optional and submitting without it does not show an error 

#### US 1.0.12 – Address any Biological Observations that is in the Site | Story Points: 1 
> **As** a User, **I want** to be able to add details regarding any biological observations that I saw or noticed on the site **so that** I can update the site’s information with new / changing / consistent wildlife sightings.

> **Acceptance Tests**

> 1. Allows the user to enter biological wildlife observations
> 2. Allows the user to delete text from the biological observations box and ensures it is empty
> 3. Does not include question number 4.3 in the missing required questions popup when answered

#### US 1.0.13 - Address Any Human Disturbances - Section 8 | Story Points: 1
> **As** a User, **I want** to be able to add details regarding any human disturbances I noticed during my visit, **so that** I can be as detailed as possible in my report

> **Acceptance Tests**

> 1. Renders section 5 questions 5.1 through 5.8 
> 2. User can indicate what other visitors were doing
> 3. User can indicate agricultural activity 
> 4. User can indicate resource extraction activity
> 5. User can indicate motorized disturbance 
> 6. User can indicate gathering and dumping activity 
> 7. User can indicate infrastructure encroachment 
> 8. User can enter invasive plants or disease comments 
> 9. User can enter comments on human disturbances
> 10. Comments can be cleared when not applicable

#### US 1.0.14 - Add Other Comments | Story Points: 2
> **As** a User, **I want** to be able to add comments/information that aren’t specifically mentioned in the questions, **so that** I can share all information I see as important, even when it isn’t specifically asked for.

> **Acceptance Tests**

> 1. User can enter their comments in beThere section
> 2. User can enter their comments in notThere section
> 3. User can enter their comments in 2BDone section
> 4. User can enter their comments in Close section
> 5. Does not include comments in the missing required questions popup when answered

#### US 1.0.15 – Inform SAPAA of Any Restorative Work that Needs to be Done / Was Done | Story Points: 2
> **As** a User, **I want** to be able to add details regarding any actions I believe need to be taken upon the land or that I took, **so that** I can relay the necessary restoration information to the right bodies of power.

> **Acceptance Tests** 

> 1. Renders section 6 questions 6.1 through 6.4
> 2. User can indicate urgently needed restorative actions
> 3. User can add nearby resident contact information
> 4. User can indicate actions they have taken to help restore/protect the site
> 5. User can add general comments
> 6. Comments can be cleared when not applicable

#### US 1.0.16 – Add Any Photography Captured During Visit | Story Points: 5
> **As** a User, **I want** to be able to add any photography taken during my visit, **so that** I can use photos to help make my report clearer and provide visual evidence of my observations.

> **Acceptance Tests**

> 1. User can upload images taken during their visit 
> 2. User can add final remarks alongside photography 
> 3. Displays uploaded image file names and count
> 4. User can remove uploaded media
> 5. User can replace uploaded media by uploading new files
> 6. User can add additional images to existing uploads 
> 7. Submitting the form without uploading images does not result in any error
> 8. Photography question is not marked as required
> 9. Removing all images clears the file count display 


#### US 1.0.17 – (Admin) Add Questions Site Inspections Form | Story Points: 3  

> **As** an admin, **I want** to be able to add questions on the Site Inspection Form, **so that** I can add new questions as needed.  

> **Acceptance Tests**

> 1. Admin fills in the form, clicks save, and the new question appears in the list. Empty titles are rejected
> 2. Question title must end in (QXX) and match the question key format, otherwise saving is blocked
> 3. After an admin adds a question, it immediately appears for all users filling out the form
> 4. Non-admin users cannot access the question editor; the page requires requireAdmin=true

#### US 1.0.18 – Adding Image Identifier | Story Points: 2 
> **As** a User, **I want** to be able to add Identifier to the images that I upload, **so that** context can be given for the images.

> **Acceptance Tests**

> 1. Shows optional caption input after uploading an image
> 2. Allows adding caption when initially empty
> 3. Allows editing the image caption before submitting
> 4. Allows deleting the image caption before submitting 
> 5. Removing image clears uploaded entry and revokes object URL

#### US 1.0.19 - Admin Viewing Images and Metadata | Story Points: 2
> **As** an Admin. **I want** to be able to view the images uploaded by the users, **so that** I can keep track of site inspection and monitor site well-being.

> **Acceptance Tests**

> 1. Renders all uploaded image cards after fetch
> 2. Admin can click an image card to open modal with metadata and associated site
> 3. Shows empty state when API returns no images
> 4. Handles API error response without crashing


#### US 1.0.20 – Admin Editing Image Metadata | Story Points: 3 

> **As** an Admin. **I want** to be able to edit image metadata **so that** I can make sure that the image data is accurate for the report's compliance.

> **Acceptance Tests**  

> 1. Admin can access an image’s metadata
> 2. Admin can change the metadata
> 3. Admin can save the changes to the metadata
> 4. Other users can see the updated image’s metadata

#### TASK 1.0.21 - View and understand the Supabase and decide if it is suitable 
> Get acquainted with the existing super-base and decide if it is necessary to modify or rebuild it, or migrate to a different database management system


#### US 1.0.22 – (User) Edit My Site Inspections Form | Story Points: 5

> **As** a User, **I want** to be able to modify my Site Inspection forms after the fact, **so that** I can make edits to my forms as needed.

> **Acceptance Tests**  

> 1. Renders the edit form when user is authorized
> 2. Shows access denied when user is not the owner 
> 3. All previous responses are filled correctly
> 4. Shows required popup if user clears a required question and attempts to submit
> 5. If user changes a required question, submission is changed

#### US 1.0.23 – Non-Public Information | Story Points: 2
> **As** a User. **I want** to have somewhere to write information that won’t be published publically **so that** sensitive information / information for SAPAA only isn’t leaked

> **Acceptance Tests**

> 1. System ensures that name, email, and user_id are never included in the site inspection answers payload
> 2. User roles and avatar URLs are explicitly excluded from the database submission for inspection records
> 3. The submission payload is restricted to only the four allowed data columns; no unauthorized keys are permitted
> 4. The uid is used only for internal report linking and is never stored within the publicly accessible answers array
> 5. The response_id in the database refers to the report itself, not the private ID of the user who submitted it
> 6. Automated checks confirm that sensitive user strings (like the actual email text) never appear within any submitted row values

#### US 1.0.24 – Modify my Site Inspections Form Questions | Story Points: 8
> **As** an admin, **I want** to be able to modify the questions on the Site Inspection Form, **so that** I can make any changes / correct any errors as I see fit.

> **Acceptance Tests**

> 1. Admin sees the header, navbar, sidebar sections, and questions for the selected section. Clicking a section loads its questions
> 2. Admin clicks edit, modifies the title, subtext, or options, clicks save, and the updated question appears. A success message is shown and the form closes
> 3. Admin fills in the add question form with a valid title and type, clicks save, and the new question appears. Save is disabled when the title is empty
> 4. Admin can hide or show a question; the button label updates between "Hide" and "Show" to reflect the current state
> 5. After an edit or addition is saved, questions are refetched and the updated data is immediately reflected in the form
> 6. Clicking cancel on either the edit or add form discards all changes without saving 
> 7. Non-admins cannot access the editor. If saving, adding, or toggling visibility fails, an appropriate error or alert is displayed

#### US 1.0.25 – Hide a Site Inspections Form Questions | Story Points: 3
> **As** an admin, **I want** to be able to hide any of the questions on the Site Inspection Form, **so that** only the questions I want are visible.

> **Acceptance Tests**

> 1. After an admin hides a question, it no longer appears in the user-facing form or the edit report form
> 2. Hiding a question does not affect past submissions; existing answers for that question remain retrievable
> 3. After an admin shows a hidden question, it reappears in both the user-facing form and the edit report form
> 4. Hidden questions display a "Hidden" badge and a "Show" button; visible questions display only a "Hide" button with no badge
> 5. Toggling a question's visibility immediately updates the admin UI without waiting for the server response
  
#### US 1.0.26 – Persist Site Inspection Form Draft | Story Points: 5
> **As** a user, **I want** my answers to be automatically saved as a draft, **so that** I do not lose my progress if I refresh, navigate away, or accidentally close my tab.

> **Acceptance Tests** 

> 1. Saves responses to local storage on change and restores them after rerendering
> 2. Separates drafts by site so Site A data does not appear on Site B
> 3. Restores draft when returning to the page after navigating away
> 4. Clears draft data from localStorage after successful submission

#### US 1.0.27 – Enforce Required Questions on Site Inspection Form | Story Points: 3
> **As** a user, **I want** to be prevented from submitting the form if required questions are unanswered, **so that** the report is complete and contains all mandatory information.

> **Acceptance Tests** 

> 1. If a user attempts to submit the Site Inspection Form without answering all required questions, a pop up message is displayed indicating that required questions must be completed before submission
> 2. Blocks submission and shows the required questions popup when a mandatory field is missing
> 3. The form submission is blocked until all required questions are answered
> 4. Successfully calls uploadSiteInspectionAnswers when all required questions are answered 
> 5. Optional questions do not prevent submission if left unanswered 

#### US 1.0.28 – Autofill Applicable Form Questions | Story Points: 3
> **As** a user, **I want** applicable information to be auto-filled into my report form, **so that** I can save time from having to manually enter that information myself.

> **Acceptance Tests**

> 1. Information is auto-filled when a new form is opened
> 2. User's name is auto-filled 
> 3. User's email is auto-filled 
> 4. User's phone number is auto-filled 
> 5. Date of visit is auto-filled with the current date
> 6. Information is only auto-filled when it exists for the given user (not all user's have all of this information saved on their account)
> 7. Auto-filled information can be manually edited afterwards



#### TASK 1.0.29 - Refactor the Database Schema and Produce an Updated ER Diagram 
> Analyze the existing Supabase database schema, identify structural issues and inconsistencies, and refactor the design to better support the Site Inspection Form functionality. Update relationships, normalize tables where necessary, and produce a clear ER diagram that reflects the revised data model.


#### US 1.0.30 - Rich Text Formatting for Form Description Fields
> **As** an admin, **I want** to apply bold, underline, italic, and link formatting to question subtext and section descriptions in the form editor, **so that** I can write clearer, more expressive descriptions for inspectors filling out site inspection forms without needing to know HTML.

> **Acceptance Tests**

> 1. Toolbar available: When editing a question's subtext or a section's description, a formatting toolbar with B, U, I, and link buttons is displayed above the text input.
> 2. Bold formatting: Selecting text and clicking B (or pressing Ctrl+B / Cmd+B) wraps the selection in .... Clicking again removes the markers.
> 3. Underline formatting: Selecting text and clicking U (or pressing Ctrl+U / Cmd+U) wraps the selection in .... Clicking again removes the markers.
> 4. Italic formatting: Selecting text and clicking I (or pressing Ctrl+I / Cmd+I) wraps the selection in .... Clicking again removes the markers.
> 5. Link embedding: Selecting text and clicking the link button converts it to selected text with url pre-selected for immediate replacement. With no selection, link text is inserted with link text pre-selected.
> 6. Live preview: The right-side preview panel in the form editor reflects all formatting changes in real time, for both the "Add Question" and "Edit Question" workflows.
> 7. Consumer form rendering: Bold, underline, italic, and links in question subtext and section descriptions render correctly for inspectors on the New Report and Edit Report pages. Links open in a new tab.
> 8. Backward compatibility: Existing plain-text descriptions and subtext display identically to before; no data migration is required.
> 9. XSS safety: Raw HTML other than `<script>` is not rendered; only the allowed element set (strong, em, u, a) is processed.

---
### **P2 – Site Image Management System**
---


#### US 2.0.1 – Manage the uploading and storing of site inspection images | Story Points: 8
> **As** an Admin, **I want** images uploaded from the Site Inspection Form web application to be stored in an AWS S3 bucket and referenced in the database, **so that** they can be accessed and managed for future reports.

> **Acceptance Tests**

> 1. Images are stored in AWS S3 (tests for generating presigned and preventing upload for unsupported and large size files)
> 2. Image metadata is stored in the database (metadata consistency across AWS and Supabase)
> 3. Uploaded images are accessible through the application

#### US 2.0.2 – Image Metadata| Story Points: 2
> **As** a User, **I want** the image I upload to retain its metadata, such as descriptions, **so that** I do not have to retype previous descriptions.

> **Acceptance Tests**

> 1. Keeps uploaded image visible after switching sections and returning
> 2. Keeps caption and description values after switching sections and returning

#### US 2.0.3 – Gallery View | Story Points: 3 

> **As** a User, **I want** to be able to see a gallery view of uploaded images, **so that** I can reference/view multiple images at once.

> **Acceptance Tests**  

> 1. Renders multiple site images in gallery layout
> 2. Uses site-scoped gallery endpoint for selected site 
> 3. Opens image detail modal with metadata from selected card 
> 4. Switches detailed view when another image is opened

#### US 2.0.4 – Offline Image Viewing | Story Points: 5

> **As** a User, **I want** to be able to view images offline, **so that** I can reference previous images where I don’t have internet access

> **Acceptance Tests**  

> 1. Previously viewed or downloaded images are accessible without an internet connection (airplane mode).
> 2. Images load correctly in offline mode without application errors.
> 3. Users are informed when images are unavailable due to not being cached.


#### TASK 2.0.5 - Discover other suitable image storage platforms
> Discover more viable and cheaper solutions to be able to upload and store images online (as opposed to supabase). The budget is under CAD$50 per month.


#### TASK 2.0.6 - Refactor Report Rendering to Use Updated Database Schema
> Update report rendering logic to fetch and display data using the refactored Supabase schema. Modify queries and joins to align with the new Form Responses and Answers tables and verified correct rendering of all question types.

#### US 2.0.7 – Admin Management of Media Files  | Story Points: 13

> **As** an Admin, **I want** all uploaded media files to be stored with standardized metadata and linked to a site, **so that** I can organize, search, and manage images regardless of whether they were uploaded through an SIR or as standalone media

> **Acceptance Tests**  

> 1. All uploaded media files are linked to one existing site
> 2. The system stores metadata for each media file, including site, date, uploader name, and identifier.
> 3. Media files are saved using the SAPAA naming format derived from the metadata. e.g. ClydeFen-2025-01-23-BobSuruncle-ATVTrack.jpg.
> 4. Admins can view all media files in the image gallery with their associated metadata.
> 5. Admins can search or filter media files using stored metadata fields.


#### US 2.0.8 – User Upload of Standalone Site Images  | Story Points: 8

> **As** a User, **I want** to upload a standalone image without creating an SIR, **so that** I can store site-related photos with metadata even when they are not tied to a specific inspection report.

> **Acceptance Tests**  

> 1. A user can upload an image without creating or submitting an SIR.
> 2. The user must select one site from the site dropdown before uploading the image.
> 3. The user must enter metadata for the image, including identifier and date.
> 4. The system automatically records the uploader’s name from the authenticated user.
> 5. The user may optionally enter a Photographer field if the image was taken by someone else.
> 6. The image is saved with the associated metadata and linked to the selected site.
> 7. The image appears in the site’s image gallery after upload.

#### US 2.0.9 – Homescreen Gallery View  | Story Points: 5

> **As** a User, **I want** to access a centralized Image Gallery, **so that** I can quickly browse through site photos without having to navigate into each individual site.

> **Acceptance Tests**  

> 1. Images are displayed in reverse chronological order by default.
> 2. Each image in the gallery clearly displays the Site Name it belongs to.
> 3. User can search the gallery with the provided search bar.
> 4. If no images have been uploaded to any site, the gallery displays a "No images available" message.

---
### **P3 – Site Inspection Mobile Application (Android & iOS)**
---

#### US 3.0.1 – Access the mobile version of the Site Inspection Form | Story Points: 5

> **As** a User, **I want** to be able to access the Site Inspection form on the mobile app, **so that** I can make observations and reports while I’m out in the field.

> **Acceptance Tests**  

> 1. Users can access the Site Inspection Form on both Android and iOS applications.
> 2. The mobile form supports all required inspection fields.
> 3. The SIR can be submitted from the mobile application
> 4. Form input is usable on small screens in field conditions.
> 5. Reports done on the mobile application are visible on the web and vice versa



#### US 3.0.2 – Offline Data Syncing  | Story Points: 8 

> **As** a User, **I want** the information that I gather while offline to be automatically uploaded once I regain connection, **so that** I don’t have to waste time manually reuploading information.  

> **Acceptance Tests**  

> 1. Inspection data can be collected while the device is offline. 
> 2. Offline data is automatically uploaded once connectivity is restored. 
> 3. Users can see the sync status of pending inspections. 
> 4. Offline data is temporarily stored locally


---
### **P4 – Site Management**
---

#### US 4.0.1 – PDF Generation of SIRs| Story Points: 5

> **As** an Admin, **I want** to generate a customizable PDF export of Site Inspection Reports, **so that** I can review historical site data and provide documentation for audits or stakeholders.

> **Acceptance Tests** 

> 1. Export PDF button is accessible on Admin panel only
> 2. Export PDF allows Admin to select questions wanted
> 3. Export PDF allows Admin to select time period interested
> 4. Export PDF correctly generates the PDF given the criteria

#### US 4.0.3 – Update Site Profile of a Particular Site | Story Points: 3

> **As** an Admin, **I want** to be able to update a profile for each site, **so that** users of the app can stay informed about the state of the site

> **Acceptance Tests**  

> 1. County of site can be updated
> 2. Site type should be able to be updated
> 3. Natural region should be updated
> 4. Name of site should be able to be updated
> 5. Admins can access option to edit site profile
> 6. Non-admin users cannot access option to edit site profile
> 7. Updates made to a site profile are visible to users


#### US 4.0.4 – Disable Site Profile of a Particular Site | Story Points: 3

> **As** an Admin, **I want** to be able to remove a profile for each site, **so that** I can keep what crown land is up to date

> **Acceptance Tests**  

> 1. Site is removed from the app
> 2. Any associated inspection forms are pushed to admin’s drive then disable
> 4. Users cannot interact with the site anymore
> 5. Admins have access to the option to remove a site profile
> 6. Non-admin users cannot access the option to remove a site profile

---
### **P5 – User Accounts User Stories**
---


#### US 5.0.1 – Sign In Feature | Story Points: 2

> **As** a User, **I want** to be able to sign in to the app **so that** I can use my previous account.

> **Acceptance Tests** 

> 1. Correct email and password allow access
> 2. Incorrect credentials display an error
> 3. User should be forced to input all fields


#### US 5.0.2 – Sign Out Feature | Story Points: 2

> **As** a User, **I want** to be able to sign out of the app **so that** I can access the app through a different account.

> **Acceptance Tests**  

> 1. User is logged out and all tokens are revoked
> 2. User is redirected to the home page
> 3. Login information remains stored in the database
> 4. User can sign back in with the same or a different account
> 5. Back navigation does not return to protected screens
> 6. If sign out fails, an error message is displayed and the user can try again


#### US 5.0.3 – Edit Account Feature | Story Points: 2

> **As** a User, **I want** to be able to edit my account information **so that** I can keep my information up to date.

> **Acceptance Tests**  

> 1. Updating login-related info requires re-login
> 2. Next login works only with updated credentials
> 3. User must be logged in to update information
> 4. Non-login info updates do not require re-login
> 5. Users can only edit their own account and not that of others



#### US 5.0.4 – Disable Account Feature | Story Points: 2

> **As** a User, **I want** to be able to disable my account **so that** my login information is no longer stored or accessible.

> **Acceptance Tests**  

> 1. Disabled accounts cannot log in again
> 2. If User disabled their account they should be taken back to the home screen
> 3. Users can only disable their own account
> 4. A user trying to disable their account should be prompted by a confirmation message first (‘Are you sure you want to disable your account?’)
> 5. A user should be able to accept the confirmation and their account should then be disabled
> 6. A user should be able to deny the confirmation and their account should not be disabled


---
### **P6 – Miscellaneous User Stories**
---


#### US 6.0.1 – Toggle Dark mode for web and mobile applications | Story Points: 2

> **As** a User, **I want** to enable dark mode for the web and mobile applications **so that** I can reduce eye strain.

> **Acceptance Tests**  

> 1. Users can enable and disable dark mode in web and mobile apps
> 2. Preference persists across sessions
> 3. UI remains readable in both modes
> 4. Selecting the current mode causes no change


#### US 6.0.2 – Change Text Size on Screen | Story Points: 3

> **As** a User, **I want** to be able to choose the size of text on screen from a set of preset font sizes, **so that** the app is more accessible my needs and vision..

> **Acceptance Tests**  

> 1. There are a few (~3) font size options offered to the user
> 2. Users can change font size by selecting one of the other options
> 3. When an option is selected the text on screen will change size to match the selected option
> 4. UI and information should be legible and responsive regardless of font size
> 5. If a user selects the font size they are already using, nothing should change

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
* US 2.0.2 – Image Metadata
* US 2.0.3  - Gallery View
* TASK 2.0.6 - Refactor Report Rendering to Use Updated Database Schema
* US 4.0.1 - PDF Generation
* US 4.0.3  - Update Site Profile of a Particular Site
* US 4.0.4 - Disable Site Profile of a Particular Site
* US 1.0.24 – Modify my Site Inspections Form Questions
* US 1.0.25 – Hide a Site Inspections Form Question
* US 1.0.30 - Rich Text Editor for Site Inspection Form Description


### Could Have
* US 1.0.17 - (Admin) Add Questions Site Inspections Form
* US 1.0.18 - Adding image caption
* US 1.0.19 - Admin Viewing Images and Metadata
* US 2.0.4 - Offline Image Viewing
* US 3.0.2 - Offline Data Syncing
* US 5.0.1 - Sign in feature
* US 5.0.2 - Sign out feature
* US 5.0.3 - Edit account feature
* US 5.0.4 - Disable account feature
* US 6.0.2 - Change Size of Text on Screen

### Would Like But Won't Get
* US 1.0.20 - Admin Editing Image Metadata
* US 3.0.1 - Access the mobile version of the Site Inspection Form
* US 6.0.1 - Toggle Dark mode for web and mobile applications


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

