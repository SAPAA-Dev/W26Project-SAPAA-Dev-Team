# Project Requirements

## Executive summary

SAPAA is a volunteer society. Its stewards visit about 270 protected areas in Alberta and file a Site Inspection Report
(SIR) after each visit. The client wants to stop the manual handling of these reports ("Google sheets are dead. Do not
store data in Google Sheets.") and wants to know where each natural area is and what stewards did there. SAPAA Stewards
gives the Admin and the stewards one system for this work. Stewards fill in the SIR in the web application, and they can
look up sites in the StewardLog mobile application. Each report goes directly into a PostgreSQL database, and its photos
go to AWS S3. The Admin approves user accounts, examines the data and makes PDF reports without manual data entry. This
term, the team first evaluates and fixes the bugs and minor enhancements on the client's list (version 1.1). Then the
team adds a site map, GPX track upload, steward profiles and simple gamification (version 2.0). These features help SAPAA
manage its people and places and give stewards a reason to visit more sites.

### Scope for Fall 2026

Version 1.1 fixes the bugs and pain points in the application and improves the user experience for Admins and stewards,
so that the application is ready for public release. The [user stories](user-stories.md) give the details.

Version 2.0 starts the client's vision of People Management and Place Management, with a smaller scope this term. The
steward profile stories (US 1.0.1 to US 1.0.5) are the base for People Management. With these stories, stewards can see
steward profiles and edit their own profile. A profile shows the inspection history, the activity statistics and the
points of the steward. The new site profiles and the site map are a first step toward Place Management. Simple
gamification increases steward engagement.

The primary user is the Admin, who needs a reliable system that does not need manual data handling and that still gives
access to the data, the reports and their distribution. The stewards are the second group of users. The StewardLog
mobile application (Expo, in the `FNR/` folder) already exists for Android and iOS and keeps an offline copy of site
data. The client said that offline capability on the web application is necessary, but it is not in a charter project
for this term.


## User stories
[Click to go to the user stories.](user-stories.md)


## Project glossary

- **Abuses:** Human activity that damages a Site, for example motorized disturbance. The SIR records human disturbance in Section 8 (Q61 to Q66). It is one of the three inputs to the to-visit priority (US 2.0.12).
- **Admin:** The SAPAA administrator. The Admin manages Site Inspection data, approves user accounts, makes official
reports and sends information to stewards.

- **Biological imperatives:** Ecological reasons that a Site needs a visit, as the Admin judges them. It is one of the three inputs to the to-visit priority (US 2.0.12).
- **Charter project:** One of the client's numbered project descriptions on the
[SAPAA website](https://sapaastewards.com/2026/06/03/student-opportunities-2026-to-2027/). Each user story maps to a
charter project: Project 1, 2a, 2b, 2c, 3a or 3b.

- **Designated steward:** The Steward that an Admin assigns to a Site (US 3.0.2). The Site page and the Steward's profile show the assignment.
- **GPX (GPS Exchange Format):** A standard file format for GPS data, for example the track of a walk through a site.
A steward records a track with a phone or a handheld GPS and uploads the GPX file to the application.

- **iNaturalist:** A public platform where people record and identify observations of plants and animals. The client asked
the team to register for it before the September 26 field trip. Integration with iNaturalist is a later client project
(Project 3).

- **KML (Keyhole Markup Language):** A file format for geographic shapes such as points, lines and area boundaries. The
Government of Alberta publishes the site boundaries that the SAPAA website uses as KML.

- **Natural Area:** A class of protected area under Alberta's Wilderness Areas, Ecological Reserves, Natural Areas and
Heritage Rangelands (WAERNAHR) Act. SAPAA stewards these areas. Provincial parks are under the Parks Act and are not the
focus of SAPAA.

- **Naturalness score:** A score in the Site Inspection Report that tells the condition of the site.

- **People Management:** A planned client capability to support and track the community of volunteer stewards,
including the activity history of each steward, for future volunteer recognition. This term, the steward profile stories
(US 1.0.1 to US 1.0.5) are the first part of it: steward profiles, editing of a steward's own profile, inspection
history, activity statistics and points.

- **Photo Identifier:** A text field on each photo in a SIR that identifies the photo. It is required today. US 4.0.6 makes it optional.
- **Place Management:** A planned client capability to show where a Site is and what activity occurred there, as an
extension of the maps on the SAPAA website. This term, site profile editing and the site map are the first part of it.

- **Protected Area:** An area of land that Alberta law protects to conserve nature. SAPAA stewards the protected areas
under the WAERNAHR Act, for example Natural Areas and Ecological Reserves.

- **Q-numbers:** The question numbers of the SIR form, for example Q31 (naturalness), Q42 (reason for the visit) and Q63 (motorized disturbance). They stay the same so that new reports can be compared with more than 40 years of past reports.
- **SAPAA:** Stewards of Alberta's Protected Areas Association. A volunteer society that supports the stewardship of
the protected natural areas of Alberta.

- **SAPAA Stewards (also SIR-SAPAA):** The web application. Stewards use it to submit Site Inspection Reports, and it
sends the data automatically to the PostgreSQL database.

- **Site:** One protected area that SAPAA stewards monitor and report on.

- **Site Inspection Report (SIR):** One completed inspection form for one visit to one Site. It records field
observations, ecological conditions, safety notes and steward activities.

- **Steward:** A SAPAA volunteer who visits Sites and submits Site Inspection Reports.

- **StewardLog:** The mobile application for Android and iOS. Its code is in the `FNR/` folder of the repository. It shows
site data and inspection history and keeps an offline copy of site data.
- **To-visit priority:** One value for a Site that the app calculates from the points that an Admin gives for abuses, biological imperatives and time since the last visit. Stewards see it on the Site page and use it to decide whether to prioritize the Site (US 2.0.12).

## Similar products

* [Park Protector](https://playgroundguardian.com/solutions/playground-inspection-software/)
    - **Function:** Inspection software for parks and playgrounds. It schedules frequent and infrequent inspections,
      manages many sites, keeps an inspection history for each site and makes reports.
    - **How we may use it:** Inspiration for the inspection history on each site page and for report export. Its
      recurring inspection plans are an example for the "sites that need attention" features.
* [iNaturalist](https://www.inaturalist.org/)
    - **Function:** A community platform to share and identify observations of nature, with photos, locations and
      species tags.
    - **How we may use it:** Inspiration for photo galleries, for tags on ecological attributes and for the display of
      long-term environmental data. The client wants a link to iNaturalist from each site page, and a later project
      integrates with it.
* [Avenza Maps](https://store.avenza.com/)
    - **Function:** A mobile application for offline maps and PDF map layers.
    - **How we may use it:** Inspiration for the workflow to download, cache and update large data bundles for offline
      use. This applies to the StewardLog mobile application, which keeps an offline copy of site data.
* [ArcGIS Survey123](https://survey123.arcgis.com/)
    - **Function:** A commercial form application from Esri for field data collection. It collects form answers, photos
      and GPS locations, also offline, and shows the results on maps and dashboards.
    - **How we may use it:** Inspiration for the Site Inspection form layout, photo attachments and the link between
      each answer and a location on the map.
* [Gaia GPS](https://www.gaiagps.com/)
    - **Function:** A mobile and web application for offline topographic maps. It records tracks and imports and
      exports GPX and KML files.
    - **How we may use it:** Inspiration for the GPX track upload and for the display of a track on the site map.


## Open-source projects

* [LimeSurvey](https://www.limesurvey.org/)
    - **Function:** An open-source survey platform, an alternative to Google Forms.
    - **How we may use it:** Examine its code for the structure of questions, sections and answer options. This can
      help the design of the Site Inspection form and the Admin form editor.
* [Ecorismap](https://ecorismap-pro.web.app/)
    - **Function:** An open-source offline application to record and check location data during field surveys.
    - **How we may use it:** Examine how its code records data offline and how its cross-platform React Native
      application is structured. This can help the offline work on StewardLog.
* [KoboToolbox](https://www.kobotoolbox.org/)
    - **Function:** An open-source platform for field data collection. Its forms work offline on mobile devices and
      collect photos and GPS locations.
    - **How we may use it:** Examine how it stores form answers offline and sends them to the server when a connection
      is available. This is a reference for offline inspection reports.
* [ODK (Open Data Kit)](https://getodk.org/)
    - **Function:** An open-source set of tools for mobile data collection. ODK Collect fills in forms offline on
      Android and records GPS points, lines and areas.
    - **How we may use it:** Examine its form definitions and its capture of GPS geometry. This is a reference for the
      GPX upload and for form questions that change over time.


## Technical resources

Documentation and references that the team uses this term.

**Platform and backend**

* [Supabase documentation](https://supabase.com/docs) - Postgres, Auth, Storage and Row Level Security.
* [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - a database
  mechanism that controls which rows each user can read or change. Access control is being improved; see the
  [issue backlog](issues.md).
* [PostgreSQL documentation](https://www.postgresql.org/docs/) - the database under Supabase.
* [PostgREST](https://postgrest.org/) - the query layer of Supabase. A Google Apps Script in this repository writes to
  the database through it directly.
* [What is Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) - inspection photos and
  PDF reports are stored here. The presigned URL pages are the relevant part.
* [AWS IAM](https://docs.aws.amazon.com/iam/) and [AWS Budgets and billing alerts](https://docs.aws.amazon.com/cost-management/) - access to the S3 bucket and control of cloud cost.

**Frontend and mobile**

* [Next.js App Router](https://nextjs.org/docs/app) - the web application uses it. The Server Actions page is important
  for access control. Access control is being improved; see the [issue backlog](issues.md).
* [React documentation](https://react.dev/)
* [Expo documentation](https://docs.expo.dev/) - the StewardLog mobile application uses Expo. EAS Build is necessary for
  publication to the app stores.
* [React Native documentation](https://reactnative.dev/docs/getting-started)
* [Leaflet](https://leafletjs.com/reference.html) - the current map and heat map.

**Geographic data**

* [OpenStreetMap wiki](https://wiki.openstreetmap.org/) - the tile source of the map.
* [OpenCage geocoding API](https://opencagedata.com/api) - the application uses it to find site positions from site
  names. The free tier allows 2,500 requests each day, which is a limit for all map work.
* [GPX 1.1 schema](https://www.topografix.com/gpx.asp) - the format of uploaded GPS tracks.
* [KML reference](https://developers.google.com/kml/documentation/kmlreference) - the format of the site boundaries
  from the Government of Alberta.
* [iNaturalist API](https://api.inaturalist.org/v1/docs/) - for the link to and later integration with iNaturalist.

**Testing and delivery**

* [Jest](https://jestjs.io/docs/getting-started) and [Cypress](https://docs.cypress.io/) - the test frameworks in the
  repository.
* [GitHub Actions](https://docs.github.com/en/actions) - including self-hosted runners, which the Sprint 3 rubric
  requires.
* [Vercel documentation](https://vercel.com/docs) - the deployment platform of the web application.

**Process**

* [Belbin team roles](https://www.belbin.com/about/belbin-team-roles)
* [Nielsen's ten usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) - required by the
  Sprint 3 user interface rubric.
* [WCAG contrast checker](https://accessibilityaid.com/free-tools/colour-contrast-checker) - also for Sprint 3.
