# Software Design

This page includes a short description of the overall architecture style of the system, its high-level system components, and their logical (what data they exchange) and control (how they invoke each other) dependencies.

---

## Architecture Diagram

This diagram provides a high-level understanding of the architecture involved in the project.

![Architecture Diagram](images/Architecture.png)

---

## AWS Architecture 

For details about how images are stored and retrieved, see the
[Media Storage Architecture](aws-architecture.md).

---

## Database Schema (ER Diagrams)

One Supabase database holds two inspection systems. The web app uses the `W26_*` and `S26_*` tables. The mobile app (StewardLog) and the Google Apps Script use the legacy tables. The `luperson` table is the only table that both systems use. Data that one system writes does not show in the other system.

The current-schema diagrams show only the tables and columns that the code reads or writes, or that `webapp/supabase/migrations/` defines. A column type is "unknown" when the code does not show it.

### Current schema: web app

[Mermaid source](assets/ER_Diagram.mmd)

![Current schema, web app](images/ER_Diagram_mermaid.svg)

### Current schema: mobile app and Google Sheets (legacy)

[Mermaid source](assets/ER_Diagram_Legacy.mmd)

![Current schema, legacy](images/ER_Diagram_Legacy_mermaid.svg)

### Proposed schema for the user stories

This diagram shows the web app tables after the user stories in the [User Stories](user-stories.md). Each table is marked EXISTING or NEW. Each new table and column names the user story that needs it. The proposed items are a design proposal, not a decision. The open questions are in the comments of the Mermaid source.

[Mermaid source](assets/ER_Diagram_Proposed_User_Stories.mmd)

![Proposed schema](images/ER_Diagram_Proposed_User_Stories.svg)

---

## UML Class Diagram

The class diagram is in two parts. Part 1 shows the services of the web app and the mobile app, and the external systems that they call. Part 2 shows the data models. A class with a `<<new x.y.z>>` stereotype is proposed. A member with the tag `[NEW x.y.z]` or `[CHANGE x.y.z]` is a proposed change for that user story. All other items exist in the code today.

### Part 1: Services

[Mermaid source](assets/UML_Class_Diagram.mmd)

![UML class diagram, services](images/UML_Class_Diagram.svg)

### Part 2: Data models

[Mermaid source](assets/UML_Class_Diagram_Models.mmd)

![UML class diagram, data models](images/UML_Class_Diagram_Models.svg)

---

## Sequence Diagrams

Each diagram names the user stories that it covers. A step with "(proposed)" does not exist in the code today. The diagrams show the server-side permission checks that the user stories need. Today most server actions do not do these checks. US 4.0.6 has no diagram, because it changes only one form field.

### US 1.0.1, 1.0.3, 1.0.4: View a Steward Profile

[Mermaid source](assets/Sequence_US_1_0_1_1_0_3_1_0_4_View_Steward_Profile.mmd)

![US 1.0.1, 1.0.3, 1.0.4: View a Steward Profile sequence diagram](images/Sequence_US_1_0_1_1_0_3_1_0_4_View_Steward_Profile.svg)

### US 1.0.2: Edit Own Profile

[Mermaid source](assets/Sequence_US_1_0_2_Edit_Own_Profile.mmd)

![US 1.0.2: Edit Own Profile sequence diagram](images/Sequence_US_1_0_2_Edit_Own_Profile.svg)

### US 1.0.5: Earn Points for Inspection Activity

[Mermaid source](assets/Sequence_US_1_0_5_Activity_Points.mmd)

![US 1.0.5: Earn Points for Inspection Activity sequence diagram](images/Sequence_US_1_0_5_Activity_Points.svg)

### US 2.0.1, 2.0.6: View Sites on the Map, Search and Filter

[Mermaid source](assets/Sequence_US_2_0_1_2_0_6_Site_Map_Search_and_Filter.mmd)

![US 2.0.1, 2.0.6: View Sites on the Map, Search and Filter sequence diagram](images/Sequence_US_2_0_1_2_0_6_Site_Map_Search_and_Filter.svg)

### US 2.0.2: Add a New Site

[Mermaid source](assets/Sequence_US_2_0_2_Add_Site.mmd)

![US 2.0.2: Add a New Site sequence diagram](images/Sequence_US_2_0_2_Add_Site.svg)

### US 2.0.3, 2.0.5: Deactivate, Reactivate and Update a Site

[Mermaid source](assets/Sequence_US_2_0_3_2_0_5_Update_and_Deactivate_Site.mmd)

![US 2.0.3, 2.0.5: Deactivate, Reactivate and Update a Site sequence diagram](images/Sequence_US_2_0_3_2_0_5_Update_and_Deactivate_Site.svg)

### US 2.0.4: Delete a Site

[Mermaid source](assets/Sequence_US_2_0_4_Delete_Site.mmd)

![US 2.0.4: Delete a Site sequence diagram](images/Sequence_US_2_0_4_Delete_Site.svg)

### US 2.0.8, 2.0.10: View a Site's Details From the Map

[Mermaid source](assets/Sequence_US_2_0_8_2_0_10_Site_Details_From_Map.mmd)

![US 2.0.8, 2.0.10: View a Site's Details From the Map sequence diagram](images/Sequence_US_2_0_8_2_0_10_Site_Details_From_Map.svg)

### US 2.0.9: Upload a GPX Track of a Site Visit

[Mermaid source](assets/Sequence_US_2_0_9_GPX_Track_Upload.mmd)

![US 2.0.9: Upload a GPX Track of a Site Visit sequence diagram](images/Sequence_US_2_0_9_GPX_Track_Upload.svg)

### US 2.0.11: Show Safety Information for a Site

[Mermaid source](assets/Sequence_US_2_0_11_Site_Safety_Information.mmd)

![US 2.0.11: Show Safety Information for a Site sequence diagram](images/Sequence_US_2_0_11_Site_Safety_Information.svg)

### US 2.0.12, 2.0.13: Site To-Visit Priority and Reassessment Reminder

[Mermaid source](assets/Sequence_US_2_0_12_2_0_13_Site_Priority_Score.mmd)

![US 2.0.12, 2.0.13: Site To-Visit Priority and Reassessment Reminder sequence diagram](images/Sequence_US_2_0_12_2_0_13_Site_Priority_Score.svg)

### US 3.0.2: Steward Designation

[Mermaid source](assets/Sequence_US_3_0_2_Steward_Designation.mmd)

![US 3.0.2: Steward Designation sequence diagram](images/Sequence_US_3_0_2_Steward_Designation.svg)

### US 3.0.3: Export All Digital Files

[Mermaid source](assets/Sequence_US_3_0_3_Export_All_Digital_Files.mmd)

![US 3.0.3: Export All Digital Files sequence diagram](images/Sequence_US_3_0_3_Export_All_Digital_Files.svg)

### US 4.0.2: Offline and Online Map Layers

[Mermaid source](assets/Sequence_US_4_0_2_Offline_and_Online_Map_Layers.mmd)

![US 4.0.2: Offline and Online Map Layers sequence diagram](images/Sequence_US_4_0_2_Offline_and_Online_Map_Layers.svg)

### US 4.0.4: Edit My Previous Inspections

[Mermaid source](assets/Sequence_US_4_0_4_Edit_My_Previous_Inspections.mmd)

![US 4.0.4: Edit My Previous Inspections sequence diagram](images/Sequence_US_4_0_4_Edit_My_Previous_Inspections.svg)

### US 4.0.5: iNaturalist Photo Import

[Mermaid source](assets/Sequence_US_4_0_5_iNaturalist_Photo_Import.mmd)

![US 4.0.5: iNaturalist Photo Import sequence diagram](images/Sequence_US_4_0_5_iNaturalist_Photo_Import.svg)

### US 4.0.7: Show the Top iNaturalist Observations for a Site

[Mermaid source](assets/Sequence_US_4_0_7_Top_iNaturalist_Observations.mmd)

![US 4.0.7: Show the Top iNaturalist Observations for a Site sequence diagram](images/Sequence_US_4_0_7_Top_iNaturalist_Observations.svg)

### US 5.0.2, 5.0.4: Password Reset and Sign Out

[Mermaid source](assets/Sequence_US_5_0_2_5_0_4_Password_Reset_and_Sign_Out.mmd)

![US 5.0.2, 5.0.4: Password Reset and Sign Out sequence diagram](images/Sequence_US_5_0_2_5_0_4_Password_Reset_and_Sign_Out.svg)

### US 6.0.1: Site Geometry From the Shared Source

[Mermaid source](assets/Sequence_US_6_0_1_Site_Geometry_Load.mmd)

![US 6.0.1: Site Geometry From the Shared Source sequence diagram](images/Sequence_US_6_0_1_Site_Geometry_Load.svg)

### US 7.0.1: Steward Exports Own SIR as PDF

[Mermaid source](assets/Sequence_US_7_0_1_Steward_PDF_Export.mmd)

![US 7.0.1: Steward Exports Own SIR as PDF sequence diagram](images/Sequence_US_7_0_1_Steward_PDF_Export.svg)

### US 7.0.3, 7.0.4: Inspection Summaries

[Mermaid source](assets/Sequence_US_7_0_3_7_0_4_Inspection_Summaries.mmd)

![US 7.0.3, 7.0.4: Inspection Summaries sequence diagram](images/Sequence_US_7_0_3_7_0_4_Inspection_Summaries.svg)

### US 7.0.5: Delete an Image and Clean Up After It

[Mermaid source](assets/Sequence_US_7_0_5_Image_Delete_and_Cleanup.mmd)

![US 7.0.5: Delete an Image and Clean Up After It sequence diagram](images/Sequence_US_7_0_5_Image_Delete_and_Cleanup.svg)

### US 7.0.6, 7.0.7: Bulk SIR Export With Hidden Fields

[Mermaid source](assets/Sequence_US_7_0_6_7_0_7_Bulk_SIR_Export_With_Hidden_Fields.mmd)

![US 7.0.6, 7.0.7: Bulk SIR Export With Hidden Fields sequence diagram](images/Sequence_US_7_0_6_7_0_7_Bulk_SIR_Export_With_Hidden_Fields.svg)

### US 7.0.8: Delete a Site Inspection Report

[Mermaid source](assets/Sequence_US_7_0_8_Delete_SIR.mmd)

![US 7.0.8: Delete a Site Inspection Report sequence diagram](images/Sequence_US_7_0_8_Delete_SIR.svg)

---

## Low-Fidelity User Interface

This is a low-fidelity projection of the end-product. The final design may take a different direction.


[View them on figma](https://www.figma.com/design/8WLN54CokqHyoJHdGFY6kd/SAPAA-UI?node-id=0-1&p=f&t=dd9Or2IMUNQLwult-0)

### This is a low-fidelity UI for the web app


![Low-Fidelity User Interface for web app](images/WEBAPP UI.jpg)

### This is a low-fidelity UI for the mobile app

![Low-Fidelity User Interface for mobile app](images/MOBILEAPP UI.jpg)

---

## List of Technologies Used

### Web app (`webapp/`)
  * [Next.js 16](https://nextjs.org/docs) with the App Router
  * [React 19](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/docs/)
  * [MUI](https://mui.com/material-ui/) and [Tailwind CSS](https://tailwindcss.com/docs) for the user interface
  * [Leaflet](https://leafletjs.com/) and [React Leaflet](https://react-leaflet.js.org/) for maps
  * [React-pdf](https://react-pdf.org/) for the PDF export of inspection reports

### Mobile app StewardLog (`FNR/`)
The Fall 2025 team built the mobile app. The Winter 2026 team did not change it.
  * [Expo 54](https://docs.expo.dev/) and [React Native 0.81](https://reactnative.dev/docs/getting-started)
  * [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for the offline copy of site data
  * [PDF.js](https://mozilla.github.io/pdf.js/) to show PDF reports in the app

### Backend: Supabase + PostgreSQL + AWS
  * [Supabase Documentation](https://supabase.com/docs) for the database and authentication
  * [PostgreSQL Documentation](https://www.postgresql.org/docs/)
  * [Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) for inspection photos

### Cloud Infrastructure & Cost Control
  * [AWS IAM](https://docs.aws.amazon.com/iam/)
  * [AWS Budgets & Billing Alerts](https://docs.aws.amazon.com/cost-management/)

### Deployment: Vercel
  * [Vercel Documentation](https://vercel.com/docs) hosts the web app. See the [Deployment Manual](Deployment-manual.md).
  * The team discussed Cybera as an alternative host. It is not in use.

### Testing & Tools
  * [Jest](https://jestjs.io/) for unit tests in the web app and the mobile app
  * [Cypress](https://docs.cypress.io/) for end-to-end tests of the web app
  * [GitHub Actions](https://docs.github.com/en/actions) runs the tests on each push
