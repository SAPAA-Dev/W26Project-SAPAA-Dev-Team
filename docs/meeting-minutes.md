# Meeting Minutes

Minutes for the current Fall 2026 team are in the first section. The Winter 2026 sections below
are the previous team's records. We keep them for reference.

---

## Fall 2026

The TA (Alex) is CC'd on all client communication, including all client meeting invitations and emails.

### Template

Each Fall 2026 meeting uses this table. Write "Not recorded" when a value is not known.

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | |
| **Time** | |
| **Location** | |
| **Attendees** | |
| **Absentees** | |
| **Minute-taker** | |
| **Source** | Notes, transcript or deck that the entry comes from |

The sections after the table are: Agenda, Summary, Key Discussions & Decisions, Status of previous
action items (when there are any), Action Items with an owner for each item, and Next Meeting
Agenda.

### Attendance

P = present, L = late, A = absent. Alex (TA) attended Meetings #0, #1, #3, #6 and #8. The notes of
Meeting #6 are titled "MEETING WITH ALEX". Frank (client)
attended Meetings #4, #5, #7 and #9. For Meetings #5 to #9 the sources did not record every member.
Saumya confirmed on October 11 that all seven members attended them.

| Meeting | Date | Chris | Aaron | Saumya | Alissa | Zanab | Abhinav | Jayden |
|---|---|---|---|---|---|---|---|---|
| #0 Lab with TA | Sep 16 | P | P | P | P | P | P | P |
| #1 Handover call | Sep 18 | P | P | P | P | P | P | P |
| #2 Working session | Sep 19 | L | P | P | P | A | P | P |
| #3 Lab with TA | Sep 23 | P | P | P | P | P | P | P |
| #4 Client meeting | Sep 25 | P | P | P | P | P | P | P |
| #5 Field trip | Sep 26 | P | P | P | P | P | P | P |
| #6 Lab with TA | Sep 30 | P | P | P | P | P | P | P |
| #7 Client meeting | Oct 2 | P | P | P | P | P | P | P |
| #8 Lab with TA | Oct 7 | P | P | P | P | P | P | P |
| #9 Client meeting | Oct 9 | P | P | P | P | P | P | P |

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
| **Absentees** | None |
| **Minute-taker** | Not recorded |

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

- Record rotating Scrum roles in the teamwork document (Team).
- Schedule a call with SAPAA volunteers (Saumya).

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
| **Absentees** | None |
| **Minute-taker** | Not recorded. The transcript is `docs/meetings/week3/week3.txt`. |

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
| **Absentees** | Zanab (at work) |
| **Minute-taker** | Not recorded |

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
| **Absentees** | None |
| **Minute-taker** | Not recorded |

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

- Narrow down user stories, grouping ones that are overly specific (Team).
- Write down Top 10 user stories to excite Frank and include in the slides for Friday's meeting (Team).
- Remove "As a Developer" user stories (Team).
- Make slides for Friday's meeting (Team).

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
| **Absentees** | None |
| **Minute-taker** | Not recorded. The transcript is `docs/meetings/week4/meeting_25th_frank_team.txt`. |

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

#### September 26, 2026 – Meeting #5: Field trip to River Lot 56 with Frank

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | September 26, 2026 |
| **Time** | Not recorded |
| **Location** | River Lot 56 |
| **Attendees** | Frank (client), Chris, Aaron, Saumya, Alissa, Zanab, Abhinav, Jayden. Frank and Chris are named as present in the [October 2](meetings/week5/2026_10_02%20_meeting_Frank.txt) and [October 9](meetings/week6/2026_10_09_meeting_frank.txt) transcripts. Attendance confirmed by Saumya, Oct 11. |
| **Absentees** | None |
| **Minute-taker** | Not recorded. No notes were taken. |
| **Source** | No transcript or notes exist for the trip. This entry uses the action items of Meeting #4 and what Frank and the team said about the trip on October 2 and October 9. |

##### Agenda

- Each member submits a River Lot 56 site inspection report with photos (action item of Meeting #4).
- Each member records the walk with a phone GPS app (action item of Meeting #4).
- Frank shows how he uses the form and the app in the field.

##### Summary

The team walked River Lot 56 with Frank. Frank showed how he fills in the site inspection form on his phone. The visit showed the team a bug in the form and gave them sample GPS data for the map work.

##### Key Discussions & Decisions

- While Frank filled in the form, he put his phone away. When he opened the app again, it opened on the first page of the form. His answers were still saved, but he had to click forward to carry on. The team made this a Sprint 2 task: the form keeps the page it was on ([#87](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87), fixed by [PR #164](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/164)).
- The trip produced GPS files in more than one format. The file from the device that Chris carried is clean. The file from Frank's handheld GPS is slightly dirty, because he did not turn it off until after the walk. His phone file is very poor. Frank gave the team clean and dirty files on purpose, as a test of how the map work deals with bad data.
- The October 2 talk track says that Frank shared his version 3.0 plan, managing site information, with the team on the trip.

##### Action Items

- Send the GPS files from the trip (Frank). He sent them before October 2.
- Fix the form so it reopens on the page the user left ([#87](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87)).

##### Next Meeting Agenda

- Weekly client meeting on October 2 (Meeting #7).

---

### Sprint 2

---

#### September 30, 2026 – Meeting #6: 401 Lab, meeting with TA

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | September 30, 2026. The notes are undated. They were committed on October 2 in `80372a5` ([PR #126](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/126)), and the only lab between the September 23 lab and October 2 is the Wednesday lab of September 30. |
| **Time** | 9:30 AM (the weekly lab slot from Meeting #0; not recorded in the notes) |
| **Location** | Online (as recorded for the labs of Meetings #0 and #3; not recorded in the notes) |
| **Attendees** | Chris, Aaron, Saumya, Alissa, Zanab, Abhinav, Jayden, and Alex (TA). The notes are titled "MEETING WITH ALEX". Attendance confirmed by Saumya, Oct 11. |
| **Absentees** | None |
| **Minute-taker** | No minute-taker; rebuilt from the week 5 notes by Saumya on Oct 11. Aaron committed the notes ([PR #126](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/126)). |
| **Source** | [Meeting notes, week 5](meetings/week5/Meeting_Notes.md) (added in [PR #126](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/126)) |

##### Agenda

Not recorded in the source. The notes cover gamification, user story clarity and points, deleting site data, and generating UML diagrams.

##### Summary

The notes are titled "Meeting with Alex". They list Alex's advice on gamification, user story clarity and deleting data. The same file also holds notes on what Frank said on October 2 (map layers, dirty GPX files, the Google Maps terms of service, simple gamification stats, release cadence and deletion levels). Those points are in Meeting #7.

##### Key Discussions & Decisions

TA advice:

- Ask Frank more about gamification. Does he want visual progress that shows off social status?
- Pitch Frank a bounty board, where visiting specific sites earns more points than other sites, instead of equal points for every site.
- Keep pushing Frank for specifics. Think about the behaviours to reward and the user flows that reward them.
- Set up automated UML generation from the code base.
- Alex said that in the real world a user story is not complete until all details are clear. The ambiguity of a story should not be tied to its points.
- Do not delete site data. Mark it as deleted and hide it, so that Frank still has the data if he needs it.

How we addressed it:

- Gamification questions: on October 2 Alissa asked Frank which actions should earn points. Frank asked for a mockup of simple gamification built from existing data. The team showed the mockup on October 9: top contributor, most counties, site variety and first reporter. Frank accepted the direction (Meeting #7 and Meeting #9). The aggregate totals are planned as US 1.0.4 in Sprint 3 ([Project Management](project-management.md)).
- Bounty board: not raised with Frank in the October 2 or October 9 transcripts. Deferred to Sprint 4: Frank asked for gamification built from existing data (on October 9: "use the data that you have"), and a bounty board needs a points value for each chosen site, which is the to-visit priority of 2.0.12 in Sprint 4. Aaron asks Frank about it at the October 16 client meeting ([Project Management](project-management.md#sprint-1-ta-feedback-and-revisions)).
- Automated UML: [PR #157](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/157) adds a diagram generator that builds the ER and UML class diagrams from the migrations and the TypeScript and updates them on every PR.
- Story clarity and points: no change was made in Sprint 2. The points of the Sprint 2 stories are the same as in the Sprint 1 release (tag `sprint-1`, September 29), which came before this advice. From the October 14 planning, each Sprint 3 story gets an "Open questions" list before work starts, owned by Aaron ([Open questions before pointing](project-management.md#open-questions-before-pointing)).
- Soft delete: sites are archived instead of deleted, with a separate admin hard delete ([#81](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/81), [PR #160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160)). Reports are archived before they can be deleted ([#93](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/93), [PR #165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165)). Frank approved this on October 9.

##### Action Items

Not recorded in the source.

##### Next Meeting Agenda

Not recorded in the source. The next meeting was the weekly client meeting on October 2.

---

#### October 2, 2026 – Meeting #7: Client meeting with Frank

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | October 2, 2026 |
| **Time** | Not recorded |
| **Location** | Not recorded |
| **Attendees** | Frank (client), Chris, Aaron, Saumya, Alissa, Zanab, Abhinav, Jayden. Chris, Alissa, Abhinav, Jayden and Zanab each speak in the transcript, and Saumya presents the deck (per the [talk track](meetings/week5/SAPAA-2026-10-02-script.md)). Attendance confirmed by Saumya, Oct 11. |
| **Absentees** | None |
| **Minute-taker** | No minute-taker; rebuilt from the transcript by Saumya on Oct 11. Aaron committed the transcript ([PR #126](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/126)) and the meeting log ([PR #127](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/127)). |
| **Source** | [Raw transcript](meetings/week5/2026_10_02%20_meeting_Frank.txt), [deck](meetings/week5/SAPAA-2026-10-02.pdf) and [talk track](meetings/week5/SAPAA-2026-10-02-script.md) |

##### Agenda

- What the team did this week and what it will do next week, tied to the charter projects.
- The sprint plan for Sprints 2 to 5.
- Questions from the team, a summary and a round table.

##### Summary

Weekly client meeting. The team presented the Sprint 2 plan against the charter. Frank described the four layers of the map, asked the team to defend its design decisions with research, and asked for a release management recommendation and a gamification mockup for the next meeting.

##### Key Discussions & Decisions

- Frank said he will rearrange work with the team when a sprint needs it, even if the work is outside the charter. He also said the team's own internal target dates are flexible.
- Environments: the team built a development copy of the app that runs on a laptop with test data and its own Supabase instance. Frank described other naming schemes (sandbox, bronze, silver, gold) so that the team knows other companies use different names.
- User model: one row per person, with or without a login. Profile fields are name, contacts, skills, focus areas and activity points. A separate table names the steward of each site. Existing accounts are copied, so nothing in the existing tables changes.
- Frank described the map as four layers: the base map, a static layer of polygons, a GPS history layer, and a layer for data visualisation. He asked each pair to say which layer it works on.
- Base map: the team will recommend an open map, probably OpenStreetMap. Frank said the team must give the reasons and must check them, for example the cost of Google Maps and any non-profit pricing. Chris added that Google's terms do not allow showing its maps offline in a third-party app. Frank said to write this down.
- Polygons: the Alberta open data set for 2023 is missing one type of natural area that the 2021 set has. Frank holds the 2021 set. The team can use the 2023 set for testing and development, and the 2021 set is needed for the real release.
- GPS files: GPX first and no phone tracking, all in Sprint 3. Frank said it is acceptable for version 2 to accept only GPX. The team should start with clean files and then deal with dirty ones.
- Offline map layers will be built for the web app only. They are not in the charter, but the team planned them anyway.
- Fix list: Frank's list has 20 items. The team plans to finish 10 by October 13. Two are already done, six are bigger and are planned for Sprints 3 and 4, and two need more detail first: the Edit Report bug, where the team waits for Harveer's description, and bringing user management into the app.
- The form that resets to page one when the phone sleeps (seen on the field trip) is planned for October 6.
- Release management: Frank asked the team to research how companies release and to recommend a schedule. He prefers weekly or monthly releases to one release at the end of the semester. The team's position is to demo each release to Frank first until he trusts its process, to have at least two reviewers on every change, and to freeze code two days before each sprint deadline.
- Sprints 4 and 5 are light so that there is room for Frank's requests. Frank will describe version 3.0 in more detail during October.
- Gamification: Frank wants simple gamification built from data that already exists, such as the number of inspections and the number of counties visited, and then improved over time. He suggested a mockup with the top contributor, the contributor with the most counties, the contributor with the greatest variety of sites, and the first contributor.
- Deleting sites and reports: Frank wants levels, suppress, archive and delete for good, and said there may even be three levels.
- Frank asked the team to pick one or two members who stay out of the research and question the recommendation the way Frank would.

##### Action Items

- Write up the map recommendation with the reasons and send it to Frank before the next meeting, if possible over the weekend (Abhinav and Alissa, the map team).
- Add an enhancement to Frank's fix and enhancement list to accept or convert non-GPX tracks (Saumya).
- Make contact with Frank's GIS contact and build the relationship before the map work needs help (Saumya; Frank to send the contact).
- Connect with Frank on LinkedIn, his preferred channel for the introduction (Everyone).
- Bring a release schedule recommendation to the next meeting (Chris).
- Bring a gamification mockup to the next meeting (Team).
- Ask Harveer for the description of the Edit Report bug (Saumya).
- Describe version 3.0 in more detail (Frank).

##### Next Meeting Agenda

- Release schedule recommendation.
- Gamification mockup.
- The work due before the meeting (slide 13 of the [talk track](meetings/week5/SAPAA-2026-10-02-script.md)): authentication checks, the Supaview fix, sign-out, the form page, add a site, map set-up and steward profiles.

---

#### October 7, 2026 – Meeting #8: 401 Lab, meeting with TA

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | October 7, 2026 |
| **Time** | 9:30 AM (the weekly lab slot from Meeting #0) |
| **Location** | Online (as recorded for the labs of Meetings #0 and #3; not recorded for this lab) |
| **Attendees** | Chris, Aaron, Saumya, Alissa, Zanab, Abhinav, Jayden, and Alex (TA). Attendance confirmed by Saumya, Oct 11. |
| **Absentees** | None |
| **Minute-taker** | No minute-taker; rebuilt from the repository record by Saumya on Oct 11. No notes were taken. |
| **Source** | Reconstructed from the repository record on Oct 11; no notes were taken. |

##### Agenda

Sprint 2 check-in against the work that the October 2 deck promised for October 7
(slide 13 of the [talk track](meetings/week5/SAPAA-2026-10-02-script.md)).

##### Summary

The entry lists the real state of each October 7 item from the git history. It does not record
what was said, because no notes or transcript exist. Times are MDT. At the start of the lab
(9:30 AM), three of the seven items had merged work on `main`.

##### Key Discussions & Decisions

Not recorded. The October 7 items from the deck, and their state on October 7:

| Item | Issue | Merged before the lab | Merged later on October 7 | Merged after October 7 |
|---|---|---|---|---|
| The steward shown on each site page | [#77](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/77) | [PR #133](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/133) (Oct 4), [PR #139](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/139) (Oct 5), [PR #140](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/140) (Oct 5) | - | - |
| Edit your own profile | [#78](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/78) | [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138) (Oct 5) | [PR #151](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151) (blank name check, 3:53 PM) | - |
| Search the map by county | [#85](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/85) | - | - | [PR #166](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/166) and [PR #167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167) (Oct 9), [PR #241](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/241) (Oct 10) |
| Website and iNaturalist links on site pages | [#86](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/86) | [PR #145](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/145) (Oct 5) | - | - |
| Delete photos | [#89](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/89) | - | [PR #148](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148) (12:10 PM) | - |
| Delete reports | [#93](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/93) | - | - | [PR #165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165) (Oct 9) |
| Stewards can export their own reports | [#92](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/92) | - | [PR #155](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/155) (3:55 PM) | - |

##### Action Items

Not recorded. The git history shows what was due next:

- The October 9 items of the deck: export more than 50 reports ([#90](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/90)) and hide private
  fields before export ([#91](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/91)). [PR #146](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/146) (hidden fields) merged on October 7 at
  12:10 PM. The 7.0.6 paging and tests merged on October 10 ([PR #237](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/237)).
- Record Alex's answer on whether DevOps and release work can be written as user stories, or ask
  him at the October 14 lab (Aaron). The question was first raised on September 19 (Meeting #2).
  [#22](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/22) is about confirming the sprint dates with the TA, and it is closed. Its
  description also mentions the DevOps question, but no answer is recorded there.

##### Next Meeting Agenda

- Weekly client meeting on October 9 (Meeting #9).

---

#### October 9, 2026 – Meeting #9: Client meeting with Frank

| Field | Details |
|-------|---------|
| **Company** | SAPAA |
| **Project** | SAPAA SIR |
| **Date** | October 9, 2026 |
| **Time** | Not recorded |
| **Location** | Not recorded |
| **Attendees** | Frank (client), Chris, Aaron, Saumya, Alissa, Zanab, Abhinav, Jayden. Chris, Abhinav, Alissa and Zanab each speak in the transcript, and Saumya presents the deck. Attendance confirmed by Saumya, Oct 11. |
| **Absentees** | None |
| **Minute-taker** | No minute-taker; rebuilt from the transcript by Saumya on Oct 11. Aaron committed the transcript ([PR #168](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/168)). |
| **Source** | [Raw transcript](meetings/week6/2026_10_09_meeting_frank.txt). The transcript ends before the meeting does. |

##### Agenda

- Status of version 1.1, which is planned for release on Tuesday, October 13.
- Walk through Frank's fix and enhancement list.
- Development and production environments.
- The map decision: which map and why.
- Gamification mockup, deletion levels and the Sprint 3 plan.

##### Summary

The team showed that version 1.1 is nearly built and that everything is merged or in review. Frank went through his fix and enhancement list and agreed that most items are done. He asked the team to document the reasons for the map decision, approved the delete design, and asked how GPX upload will work.

##### Key Discussions & Decisions

- Version 1.1: all work is merged on `main` or in review. Code freeze is October 11 and the release is October 13. Every pull request has two reviewers.
- Frank will run user testing after the release, and wants no surprises for users. The Supaview connection will work after the release.
- Frank's list: the Supaview fix, removing the 50 report limit, SAPAA website links, admin edits of site pages, all photos in the PDF, steward designation, hiding fields on export, a map and basic user management are done or running. Image extract needs another look. Critical safety information is not done, and Frank does not expect the team to reach it. Report deletion was in review, and GPS track upload and site priority points are for later sprints. Frank added that an iNaturalist link only needs a URL field, so he is satisfied.
- Map: the team uses Protomaps data, which comes from OpenStreetMap, drawn with MapLibre. The team gave two reasons: Google does not allow offline display, and Protomaps allows up to 1,000,000 tile requests a month, which the team expects to be enough.
- Frank asked how the team will document the map decision. The decision document is in the team's Google Docs and will go to the repository and to Frank's Drive. Frank wants a project close summary by the end of the project, with a section on how the map was chosen. He wants to see that section on the Drive now, even if it is empty.
- Environments: a SAPAA Dev GitHub account holds a repository linked to Vercel. A branch in the team repository will be linked to the release branch of that repository, so a push deploys automatically. Local environments imitate Supabase and the S3 storage, so the team can work offline.
- Releases: the team demos each release to Frank until he trusts the process. After that it can release without a demo. Frank's trust will go up when he sees the app after October 13.
- Gamification mockup: top contributor, most counties, site variety and the first reporter of a site. The team measures variety by site subtype, which the site filter already has. Frank also suggested natural region, and a time dimension such as all time and the past year. He said the team is going in the right direction.
- Deleting: there are two levels. Archive hides a site and can be restored easily. Delete for good removes the site and the steward link, and the reports and photos stay. Frank approved it.
- The form now reopens on the page the user left (Abhinav, [PR #164](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/164)). The team told Frank that the database name change took about five minutes.
- Sprint 3 has been planned and the teams change. Dates: October 13 for version 1.1, October 27 for maps and history, and November 17 for Frank's requests. Sprint 3 includes scoreboard totals, editing reports, safety information, password reset, offline map download and linking sites to government boundaries.
- GPX upload: today the admin panel accepts KML for site boundaries only, and GPX upload is for Sprint 3. Frank asked what the user experience will be. The team's ideas: an editor with a cutting tool when a file is uploaded, the original file stays in the database, and the cleaned track shows as an extra layer. The steward decides what to keep, because a steward may walk outside the boundary and still inspect the area.
- Frank offered about 100 of his own GPX files as samples and asked about bulk upload. The team will support uploading several files from the start.
- Linking sites to protected areas: some KML areas share site names, and one site such as Lakeland has three boundaries. The sites in the app have a type in brackets in the name, for example Riverlot 56 (NA), so only fuzzy matching is possible. The team proposes automatic matching plus a manual link option. Frank's advice: the KML format is a system concern, not a user concern. Expect about 90 percent to match automatically and clean up the other 10 percent by hand.
- Frank advised the team to leave the client with a project close summary and a graceful exit, because the next contract goes to the team that did. He asked Abhinav a mock interview question on release management and discussed the answer.

##### Status of previous action items

The action items of Meeting #7 (October 2), checked against this transcript, GitHub and the git
history. "Not recorded" means that no source shows the result.

| Action item (owner) | Status on October 9 | Evidence |
|---|---|---|
| Write up the map recommendation with the reasons and send it to Frank (Abhinav and Alissa) | Presented at this meeting. The decision document was in the team's Google Docs, not in the repository. | This transcript; new action item below |
| Add an enhancement to Frank's list to accept or convert non-GPX tracks (Saumya) | Not recorded | - |
| Make contact with Frank's GIS contact (Saumya; Frank to send the contact) | Not recorded | - |
| Connect with Frank on LinkedIn (Everyone) | Not recorded | - |
| Bring a release schedule recommendation (Chris) | Discussed at this meeting: the team demos each release to Frank until he trusts the process. The written release process merged on October 11. | This transcript; [PR #246](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/246) |
| Bring a gamification mockup (Team) | Done. Shown at this meeting. | This transcript |
| Ask Harveer for the description of the Edit Report bug (Saumya) | Not recorded | - |
| Describe version 3.0 in more detail (Frank) | Not recorded | - |

The work due before this meeting (slide 13 of the October 2 deck):

| Item | Issue | Merged on `main` |
|---|---|---|
| Authentication checks on admin pages and actions | [#71](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/71) | [PR #144](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/144) (Oct 5) |
| Supaview fix: Invalid Identifier and the `W26_` rename | [#72](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/72), [#73](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/73) | [PR #128](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/128) and [PR #129](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129) (Oct 3) |
| Sign-out fix | [#94](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/94) | [PR #120](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/120) (Oct 2), [PR #158](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/158) (Oct 8) |
| The form keeps its page | [#87](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87) | [PR #164](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/164) (Oct 9) |
| Admins can add a site | [#79](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/79) | [PR #153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153) (Oct 6) |
| Map set-up | [#83](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/83) | [PR #159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159) (Oct 8) |
| Steward profiles | [#75](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/75), [#76](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/76) | [PR #131](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131) (Oct 3), [PR #138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138) (Oct 5) |

##### Action Items

- Put the map decision document in the repository and share it with Frank (Saumya). Add a section on how the map was chosen to the project close summary.
- Demo the Protomaps and MapLibre map next week (Abhinav).
- Demo the manual link between sites and protected areas next week (Alissa and Abhinav).
- Get the Supaview connection working by Tuesday (Team).
- Freeze code on October 11, release version 1.1 on October 13, and write the release notes (Team).
- Put Frank's sample GPX files in a sample GPX subfolder (Frank).
- Mark the finished items as done in column G of Frank's list at the next meeting (Saumya and Frank).
- Check with each member that they are comfortable with their Sprint 3 work (Saumya).

##### Next Meeting Agenda

- Version 1.1 frozen, merged and tested, with the release notes.
- Release of version 1.1 to the stewards, a demo for Frank and a review.
- Demo of the map and of the manual link between sites and protected areas.
- Sprint 3 plan.

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

