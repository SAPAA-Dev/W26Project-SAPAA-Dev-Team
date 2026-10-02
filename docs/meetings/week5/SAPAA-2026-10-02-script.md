# SIR-SAPAA weekly update, Fri Oct 2, 2026: talk track

Rules for Frank: one idea per slide, lead with the key line, business words, charter project first, short answers. Say "I don't know, I'll find out" when you don't know.

## 1. Title

[Under 15 seconds.]
"Good afternoon, Frank. Two things today: what we did this week, and what we'll do next week. Everything ties to your charter."

## 2. Agenda

"Last week you asked us to tie everything to your charter and keep it simple. So today is two things."
[click] "What we did this week."
[click] "What we'll do next week."
[click] "Then a quick look at our sprint plan, questions from the team, and a summary."

## 3. Charter

KEY LINE: "This is your charter, straight from your website. Every slide today ties back to these four projects."
"Project 1 is version 1.1: your fix list and a safer app. Projects 2a, 2b and 2c are version 2.0: a proper testing setup, people, and maps."
(Each project name on the slide links to its section of the charter, if Frank wants to open it.)

## 4. Project 2 explained

KEY LINE: "Version 2.0 is three projects in your charter."
[click] 2a, development environment: "A safe place to build and test, and a release process the next student team can pick up. Your charter asks us to review it with former students and industry experts."
[click] 2b, person management: "One record for every steward. Today's accounts move onto it, and it becomes the base for profiles and, later, simple rewards."
[click] 2c, map management: "A low-cost map that will last, using the same boundaries as your website, plus a plan for reusing it in a mobile app later."

## 5. Section 1

"First: what we did this week."

## 6. This week

KEY LINE: "Each line is one of your charter projects."
[click] Project 1: "We went through your whole fix list. Every one of the 20 items has a plan and a date."
[click] Project 2a: "We built a practice copy of the app that runs on a laptop with test data. We can try things without touching real stewards' reports. Last time, test reports ended up in the live data, which is item F002 on your list."
[click] Project 2b: "We designed the steward profile: one record per steward, including stewards who never log in, so the older history can come in later."
[click] Project 2c: "We re-planned the map the way you described it: where the natural area is, and what other stewards did there."

## 7. 2b detail

KEY LINE: "This is the design behind steward profiles."
[click] "One 'people' table, with one row per person. A person can have a login or not, so older stewards from the legacy list can come in later with their history."
[click] "Each profile holds a name, contact details, skills like birding or sedges, focus areas, and a points counter for simple rewards later."
[click] "A 'site stewards' table names the steward for each site. Only admins can change it."
[click] "To move over, we copy today's accounts into the new table. Nothing in the existing tables changes, so no data can be lost."
"The tables are built by October 4 and accounts moved by October 5. Owners: Saumya and Aaron."

## 8. 2c detail

KEY LINE: "On September 25 you told us how the map should work. Here's what we changed."
[click] "You said it doesn't have to be Google Maps. We'll recommend a low-cost, open map such as OpenStreetMap."
[click] "You said the shapes must come from the same source as the website. Site boundaries will come from that source (Sprint 3)."
[click] "You said the map should show what others did there. Each site will show its past visits and GPS tracks (Sprint 3)."
[click] "You said to start with GPX uploads, with no tracking on the phone. We wrote one GPX upload story for Sprint 3. KML and FIT can come later."
[click] "You said you need offline, but in the web app. Offline map layers are planned for the web app in Sprint 3."
"This sprint: the map is set up, every site is plotted, and you can search by county, all by October 7."

## 9. Fix list in numbers

KEY LINE: "Half of your list is fixed by October 13."
"Your list has 20 items."
[click] "Ten are fixed by October 13, in version 1.1."
[click] "Why not the other ten yet? Two are already done: photos in reports, and the ghost users, which we're double-checking. Six are bigger features that build on this sprint's work: the full map, GPS tracks and safety information in Sprint 3, then site points, steward rewards and the download-everything backup in Sprint 4. Two need more detail first: the Edit Report bug, where we're waiting on Harveer's description, and bringing user management into the app."
IF HE ASKS about the 50-report limit: "That was fixed in July. We're adding the warning message you asked for."

## 10. On site

KEY LINE: "This is the problem we hit with the app when we were on site with you."
"Some of us filed our reports at River Lot 56, and the rest are finishing theirs."
[click] "You were showing us how you fill in the form, and you put your phone away for a few minutes while we walked."
[click] "When you opened the app again, it opened on the first page of the form."
[click] "Everything you'd entered was still saved, but you had to click forward to page six to carry on."
[click] "The fix: the form will reopen on the page you left. That's GitHub issue #87, owners Abhinav and Alissa, due October 6."

## 11. Section 2

"Second: what we'll do next week."

## 12. Next week

KEY LINE: "Same four projects. Here's next week."
[click] Project 1, three fixes:
- "Authentication checks. We go through every admin page and admin action and make sure the server itself confirms the person is allowed. Today a regular user with some know-how could give themselves admin rights. Closed by Sunday, October 4. Owners: Abhinav and Alissa." (The asterisk on the slide points to this review.)
- "Sign-out. After signing out, the app could sign you straight back in with the wrong Google account. Fixed by October 5. Owners: Saumya and Aaron."
- "The form page. The form keeps your page when the phone sleeps, the issue from River Lot 56. October 6. Owners: Abhinav and Alissa."
[click] Project 2a: "From this sprint, every change is built on its own branch and reviewed by two teammates, and all work is frozen two days before release, so stewards only get tested work. Branch setup is due October 4 (Chris, Jayden and Zanab). The freeze is October 11."
[click] Project 2b: "Steward profiles. You said a profile should tell you who the birder is, who knows sedges, who the historian is. So skills and interests are on it. Owners: Saumya and Aaron."
[click] Project 2c: "A first, basic version of the map. Timing, so it's clear: in Sprint 2, due October 13, the map is set up, every site is plotted, and you can search and filter by county. In Sprint 3, due October 27, you can open a site's details from the map, see its boundary, past visits and GPX tracks, and use offline map layers when there's no signal. Owners this sprint: Abhinav and Alissa."

## 13. Next meeting

KEY LINE: "Everything on this slide is due before we meet next Friday."
[click] Oct 4: "Authentication checks on every admin page and action (Abhinav, Alissa, GitHub #71). The Supaview fix, proved on a test copy of the database (Saumya, Aaron, #72 and #73)."
[click] Oct 5: "Sign-out fix (Saumya, Aaron, #94). The photo identifier becomes optional (#88). Admins can add a site (#79). The map is set up (#83). Today's accounts move onto profiles (#75)."
[click] Oct 6: "The form keeps your page (#87). Steward profile page (#76). Every site plotted on the map (#84). Admins can edit (#80), retire and restore (#82), or delete a site (#81)."
[click] Oct 7: "The steward shown on each site page (#77). Edit your own profile (#78). Search the map by county (#85). Website and iNaturalist links on site pages (#86). Delete photos (#89) and reports (#93). Stewards can export their own reports (#92)."
[click] Oct 9: "Export more than 50 reports at once (#90), and hide private fields like email and phone before export (#91)."
[click] "All of it is frozen on October 11 and reaches stewards in version 1.1 on October 13. Supaview's live database switches over with your admin after the release."

## 14. Sprint calendar

KEY LINE: "We know sprints matter more to Mark than to you. They're a useful common calendar, so here's ours."
[click] Sprint 1, done September 29: "Discovery and planning. We learned the system, met you, wrote the plan, and turned your fix list into work items."
[click] Sprint 2, due October 13 (all work in by October 11): "Version 1.1. Next slide."
[click] Sprint 3, due October 27 (work in by October 25): "Maps and history."
[click] Sprint 4, due November 17, [click] and Sprint 5, due December 1: "We kept these light on purpose. You mentioned you'd likely have more for us, so this is room for your requests. Sprint 5 also covers fixes from the December field test."
[click] (summary line)

## 15. Sprint 2

KEY LINE: "Sprint 2 is version 1.1: mostly your fix list."
[click] Safety: "We finish the authentication checks, fix sign-out and the form page, and get Supaview connecting again."
[click] Sites: "Admins can add a site, edit its details, retire it, or delete an empty or duplicate one. Every site page also gets links to its SAPAA web page and iNaturalist."
[click] Reports and photos: "Admins can delete a test or duplicate report. Before exporting a PDF, they can hide private fields like email and phone. Stewards can download their own report as a PDF. Bulk export works past 50 reports, with a warning for very large exports. The photo label becomes optional, and photos can be deleted cleanly."
[click] People: "Steward profiles with skills and interests, stewards can edit their own, and each site page names its steward, linked to their profile."
[click] Maps: "The map is set up, every site is on it, and you can search and filter by county."
Deadline: all work is in by Sunday, October 11, and the release is Tuesday, October 13.

## 16. Sprint 3

KEY LINE: "Sprint 3 is the map you described: where the area is, and what other stewards did there."
[click] Maps: "Each site's boundary, from the same government shapes your website uses. Open a site's details from the map. See past visits and the GPX tracks stewards upload. We start with GPX only, as you asked."
[click] Offline: "Map layers that keep working when there's no cell signal."
[click] People: "Each profile shows that steward's inspection history and a few simple totals."
[click] Reports: "Stewards can edit their own past reports. We think this covers the Edit Report bug, and Harveer's notes will confirm it. Site pages get safety information: nearest hospital and known hazards."
[click] Access: "Stewards can reset a forgotten password themselves."
Also planned for Sprint 3: iNaturalist photo import and top observations on site pages. In your charter that's Project 4, so we'll only build it if you want it this term.
Deadline: work in by Sunday, October 25; release Tuesday, October 27.

## 17. Sprints 4 and 5

KEY LINE: "Both sprints start with your new requests."
"We know you don't follow sprints. For us they're a way to keep track, and for you a way to know roughly when each feature will be ready."
[click] Sprint 4, November 17: "First, whatever new features you bring us. Then simple activity points for stewards, a priority score for which sites most need a visit, a one-click download of every photo and file as a backup, and a summary of all reports. Your Image Extract item is your priority 3, so we can move it earlier if you'd like."
[click] Sprint 5, December 1: "Your new requests, fixes from the field test, and handover notes for the next team."


## 18. Why light

KEY LINE: "Room for you, and the core done early."
[click] "You mentioned you'd have more for us as the term goes on, so Sprint 4 is light and Sprint 5 is almost empty. That's where your requests go."
[click] "And we're putting the core work, version 1.1, profiles and the map, into Sprints 2 and 3, so it's done as soon as possible and has time to settle before the December field test."
[click] "And if we finish early, we'll start on version 3.0 from your charter, Project 15: managing site information. That means updating site content, adding fields from a central list and retiring old ones, such as the designated steward and website links. It's the vision you shared with us on the field trip. Sprint 2 already makes a start with editing sites, site links and a steward on each site."

## 19. Team questions

KEY LINE: "This is the team's turn to ask."
Each team member asks Frank anything they need, based on what we covered. Keep each question to one sentence.
If the room is quiet, possible questions:
- Should a site have one designated steward, or can it have several?
- When a site is deleted, what should happen to its reports and photos?
- Who should we review our testing and release plan with (charter Project 2a)?
- Is iNaturalist photo import something you want this term? (In the charter it's Project 4.)
- Could Harveer share his notes on the Edit Report bug?

## 20. Summary

KEY LINE: "Three columns: what we did, what's next, and what's coming."
[click] "This week: your fix list is planned, we have a practice copy of the app, the steward profile is designed, the map is re-planned, and we're fixing what we hit on site first."
[click] "Next week: authentication checks, the sign-out and form-page fixes, profiles and a basic map, admins managing sites, and Supaview working again."
[click] "Coming up: version 1.1 on October 13, maps and history on October 27, room for your requests in November, and the field test in December."

## 21. Round table

Round table: Frank picks the order; Saumya speaks last. Three sentences each, at most.
Saumya's last word (about 20 seconds): "This week we did what you asked: your list is planned, and everything maps to your charter. Next week we finish the authentication checks and the sign-out and form fixes, and show you profiles and the map."
