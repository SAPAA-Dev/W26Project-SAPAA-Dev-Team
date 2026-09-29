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


## User Stories
[Click to be directed to user stories.](user-stories.md)


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
 

