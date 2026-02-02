# Project Management

This page provides a general overview of the assigned tasks and roles for the duration of five sprints (subject to change).

## Story Map
[View the Story Map on MURAL](https://app.mural.co/t/w26sapaa5191/m/w26sapaa5191/1769738797979/50f464dfdeaa98350a875ad25dff2f1a613ea7a3?sender=ubcb7600326dec09377448403)

![Story Map](images/W26-SAPAA-Storymap.png)

## Project Plan

**Project Scrum Master:** Jason Liang

**Project Product Owner:** Harveer Deol

### Sprint 1
**Due:** *September 28, 2025*

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|User Stories                                   |Documentation  |Mehrdad                        |Sep 28th|
|Project Requirements Doc                       |Documentation  |Mehrdad, Ashlyn                |Sep 28th|
|Architecture Diagram                           |Documentation  |Derrick                        |Sep 28th|
|UML Diagram                                    |Documentation  |Ashlyn, Shane, Aaryan          |Sep 28th|
|Sequence Diagram                               |Documentation  |Gabe                           |Sep 28th|
|User Interface Mockup                          |Documentation  |Ashlyn, Shane                  |Sep 28th|
|Software Design Doc                            |Documentation  |Gabe, Derrick, Shane, Aaryan   |Sep 28th|
|Project Management Doc                         |Documentation  |Gabe, Mehrdad                  |Sep 28th|
|Team Canvas                                    |Documentation  |Everyone                       |Sep 28th|
|Teamwork Doc                                   |Documentation  |Derrick, Aaryan                |Sep 28th|
|Research and evaluate cloud database options   |US 5A.01       |Everyone                       |Sep 28th|


### Sprint 2

**Due:** *October 12, 2025*

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 5C.01 – Automate Data Entry from Google Forms|5|
|US 6B.01 – View Site Data Offline|5|
|US 6B.02 - Sort Sites by Name or Inspection Date|2|
|US 6B.03 - View Full Inspection History Offline|3|
|US 6B.04 – View Site Photos Offline|3|
|US 6B.05 – Read Official PDF Reports Offline|3|
|US 6B.08 - Secure Access to Sensitive Data|5|

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Set up Supabase project and create PostgreSQL schema|US 5C.01|Derrick|Oct 12th|
|Automate data transformations in Google Sheets to be ready for manual transfer|US 5C.01|Aaryan|Oct 12th|
|Initialize React Native + Expo project for Field Notes Reader|US 6B.01|Mehrdad |Oct 12th|
|Implement Analytics screen with KPIs|US 6B.01|Mehrdad|Oct 12th|
|Implement mock SQLite data model (sites, inspections, images, pdfs)|US 6B.01|Mehrdad |Oct 12th|
|Build offline site screen with search and age badges|US 6B.01|Mehrdad|Oct 12th|
|Implement basic sort (A-Z, newest first)|US 6B.02|Mehrdad|Oct 12th|
|Implement Site Detail screen with full inspection history|US 6B.03|Mehrdad|Oct 12th|
|Add photo support (offline, bundled assets)|US 6B.04|Mehrdad|Oct 12th|
|Add PDF viewer (offline, bundled assets)|US 6B.05|Mehrdad|Oct 12th|
|Integrate authentication flow (login/logout)|US 6B.08|Ashlyn|Oct 12th|
|Write acceptance tests|All US|Everyone|Oct 12th|
|Update documentation|Documentation|Everyone|Oct 12th|


**Sprint Velocity:** 26


### Sprint 3

**Due:** *October 26, 2025*

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 5C.01 – Automate Data Entry from Google Forms|5|
|US 5C.05 – Migrate MS Access Queries into new database system|3|
|US 5D.01 - View Database Analytics|3|
|US 5D.02 - View All Registered Users|3|
|US 5D.03 - Delete Accounts of Registered Users|3|
|US 5D.04 - Add a New Field Notes Reader Account as an Admin|3|
|US 6B.03 - View Most Inspection History Offline|3|
|US 6B.06 – View SAPAA Protected Area Map|5|
|US 6B.07 – Select and Download Sites for Offline Use|5|
|US 6B.08 - Secure Access to Sensitive Data|5|
|US 6B.09 - Install Field Notes Reader via sideloaded APK|3|

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Automate manual work on Google Sheets to the best extent to create DB ready data|US 5C.01|Aaryan|Oct 26th|
|Create Apps Script functions to handle data operations in Google Sheets|US 5C.01|Aaryan|Oct 26th|
|Handle data validations and error checking before sending data to Supabase|US 5C.01|Aaryan|Oct 26th|
|Enable the admin to use Google Sheets to make modifications and sync them to Supabase|US 5C.01|Aaryan|Oct 26th|
|Recreate MS Access queries as PostgreSQL views|US 5C.05|Derrick|Oct 26th|
|Implement an admin dashboard|US 5D.01|Shane|Oct 26th|
|Migrate authentication to Supabase (email signup/login + confirmation dialog)|US 6B.08|Ashlyn|Oct 26th|
|Secure data access with RLS so authenticated users can read site data|US 6B.08|Ashlyn|Oct 26th|
|Add capability to view all registered FNR users|US 5D.02|Shane|Oct 26th|
|Add an account deletion feature for FNR accounts|US 5D.03|Shane|Oct 26th|
|Add an account creation feature for FNR accounts|US 5D.04|Shane|Oct 26th|
|Add Q31 (naturalness score) and Q32 (inspection details) to Site Detail screen|US 6B.03|Mehrdad|Oct 26th|
|See naturalness score as color gradient|US 6B.03|Ashlyn|Oct 26th|
|Add map of SAPAA protected areas to application|US 6B.06|Mehrdad|Oct 26th|
|Implement data age component on all screens|US 6B.07|Mehrdad|Oct 26th|
|Connect real Supabase data|Mehrdad|US 6B.07|Oct 26th|
|Add downloaded icon on downloaded sites|US 6B.07|Mehrdad|Oct 26th|
|Generate an unsigned .apk for sideloading|US 6B.09|Mehrdad|Oct 26th|
|Update Offline Reader UI|US 6B|Mehrdad, Ashlyn|Oct 26th|
|Implement an average naturalness gradient visualization and convert inspection reports into expandable accordion-style cards|US 6B.03|Ashlyn|Oct 26th|
|Update documentation|Documentation|Everyone|Oct 26th|


**Sprint Velocity:** 44


### Sprint 4

**Due:** *November 9, 2025*

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 5C.01 – Automate Data Entry from Google Forms|5|
|US 5C.02 – Edit Records|3|
|US 5C.03 – Generate and Preview PDF Reports Instantly|2|
|US 5D.05 – Visualize Keyword Occurrences as a Heatmap|3|
|US 6C.01 – Answer Site Inspection Questions on Web Page|3|
|US 6C.02 - Edit Site Inspections Form|5|
|US 6B.04 – View Site Photos Offline|5|
|US 6B.05 – Read Official PDF Reports Offline|3|
|US 6B.07 – Update My Offline Data When Online|5|
|US 6B.12 – Configure App Settings|3|
|US 6B.13 – Manage Offline Data Retention|3|
|US 6B.14 – Toggle Dark Mode|2|
|US 6B.15 – Sign in with Google and Microsoft OAuth|5|
|US 6B.16 - Compare Inspection Answers Across Reports|3|


#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Implement Settings screen with navigation tab|US 6B.12|Mehrdad|Nov 9th|
|Add data retention controls (custom and presets)|US 6B.13|Mehrdad|Nov 9th|
|Add dark mode toggle with theme persistence|US 6B.14|Mehrdad|Nov 9th|
|Enable site deletion when online|US 6B.07|Mehrdad|Nov 9th|
|Optimize UI colors and fonts|US 6B|Mehrdad|Nov 9th|
|Optimize Application Performance|US 6B|Mehrdad|Nov 9th|
|Implement new web page to answer site inspection forms|US 6C.01|Derrick|Nov 9th|
|Add ability to edit site inspection form questions|US 6C.02|Derrick|Nov 9th|
|Edit Records|US 5C.02|Gabe|Nov 9th|
|Implement offline PDF report viewer with caching|US 6B.05|Ashlyn|Nov 9th|
|Design and implement PDF generation modal with field selection UI|US 5C.03|Ashlyn|Nov 9th|
|Implement a basic heatmap for the Admin panel|US 5D.05|Shane|Nov 9th|
|Implement Preview and Share PDF functionality with error handling|US 5C.03|Ashlyn|Nov 9th|
|Create collapsible question cards with chronological answer grouping|US 6B.16|Ashlyn|Nov 9th|
|Implement tab navigation component for By Date/By Question views|US 6B.16|Ashlyn|Nov 9th|
|Configure Google and Microsoft OAuth providers in Supabase and cloud consoles|US 6B.15|Ashlyn|Nov 9th|
|Implement OAuth sign-in functions with expo-web-browser integration|US 6B.15|Ashlyn|Nov 9th|
|Implement the site locator (heatmap) feature for the FNR|US 5D.05|Shane|Nov 9th|
|Finalize Google Apps Script code|US 5C.01|Aaryan|Nov 9th|
|Update documentation|Documentation|Everyone|Nov 9th|

Sprint Velocity: 50


### Sprint 5

**Due:** *November 30, 2025*

#### User stories

|User Story|Story points|
|:---:|:---:|
|US 5C.01 – Automate Data Entry from Google Forms|5|
|US 5C.04 – Keep Using Familiar Tools|2|
|US 6B.14 – Toggle Dark Mode|2|
|US 6C.03 - Integrate Field Notes Reader into Web App|8|
|US 7A.01 – Integrate Field Note Reader with Legacy "acs_checkin" App |8|

#### Tasks

|Task|Related US|Assignee|Due|
|:---:|:---:|:---:|:---:|
|Create Google Sheets documentation|US 5C.01|Aaryan|Nov 30th|
|Update UX/UI in web app|US 6C.03|Aaryan|Nov 30th|
|Add dark mode toggle with theme persistence|US 6B.14|Mehrdad|Nov 30th|
|Create Offline Reader app documentation|US 6B|Mehrdad|Nov 30th|
|Finzalize steward analytics screen|US 6B|Mehrdad|Nov 30th|
|Update ui for the admin dashboard|US 5D|Shane|Nov 30th|
|Port over the admin dashboard and the account management to the web app|6C.03|Shane|Nov 30th|
|Finalize documentation|Documentation|Everyone|Nov 30th|

Sprint Velocity: 25