# Meeting Minutes

Minutes for the current Fall 2026 team are in the first section. The Winter 2026 sections below
are the previous team's records. We keep them for reference. We changed only their heading levels and corrected some
typing errors.

---

## Fall 2026

The TA (Alex) is CC'd on all client communication, including all client meeting invitations and emails.

### Sprint 1

---

#### September 16, 2026 – Meeting #0: 401 Lab, meeting with TA

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | September 16, 2026 |
| **Time** | 9:30 AM – 10:00 AM MDT |
| **Location** | Online |
| **Attendees** | Chris, Aaron, Saumya, Alissa, Zanab, Abhinav, Jayden, and Alex (TA) |

##### Agenda

- Sprint 1 deliverables and the course documents.
- Expectations for each project document.
- Scrum roles for the semester.

##### Summary

Introduction to Sprint 1 deliverables. Alex went over the course docs, expectations for each project doc, and Scrum roles.

##### Key Discussions & Decisions

- Group chose to meet Alex during lab times at 9:30 AM.
- Alex suggested meeting with SAPAA students from previous 401 semesters to discuss the state of the app and what needs to be worked on.
- Group agreed to meet 4pm onwards on Fridays, and 2pm onwards on Saturdays (can be online but in-person is preferred). Members should drop in; staying the whole time is not required.
- Discussed and assigned the Scrum roles. Roles rotate each sprint. Sprint 1: Chris (Scrum Master), Alissa (Product Owner).

##### Action Items

- Record rotating Scrum roles in the teamwork document.
- Schedule a call with SAPAA volunteers (Saumya)

---

#### September 18, 2026 – Meeting #1: Handover call with previous teams

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | September 18, 2026 |
| **Time** | 6:30 PM – 7:30 PM MDT |
| **Location** | Online |
| **Attendees** | Saumya, Chris, Zanab, Abhinav, Alissa, Aaron, Jayden, plus Alex, our TA for Fall 2026, Vishal, Harveer, Raiyana from the Winter 2026 team and Mehrdad from the Fall 2025 team |

##### Agenda

- Handover from the previous teams: the existing codebase and the repository setup.
- Frank's expectations before Sprint 1.

##### Summary

Onboarding call with the two previous teams to understand the existing codebase, repository setup and Frank's expectations before starting Sprint 1.

##### Key Discussions & Decisions

- Work from Frank's repository rather than the previous team's personal copy, since it holds the latest code.
- Two deployments run in parallel: the course Vercel and Supabase instance, and Frank's own site, which received approved work after each sprint review.
- The previous team built the site inspection form, image upload and gallery, PDF generation and the admin panel. They did no work on the mobile app.
- The map exists on the admin side as a heat map and has been unchanged since Fall 2025. Search does not work.
- Account management is limited to password reset, account creation and deletion, and approval status. It was described as clunky.
- Sign up requires a confirmation email and then manual admin approval, and that flow may be partly broken.
- Mehrdad's advice: the project measures no KPIs at all. That is priority one. Deciding where to display them is priority two.
- No staging environment exists. It was deliberately left for this team.
- Frank runs weekly Friday meetings and expects a slide deck covering what was done, what is next, and open questions.

##### Action Items

- Get access to GitHub, Supabase and Vercel through the shared dev team email (Everyone).
- Boot up the mobile app and assess its state (Everyone).
- Confirm with Frank whether the web app stays the priority over mobile (Saumya).

##### Next Meeting Agenda

- Team working session to draft user stories and plan Sprint 1.

---

#### September 19, 2026 – Meeting #2: Sprint 1 working session

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | September 19, 2026 |
| **Time** | 2:49 PM – 7:27 PM MDT |
| **Location** | Online, with some members in person at ETLC |
| **Attendees** | Saumya, Abhinav, Alissa, Aaron, Jayden, Chris (joined later). Zanab absent, at work. |

##### Agenda

- Repository setup.
- First draft of the user stories.
- Audit of the deployed application.
- Team canvas.
- Division of the Sprint 1 documentation work.

##### Summary

Long working session covering repository setup, a first pass at user stories, an audit of the deployed application, the team canvas, and the division of Sprint 1 documentation work. The team drafted roughly 80 to 90 user stories, agreed on a commit convention and a code review process, and assigned owners to each Sprint 1 deliverable. 

##### Key Discussions & Decisions

- Sprint 1 is due September 29, 2026.
- Repository set up with the previous team's work as upstream. A `meetings` folder was added for transcripts and minutes.
- User stories are written from the point of view of app personas, admin and steward. Stories written from a developer's point of view were cut.
- Defects in features that already exist become bug tickets or issues, not user stories. User stories cover what the team is adding this term.
- MoSCoW will be used for prioritisation. Story points will be estimated once the story list is confirmed with Frank, with the whole team present so estimates can be averaged.
- Acceptance criteria are required on every story and will be written by the team rather than generated.
- GitHub Issues is the issue tracker. A Discord integration for issue notifications was proposed.
- Commit messages use the format `(<purpose>): <text>`, where purpose is one of docs, chore, feat, del, fix, refactor, style, perf, build or ci.
- Code review: the Scrum Master reviews first, then a second reviewer. Pull requests should stay under 500 lines. Code written with LLM assistance must be reviewed manually.
- Branch protection was deferred during Sprint 1 because the work is documentation rather than code.
- Application audit by Aaron found that map search does not work and that the map fails to load with no connection. Nothing else appeared broken.
- Logout only works from the home page.
- The map uses OpenStreetMap, not Google Maps.
- About 270 sites need to be placed on the map.
- The mobile app lives in the same repository under `FNR` and is built with Expo for iOS and Android.
- Gamification ideas discussed: badges for activities recorded in the inspection form, for visiting sites flagged as needing attention after two years, and for site condition reporting.
- Several stories need Frank's input before they can be finalised, particularly around steward types and permissions. Those are being marked for the client meeting.
- Whether DevOps and release tasks can be written as user stories is a question for the TA.

##### Action Items

- Finish the user stories, add acceptance criteria, and mark the ones needing Frank's input (Alissa).
- Classify the user stories using MoSCoW (Saumya).
- Write the project overview: executive summary, glossary, similar products, open source projects and technical resources (Zanab).
- Create the UML class and sequence diagrams for the new features (Jayden).
- Create the low fidelity UI mockups and the UI flow diagram for the new pages, desktop first (Abhinav).
- Update the software design document and its diagrams (Abhinav).
- Plan the high level architecture diagram (Saumya).
- Finish the team canvas and the teamwork document (Chris).
- Draft the mobile application user stories (Chris).
- Review the previous teams' documentation and codebase (Chris).
- Create and assign GitHub issues for Sprint 1 work (Saumya).
- Schedule a call with Frank earlier in the week rather than waiting for Friday (Saumya).
- Ask the TA whether DevOps and release work can be written as user stories (Abhinav).

##### Next Meeting Agenda

- Lab session: review the draft user stories with the TA and confirm which need Frank's input.
- Client call with Frank to confirm priorities and clarify People and Place management.

---

#### September 23, 2026 – Meeting #3: 401 Lab, meeting with TA

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | September 23, 2026 |
| **Time** | 9:30 AM – 10:00 AM MDT |
| **Location** | Online |
| **Attendees** | Chris, Aaron, Saumya, Alissa, Zanab, Abhinav, Jayden, and Alex (TA) |

##### Agenda

- Review the draft user stories with the TA and confirm which stories need Frank's input.

##### Summary

Alex reviewed the draft user stories. He advised the team to merge small stories, remove developer stories, and prepare a short presentation of about 15 minutes for Frank on Friday, with the most interesting stories. He also confirmed that the Sprint 1 deadline is Tuesday evening and that it must be a GitHub release.

##### Key Discussions & Decisions

Alex's advice:

- Frank may want geobounds for sites on a map
- Want to have user stories that touch his pain points and are well developed; don't keep them general, keep them exciting.
- Group smaller user stories together, have members pick one story each and polish them
- For gamification, have Frank be explicit in what behaviours he wants to incentivize. If it is meant to drive people to do site inspections, we could look into kilometres travelled; find the metrics that correspond with behaviours Frank wants to drive
- When we talk to Frank, don't highlight user stories as written; make them interesting.
- We can pitch the mobile app as a PWA; need to consider how mobile app would be used offline though. Android does support offline PWA, but iOS needs investigation.
- Until Friday, don't write anything new; focus on ~15 minute presentation. Get a dialogue going on what Frank thinks is cool; he's the signal for where our focus should be.
- As product owners, if we have many small user stories, they should be merged; think more high-level, less "technical" or "logical"
- We should use the GitHub project board for the filtered issues.
- Deadline for sprint 1 is Tuesday evening. Must be a GitHub release.
- In standups, teammates should know what others are doing. Alex will do exercises with us where we describe what another member is doing

##### Action Items

- Narrow down user stories, grouping ones that are overly specific
- Write down Top 10 user stories to excite Frank and include in the slides for Friday's meeting
- Remove "As a Developer" user stories
- Make slides for Friday's meeting

---

#### September 25, 2026 – Meeting #4: Client meeting with Frank

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | September 25, 2026 |
| **Time** | 3:35 PM – 5:00 PM MDT |
| **Location** | Online |
| **Attendees** | Frank (client), Chris, Aaron, Saumya, Alissa, Zanab, Abhinav, Jayden, Mehrdad from the Fall 2025 team. |

##### Agenda

- Present the user stories and the plan to Frank.
- Confirm priorities and clarify People and Place management.

##### Summary

The team presented its user stories and plan. Frank asked for every story to be mapped to the charter projects on the SAPAA website (1, 2A, 2B, 2C) and ruled on data storage, maps, offline, GPS uploads, mobile and admin roles. 

##### Key Discussions & Decisions

- The charter projects are the spec. Stories must be shown against them. Adding or dropping a deliverable needs a change request.
- Project 1 comes first. The one thing not yet done is to "evaluate each of the bugs and minor enhancements" on Frank's fix/fault spreadsheet, which must be in GitHub.
- Google Sheets must not hold primary data: "Google sheets are dead. Do not store data in Google Sheets." Frank endorsed removing the Sheets wiring and one of the two databases.
- v1.1 fix: rename hyphenated Supabase objects to use underscores, as Frank asked to remove all hyphens, so Frank's visualization tool can connect.
- Map: "It doesn't have to be Google Maps inside the application." Website and app must share site geometry ("the underlying shapes, have to come from the same source"); everything else may diverge. The map story must also show where each natural area is and what others have done there.
- Frank suggested only supporting GPX uploads as a requirement for an early sprint. KML and FIT are left for a later group. No phone-based tracking.
- Offline: "I definitely need offline capability, but on the web app." It is not in any charter project, therefore it is not a priority.
- Super admin and manager roles: "I would put it on the back burner for this project." Admins assigning stewards to inspections was rejected by Frank, since volunteers go out of goodwill or proximity.
- Incentivizing is Project 2 and depends on person management. Gamification stays small: "I'd rather be a bare-bones gamification." Project 3 is iNaturalist integration.
- Keep the first sprint simple ("Keep it easy. Keep it stupid, keep it simple."), present in business language. Frank says, "If you guys are off the rails, call me, okay?"
- Frank's verdict: "I think you guys got some holes, but I think you have a base that's there."
- Frank reviewed the wireframes and said that they are acceptable. He asked for no changes.

##### Action Items

- Download and register for iNaturalist before the September 26 field trip (Everyone).
- On the field trip, submit your own River Lot 56 site inspection report with photos and record your walk with a phone GPS app (Everyone).
- Send the St. Albert transit station address and trip note; bring a handheld GPS and send the files afterwards (Frank).
- Drive teammates who need a ride (Chris).
- Map every story to charter projects 1, 2A, 2B and 2C, rewrite the map story, and bring a revised GPX upload story back to Frank (Team).

##### Next Meeting Agenda

- Field trip to River Lot 56 on September 26. Other SAPAA problems were deferred to it.

---

## Winter 2026 (previous team)

### Winter 2026 Sprint 1

---

#### January 22, 2026 – Meeting #1

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 8:00 PM – 9:00 PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Vishal, Zoe |

##### Summary

The team held their first meeting to establish a shared understanding of the project. Members familiarized themselves with the previous codebase, reviewed the existing documentation website, and examined the Site Inspection Excel spreadsheet. The session concluded with a collaborative effort to begin drafting a cleaned-up project roadmap for the new term, incorporating core and optional requirements, rough UI feature ideas, and success criteria.

##### Key Discussions & Decisions

- Reviewed the previous project codebase to familiarize the team with existing work.
- Examined the previous project documentation website and the Site Inspection Excel spreadsheet to understand the scope of work.
- Reviewed the rough draft roadmap prepared by previous project members.
- Began preparing a cleaned-up roadmap covering core and optional requirements, rough UI features, and end-of-project success criteria.

##### Action Items

- Finish the project roadmap to serve as a high-level plan for project features (Everyone).
- Create user stories based on the roadmap and organize them using the MoSCoW method (Everyone).
- Communicate with previous project members, Gabriel and Mehrdad, to gain access to Supabase and gather general information about last term's development (Braden, Harveer, Jason, Vishal).

##### Next Meeting Agenda

- Video call with the SAPAA president and client, Frank Potter (January 23).

---

#### January 23, 2026 – Meeting #2

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 1:05 PM – 2:00 PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Frank, Gabriel, Harveer, Jason, Mehrdad, Raiyana, Vishal, Zoe |

##### Summary

The team met with SAPAA president Frank Potter for official introductions. Frank outlined his expectations for the project and provided insight into SAPAA's organizational operations, with particular emphasis on the importance of Site Inspections. The team shared their individual strengths and areas of expertise, and together they established a structure for future weekly meetings. The session concluded with a high-level review of the overall project scope.

##### Key Discussions & Decisions

- Introduced the team to Frank Potter and shared individual strengths and areas of expertise.
- Frank provided a prioritized framework for future meetings covering weekly progress, upcoming work, and CMPUT 401/SAPAA concerns.
- Discussed SAPAA organizational operations and the importance of Site Inspections to the organization.
- Reviewed the project scope and aligned on client expectations.

##### Action Items

- Prepare a weekly slide deck for Friday meetings to summarize progress and upcoming work (Harveer).
- Modify the high-level project roadmap based on feedback from Frank (Everyone).
- Schedule a meeting on January 25 to begin creating user stories (Everyone).

##### Next Meeting Agenda

- Meeting on January 25 to begin creating user stories.

---

#### January 25, 2026 – Meeting #3

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 7:00 PM – 9:00 PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Vishal, Zoe |

##### Summary

The team focused on refining the project roadmap by categorizing requirements into core and "if-time-permits" features. The session was highly collaborative, with the team reorganizing priorities and jointly drafting the first set of user stories and acceptance tests to guide the upcoming sprint.

##### Key Discussions & Decisions

- Reviewed the high-level project roadmap and classified requirements as core or "if-time-permits" features.
- Reorganized requirements based on agreed-upon priorities to ensure the most critical features would be delivered first.
- Collaboratively drafted initial user stories and outlined potential acceptance tests to define completion criteria.

##### Action Items

- Add story points to user stories as a team decision (Everyone).
- Organize draft user stories into MoSCoW format during the January 28 lab session (Everyone).
- Begin work on Sprint 1 User Story and Project Management requirements (Everyone).

##### Next Meeting Agenda

- Meeting to communicate with previous project members to gain access to Supabase and gather general information about last term's development (January 27).
- Lab session to organize user stories into MoSCoW format (January 28).

---

#### January 27, 2026 – Meeting #4

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 11:00 AM – 12:00 PM |
| **Mode** | Online |
| **Attendees** | Braden, Gabriel, Harveer, Jason, Mehrdad, Vishal |

##### Summary

A subset of the team consulted with the previous developers, Gabriel and Mehrdad, to clarify the Supabase database structure and address outstanding image management challenges. The team agreed to prioritize the web-app transition from Google Forms as the core focus of Sprint 2, and decided to defer UI mockup development until Frank had reviewed and approved the core user stories.

##### Key Discussions & Decisions

- Met with previous project members Gabriel and Mehrdad to clarify the Supabase database structure and handoff details.
- Confirmed the priority of developing a web-based application to replace Google Forms for stewards and administrators.
- Discussed unresolved image management issues and explored potential solutions, including image compression versus additional storage investment.
- Decided on the focus for Sprint 1 requirements and established a timeline for UI mockup development pending client approval.

##### Action Items

- Prepare a slide deck for Friday's meeting with Frank (Harveer).
- Finalize the high-level project roadmap and user stories for client review (Everyone).
- Assign Sprint 1 tasks to team members during the January 28 TA meeting (Everyone).
- Collaborate on shared tasks such as low-fidelity UI mockups (Everyone).

##### Next Meeting Agenda

- TA Meeting: Assigning Sprint 1 tasks and collaborating on low-fidelity UI mockups (January 28).

---

#### January 28, 2026 – Meeting #5

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 9:50AM - 10:50AM |
| **Mode** | In-Person at KHRA |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Shahriar, Vishal, Zoe |

##### Summary

The team attended the regular lab session with the TA to discuss the remaining Sprint 1 requirements. The session covered image management solutions, logistics for the upcoming site inspection on January 31, and a collaborative ranking of user stories by necessity and implementation complexity. Story points were also assigned during this session.

##### Key Discussions & Decisions

- Attended the regular lab session with the TA to discuss completing the remaining Sprint 1 requirements.
- Explored and discussed potential solutions for image management.
- Coordinated logistics for the upcoming site inspection on January 31.
- Ranked user stories by necessity and implementation complexity and assigned story points.

##### Action Items

- Hold a team meeting later in the evening to finalize user story rankings and identify epic user stories that require decomposition. (everyone)
- Complete the slide deck for Friday's meeting with Frank. (Harveer)

##### Next Meeting Agenda

- Meeting to finalize user stories (January 28).

---

#### January 28, 2026 – Meeting #6

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 7:00PM - 9:00PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Vishal, Zoe |

##### Summary

The full team reconvened in the evening to finalize the user story planning work started earlier in the day. The session resulted in completed MoSCoW rankings, decomposed oversized stories, finalized story point estimations, expanded acceptance tests, and a mapping of stories to the original Site Inspection Form. Belbin team roles were also formally documented.

##### Key Discussions & Decisions

- Finalized user story rankings using the MoSCoW method.
- Decomposed oversized user stories into smaller, more manageable pieces.
- Completed story point estimations for all user stories.
- Expanded acceptance tests to better define completion criteria.
- Mapped user stories to the original Site Inspection Form for traceability.
- Documented Belbin team roles for each team member.

##### Action Items

- Request a review of user stories from the clients to check for missing functionality or incorrect priorities. (everyone)
- Transfer finalized user stories into GitHub as issues. (Akib, Vishal)
- Begin creating the project story map Kanban board and assign stories to sprints. (Braden, Vishal)

##### Next Meeting Agenda

- Discuss technology choices and how to communicate them to the client (January 30).

---

#### January 30, 2026 – Meeting #7

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 1:05PM - 2:00PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Frank, Gabriel, Harveer, Jason, Mehrdad, Raiyana, Vishal, Zoe |

##### Summary

The team discussed logistics for the upcoming site visit and evaluated image management technology options. AWS S3 was identified as the preferred solution due to its scalability, cost-effectiveness, and feature set. User stories were further refined and cross-referenced with Site Inspection Form questions to improve clarity.

##### Key Discussions & Decisions

- Reviewed logistics and preparation requirements for the upcoming site visit.
- Compared image management options including AWS S3, Google Drive, and Supabase; AWS S3 was preferred for scalability, cost-effectiveness, and available features.
- Refined user stories and mapped them to site inspection questions for greater traceability and clarity.

##### Action Items

- Frank to review the refined user stories.
- Develop an AWS S3 proof of concept.
- Conduct the site visit as planned.
- Continue refining user stories based on client feedback.

##### Next Meeting Agenda

- Meet with client to discuss technology choice for image management (January 31).

---

#### January 31, 2026 – Meeting #8

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 9:00AM - 6:00PM |
| **Location** | Riverlot 56 |
| **Attendees** | Akib, Braden, Frank, Harveer, Jason, Raiyana, Vishal, Zoe |

##### Summary

The team conducted a field site visit at Riverlot 56 alongside Frank. The visit provided a firsthand look at how stewards use web and mobile apps in the field, which helped validate existing user stories and surface new insights. The team proposed cross-referencing user stories with site inspection questions to better align the product with real-world usage.

##### Key Discussions & Decisions

- Observed stewards using web and mobile apps in the field to understand their workflows and environment.
- Validated existing user stories against actual steward behaviour and site conditions.
- Proposed and aligned on cross-referencing user stories with site inspection questions for better traceability.

##### Action Items

- Continue refining user stories and system functionalities based on client and field feedback. (Harveer, Raiyana, Zoe)
- Continue designing the low-fidelity UI (Akib, Braden, Jason)
- Design the sequence diagrams (Vishal)

##### Next Meeting Agenda

- Finish up what's left of Sprint 1 (February 1).

---

#### February 1, 2026 – Meeting #9

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 3:00PM - 6:00PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Vishal, Zoe |

##### Summary

The team wrapped up the final Sprint 1 requirements and transitioned focus toward Sprint 2 planning. Tasks were reviewed for completeness, outstanding items were resolved, and Sprint 2 work was assigned in preparation for beginning web application development.

##### Key Discussions & Decisions

- Reviewed and confirmed completion of all Sprint 1 requirements.
- Assigned Sprint 2 tasks to team members in preparation for the next development phase.

##### Action Items

- Start working on understanding the current Site Inspection Report for refactoring Supabase. (everyone)
- Begin coding Sprint 2 user stories. (everyone)
- Request Frank for additional documents on Friday. (Harveer)

##### Next Meeting Agenda

- Get to planning for Sprint 2 (February 4).

---

### Winter 2026 Sprint 2

---

#### February 4, 2026 – Meeting #1

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 9:50AM - 10:50AM |
| **Mode** | In-Person at KHRA |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Shahriar, Vishal, Zoe |

##### Summary

The team kicked off Sprint 2 during the lab session by reviewing the previous week's progress and discussing upcoming development tasks. Discussion included a potential Supabase refactoring effort and a review of the existing Google Sheets code that currently acts as a middleman for Site Inspection Form data.

##### Key Discussions & Decisions

- Reviewed previous week's work and assessed what carried over into Sprint 2.
- Planned Sprint 2 development tasks and identified priorities.
- Discussed the need for Supabase refactoring to better support the new web application.
- Reviewed the existing Google Sheets middleman code to understand its role in the current data pipeline.

##### Action Items

- Create a plan for Supabase refactoring and identify which new tables are needed. (Raiyana, Zoe)
- Create diagrams of the refactored Supabase schema for Frank's review and approval. (Raiyana)
- Work on implementing the form based on the user stories. (everyone)

##### Next Meeting Agenda

- Meet with client to discuss what has been built so far (February 6).

---

#### February 6, 2026 – Meeting #2

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 1:05PM - 2:00PM | 
| **Mode** | Online |
| **Attendees** | Akib, Braden, Frank, Gabriel, Harveer, Jason, Mehrdad, Raiyana, Vishal, Zoe |

##### Summary

The team met with Frank Potter to present draft diagrams for the proposed Supabase refactoring. Frank reviewed the plans and provided feedback. The team also noted that the next weekly client meeting would be skipped due to scheduling conflicts.

##### Key Discussions & Decisions

- Presented draft diagrams for the Supabase refactoring to Frank for review.
- Discussed next steps following Frank's feedback on the proposed schema changes.
- Confirmed that next week's client meeting would be skipped due to scheduling conflicts.

##### Action Items

- Set up a meeting with Frank to create AWS S3 and SAPAA email accounts. (Harveer)
- Continue progressing on the Supabase refactoring. (Raiyana, Zoe)
- Begin frontend entry point development for the Site Inspection Form webapp. (everyone)

##### Next Meeting Agenda

- Meet with the group to complete certain user stories and tasks (February 7).

---

#### February 7, 2026 – Meeting #3

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 12:00PM - 5:00PM |
| **Mode** | In-Person at Cameron |
| **Attendees** | Braden, Harveer, Jason, Raiyana, Vishal, Zoe |

##### Summary

A productive in-person session where the team completed the Supabase refactoring, finalized table relation diagrams, and delivered the frontend entry point for the Site Inspection Form webapp. The session also included onboarding team members to the new schema.

##### Key Discussions & Decisions

- Completed the Supabase refactoring, bringing the database schema in line with the new application requirements.
- Created table relation diagrams to document and communicate the updated schema.
- Finished development of the frontend entry point for the Site Inspection Form webapp.

##### Action Items

- Continue developing the remaining user stories for the Site Inspection Form. (everyone)
- Get familiarized with the new Supabase schema to ensure shared understanding. (Raiyana)

##### Next Meeting Agenda

- Meet with group to continue work on user stories and tasks (February 9).

---

#### February 9, 2026 – Meeting #4

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 7:00PM - 9:00PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Vishal, Zoe |

##### Summary

Raiyana presented the updated database schema to the full team, ensuring everyone was aligned on the new structure. The session confirmed that both the Supabase refactoring and the frontend entry point were complete and ready for the next stage of development.

##### Key Discussions & Decisions

- Raiyana presented the updated Supabase schema to bring all team members up to speed.
- Confirmed completion of the Supabase refactoring and the frontend entry point. 

##### Action Items

- Continue development and begin integrating the new database schema into active feature work. (everyone)

##### Next Meeting Agenda

- Meeting with the TA in the Lab Session, with review on Sprint 2 Progress. (February 11)

---

#### February 11, 2026 – Meeting #5

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 9:50AM - 10:50AM |
| **Mode** | In-Person at KHRA |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Shahriar, Vishal, Zoe |

##### Summary

The team used the lab session to review overall Sprint 2 progress, continue ongoing implementations, and share updates on individual user stories. Emerging issues during development prompted the identification of new user stories that would need to be added to the backlog.

##### Key Discussions & Decisions

- Reviewed overall Sprint 2 progress and identified any blockers or emerging issues.
- Continued implementing Sprint 2 tasks and discussed status across individual user stories.

##### Action Items

- Add new user stories to the backlog based on issues emerging during development, such as persistence of data and autofilling certain inputs. (Akib, Raiyana, Zoe)
- Hold another meeting to collaboratively work on Sprint 2 requirements and address Git practices.
- Begin working on testing user stories. (Braden, Jason, Vishal)

##### Next Meeting Agenda

- Collaborate to work on Sprint 2 (February 13).

---

#### February 13, 2026 – Meeting #6

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 2:00PM - 8:00PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Vishal, Zoe |

##### Summary

The team worked together (work session) to resolve outstanding Git pull requests and make continued progress on Sprint 2 tasks. The session was focused on clearing integration blockers and collaborating directly on shared user stories.

##### Key Discussions & Decisions

- Resolved outstanding Git pull requests to unblock further development.
- Collaborated directly on Sprint 2 user stories to accelerate progress.

##### Action Items

- Complete all remaining Sprint 2 acceptance tests. (everyone)
- Update documentation for all Sprint 2 requirements on the project documentation website. (Braden, Vishal, Raiyana)
- Design the Traceability Matrix. (Vishal)

##### Next Meeting Agenda

- Collaborate to work on Sprint 2 (February 15).

---

#### February 15, 2026 – Meeting #7

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 2:00PM - 8:00PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Vishal, Zoe |

##### Summary

The team held a final online work session to close out Sprint 2. All remaining pull requests were merged, the codebase was cleaned up, and the full set of Sprint 2 documentation was completed. The team then shifted focus toward early Sprint 3 planning to be carried out during reading week.

##### Key Discussions & Decisions

- Merged all remaining pull requests to finalize Sprint 2 development.
- Cleaned up the codebase to improve maintainability ahead of Sprint 3.
- Completed documentation for all Sprint 2 requirements on the project website.

##### Action Items

- Begin work on AWS set up for user stories. (Raiyana)
- Work on deploying to Vercel for Frank to test. (Harveer)
- Begin working on all required user stories for Sprint 3. (everyone)

##### Next Meeting Agenda

- Set up AWS with Frank to prevent image management delays.

---

### Winter 2026 Sprint 3

---

#### February 20, 2026 – Meeting #1

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 1:05 PM – 2:00 PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Frank, Gabriel, Harveer, Jason, Mehrdad, Raiyana, Vishal, Zoe |

##### Summary

The team met with Frank, Gabriel, and Mehrdad to attempt AWS account setup, demo the current state of the Site Inspection Form, and gather detailed client feedback. Although AWS payment verification was required before the account could be activated, the session produced significant alignment on several product decisions including section naming conventions, question numbering format, inspection number generation, and upcoming Sprint 3 priorities around admin features and question management.

##### Key Discussions & Decisions

- Attempted to set up an AWS account for deployment; payment verification was required before activation could proceed.
- Decided to wait for AWS verification before continuing with hosting setup.
- Set up a development email account for deployment and configuration purposes.
- Demoed the current version of the Site Inspection Form to Frank (running locally).
- Agreed to replace the emergency/terms text with a single checkbox confirming the user's agreement.
- Agreed to refactor section names to match the structure of the official SAPAA website.
- Discussed question numbering format; decided to retain the original Q-number format (e.g., Q21, Q37) to preserve consistency with 40+ years of historical inspection data.
- Confirmed that inspection numbers should be auto-generated based on the calendar year.
- Discussed the future migration of legacy inspection data into the new database tables.
- Reviewed upcoming Sprint goals, including question management features and admin functionality.

##### Action Items

- Wait for AWS payment verification and complete hosting setup (everyone).
- Change development email password and finalize account configuration (everyone).
- Refactor section names to match the official SAPAA website (everyone).
- Revert and maintain original Q-number format for all questions (Vishal).
- Implement yearly auto-increment inspection number system (everyone).
- Plan and document a deployment strategy for production release (Harveer).
- Begin preparing a data migration plan for legacy inspection records (Raiyana, Vishal).
- Begin work on Admin Form Editor (Jason, Braden).

##### Next Meeting Agenda

- Confirm AWS setup.

---

#### February 25, 2026 – Meeting #2

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 10:00 AM – 11:00 AM |
| **Mode** | In-Person at KHRA |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Shahriar, Vishal, Zoe |

##### Summary

Sprint-3 check-in with our TA to demo the Sprint-2 state of the Site Inspection Form, and gather feedback on recent progress. Discussions on deployment issues in Sprint-2 with Vercel was discussed. Cybera was raised as an alternative hosting option to discuss with Frank. Amongst the team, discussions about confirmation of AWS setup done and progress on Sprint-3 user stories.

##### Key Discussions & Decisions

- Received feedback from the TA on the current state of the project.
- Discussed any initial feedback with integration testing and Vercel deployment.

##### Action Items

- Begin setting up AWS for our project through the codebase. (Raiyana, Harveer)
- Continue work on active user stories (Team).

##### Next Meeting Agenda

- Show progress on UI to Frank.

---

#### February 27, 2026 – Meeting #3

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 1:05 PM – 2:00 PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Frank, Gabriel, Harveer, Jason, Mehrdad, Raiyana, Vishal, Zoe |

##### Summary

A Sprint 3 check-in with Frank, Gabriel, and Mehrdad to confirm AWS setup, show the mock ups for planned image management, and gather feedback on recent progress. Cybera was raised as an alternative hosting option and discussed with Frank. The session also produced several targeted action items to address minor UI and output issues before the next meeting. Discussions were also raised on testing the webapp with real-world stewards for March 10th.

##### Key Discussions & Decisions

- Confirmed that the AWS setup was complete and functional.
- Introduced Cybera as a potential hosting alternative and discussed it with Frank.
- Received feedback from Frank on the current state of the project.
- Demoed the current AWS image management setup.
- Testing the webapp with real-world stewards. (March 10th)

##### Action Items

- Fix next and previous button anchoring (Akib).
- Remove the "next section" prompt on the last page of the site inspection form (Vishal).
- Update CSV file output to change the delimiter from semicolons to an alternative character (everyone).
- Plan user testing sessions after Sprint 3 (March 10th onwards) using different user scenarios to evaluate whether the web app is sufficiently intuitive (everyone).
- Continue work on active user stories (everyone).

##### Next Meeting Agenda

- Prepare AWS image management and admin site inspection form editor by next week. 

---

#### March 6, 2026 – Meeting #4

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 1:05 PM – 2:00 PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Frank, Gabriel, Harveer, Jason, Mehrdad, Raiyana, Vishal, Zoe |

##### Summary

The team met with Frank, Gabriel, and Mehrdad to demo Sprint 3 capabilities, including the AWS image management system and the admin site inspection form editor. The session also covered upcoming priorities such as the Dragons' Den presentation and the planned user testing sessions beginning the following week.

##### Key Discussions & Decisions

- Demoed the AWS image management system to the client and previous developers.
- Demoed the admin site inspection form editor, showcasing current admin capabilities.
- Discussed logistics for the upcoming Dragons' Den presentation and user testing sessions.

##### Action Items

- Allow images to be uploaded directly for a site, not restricted to uploading only through the site inspection form (Raiyana).
- Fix the **Other text box** input behaviour (Vishal).
- Implement **gallery view** for uploaded images (Raiyana, Akib).
- Plan and begin work on **Future Enhancements** (Harveer, Raiyana):
    - CRUD operations for sections.
    - Moving questions across sections.

##### Next Meeting Agenda

- Discuss Sprint 4 priorities.
- Review and discuss user feedback from upcoming testing sessions.

---

### Winter 2026 Sprint 4

---

#### March 10, 2026 – Meeting #1

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp User Testing Session #1 |
| **Time** | 9:00 AM – 10:30 AM |
| **Mode** | Online |
| **Attendees** | Frank, Gabriel, Harveer, Jason, Mehrdad, Raiyana, Vishal |

##### Summary

The team met with members and friends of SAPAA to get early feedback on the development on the SAPAA webapp. Members of the team were paired with participants to walk them through webapp. Based on user-scenarios by Harveer, the participants were timed on whether they are able to fill out a SIR, and access information related to a site. During and after each scenario, participants had provided their feedback on the webapp.

##### Key Discussions & Decisions

- Members were placed into break-out rooms of a 1:1 ratio of CMPUT401 team to participant.
- Each CMPUT401 team member presented the scenarios to the participant.
- Observations were noted by the team while the participants attempted the scenario.
- Participants had given valuable feedback on our webapp which we can use for future development.

##### Action Items

- Fix bugs that arose during testing session, such as Image upload on deployed Vercel link. (Raiyana)
- Based on user feedback, anchoring of buttons on the form; the Next/Previous buttons. (Akib)
- Based on user feedback, fixing the back button navigation across all pages. (Zoe)
- Based on user feedback, Minor UI tweaks based on accessibility of form. (everyone)

##### Next Meeting Agenda

- Continue to collect data from users with updated webapp based on previous feedback.

---

#### March 11, 2026 – Meeting #2

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 10:00 AM – 11:00 AM |
| **Mode** | In-Person at KHRA |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Shahriar, Vishal, Zoe |

##### Summary

Sprint-4 check-in with our TA to demo the Sprint-3 state of our Image Management System, Admin Form Editor, and User Editing Site Inspection Forms, and gather feedback on recent progress. Gathered early feedback about UI testing and Sprint-4 details regarding GitHub actions and switching to auto-runners on Cybera.

##### Key Discussions & Decisions

- Received feedback from the TA on the current state of the project.
- Discussed testing and switching to auto-runners on Cybera.

##### Action Items

- Finish US 2.0.7 and US 2.0.8 to demo to Frank on Friday. (Raiyana, Vishal)
- Continue work on active user stories. (Team)

##### Next Meeting Agenda

- Session #2 for user feedback on webapp. (Harveer, Raiyana)
- Show progress on UI to Frank.


---


#### March 12, 2026 – Meeting #3

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp User Testing Session #2 |
| **Time** | 12:00 PM – 1:30 PM |
| **Mode** | Online |
| **Attendees** | Frank, Gabriel, Harveer, Mehrdad, Raiyana |

##### Summary

This was Session 2 for collecting user feedback on the SAPAA webapp. Similar to Session 1 on March 10th, members of the team were paired with participants to walk them through webapp. Based on user-scenarios by Harveer, the participants were timed on whether they are able to fill out a SIR, and access information related to a site. During and after each scenario, participants had provided their feedback on the webapp.

##### Key Discussions & Decisions

- Members were placed into break-out rooms of a 1:1 ratio of CMPUT401 team to participant.
- Each CMPUT401 team member presented the scenarios to the participant.
- Observations were noted by the team while the participants attempted the scenario.
- Participants had given valuable feedback on our webapp which we can use for future development.

##### Action Items

- Based on user feedback, anchoring of buttons on the form; the Next/Previous buttons. (Akib)
- Based on user feedback, fixing the back button navigation across all pages. (Zoe)
- Based on user feedback, other Minor UI tweaks based on accessibility of form. (everyone)

##### Next Meeting Agenda

- Debrief testing session with Frank, Mehrdad and Gabriel on Friday.

---

#### March 13, 2026 – Meeting #4

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 1:05 PM – 2:00 PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Frank, Gabriel, Harveer, Jason, Mehrdad, Raiyana, Vishal, Zoe |

##### Summary

The team met with Frank, Gabriel, and Mehrdad to demo image metadata upload capabilities, improved metadata storage for images. The session also covered upcoming priorities such as the Dragons' Den presentation and Go-Live plan. The team also discussed changing the course of sprint 4 to focus on the webapp instead of starting the mobile application. Additionally debriefed user testing session.

##### Key Discussions & Decisions

- Demoed submitting an image using the site inspection report to show metadata being saved using new format and new file naming convention.
- Demoed standalone image upload functionality.
- Discussed change of sprint 4 plans to focus on polishing up the webapp for the Go-Live and Dragon's Den.
- Discussed the possibility of changing the UX of the app to tailor to the users.

##### Action Items

- Notification Approval of Users. (Harveer)
- Editing site info. (Jason, Braden)
- PDF Generation. (Vishal, Jason, Braden)
- Data Migration Plan. (Team)
- Tailor UX to member feedback. (Team)

##### Next Meeting Agenda

- Demo Sprint 4 work
- Discuss what's next in terms of the go-live plan

---

#### March 17, 2026 – Meeting #5

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 7:00 PM – 9:30 PM |
| **Mode** | Online |
| **Attendees** | Braden, Jason, Raiyana, Vishal |

##### Summary

The team worked together (work session) to resolve outstanding Git pull requests and make continued progress on Sprint 4 tasks. The session was focused on clearing integration blockers and collaborating directly on shared user stories. Additionally, this session led to 3 new/updated user stories (US 2.0.9, US 4.0.1, US 5.0.1) based on client feedback, and a bit of Sprint 5 planning based on TA feedback on minor codebase changes for our March 31st deadline.

##### Key Discussions & Decisions

- Jason and Braden worked on finishing US 4.0.3 and US 4.0.4.
- Raiyana worked on finishing US 2.0.7.
- Vishal worked on finishing US 2.0.8, and beginning US 4.0.1.
- Everyone discussed the removal and addition of user stories based on time capacity and client's immediate requirements.

##### Action Items

- Finish UI tests for US 4.0.3 and US 4.0.4. (Braden, Jason)
- Work on PDF Generation over the next few days. (Braden, Jason, Vishal)
- Finish US 2.0.7 with UI, API, and Integration testing. (Akib, Raiyana)
- Work on US 5.0.1 for admin approval prior to Friday's meeting with Frank. (Harveer)
- Fixing the back button navigation across all pages. (Zoe)

##### Next Meeting Agenda

- Discuss addition and removal of user stories with TA Shahriar.

---

#### March 18, 2026 – Meeting #6

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 10:00AM - 10:50AM |
| **Mode** | In-Person at KHRA |
| **Attendees** | Akib, Braden, Harveer, Jason, Shahriar, Vishal |

##### Summary

The team used the lab session to review overall Sprint 4 progress, continue ongoing implementations, and share updates on individual user stories. The team discussed with the TA about adding the new user stories discussed on prior meetings, as well as general check-up for Sprint-3 feedback.

##### Key Discussions & Decisions

- Discussed Sprint-3 feedback: Uploading images for our UI Documentation.
- Discussed the new user stories requested by client, and our new plan for Sprint 5.

##### Action Items

- Continue to work on PDF Generation. (Braden, Jason, Vishal)
- Fix US 2.0.7 with UI, API, and Integration testing. (Akib, Raiyana)
- Anchoring next/previous buttons to the bottom and re-navigating to the top. (Akib)
- Continue working on US 5.0.1 for Admin approval of users. (Harveer)
- Fixing the back button navigation across all pages. (Zoe)

##### Next Meeting Agenda

- Dragon's Den Meeting on March 19th (to collect more professional feedback on webapp).
- Features to be implemented by Friday for demoing to Frank.

---

#### March 19, 2026 – Meeting #7 (Dragon's Den)

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 11:30 AM – 1:30 PM |
| **Mode** | Online |
| **Attendees** | Frank, Gabriel, Harveer, Mehrdad, Raiyana, Vishal |

##### Summary

The team was present to gather features required for future versions of the webapp. Clients Gabriel and Mehrdad presented the web application to industry professionals and SAPAA members (dragons) to gather feedback about current and future implementations. Post-meeting, Frank discussed more on plans of data migration for v1.0.

##### Key Discussions & Decisions

- Demoed the current v1.0 of the SAPAA webapp, including the solution for image management and filling out a Site Inspection Report.
- Feedback on features regarding webapp, such as summarizing all site inspection reports and viewing SIRs alongside filling out the report.
- Dragons raised questions about design choices, and gave valuable feedback and features they would like to see implemented.

##### Action Items

- Data Migration Plan: Discuss with other CMPUT401 team members about what can be done.

##### Next Meeting Agenda

- Friday Meeting with Frank to demo new features.

---

#### March 20, 2026 – Meeting #8

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 1:05 PM – 2:00 PM |
| **Mode** | Online |
| **Attendees** | Braden, Frank, Gabriel, Harveer, Mehrdad, Jason, Vishal |

##### Summary

The team met with Frank and Gabriel to demo new functionality/design such as site profile editing, new authentication flow, rich text editing in site inspection form, pdf generation with added customizability, and new user experience of the form editor. We also discussed the data migration plan, continual support and future enhancements of the SAPAA webapp. This is the last meeting that Frank will be present for, so the team also gathered feedback on the team's performance this semester.

##### Key Discussions & Decisions

- Demoed changes to site profile admin functionality
- Demoed admin authorizing users functionality
- Demoed Rich text editor functionality
- Demoed PDF generation
- Demoed new form editor view
- Discussed data migration plan 
- Discussed continual support of users and next CMPUT 401 group
- Discussed tasks and information that need to be added into the end of project report
- Collected general feedback about the team's performance and the client's overall satisfaction of the project

##### Action Items

- Data Migration Plan (Team) (We need to be out of the database by April 5th)
- Adding tasks for the next team to work on into the end of project report
    - Ability to edit/add site data
    - Rework the manual implementation of admin approving users

##### Next Meeting Agenda

- Check-in on data migration
- Finish up all testing for Sprint-4 
- Delegate tasks for Sprint-5

---

### Winter 2026 Sprint 5

---

#### March 24, 2026 – Meeting #1

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 7:00 PM – 10:30 PM |
| **Mode** | Online |
| **Attendees** | Braden, Jason, Raiyana, Vishal |

##### Summary

The team worked together (work session) to work on upcoming user stories and discussing new tasks. The session was focused on clearing integration blockers and collaborating directly on shared user stories. Based on our scope and provided by our client Frank to our product managers, three tasks were added:

1. TASK 6.0.1 – Web Application Responsiveness
2. TASK 6.0.2 – Front-End Error Handling & Validation 
3. TASK 6.0.3 – Inspection Fields Integration

The team made continued progress on Sprint 5 tasks including SonarQube results, making minor UI tweaks, and finishing US 2.0.9 (User Image Gallery). 

##### Key Discussions & Decisions

- Jason and Vishal worked on UI Tweaks across the webapp.
- Raiyana worked on polishing the codebase for SonarQube tests.
- Vishal worked on finishing US 2.0.9.
- Everyone discussed the removal and addition of user stories and tasks based on time capacity and client's immediate requirements.

##### Action Items

- Finish more minor UI tweaks across the webapp. (Harveer, Jason, Vishal)
- Finish US 5.0.2 for user logout. (Harveer)
- Discussing the addition of new tasks to the entire team. (everyone)

##### Next Meeting Agenda

- Discuss addition and removal of user stories and tasks with TA Shahriar.
- Demo our webapp's Sprint-4 features.

---

#### March 25, 2026 – Meeting #2

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 10:00 AM – 11:00 AM |
| **Mode** | In-Person at KHRA |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Shahriar, Vishal, Zoe |

##### Summary

Sprint-5 check-in with our TA to demo the Sprint-4 state of our webapp, demoing these features:

1. Uploading Images from Homepage
2. Admin Search in Gallery + Site Gallery Search
3. Admin Approval of Users
4. PDF Generation
5. Admin Editing and Disabling Sites
6. Next/Previous anchoring in SIR + updated metadata schema for image uploading
7. While doing all this, back navigations across the webapp

Additionally, feedback was gathered on recent progress. Finally, discussions of Sprint-5 details regarding SonarQube results, documentation requirements, and planned features.

##### Key Discussions & Decisions

- Received feedback from the TA on the current state and progress of the project.
- Discussed documentation requirements (Job Descriptions, Manuals, Deployment, Portal) for Sprint-5.
- Team discussions on refactoring user stories to new tasks TASK 6.0.1, TASK 6.0.2, and TASK 6.0.3 based on final client requirements.

##### Action Items

- Finish US 5.0.2 for allowing user to logout. (Harveer)
- Finish TASK 6.0.1 to make the entire webapp responsive. (Raiyana)
- Finish TASK 6.0.2 to ensure users know of any errors in the frontend. (Akib)
- Finish TASK 6.0.3 to ensure that the inspection_no and inspection_date are correctly pushed to W26_form_responses. (Akib, Jason)
- Make minor UI Fixes on various pages such as UserNavBar, Pie Charts in Admin Dashboard, Automatic Login, Loading Pages, and Admin Site Gallery Search. (Harveer, Jason, Vishal, Zoe)

##### Next Meeting Agenda

- Work Session to finish majority of Sprint-5 tasks and documentation requirements.

---

#### March 28, 2026 – Meeting #3

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 4:00 PM – 8:30 PM |
| **Mode** | Online |
| **Attendees** | Akib, Braden, Harveer, Jason, Raiyana, Vishal |

##### Summary

The team worked together (work session) to resolve outstanding Git pull requests and make continued progress on Sprint 5 tasks. The session was focused on clearing integration blockers and collaborating directly on remaining tasks and user stories. Work on documentation requirements such as User and Admin Manuals and the Job Descriptions were worked on during this work session. New Tasks were completed and merged, and UI was cleaned up across all pages.

##### Key Discussions & Decisions

- Akib, Harveer, Jason, Vishal worked on UI Tweaks across the webapp.
- TASK 6.0.1, TASK 6.0.2, and TASK 6.0.3 were completed and merged into Sprint-5. (Akib, Jason, Raiyana)
- US 5.0.2 was merged into Sprint-5. (Harveer)
- UI Tests were refactored by Harveer based on new UserNavBar and AdminNavBar. (Harveer)
- Documentation work on Manuals and Job Descriptions. (Braden)

##### Action Items

- Continue work on the manuals for users and admins. (Braden, Jason, Raiyana)
- Add testing for US 5.0.2. (Vishal)
- Update old documentation for new tasks. (Vishal)
- Update UI Documentation based on the new changes such as responsiveness. (Braden, Vishal)
- Work on deployment documentation. (Harveer)

##### Next Meeting Agenda

- Continue finishing up all documentation tasks in work sessions. 

---

#### March 30, 2026 – Meeting #4

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA WebApp |
| **Time** | 7:00 PM – 11:00 PM |
| **Mode** | Online |
| **Attendees** | Jason, Raiyana, Vishal |

##### Summary

The team worked together (work session) to resolve outstanding Git pull requests and make continued progress on Sprint 5 documentation. The session was focused on clearing integration blockers and collaborating directly on remaining tasks and user stories. Work on documentation requirements such as User and Admin Manuals were completed during this work session. Old documentation was updated based on new changes, and testing was added for US 5.0.2.

##### Key Discussions & Decisions

- Added testing for US 5.0.2. (Vishal)
- Updated old documentation for new tasks. (Vishal)
- Finished work on the manuals for users and admins. (Braden, Jason, Raiyana)

##### Action Items

- Finish on deployment documentation. (Harveer)
- Finish UI Documentation based on the new changes such as responsiveness. (Braden, Vishal)
- Update the SonarQube results on MKDocs. (Raiyana)
- Add project to CMPUT401Portal online. (Harveer)

##### Next Meeting Agenda

- Finish up all documentation tasks.
- Deploy all changes and make the Sprint-5 release. 

---

