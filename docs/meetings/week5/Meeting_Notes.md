MEETING WITH ALEX
=================
Talk with Frank even more about gamification; does he want visual progress to show off "social status,"

Pitch Frank a bounty board to give more points for visiting specific sites instead of every site giving equal points

Mainly just keep pitching Frank to get more specifics from him; think about behaviours, user flows that reward the behaviour we want to incentivize

...intermittent talk

Set up automated UML generation based on code base

...intermittent talk

Alex said "in real world, you couldn't consider user story completed until you have full clarity on all details"

Ambiguity of user story shouldn't be tied to its points

Maybe don't delete site data; just mark it as deleted and don't show it, that way Frank still has the sites data if he ever needs it again

Map has map layer
|
static layer (polygons) {can find them on Alberta Open Data}
|
dynamic layer / history (e.g. GPX trails, paths) {files Frank sent us}
|
data visualization layer (parsing people of data, view, etc)

Frank discusses we should understand how to deal with "dirty" gpx files; 
Chris: I'm thinking we can have some gui "scissor" tool to cut off bad regions

Google Maps doesn't allow caching mapping data offline; violates their terms of service:
- https://cloud.google.com/maps-platform/terms
- https://cloud.google.com/maps-platform/terms/maps-service-terms

They allow caching of say latitude and longitude conversions, but they never specify allowing caching map tiles for offline use; by how the terms are worded, this means it is forbidden.

This is another strong motivator for using OpenStreetMap

Gamification:
- How many site inspections have you put in?
- How many unique counties have you visited?

Frank also seems to really want continuous release, especially to see how gamification is coming along.

Frank wants to see a proposal for gamification by next Friday; how it'll flow, what will the user see, what specific stats are on display?

For site inspection report deletion, Frank wants the following options:
- suppress, archive, nuke (the suppress feels redundent)