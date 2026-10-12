# SIR-SAPAA weekly update, Fri Oct 9, 2026: talk track

Rules for Frank: one idea per slide, lead with the key line, business words, charter project first, short answers. Say "I don't know, I'll find out" when you don't know. Frank cares about what's next more than what was done, so keep section 1 short. Always give the reason for a decision.

Names used below: Sprint 2 teams are Alpha (Saumya, Aaron), Beta (Abhinav, Alissa) and Gamma (Zanab, Chris, Jayden). Sprint 3 teams are Red (Saumya, Chris), Blue (Aaron, Zanab, Abhinav) and Green (Alissa, Jayden). GitHub handles map to first names as follows: snp05016 is Saumya, Aaronplayz14 is Aaron, abhinav-bhattarai8 is Abhinav, AlissaPepino is Alissa, Zanab-Akbar is Zanab, lamersc is Chris, jaydonos is Jayden. The mapping of lamersc to Chris is inferred from the Sprint 2 assignments.

Repo base: https://github.com/UAlberta-CMPUT401/F26project-SAPAA

---

## 1. Cover

[Under 15 seconds.]
"Good afternoon, Frank. Today is mostly about what's next: version 1.1 is planned for release on Tuesday, and then we start the map. Everything ties to your charter."

Behind this slide:
- Version 1.1 is Project 1 of your charter (the fix list and minor enhancements). The plan: all work merged by the code freeze on Sunday Oct 11, release notes on Monday Oct 12, release on Tuesday Oct 13 at 20:00. Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (Milestones table and the Sprint 2 section).
- Tracking issues for the dates: code freeze https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/96 (Jayden, open), release notes and release https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97 (Gamma, assigned to Chris, open), Sprint 2 demo and review https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/98 (Chris, open, Oct 14).
- Gamma (Zanab, Chris, Jayden) makes the Sprint 2 release. The project-management plan says release on Oct 12 and treats Oct 13 as spare time before the 20:00 deadline. The slide says Tuesday, which is the deadline.
- IF HE ASKS what version 1.1 is: "It is the Project 1 fix list from your charter, plus a few safety fixes. The list has 20 items. We said last week that 10 of them land in 1.1."
- IF HE ASKS whether Tuesday is firm: "The sprint deadline is Tuesday at 8 p.m. The release also needs someone to run the database changes on the live database. I'll confirm who and when." (Open question: see the last section.)

## 2. Agenda

KEY LINE: "Last Friday you asked us for three things: which map and why, a release recommendation, and a scoreboard mockup. We also asked how deleting should work, and you answered. Section two covers all four. Most of our time goes to section three, what's next."
[click] 1: "What's new is one short slide."
[click] 2: "Your four topics from last Friday."
[click] 3: "What's next: version 1.1, then the map."
Footer, if needed: "Then what we need from you, questions from the team, and a summary."

Behind this slide:
- Where the four items come from in Frank's Oct 2 transcript (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week5/2026_10_02%20_meeting_Frank.txt): the map rationale ("you can't make that design decision without telling me the rationale"), the release recommendation ("come back to me with recommendation"), the gamification mockup ("give me a mockup for next week"), and deletion levels (Jayden asked; Frank answered "two levels... there may even be three levels. Suppress, archive, nuke").
- Wording matters here: the first three are Frank's asks. Deleting was Jayden's question and Frank's answer. The slide says "Your asks", and slide 10 is labelled "Your answer".
- Team notes with the same items: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week5/Meeting_Notes.md
- IF HE ASKS to skip ahead: go to slide 11 (what's next). Section 1 is slides 3 to 5 and can be cut to one minute.

## 3. Section 1: What's new since last Friday

"First, a short look at what changed. It is two slides, because most of today is about what's next."

Behind this slide:
- Window: Oct 2 to Oct 9.
- No issue or PR on this slide.

## 4. Where your four projects stand

KEY LINE: "Each line is one of your charter projects."
[click] Project 1: "Version 1.1 is nearly built. Five pieces are in review and land by the October 11 freeze. Slide 14 lists them. One more item, exporting more than 50 reports, is still being verified."
[click] Project 2a: "Every change is reviewed by two teammates and passes automatic checks before it goes in, and we now have a release branch for versions."
[click] Project 2b: "Steward profiles work in our practice copy: name, contact details, skills, inspection history, and the steward named on each site, linked to their profile."
[click] Project 2c: "The map now shows Alberta with the government's protected-area boundaries. Hover to highlight, click for details. Linking those boundaries to our own sites is the first Sprint 3 task."
Footer: "About thirty code changes merged since last Friday, including six fixes. We also removed the old Winter-2026 prefix from our table names in the practice copy. The live database follows at release."

Behind this slide:
- Project 1 (Fixes). The five pieces still in review are open pull requests #162, #163, #164, #165 and #166 (slide 14). The sixth item, export of more than 50 reports, is unverified: issues https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/66 (US 7.0.6) and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/90 (task) are closed, no pull request changes the export, and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148 only seeds 51 test inspections. Owner: Gamma. Merged this week for Project 1: admin checks moved from user-editable data to server-only data, so a user cannot give themselves admin rights (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/144, Chris, closes https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/71, a Beta task); the "Invalid Identifier" task (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/72, Alpha, PR https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/128); the sign-out fix (slide 5).
- Project 2a (Testing). Reviewer gate: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/124 (with 2 or more assignees, only they review and all must approve; with none, any 2 people). Release branch model: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/125 (feature branches go to `main`, `main` goes to `release` by PR; the `release` branch exists). Also https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/154 (reviewer gate status fix) and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/157 (diagram generator that updates diagrams on every PR). Written down in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/contributing.md. Branch setup task: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/70, Gamma. Do not say "tested on a copy first": there is no shared staging environment (item 25 in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/issues.md is open). The practice copy runs on our laptops.
- Project 2b (People). User model: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131 (`people` and `site_stewards` tables, a profile row for every current and new user; Alpha, issues https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/74 and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/75). Profile page and edit own profile: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138 (Aaron). Contact details and socials: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/142. Inspection links to submitter profile and back button: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/141. Blank-name check: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151. Steward on each site: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/133 (server actions), https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/134 (site page: show and assign), https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/139 (link goes to the real profile page), https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/140 (profile lists "Steward of"). Stories: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/54 (US 1.0.1), https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/55 (US 1.0.2), https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/62 (US 3.0.2). All Alpha (Saumya, Aaron). Database design: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/user-model.md
- Project 2c (Maps). Basemap and Cards/Map toggle: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159 (Abhinav, Beta; its description says sites do not plot markers on the map). Boundaries drawn with hover highlight and click popup: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161 (Abhinav; its description says `protected_areas` and `sites_pa` "remain disconnected"). Groundwork: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/132 (`protected_areas` table), https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137 and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152 (KML/KMZ parser and admin upload). So the shapes on the map are government protected-area polygons, not our sites. Linking is the first Sprint 3 task (slide 13).
- Footer count. The exact number depends on when the Oct 2 meeting ended, which the repo does not record. From the PR list: 41 PRs merged after 20:00Z on Oct 2, of which 30 are feat, fix or refactor (23 feat, 6 fix, 1 refactor); 36 PRs merged after 23:00Z, of which 28 are feat, fix or refactor (21 feat, 6 fix, 1 refactor). The rest are docs, CI and chore PRs. So say "about thirty code changes" and "six fixes". The "database clean-up" is the removal of the `W26_` prefix: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129 (task https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/73, Alpha). It renames 10 web app tables and the hyphenated names. The live database still has the old names until someone runs the migration (see the last section).
- IF HE ASKS what "two teammates review every change" means: "Each change needs approval from at least two teammates, and automatic tests must pass. It cannot merge until both are done."
- IF HE ASKS what "practice copy" is: "A copy of the app on our laptops with a test database and made-up data, so nothing touches real stewards' reports. It is the development environment you asked about last Friday."
- IF HE ASKS why we say "protected-area boundaries" and not "site boundaries": "They are the government's shapes, and they are not linked to our sites yet. That link is the first Sprint 3 task."

## 5. Ready to see in the practice copy

"If you want to see any of this, we can show it live in the practice copy now. You said last week you like to see demos while you build trust in our testing."
[click, four builds, two items each]
- "Map and profiles."
- "Steward on site and add a site."
- "Archive, restore or delete a site, and sign-out."
- "Own PDF and hidden fields."
Also done and not on the slide: "Photo identifier is optional, photos can be deleted, and SAPAA and iNaturalist links show on site pages."
Offer: "Want to see any of these now?"

Behind this slide:
- Map view with protected-area boundaries: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159 and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161. The hosted Protomaps basemap needs the environment variable `NEXT_PUBLIC_PROTOMAPS_API_KEY`; without it the map shows a setup card instead. The shapes are not yet linked to our sites and there are no site markers.
- Steward profile with inspection history: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138. Steward on each site page: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/134 and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/139.
- Admins add a site: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153 (Zanab, Gamma, story https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/56). Name must not be empty; a same-name duplicate warning appears; a steward who calls it directly is refused. The similar-name warning is in review (#162). Picking a boundary and the SAPAA-map suggestions are not built (slide 14).
- Archive, restore or delete a site: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160 (Jayden, Gamma, closes https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/58). See slide 10. Deactivate and reactivate (US 2.0.3) is separate and was already there: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150.
- Sign out from every page: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/158 (Saumya, Alpha, story https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/64). It adds the user menu with Logout to the profile, people, new-report and edit-report pages, and a guard so the Back button after sign-out goes to the login page. Earlier work: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/120 (admin site details page).
- Download your own report as a PDF: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/155 (Chris, Gamma, story https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/68).
- Hide private fields before export: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/146 (Alissa, Beta). An admin clears questions in Advanced Options before a PDF export, for single-site and multi-site exports. The answers stay stored; only the export drops them. Answers are not marked non-public in the database.
- Photo identifier optional: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/147 (Alissa, closes https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/63). Delete a photo: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148 (Chris; also adds a local S3 bucket for testing; closes https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/65). Links on site pages: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/145 (Zanab, closes https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/61). Caution: in that PR the links are temporary and point to the same two home pages for every site until the "edit a site" work (#163) stores real links per site.
- IF HE ASKS where the export of more than 50 reports is: "It is not on this slide because we have not verified it yet. The two GitHub issues for it (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/66 and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/90) are closed, but no pull request changes the export. Pull request https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148 only added 51 test inspections so we can check it. Last week we said the limit was fixed in July; we have not re-checked that this week. I'll confirm and tell you." Owner: Gamma (task #90, story #66, due Oct 9). Acceptance tests: export of more than 50 completes and includes each selected report; each report matches its page; stewards are refused; a failed export leaves stored reports unchanged. The warning for very large exports that we mentioned last week is not in any merged change.
- IF HE ASKS about GPX, offline or safety information: "Those are Sprint 3, slide 16."

## 6. Section 2: Your asks from last Friday

"Second: what you asked for last Friday, and the delete answer you gave us. For each one, our answer and the reason."

Behind this slide:
- No issue or PR. Transcript source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week5/2026_10_02%20_meeting_Frank.txt
- Frank's expectation, in his words: bring a recommendation with reasons, because when someone later asks "why did you decide to go with X", "we had options and a rubric" beats "pizza one night". Lead each answer with the reason.

## 7. Which map, and why

KEY LINE: "You asked us to explain why we picked this map, not just which one."
[click] Our choice: "OpenStreetMap data, drawn with Protomaps and MapLibre. The data is open and the map viewer is open source."
[click] Not Google: "You told us you already hit Google's limits on your website. And Chris found that Google's terms don't permit using their maps offline in another app, which you need on the web app."
[click] Already working: "This is not just a proposal. It runs in the app today, with the government boundaries on it."
[click] Still to confirm: "We have not finished the comparison. We still need to confirm hosting cost, any non-profit pricing, and whether saving map areas offline is allowed. If there is an option you want us to compare, tell us now."

Behind this slide:
- Frank's request: "You guys need to tell me why you have selected that, though." He also asked: "Why have you eliminated Google Maps? ... Do they not have nonprofit pricing?", asked for a short comparison of several options with an honest confidence level, and asked us to keep two teammates out of the research so they can ask what Frank would ask (transcript above).
- What is built: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159 (MapLibre GL JS plus Protomaps vector tiles; map bounded to Alberta; loaded only when "Map View" is selected) and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161 (boundaries from the `protected_areas` table, simplified on the server). Owner: Abhinav (Beta, tasks https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/83 and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/84).
- Protomaps hosting: the app loads the style from the hosted Protomaps API (`api.protomaps.com`) with an access key, set as `NEXT_PUBLIC_PROTOMAPS_API_KEY`. The key must exist in production. Cost, non-profit terms and whether that hosted service allows saving tiles for offline use are not confirmed. Those are the open items on the slide.
- Source for the Google claim: Chris, in the Oct 2 transcript (around lines 497 to 508): "it's actually against Google's terms of service to use their mapping software in a 3rd party application offline". Frank answered "write it down... you need to tell me why." The links are in the team notes: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week5/Meeting_Notes.md (https://cloud.google.com/maps-platform/terms and https://cloud.google.com/maps-platform/terms/maps-service-terms). The notes say the terms allow caching of latitude and longitude conversions but never state that caching map tiles for offline use is allowed. Say "don't permit", which is the notes' reading, and have the clause open.
- Frank's own reason: "I've maxed out Google Maps. I can't add any more data elements to it, without paying them a bag of money."
- IF HE ASKS why not Google Maps: "Two reasons. Your website already hits Google's limits. And Google's terms don't permit offline use of its maps in another app, and you need offline on the web app. We have not yet checked Google's non-profit pricing. That is part of the write-up."
- IF HE ASKS why OpenStreetMap and Protomaps: "OpenStreetMap is open data. Protomaps draws it as map tiles and MapLibre is an open-source viewer, and both already work in our app. What we have not confirmed is what the hosted Protomaps tiles cost for your use, whether a non-profit rate applies, and whether we may save those tiles offline."
- IF HE ASKS what Protomaps and MapLibre are: "Protomaps supplies the map tiles, built from OpenStreetMap data. MapLibre is the open-source code in the browser that draws them."
- IF HE ASKS about cost today: "I don't know yet, I'll find out."
- IF HE ASKS who is challenging the decision: Open question. Frank asked us to name teammates who play the questioner. The repo does not record who was picked.

## 8. How often you get new versions

KEY LINE: "You said you don't want one big release at the end of the semester. Here is our starting proposal."
[click] Every sprint: "A new version at the end of every sprint, two to three weeks apart. Those are the dates on the calendar slide."
[click] You see it first: "We demo each release to you first. Once you trust our testing, we can release without waiting for a demo."
[click] Checked first: "Every change is reviewed by two teammates and passes automatic checks before it goes into a release."
[click] Frozen early: "Two days before each release we stop adding work, so only tested work ships."
Ask: "Does this work for you? If you want to see how other teams do releases, we can bring that comparison."

Behind this slide:
- Dates: Oct 13, Oct 27, Nov 17, Dec 1, each at 20:00, with a freeze two days earlier (Oct 11, Oct 25, Nov 15, Nov 29). The gaps are 14 days (Sept 29 to Oct 13), 14 days (to Oct 27), 21 days (to Nov 17, after reading week) and 14 days (to Dec 1). That is why the slide says "every sprint", not "every two weeks". Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (Milestones table).
- Frank's words: he does not like a semester-end release ("then you guys disappear on me"), he is fine with releases on the course sprint schedule, and he wants to see demos at first: "Initially, I like to see demos... as my trust level of your team increases." He asked for a researched recommendation: talk to other people and see what they do, then come back with it.
- Research status: on Oct 2 Chris said the team would bring a release-schedule proposal at the next Friday meeting. The repo has no record of a survey of other teams, so do not claim one. The offer on the slide is a comparison if Frank wants it. Owner of the topic: Chris (Gamma, Platform / CI/CD / releases).
- No staging environment exists (item 25 in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/issues.md is open). What is true today: two teammates review every change and automatic checks run (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/124), and the branch model separates `main` from `release` (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/125, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/contributing.md). Gamma releases Sprint 2; Red releases Sprint 3.
- IF HE ASKS why each sprint end and not weekly or monthly: "Our sprints end on fixed course dates, two to three weeks apart. Releasing at each sprint end gives you something new regularly without adding a separate process. If you want weekly, say so and we will look at what it costs us."
- IF HE ASKS whether changes are tested before going live: "Reviewed by two teammates and automatic checks. We do not have a separate shared test site yet. It is on our backlog."
- IF HE ASKS what happens if something urgent comes up: "That is what the two-day freeze window is for. We can fix it without touching new work." (From the transcript.)
- IF HE ASKS who reviews the plan: "We would like an outside reviewer for Project 2a. Do you have a name?" (The charter asks for review with former students and industry experts, as said on Oct 2.)

## 9. A simple scoreboard: our mockup

KEY LINE: "These are your own examples from last Friday, shown the way a steward would see them. The numbers are examples, not real data."
[click] Top contributor.
[click] County explorer.
[click] Site variety.
[click] First on site.
"Each one counts something we already store, so there is nothing new to collect. Sprint 3 puts inspection totals on every profile, and activity points come in Sprint 4. This follows your 'start with something simple and improve it' approach. Which of these four should we build first? And by first on site, do you mean the first report ever filed at a site?"

Behind this slide:
- Frank's examples, nearly in his words: "who is the top contributor, who is the contributor who has the most number of counties, who has visited the greatest variety of sites, who was the first contributor". He asked for "a mockup... you already have the data, it is just visualization" and said "we always use the power of terrible": start with what exists and improve it.
- Team notes also record that Frank wants to see "how it'll flow, what will the user see, what specific stats are on display." The slide covers what the user sees; the flow is not drawn. Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week5/Meeting_Notes.md
- Where it lives in the plan: inspection totals on the profile are US 1.0.4 (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/user-stories.md, 2 points), Sprint 3, Green (Alissa, Jayden), due Oct 19. Activity points are US 1.0.5 (5 points), Sprint 4. The profile already shows two counts from https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138.
- Gap to know about: US 1.0.4's acceptance tests cover the inspection count and "activities reported" only. County explorer, site variety and first-on-site are not in any acceptance test. County data may be incomplete (backlog item 43, "Finish site classification by region and county", is open). The footer therefore says "the counts use data we already store", not "every count".
- "First on site" is our reading of Frank's "who was the first contributor". The slide now asks him.
- IF HE ASKS where the numbers come from: "They are examples. The real ones come from the inspection reports and each site's county, which are already in the database."
- IF HE ASKS about a leaderboard or bounty board: Open question. The team notes mention a "bounty board" idea (more points for specific sites). It is not in the plan. Frank said "start simple."
- IF HE ASKS when points arrive: "Sprint 4, due Nov 17, if you confirm what actions earn points."

## 10. Deleting, in two safe steps

KEY LINE: "We asked how deleting should work. You said two levels, maybe three: suppress, archive, nuke. Nothing is erased by accident."
[click] Archive: "An admin archives a site after seeing how many reports, answers, photos and steward assignments are connected to it. The site is hidden everywhere, and restoring it brings everything back."
[click] Delete for good: "From the Archived Sites page, an admin can delete a site permanently. The site and its steward assignment go. Its reports, answers and photos stay in the database with no site attached. People and boundaries are untouched. Reports of an archived site stay visible with an Archived label."
[click] Reports: "Reports get the same two steps, archive then delete. Deleting a report for good also removes its answers and photos. That is in review now."
[click] Your call: "We already have deactivate and reactivate, which hides a site from pickers and search. That is close to your suppress. Do you want suppress as its own level below archive?"

Behind this slide:
- Who asked: Jayden asked Frank at the Oct 2 round table whether deleted sites and reports should be erased or marked as deleted. Frank answered "Like 2 levels... and there may even be 3 levels. Suppress archive nuke." The team notes call suppress "redundant". That is why the slide is labelled "Your answer". Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week5/Meeting_Notes.md
- Sites: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160 (merged Oct 9, Jayden, Gamma; closes https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/58, US 2.0.4). Step 1: show the connected records. Step 2: archive (the site row stays with `archived_at` set; nothing else changes). Step 3: from the Archived Sites page (`/admin/sites/archived`), restore or permanently delete. Permanent delete requires the site to be archived first. It removes the `sites_pa` row; its steward assignment is removed with it by cascade (`site_stewards.site_id` is that table's key); the steward's profile stays. Reports, answers, attachments and homepage images stay with `site_id` set to empty. Kept: login accounts, `people` profiles, imported `protected_areas` boundaries, image files in storage. The same PR adds an All Reports page (`/reports`): reports of archived sites are listed there with an "Archived" label but not linked to a site page. The profile shows the Archived badge for reports on archived sites and "Unknown site" for reports of permanently deleted sites. Needs migration `20261008164223_delete_site.sql` on the live database.
- Reports: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165 (open, Jayden, closes https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/69, US 7.0.8). Archive, restore and permanent delete for inspection reports; admin only; a report must be archived before it can be deleted. Permanent delete removes the report's answers and attachment records in one database transaction and then removes the image files from storage. Archived reports are hidden from lists, galleries, profiles, totals and PDF exports. Status when I checked: 34 files, 1,725 lines added, no reviews yet, requested reviewers Zanab and Chris. Needs migration `20261009000000_archive_site_inspection_reports.sql`.
- What is left for US 7.0.8 (acceptance tests in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/user-stories.md): confirm before delete, the report disappears from the site and lists, its images disappear with it, stewards are refused on the server, a failed delete leaves the report unchanged.
- Vocabulary: the app already has Deactivate and Reactivate for sites (US 2.0.3, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/57, PR https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150). A deactivated site is hidden from pickers and search, but its inspections stay viewable and an admin can toggle it back. Frank's order is suppress (mildest), archive, nuke. Deactivate is close to suppress. So the question for Frank is whether deactivate already is his suppress, or whether he wants suppress as a separate level below archive. Open question.
- IF HE ASKS how archive differs from delete: "Archive hides it and can be undone. Delete for good removes the site record and its steward assignment and cannot be undone. Archive comes first, so a site cannot be deleted in one click."
- IF HE ASKS what happens to the reports of a deleted site: "They stay in the database with no site attached; the profile shows 'Unknown site'. They are not erased. Today no screen lets an admin re-attach them to another site. That is an open question for you." (The re-attach part is my reading of PR #160: it describes no re-attach screen.)
- IF HE ASKS what happens to the reports of an archived site: "They stay visible on the All Reports page with an Archived label."
- IF HE ASKS who agreed this: "Our team agreed the first version. We have not had your sign-off on keeping the reports." Reason: the project plan lists this as an open conflict, and my review comment on PR #160 asked for the team's agreement to be linked. Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (Open conflicts with the plan).
- IF HE ASKS whether you can undo a permanent delete: "Not from the app. The site record is gone. The reports are kept, so the history is not lost."

## 11. Section 3: What's next

"Third, and where most of our time goes: what's next."

Behind this slide:
- Window: Oct 9 to Oct 16.
- Sprint 3 teams (Red, Blue, Green) start after the Oct 14 sprint demo and planning. Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md

## 12. What we'll do, project by project

KEY LINE: "Same four projects. Here is next week."
[click] Project 1: "Finish the five last pieces, freeze on Sunday October 11, release version 1.1 on Tuesday October 13."
[click] Project 2a: "The release goes through our new process: a release branch, two reviewers and checks on every change."
[click] Project 2b: "Sprint 3 starts. On each profile, every past visit opens its report. The scoreboard totals come next."
[click] Project 2c: "The first Sprint 3 task, due October 16: link each of our sites to its boundary from the Alberta government data, and store a centre point for the map. Matching sites and listing any that do not match follows by October 18."

Behind this slide:
- Project 1: open PRs #162 to #166 (slide 14); tracking https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/96 (code freeze) and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97 (release).
- Project 2a: release by Gamma in Sprint 2 (Zanab, Chris, Jayden); steps in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/contributing.md: open a PR from `main` into `release`, merge with a merge commit, publish the GitHub release from `release`. There is no staging step in this process.
- Project 2b: Green (Alissa, Jayden). "Link each inspection in the profile history to its SIR" (US 1.0.3) due Oct 17; activity aggregates on the profile (US 1.0.4) due Oct 19. The history list already exists from https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138. The slide says "Sprint 3 starts" because Sprint 3 begins on Oct 14.
- Project 2c: Blue (Aaron, Zanab, Abhinav) owns "Link each site to its boundary from the Alberta government KML and store a centre point (migration)", US 6.0.1, due Oct 16. Acceptance tests 1 and 2 of US 6.0.1: the site geometry equals the source the website uses, and a site read from the database has a stored boundary and a centre point. The next two tasks are matching sites and listing unmatched ones for an admin (Oct 18, acceptance test 3) and caching geocoding results under the OpenCage daily limit (Oct 19, acceptance test 4). It continues the KML parser and import from PRs https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137 and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152. Green reviews the database design of the new columns first. The map work (US 2.0.1) belongs to Red, but this linking task belongs to Blue.
- IF HE ASKS why the boundary link comes first: "The map, the details view and the iNaturalist observations all need each site to have a boundary and a centre point."
- IF HE ASKS what data the boundaries use: "The Alberta government's open data, which is the same source your website uses. You told us the 2023 version leaves out one natural-area type. See slide 17."

## 13. What you can expect next Friday (Oct 16)

KEY LINE: "Everything on this slide is due before we meet next Friday."
[click] Oct 11: "All version 1.1 work is merged and frozen."
[click] Oct 12: "Release notes are written."
[click] Oct 13: "Version 1.1 is released by 8 p.m. That is the sprint deadline."
[click] Oct 14: "The team does its sprint demo and review, and plans Sprint 3."
[click] Oct 16: "The first Sprint 3 items: each site linked to its government boundary with a centre point, the Sprint 3 test plan, and a review of the new database tables for the map, GPS tracks and safety information."
Footer: "Your live database needs a one-time update when we release, because we renamed our tables. We will do it with your admin so Supaview can connect."

Behind this slide:
- Oct 11 freeze: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/96. Oct 12 release notes and Oct 13 release: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97 (Gamma, Chris). Oct 14 demo, review and retrospective: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/98 (a course lab; the Sprint 2 peer-review form is due Oct 14 at 23:59). Sprint 3 planning is the same day, when Sprint 3 issues get created.
- Oct 16 items, all in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (Sprint 3 tasks): link each site to its boundary and store a centre point (Blue, US 6.0.1, acceptance tests 1 and 2); write the Sprint 3 test plan naming the test type for each acceptance test (Blue); review the schema of the site geometry columns, the GPX track table and the safety information fields (Green, dev task).
- The slide now says "Sites linked to their boundaries" on Oct 16. Only the first step is due on Oct 16. Matching sites and the unmatched-site list for an admin is Oct 18, and the geocoding cache is Oct 19 (backup slide 25 shows Oct 16 to 19).
- What Supaview is: Frank's data visualisation and data access tool. On Sept 25 he said he could not mount it on Supabase "because when they built the database, they named the database with hyphens instead of underscores". The Sept 25 minutes record the fix as "rename hyphenated Supabase objects to use underscores, as Frank asked to remove all hyphens, so Frank's visualization tool can connect": https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meeting-minutes.md. The rename is https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129 (task https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/73, Alpha).
- Why the live update: the new app code uses the new table names, so the live database must be renamed when the new code goes live. If the rename is not run, the live app breaks. Source: PR #129 description ("do not release until the SQL runs"). Plan: run it right after deploy, with Frank's admin.
- IF HE ASKS what Supaview is: "It is your data visualisation and access tool. It could not connect to our Supabase database because the table names had hyphens. We renamed the tables, and removed the old W26 prefix, in the practice copy. Your live database gets the same one-time update at release, with your admin." The spelling "Supaview" is ours; transcripts say "Superview". Open question: confirm the spelling and that the tool connects after the rename. We have not tested the tool itself.
- IF HE ASKS whether Supaview works today: "On the live database, not yet. I'll confirm after the update."
- IF HE ASKS why the review of the new database tables: "Green (Alissa, Jayden) checks names, keys, access rules and the order of changes before each migration merges, so the map and GPS tables are consistent."

## 14. Five last pieces of version 1.1

KEY LINE: "Five pieces of version 1.1 each have a pull request in review."
[click] Add site: "When an admin adds a site, the form now warns about similar names, for example 'Bilby' against 'Bilby Natural Area'. Suggesting sites from your SAPAA map, and picking a boundary, are not built yet."
[click] Edit site: "Admins pick from a fixed list of site fields, set values, and show or hide each. Hidden values are kept, not deleted. We need your full list of fields."
[click] Your form: "The River Lot 56 fix. Next slide."
[click] Reports: "Archive first, then delete for good, same as sites."
[click] Map search: "Filter boundaries by type and subtype, and search by name. The search text stays when you switch back to the card view. A county filter is not built yet."
Also say: "Exporting more than 50 reports is still being verified."

Behind this slide:
- Add site: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/162, Zanab (Gamma), open, part of story https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/56 (US 2.0.2, follow-up to merged https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153). It only adds the similar-name warning: names that contain or are contained in an existing name (the shorter name needs at least 4 characters, so "Elk" does not match many sites); matching ignores case and extra spaces; the warning does not block saving; the admin check still runs first. The idea came from Alissa. Tests: 987 of 987 passed per the PR. The PR title says "suggest SAPAA map areas", but the PR body and code do not do that. Not built: acceptance test 6 (suggest sites from Frank's SAPAA map that are not in SIR-SAPAA yet) and acceptance test 1 (admin selects a boundary), which waits on the decision about linking `sites_pa` (our sites) and `protected_areas` (government boundaries). Status when I checked: two approvals (Aaron, Jayden), Chris still requested, the reviewer gate failing for that reason, and a merge conflict with `main`.
- Edit site: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/163, Zanab (Gamma), open, closes story https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/59 (US 2.0.5) and task https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/80. New `site_page_fields` table (one row per field per site: value and shown/hidden). Fixed field list today: SAPAA website, iNaturalist, designated steward. Admin-only edit; hidden fields keep their value; only http/https links are saved. Replaces the temporary links from PR #145. If the designated steward is hidden, stewards do not see that line; admins still do. Tests: 1,025 of 1,025 passed per the PR. Needs migration `20261008000000_create_site_page_fields.sql` run in the Supabase dashboard before release, otherwise the site page cannot load or save these fields in production. Status when I checked: two approvals, Chris requested, reviewer gate and diagram-push checks failing, merge conflict with `main`, labelled "large-pr".
- Your form: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/164, Abhinav (Beta), closes task https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87. See slide 15.
- Reports: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165, Jayden (Gamma). See slide 10.
- Map search: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/166, Alissa (Beta), open, "related issue" https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/60 (US 2.0.6) and task https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/85. Built: filter by Type and Subtype (with a "No Subtype" option); search matches the name and the `oc_name`; the search text stays when you go back to the card view; the popup shows more stored fields (id, IUCN class, acres, hectares, dates, notes) when present. Tests added for the filter logic, filter panel, popup and sites page; the admin sites page uses the same filter with no new test. Not built: a county filter. US 2.0.6 and Frank both asked for county, and the story's acceptance test 3 centres the map on a selected site, which this PR does not do (it filters). Status when I checked: one approval (Abhinav), Chris requested, `conventions` check failing, reviewer gate failing, 892 lines.
- Seventh item: export of more than 50 reports is unverified. Issues #66 and #90 are closed, no PR changes the export, #148 only seeds 51 inspections.
- Timing risk: the freeze is Sunday Oct 11. Two of the five (#162, #163) conflict with `main` after PR #160 merged, and #165 and #166 are large.
- IF HE ASKS about a boundary on add site: "An admin cannot yet pick a boundary when adding a site. It waits on one decision: how a site links to its government boundary. That link is also the first Sprint 3 task (Oct 16)."
- IF HE ASKS for the full field list: "Today the list has three. Please send yours and we will add them."
- IF HE ASKS why the map has no county filter: "The map data we loaded has type and subtype, and the filter was built on that. County is in your request and in our story, and it is not built yet. I'll tell you how we add it." (Open question: whether the boundary data carries a county; the repo does not say.)

## 15. Your form problem is nearly fixed

KEY LINE: "This is the problem we hit at River Lot 56."
[click] Before: "We were filling in the form, put our phones away for a few minutes while we walked, and when we opened the app again it was back on page one. The answers were still saved, but we had to click forward again."
[click] Now: "The form now remembers which page you were on and that you had accepted the steward verification message, so it reopens where you left it. If that page no longer exists, it falls back to page one. This covers the new-report form."
[click] When: "We aimed for October 6 and missed it. The fix is finished and in review today. It is in version 1.1 on October 13."

Behind this slide:
- The fix: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/164 (Abhinav, Beta), closes https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/87, which is part of story US 4.0.6 (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/63). Opened Oct 9. The draft saved in the browser now stores the answers plus the active section and the accepted-verification flag in one record. Old drafts without these still load as answers only. If the stored section no longer exists, it opens at Section 1. Cancel or submit clears the draft. Tests: 1,088 passed per the PR, including a new test (accept, go to section 2, leave, return, still on section 2 with no popup). Manual check: reload (F5) keeps the section. It changes the new-report form only (`/detail/[namesite]/new-report/`); the edit-report form is not touched.
- Status when I checked: one approval (Jayden), Alissa and Chris requested.
- Plan owner: Beta, task due Oct 6 (https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md). The Oct 2 deck gave Oct 6 as the date. It slipped to Oct 13 (inside the Oct 11 freeze if the PR merges).
- Source of the story: Frank's Oct 2 transcript has "You're filling the form, you put your phone away, you open again, you're back to square one" (said by the team). The "page six" detail appears only in the team's own Oct 2 script, not in the transcript or PR #164, so the slide no longer states it.
- Wording: the slide says "we" because the team, not Frank, hit this problem in the field in the Oct 2 account.
- IF HE ASKS whether you lose answers: "No. Your answers were always saved on the phone. What was lost was your place in the form."
- IF HE ASKS whether it works after the app is fully closed: "I don't know yet if a full close and reopen behaves the same as a reload. The test we have covers leaving and returning to the page, and a browser reload. I'll check." (Open question.)
- IF HE ASKS about the edit-report form: "The fix covers the new-report form. I'll check the edit form." (Open question.)

## 16. Sprint 3: the map you described

KEY LINE: "Sprint 3 is the map you described: where the area is and what other stewards did there."
[click] Map: "Every active site drawn with its boundary, and a View on map link from each site page. Select a site on the map to open its details."
[click] Tracks: "Stewards upload a GPX file after a visit, and it is drawn as a line on the map. GPX only, as you asked. We refuse files that are not valid GPX."
[click] Offline: "Download a map area and keep using it with no signal, on the web app. It is not in your charter, but you told us you need it."
[click] People: "Each past visit in a profile's history opens its report, and the profile shows inspection totals."
[click] Reports: "Stewards can edit their own past reports. We don't yet know whether this covers the Edit Report bug. Site pages get safety information such as the nearest hospital and known hazards. Stewards can reset a forgotten password."
Footer: "iNaturalist connection and top observations are in the Sprint 3 plan. In your charter that is a separate project, so tell us if you would rather defer it."

Behind this slide:
- All Sprint 3 stories, due Tue Oct 27 (freeze Sun Oct 25), 60 points. Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/user-stories.md. The Sprint 3 GitHub issues are created at planning on Oct 14, so no issue links yet.
- Map. US 2.0.1 (8 points), Red (Saumya, Chris): map page with all active sites and boundaries (Oct 17), "View on map" link from the site page and only the selected site highlighted (Oct 19), tracks drawn on the map (Oct 22). Acceptance tests: every active site drawn with its boundary; an uploaded track drawn as a line in a different style from the boundary; navigate from a site page to its place on the map; only the newly selected site is highlighted. It depends on US 6.0.1 (site boundary and centre point, Blue, Oct 16). US 2.0.8 (3 points), Blue: site details when a site is selected on the map (Oct 21), "View SIRs" link (Oct 22).
- Tracks. US 2.0.9 (5 points), Red: GPX table and file storage with access rules (Oct 17), upload server action (Oct 19), upload control on the site page (Oct 21). Acceptance tests: valid .gpx is saved and linked to the site and to the uploader; non-.gpx extension is refused with a message; a .gpx that is not valid GPX or has no track points is refused and nothing is saved; the stored track reads back with the same points; a file larger than the stated maximum is refused with a message naming the limit.
- Offline. US 4.0.2 (13 points, the largest story), Red. Charter mapping: "none (team request)". It is not a charter project, hence the "+" chip on the slide. Tasks: choose the tile source and offline cache (Oct 18), download an area with status (Oct 22), show tiles offline and mark missing tiles (Oct 23), live tiles when online (Oct 24). Frank said on Sept 25: "I definitely need offline capability, but on the web app." Whether the hosted Protomaps service permits saving tiles offline is unconfirmed (slide 7).
- People. US 1.0.3 (2 points) and US 1.0.4 (2 points), Green (Alissa, Jayden).
- Reports and access. US 4.0.4 edit my previous inspections (5 points), Blue, Oct 19 to 23; edits are limited to the author, checked on the server. US 2.0.11 safety information (5 points), Blue: Admin-only write access, empty values shown as "not recorded", Oct 17 to 21. US 5.0.2 reset a forgotten password (2 points), Green, Oct 17 to 20; no admin step.
- iNaturalist. US 4.0.5 (5 points) and US 4.0.7 (5 points), Green, in the Sprint 3 plan, charter project 3a. Nothing in the repo says Frank must opt in. The slide offers deferral. If Sprint 3 falls behind at the Oct 20 midpoint, 4.0.7 moves to Sprint 4 first, then 4.0.5. (Last week's script said "Project 4"; the stories document says 3a.)
- IF HE ASKS where GPX is: "It is Sprint 3. Nothing is built yet. First the storage table (Oct 17), then upload with validation (Oct 19), then the upload button on the site page (Oct 21), then drawing the track on the map (Oct 22)."
- IF HE ASKS about messy GPX files such as the one from your handheld with the run to Dairy Queen: "Our first version only checks that the file is valid GPX with track points. Trimming the stray part is not in the Sprint 3 tests. You told us to start with the simple files and move to the ugly ones. Do you want trimming this term?" The team notes record a "scissor" tool idea from Chris. (Open question.)
- IF HE ASKS about FIT or KML uploads: "GPX only for now. On Oct 2 you asked us to log an enhancement to accept or convert other formats. I'll confirm it is in your BFE list." (Open question: the BFE file is not in the repo.)
- IF HE ASKS what the Edit Report bug is: "I don't know, I'll find out. We could not find the description in your list. It was Harveer's item. Our story 4.0.4 lets a steward edit their own past report, but we don't know if that is the same thing. You did not have a description on Oct 2; we said we would ask Harveer." Background: the edit-report page already exists in the app (the sign-out fix in PR #158 touches it). Harveer Deol is on the Winter 2026 team (archive section of the project plan).
- IF HE ASKS why offline when it is not in the charter: "You said on Sept 25 you definitely need it on the web app. We rated it 'team request' because it is outside the charter. It is also our biggest story at 13 points, so tell us if you would rather we cut it."
- IF HE ASKS about mobile: "The app is set up so it can be reused in a mobile app later. No mobile work this term." (From the Oct 2 transcript.)

## 17. The map, in your four layers

KEY LINE: "Last Friday you split the map into four layers. Here is where each one stands."
[click] Base map: "Working today."
[click] Boundaries: "The government polygons are on the map now. Linking each of our sites to its polygon is the first Sprint 3 task, due October 16."
[click] History: "GPX tracks are Sprint 3."
[click] Data views: "Later. Today we are working on layers one and two, and next on three."
Footer: "You told us the 2023 government data leaves out one natural-area type, that it is fine for testing, and that you have the 2021 version for go-live. We would like that file."

Behind this slide:
- Frank's layers on Oct 2: base map, static layer (the polygons), history layer (GPS devices; his files), and a data visualization / communication layer. Frank corrected the team on which files belong to which layer: the GPX files he sent belong to the history layer (the third), not the data visualization layer (the fourth). Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/meetings/week5/2026_10_02%20_meeting_Frank.txt
- Base map: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159. Boundaries: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161 and the import work in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/132, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152. The boundaries are government protected-area polygons from the `protected_areas` table. PR #161 says that table and `sites_pa` (our sites) "remain disconnected", and PR #159 says sites do not plot markers. Linking to sites: Blue (Aaron, Zanab, Abhinav), US 6.0.1 acceptance tests 1 and 2, Oct 16; matching and the unmatched-site list Oct 18; geocoding cache Oct 19. History: Red (Saumya, Chris), US 2.0.9 and US 2.0.1. Data views: nothing planned; Sprint 4 has activity points and priority scores, which are not map views.
- Frank's words on the missing type: in the 2023 open data "they have removed one type of natural area called a protective notation"; "you can no longer get from the Alberta government the 2021 version... I have the 2021 version." He said 2023 is fine for testing and development, but the 2021 version is needed for go-live. The import code has a field for "notation" placemarks with status codes (for example CNT and PNT; PR #152). Whether those are the same type Frank means is an open question.
- IF HE ASKS about "every site plotted" from last week: "On Oct 2 we planned for every site to be plotted on the map by Oct 6. That did not happen. What is on the map is the government boundaries, not our sites. Our sites have no location data yet, so plotting them depends on linking each site to its boundary and centre point, due Oct 16." Evidence: last week's deck listed "Every site plotted on the map (#84)" for Oct 6; issue https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/84 is closed by PR #161, which draws boundaries only. Backlog item 7 ("Add real coordinates to sites") says "Sites still have no coordinates" as of Oct 7.
- IF HE ASKS which type is missing: "The transcript says 'protective notation'. I'll confirm the exact name from your 2021 file."
- IF HE ASKS what polygons are on the live site today: "None yet. The live database has no boundary data until an admin uploads the government file through the Admin Sites page and the migrations are run. On the practice copy, the shapes are loaded." (Open question: whether production has any rows; the add-site PR said `protected_areas` had no rows as of Oct 7.)
- IF HE ASKS who our GIS contact is: Open question. Frank offered the introduction ("I am offering you a gift of access to someone who is in industry"); Saumya asked him to send the contact by the end of the meeting; his preferred method is LinkedIn.

## 18. Where we are on the calendar

KEY LINE: "Sprints matter to Mark. For you they are just a calendar of release dates."
[click] Sprint 1 is done (Sept 29, discovery and planning).
[click] Sprint 2 ends Tuesday October 13 with version 1.1.
[click] Sprint 3 ends October 27: maps and history.
[click] Sprints 4 and 5, November 17 and December 1, are deliberately light so there is room for your requests, and Sprint 5 also covers fixes from the December field test.
Footer: "Sprint 2 ends Tuesday. Sprint 3 starts the next day."

Behind this slide:
- Dates: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md (Milestones). Sprint 1: Sept 29. Sprint 2: Oct 13 (freeze Oct 11). Sprint 3: Oct 27 (freeze Oct 25). Sprint 4: Nov 17 (freeze Nov 15). Sprint 5: Dec 1 (freeze Nov 29). All releases are at 20:00. The client field test is in early December.
- Mark: the course instructor who marks the project; Frank said on Oct 2: "let's make Mark's life easy" and that dates "are Sonya and I who can really control", meaning he and Saumya negotiate dates between the course sprints and the end state.
- Footer detail: Sprint 3 work starts after the Oct 14 demo and planning, not on Oct 14 at midnight. The plan says the "sprint starts on October 14".
- Points per sprint in the plan: Sprint 2 committed 63; Sprint 3 60; Sprint 4 29; Sprint 5 30 estimated with no stories. Frank has not seen these numbers.
- IF HE ASKS why Sprint 3 has 60 points when Sprint 2 reached about half: "Sprint 2 spent its first week on setup tasks that carry no points. Sprint 3 is the risky one; if we are behind on Oct 20 we move iNaturalist work to Sprint 4." Source: velocity re-estimate in the project plan (as of Oct 7).

## 19. Sprints 4 and 5 are still yours

KEY LINE: "Both sprints start with your new requests."
[click] Sprint 4: "Whatever you bring us first. Then activity points, a priority score for which sites most need a visit, a one-click download of every photo and file as a backup, and summary charts across all reports. Image Extract is on your list, so we can move it earlier if you want."
[click] Sprint 5: "Your requests, fixes from the field test, and handover notes for the next team."
Footer: "You said you would flesh out version 3.0 in October. If we finish early we want to start on it."

Behind this slide:
- Sprint 4 stories in the plan (29 points): US 1.0.5 earn points (5), US 2.0.12 score a site for to-visit priority (8), US 2.0.13 flag site points a year old (3), US 3.0.3 export all digital files (8), US 7.0.3 all-inspections summary (5). The summary (7.0.3) shows report counts per site, per steward and per reason for the visit, plus the spread of naturalness scores, with a date range; that is why the slide says "summary charts". Sprint 5: no stories planned; capacity of about 30 points held for new requests, carry-over, deployment and field-test fixes. Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/user-stories.md
- "Image Extract" is taken to be US 3.0.3 (extract all images and other digital files at once, as a zip). That mapping comes from last week's script; Frank's BFE file is not in the repo. Last week's script also called it "your priority 3"; I could not verify that, so the slide no longer says it. Open question.
- Frank on Oct 2: "what I will commit to in October is to better flesh out in my mind's eye version three. It is on the student site."
- IF HE ASKS what activity points are: "Points for visiting sites and contributing photos, so stewards have a reason to visit more natural areas (story 1.0.5). We need you to say which actions earn points."
- IF HE ASKS about priority score: "An admin gives each site points for abuses, biological imperatives and time since last visit, and the app combines them (story 2.0.12). A reminder flags points a year old (story 2.0.13)."

## 20. Five things we need from you

KEY LINE: "Five things, and your decisions on the last section."
[click] 1: "Your 2021 boundary file. The government's 2023 data leaves out one natural-area type, and you have the 2021 version."
[click] 2: "Your full list of site-page fields. Admins can show, hide and edit fields from a fixed list. Today it has three: SAPAA website, iNaturalist and designated steward. We add yours."
[click] 3: "The Edit Report bug. We could not find its description on your list. Can you share it, or may we ask Harveer?"
[click] 4: "Your GIS contact. We will reach out on LinkedIn, as you suggested."
[click] 5: "iNaturalist import is in the Sprint 3 plan. Do you want it this term, or should we defer it?"
Footer: "And your answers on the map, the release plan and deleting."

Behind this slide:
- 1: Needed before go-live. Frank said the 2023 data is fine for testing and development, and that he has the 2021 version. The Sprint 3 test is that the site geometry equals the source the website uses (US 6.0.1 acceptance test 1).
- 2: The field list lives in `lib/sitePageFields.ts` in PR https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/163 (Zanab). Adding yours is a code change, not a database change.
- 3: Harveer Deol was on the Winter 2026 team. On Oct 2 Saumya said the BFE has an "edit report bug fix" item whose description the team cannot find, and that the team would have to nag Harveer. Frank did not provide the description; he said they had run out of time and would do the BFE later ("I left you a couple of those to frustrate you"). We do not know whether US 4.0.4 (edit my previous inspections) covers the bug.
- 4: Frank offered the contact ("I am offering you a gift of access to someone who is in industry"). Saumya asked him to send it by the end of the Oct 2 meeting. Frank's preferred method of contact is LinkedIn. Open question: whether the contact was sent.
- 5: US 4.0.5 and US 4.0.7 are in the Sprint 3 plan (charter project 3a). Nothing in the repo says Frank has to opt in. If he defers, they move out of Sprint 3.
- Decisions: map and cost (slide 7), release plan (slide 8), scoreboard first pick (slide 9), suppress as its own level (slide 10).
- IF HE ASKS what happens if he does not send the 2021 file: "We use the 2023 data for testing and development. It is missing one type, so it cannot go live as is."

## 21. Questions from the team

KEY LINE: "This is the team's turn to ask."
Each team member asks Frank one question. If the room is quiet, backups:
- "Should a site have one designated steward, or several?"
- "Reports of an archived site stay visible with an Archived label. Is that what you want?"
- "Who should review our testing and release plan for charter Project 2a?"
- "Which of the four scoreboard items do you want first?"

Behind this slide:
- One steward per site is how the tables are built today (the site is the key of `site_stewards`; assigning a new steward replaces the old). Source: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131. Changing it to several stewards is a database change.
- Reports on an archived site: they stay in the database and are listed on the All Reports page (`/reports`) with an Archived label, but not linked to the site page (PR https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160).

## 22. Today in one slide

KEY LINE: "Three columns: what changed, what's next, and what's coming."
[click] This week: "Version 1.1 is nearly built, the map shows the government boundaries, and every site can name its steward."
[click] Next week: "We release version 1.1 on Tuesday, link every site to its boundary, and start the scoreboard."
[click] Coming up: "Maps and history on October 27, your requests in November, and the field test in December."

Behind this slide:
- This week: slides 4 and 5. Next week: slides 12 and 13. Coming up: slides 16 to 19.
- "Nearly built": five open pull requests, one unverified item (export of more than 50 reports), and two add-site acceptance tests not built.
- "About 30 code changes": see the range under slide 4.
- "Link every site to its boundary" in the spoken line is the Sprint 3 goal; the Oct 16 task is the first step and matching finishes by Oct 18 (slide 12).
- IF HE ASKS what "start the scoreboard" means: "Totals on every profile (story 1.0.4, due Oct 19). The points come in Sprint 4."

## 23. Round table

Frank picks the order; Saumya speaks last. Three sentences each, at most.
Saumya's last word, about 20 seconds: "Version 1.1 goes out on Tuesday. Next we link every site to its boundary and start the scoreboard. We need your 2021 boundary file, your list of site-page fields, and your answers on the map, the release plan and deleting."

Behind this slide:
- On Oct 2, Zanab said the team should explain why it chooses what it chooses, and Frank agreed strongly. Give the reason first, then the decision.
- On Oct 2 Frank asked Chris whether the presentation had improved on the week before. Open question: whether to ask Frank for the same feedback today.

## 24. Backup: Sprint 2, where each story stands

Use only if asked where a specific Sprint 2 item stands. Counts: 10 stories merged, 3 partly merged, 2 in review, 1 being verified (16 in all).

Behind this slide: row by row.
- Steward profiles (US 1.0.1, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/54): merged. PRs https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/141, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/142. Alpha. No test yet for acceptance tests 2 and 5, per the project plan.
- Edit your own profile (US 1.0.2, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/55): merged. PRs #138 and https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151. Alpha. No test yet for acceptance test 5.
- Steward named on each site (US 3.0.2, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/62): merged. PRs #133, #134, #139, #140. Alpha.
- Admins add a site (US 2.0.2, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/56): partly. Merged PR #153 covers acceptance tests 2 to 5. Open PR #162 adds the similar-name warning only. Acceptance tests 1 (select a boundary) and 6 (SAPAA-map suggestions) are not built. Gamma.
- Deactivate and reactivate a site (US 2.0.3, https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/57): merged. PR #150 (Jayden). Hidden from pickers and search; inspections still viewable; admin can toggle. This is the existing level close to "suppress".
- Archive, restore, delete a site (US 2.0.4, #58): merged. PR #160 (Jayden).
- Edit a site (US 2.0.5, #59; task #80): in review. PR #163 (Zanab). Gamma.
- Links on site pages (US 2.0.10, #61): merged. PR #145 (Zanab). Links are temporary until #163.
- Map with county filter and search (US 2.0.6, #60; tasks #83, #84, #85): boundaries merged (PRs #159, #161); type filter and name search in review (PR #166); no county filter yet. Beta.
- Photo ID optional and form keeps its page (US 4.0.6, #63): partly. Photo ID: PR #147 (merged). Form: PR #164 (in review).
- Sign out from every page (US 5.0.4, #64; task #94): merged. PRs #120 and #158. Alpha. PR #158 adds a guard for acceptance test 2 (Back button after sign-out). I did not check whether acceptance test 1 (reopening the app after sign-out shows the sign-in page) has a test.
- Stewards export their own reports (US 7.0.1, #68): merged. PR #155 (Chris).
- Delete a photo (US 7.0.5, #65; task #89): merged. PR #148 (Chris). No test yet for acceptance test 4 (deactivating a report keeps its image files), per the project plan.
- Hide private fields on export (US 7.0.7, #67; task #91): merged. PR #146 (Alissa). No test yet for acceptance test 3.
- Export more than 50 reports (US 7.0.6, #66; task #90): being verified. Issues closed, no pull request changes the export; PR #148 only seeds 51 inspections. Gamma.
- Delete a report (US 7.0.8, #69; task #93): in review. PR #165 (Jayden). Gamma.
- The project plan on main is dated Oct 7 and has not yet been updated for #158, #159, #160 and #161: https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md#sprint-2-status-as-of-october-7-2026
- IF HE ASKS how many points are done: "As of Oct 7, 30 of 63 points were done by the plan's strict rule (merged and every acceptance test covered). Since then PRs #158 and #160 merged. I'll give you the updated number after the freeze."

## 25. Backup: Sprint 3, what you get and when

Use only if asked. Footer: "Freeze Sunday, Oct 25. Release Tuesday, Oct 27. iNaturalist rows can be deferred."

Behind this slide:
- Source: Sprint 3 plan in https://github.com/UAlberta-CMPUT401/F26project-SAPAA/blob/main/docs/project-management.md. The "Built" dates are the first and last due dates of the tasks for each story.
- Sites linked to government boundaries, Oct 16 to 19 (US 6.0.1, 5 points, Blue): the link and centre point Oct 16, matching and unmatched list Oct 18, geocoding cache Oct 19. All sites and boundaries on one map, Oct 17 to 22 (US 2.0.1, 8, Red). Open a site's details from the map, Oct 21 to 22 (US 2.0.8, 3, Blue). Upload a GPX track, Oct 17 to 21 (US 2.0.9, 5, Red). Offline and online map layers, Oct 18 to 24 (US 4.0.2, 13, Red; "+" chip, a team request outside the charter). Past inspections open from profile history, Oct 17 to 20 (US 1.0.3, 2, Green). Activity totals on each profile, Oct 19 (US 1.0.4, 2, Green). Edit my previous inspections, Oct 19 to 23 (US 4.0.4, 5, Blue). Safety information on each site, Oct 17 to 21 (US 2.0.11, 5, Blue). Reset a forgotten password, Oct 17 to 20 (US 5.0.2, 2, Green). Connect iNaturalist and pick photos, Oct 20 to 23 (US 4.0.5, 5, Green, charter 3a). Top iNaturalist observations on a site, Oct 21 to 23 (US 4.0.7, 5, Green, charter 3a).
- Points by team: Red 26, Blue 18, Green 16 (60 in all).
- The 3a rows are in the plan. The slide offers to defer them if Frank prefers.
- IF HE ASKS why the map is split across teams: "Red has the map, GPX tracks and offline layers because they are one connected piece of work. Blue does the boundary link and site details; Green does profiles, password reset and iNaturalist."

---

## Things to check before the meeting

Database and release
1. Production migrations must be run by a person in the Supabase dashboard before or right after the release. List, from the PRs: the `W26_` rename `20261003000000_remove_w26_prefix.sql` (PR #129; production still has the old tables; PR #129 says the Sprint 2 release breaks the live app unless this runs right after deploy, after the `W26` inventory query), the user model `20261004000000` (PR #131, after the rename), `20261004010000_create_protected_areas.sql` (PR #132, after the rename), `20261005000000_profile_distinct_site_count.sql` (PR #138; without it the profile page returns an error), `20261005010000_create_socials.sql` (PR #142), `20261005020000_gallery_read_policies.sql`, `20261006000000_create_kml_imports_bucket.sql` and `20261006010000_alter_protected_areas_for_kml_import.sql` (PR #152), `20261008164223_delete_site.sql` (PR #160), and from the open PRs `20261008000000_create_site_page_fields.sql` (#163) and `20261009000000_archive_site_inspection_reports.sql` (#165). Note #163's migration number is older than #160's although it merges later. Open question: who runs them, in what order, and who at SAPAA has dashboard access ("with your admin" on slide 13).
2. The live map needs `NEXT_PUBLIC_PROTOMAPS_API_KEY` set in the production environment (Vercel) at build time; without it the map shows a setup card. The hosted Protomaps API's cost, non-profit terms and offline-caching terms are unconfirmed (slide 7 says so). Boundaries also need the KML/KMZ uploaded once through Admin Sites by an admin; production has no boundary rows as far as the repo shows.
3. No staging environment exists (issues.md item 25 is open). The old line "tested on the practice copy before it goes live" is gone from slides 8 and 12. The script now says "reviewed by two teammates plus automatic checks". Do not say "tested on a copy first". The practice copy runs on laptops.
4. Release timing: the plan has Gamma releasing on Oct 12, with Oct 13 as spare; the slide says released by 8 p.m. on Oct 13. The Oct 11 freeze is a Sunday. Five PRs are still open, two conflict with `main` (#162, #163), and every open PR fails the reviewer gate (waiting for approvals). #163 also fails the diagram-push check (the diagram bot needs an admin to add `DIAGRAMS_APP_ID` and `DIAGRAMS_APP_KEY`, per PR #157). #165 has no reviews and 1,725 added lines. #166 fails the `conventions` check.
5. Sprint dates are 14, 14, 21 and 14 days apart (Sept 29, Oct 13, Oct 27, Nov 17, Dec 1). Say "every sprint, two to three weeks apart", not "every two weeks". I found no evidence of a survey of other teams' release practice, only Chris's Oct 2 promise of a proposal. The script does not claim a survey.

Plan versus implementation
6. The Sprint 3 plan in docs says "Use Leaflet, which is already in `webapp/package.json`" for the map page (Red task, US 2.0.1). The app already uses MapLibre and Protomaps (PR #159). The architecture diagram and the sequence diagrams for US 2.0.1/2.0.6 and US 4.0.2 also still say Leaflet. Leaflet remains only for the inherited admin heatmap. Fix the plan, or Frank will see two answers. The Oct 18 task "Choose the tile source" is half decided already; what is really open is the offline cache, hosting cost and terms.
7. The project plan on main is dated Oct 7. It still lists 2.0.4 and 7.0.8 "not started", 2.0.6 "in progress" with no map page, and 5.0.4 "partial". It does not yet mention #158 to #161. The links in this script point to it.
8. Add-site: PR #162 only adds the similar-name warning. Its title says "suggest SAPAA map areas" but the body and code do not. Acceptance tests 1 (select a boundary) and 6 (SAPAA-map suggestions) are not built. Slide 14 now says so.
9. Map filter: US 2.0.6 and Frank both asked for county. PR #166 filters by type and subtype and searches by name; it does not centre the map on a selected site either. No county filter is in any PR. Slides 14 and 24 now say "no county filter yet".
10. Map content: the boundaries are government protected-area polygons, not our sites. PR #161 says `protected_areas` and `sites_pa` "remain disconnected"; PR #159 says no site markers. Task #84 "Add sites to the map" is closed, but only boundaries are drawn. Slides 4, 5, 17 and 22 now say "government boundaries". The Oct 2 deck promised "every site plotted" by Oct 6; that did not happen. The answer is under slide 17.
11. Version 1.1 is "nearly built", not built: the five PRs, export of more than 50 reports unverified (issues #66 and #90 are closed with no PR; #148 only seeds 51 inspections; I found no code or note for the warning message we promised last week), add-site acceptance tests 1 and 6 not built, and the "Invalid Identifier" task #72 was closed by PR #128, which fixed a local-only relationship-name error ("the live database already uses the correct name"). I did not find evidence that the hyphen problem that stopped Frank's tool was tested end to end.
12. Site links on site pages are temporary (same two home pages for every site) until #163 merges. If #163 slips, say so.
13. "Hide private fields before export" (slide 5) hides admin-chosen form questions at export time; answers are not stored as non-public. Slide wording "private fields like email and phone" came from last week. I did not verify that email and phone are form questions.
14. Slide 25 shows boundary linking running Oct 16 to 19, while slides 12, 13, 17 and 20 say the first task is due Oct 16. Only the first step (link and centre point, acceptance tests 1 and 2 of US 6.0.1) is due Oct 16; matching and the unmatched-site list is Oct 18, geocoding cache Oct 19. The link task belongs to Blue, not Red.

Content that depends on a decision or an unknown
15. Scoreboard: US 1.0.4's acceptance tests cover only inspection count and "activities reported". The mockup's counties, site variety and first-on-site are in no story. County data may be incomplete (backlog item 43 is open). The footer says "the counts use data we already store". "First on site" is our reading of "who was the first contributor"; the slide asks Frank.
16. Deleting: Jayden asked and Frank answered "two levels, maybe three: suppress, archive, nuke". Deactivate/Reactivate (US 2.0.3, #150) already exists and is close to suppress. "Delete for good" also removes the site's steward assignment; reports, answers and photos stay with no site; reports of an archived site stay visible with an Archived label on the All Reports page (PR #160). The cascade decision (what happens to reports of a deleted site) was never formally agreed with Frank; the plan lists it as an open conflict and my review of PR #160 asked for the agreement to be linked.
17. The Google claim (slide 7) is Chris's reading on Oct 2 (transcript around lines 497 to 508) of terms that never state offline tile caching is allowed; the team notes cite the two Google terms pages. Have the clause open. Google non-profit pricing has not been checked. Frank asked for a comparison of several options with a confidence level and a designated questioner; slide 7 admits the comparison is not finished, so expect pushback. Alissa asked Frank on Oct 2 whether the team could send the map proposal over the weekend; I found no record that it was sent.
18. Footer count on slide 4: "about 30 code changes". From the PR list: 41 PRs merged after 20:00Z on Oct 2, of which 30 are feat, fix or refactor; 36 PRs after 23:00Z, of which 28. The cut-off depends on when the Oct 2 meeting ended, which the repo does not record. The slide says "including 6 fixes" (6 fix PRs in both cuts). Do not say "23 new features".
19. Terms: "Supaview" is our spelling of the tool Frank calls "Superview" in the transcripts. Confirm the spelling and what the tool is. "Project 3" for iNaturalist (this deck, and the stories list "3a") differs from last week's script, which said "Project 4". "Page six" was dropped from slide 15: it appears only in the team's own Oct 2 script.
20. Items Frank asked for on Oct 2 that have no evidence of progress in the repo: add a BFE enhancement for non-GPX formats (convert FIT or KML to GPX); make contact with the GIS person (Frank offered, Saumya asked him to send it, LinkedIn preferred); chase Harveer for the Edit Report description (Frank did not offer it, Saumya said the team would nag Harveer); name a person on the team to challenge the map recommendation; bring a gamification flow, not only a mockup. His sample GPX files (clean, slightly dirty with the 30 km/h run, very messy) are not in the repo, and Sprint 3's US 2.0.9 tests do not cover dirty tracks.
21. River Lot 56 (slide 15): the target was Oct 6 and it slipped to the Oct 11 freeze; PR #164 covers the new-report form only, not the edit-report form. Whether a full app close behaves like a reload is untested.
22. Offline maps (US 4.0.2) are "none (team request)" and not a charter project; slide 16 and slide 25 mark it with a "+" chip. iNaturalist (US 4.0.5, 4.0.7, charter 3a) is in the Sprint 3 plan and nothing in the repo says Frank must opt in; the slides offer deferral, they do not ask for permission.
23. Edit Report bug: we do not know if US 4.0.4 covers it. Slide 16 says "We don't yet know".
24. Test gaps in done stories: US 1.0.1 acceptance tests 2 and 5 and US 1.0.2 acceptance test 5 (Alpha); US 7.0.5 acceptance test 4 and US 7.0.7 acceptance test 3 (Beta). Per the project plan.
25. GitHub states still do not match the work: issues #59, #60, #69, #80, #85 and #87 are open (correct, PRs in review); #66, #90, #81, #93 are closed with no matching work; #56 and #79 are closed although add-site acceptance tests 1 and 6 are not built; #64 and #94 are closed, and the plan has not been updated for PR #158.
26. Oct 14 on slide 13 is a course lab (demo, review, retrospective), not a meeting with Frank. Say "the team demo", not "your demo".
27. Slide 19 says Sprint 5 covers "handover notes". The plan lists "final polish, deployment and field-test fixes". Keep consistent with the plan if Frank asks. "Your priority 3" for Image Extract was dropped because I could not verify it.
