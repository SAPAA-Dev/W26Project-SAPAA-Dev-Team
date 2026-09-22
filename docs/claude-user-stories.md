# Candidate user stories from the handover audit

These are stories that came out of reading the codebase, the docs, the Week 3 handover call and
the deployed app. They are not merged into `index.md` yet. The point of keeping them separate is
so the team can review them, argue about them, throw some out, and then fold the survivors into
the real backlog.

Evidence for every claim below is in `docs/investigation/`. Where a story says something is
broken or missing, that was checked against the code, not assumed.

## About the numbering

These use an `F26-` prefix on purpose. The Winter team numbered their stories `US 1.0.1` through
`US 6.0.3`, and the draft in PR #2 restarts at `US 1.0.1` for something completely different.
Those two already collide. Adding a third scheme that reuses the same numbers would make the
traceability matrix meaningless, so these sit in their own space until we agree on one scheme for
everything.

## How to read the tags

Most of these are new. A few overlap with stories that already exist, and those are marked so we
do not estimate the same work twice.

- **New** means nobody has written this down before.
- **Replaces** means there is a story in the current draft that cannot be built as written, and
  this is the version that can.
- **Already built** means the work exists and the story should be dropped, not estimated.

---

## A. Access and accounts

This group is first because most of the rest of the backlog is not safe to build until it is done.
Right now any signed in account can call an admin function directly and make itself an admin.

### F26-A1. Enforce permissions on the server (5 points) — New

As an administrator, I want every privileged action to check who is calling it before it runs, so
that a user cannot do admin things by calling the endpoint directly.

Acceptance tests:

1. A steward who calls a role change endpoint from outside the app is refused.
2. An admin calling the same endpoint succeeds.
3. A user who has signed up but has not been approved cannot call any privileged action.
4. Deleting the check from an action makes a test fail.

### F26-A2. Store roles where users cannot edit them (5 points) — New

As an administrator, I want a user's role kept in a protected table rather than in data the user
owns, so that nobody can promote themselves.

Acceptance tests:

1. A user cannot change their own role through the app or through the auth API.
2. Only an admin can change someone else's role.
3. The first admin exists as a seeded database record, and no path in the app creates one.

### F26-A3. Separate joining the app from administering it (3 points) — New

As an administrator, I want stewards to be able to join without me approving each one, while admin
access stays something only an existing admin grants.

Acceptance tests:

1. A new signup with a verified email can use the app as a steward with no admin step.
2. Only an admin can grant admin.
3. Turning off someone's access blocks them at sign in, and their past inspections stay visible.

This is already filed as GitHub issue #5.

### F26-A4. Keep photos private to the person who uploaded them (2 points) — New

As a steward, I want my uploaded photos visible only to me and to admins, so that the gallery does
not show my uploads to everyone.

The user gallery routes are copies of the admin routes with the permission check removed and no
owner filter added in its place, so they currently serve everyone's photos to any signed in user.

Acceptance tests:

1. A steward sees only their own uploads.
2. An admin sees all uploads.

### F26-A5. Reset a forgotten password (2 points) — New

As a user, I want to reset my password myself, so that I do not need an admin to get back in.

There is no reset route and no link on the login page today.

### F26-A6. Actually send the approval email (2 points) — New

As a new user, I want to be told when my account is approved, so that I know when I can sign in.

The app already tells users they will get an email. Nothing sends one. Either send it or stop
promising it.

### F26-A7. Sign out properly (2 points) — New

As a user, I want signing out to keep me signed out, so that the next person on a shared device
cannot use my account.

Coming back to the site silently signs you back in from the stored token, and the only sign out
control is on the home page.

### F26-A8. Keep a record of role changes (2 points) — New

As an administrator, I want a record of who changed whose role and when, so that "how did this
person become an admin" always has an answer.

---

## B. Data and schema

The web app and the mobile app use two different sets of tables in the same database, and a Google
Sheet writes to a third. They share one table, `luperson`. This group decides what to do about
that. Nothing in Place management or People management is safe to design until it is settled.

### F26-B1. Decide which schema is canonical (2 points) — New

As a developer, I want a written decision about which set of tables is the real one, so that we
stop building features on two schemas at once.

This is a spike. The output is a short decision document in the repo, plus issues for whatever
follows from it. It is a one way door, so it should be a deliberate decision rather than something
settled inside a feature ticket.

### F26-B2. Bring the legacy inspections into the canonical schema (13 points) — New

As SAPAA, I want the forty plus years of historical inspections readable by the web app, so that
the history is not stranded in tables only the mobile app can see.

Acceptance tests:

1. The migration can be run twice without duplicating rows.
2. The migration can be reversed.
3. A report compares row counts before and after.
4. Question numbers are preserved, because the historical data is keyed on them.

### F26-B3. One question bank instead of two (8 points) — New

As an administrator, I want one definition of the inspection form, so that editing a question
changes it everywhere.

There are currently two. The web app reads its own question tables, and the mobile app plus the
Google Sheet read a different set. Editing questions in the Sheet does not change the web form,
which is not what anyone expects.

### F26-B4. Connect people records to login accounts (8 points) — New

As an administrator, I want each person in our records linked to their login, so that the two
stop drifting apart.

`luperson` is a list of people that is separate from the list of accounts. This is also why signing
up with Google and signing up with email produce different looking users.

Acceptance tests:

1. A person with no login can be found and invited.
2. A login with no person record can be found and matched.
3. Two records for the same person can be merged without losing their inspection history.

### F26-B5. Put the schema in version control (5 points) — New

As a developer, I want the database schema stored as migrations in the repo, so that every
environment matches and changes are reviewable.

There are no SQL files in the repo at all. Two database functions the dashboard depends on exist
only inside Supabase. The deployment manual tells you to contact the development team for the
schema.

### F26-B6. Decide what happens to the Google Sheet (2 points) — New

As an administrator, I want a decision on whether the Google Sheet keeps write access to the
database.

It currently syncs people, member types and form questions, and it can delete any database row
that is missing from the sheet. Whichever schema wins in F26-B1 decides whether it keeps working.

### F26-B7. Clean up the naturalness values (5 points) — New

As an administrator, I want the site condition values stored consistently, so that statistics
built on them are correct.

The same field currently holds "4 - Great", "4 = Great" and "Great" for what should be one value.
A database function papers over it with a loose text match. Any KPI built on this inherits the
mess, so this should land before the stats work.

---

## C. Places and maps

Sites have no coordinates. None. The existing heat map takes the site's name as text and asks an
external service where it is, on every page load, one site per second, without caching anything.

Every map story in the current draft quietly depends on fixing this.

### F26-C1. Store real coordinates for each site (5 points) — Replaces the map stories in PR #2

As a user, I want sites to have actual stored locations, so that the map shows where they really
are.

Acceptance tests:

1. Sites have latitude and longitude columns.
2. Existing sites have coordinates filled in.
3. The map draws from stored coordinates with no external lookup on page load.

PR #2 has three stories (viewing sites on a map, filtering by county on a map, opening a site from
the map) that all sit on top of this one. They cannot be estimated honestly until it exists.

### F26-C2. Give stewards the map (2 points) — New

As a steward, I want to see the map, so that I can find the protected area I am visiting.

The map and heat map already exist but are admin only. The map stories in the draft are written
from a user's point of view against a feature users cannot reach.

### F26-C3. Stop site links breaking when a site is renamed (2 points) — New

As a user, I want links to a site to keep working after the site is renamed.

Site pages are addressed by name, so renaming a site breaks every link to it, and two sites with
similar names end up sharing a URL. Worth doing before any deduplication work, because it is the
defect people will actually hit.

### F26-C4. Make site search work (2 points) — New

As a user, I want to search for a site and find it.

Search was reported broken during the handover call, tested live, and failed. It has not been
touched since.

### F26-C5. Load the sites list in pages (2 points) — New

As a user, I want the sites list to load quickly.

It currently fetches every site and then filters and sorts them in the browser.

### F26-C6. Cache location lookups (2 points) — New

As a developer, I want geocoding results cached and the request volume bounded, so that we do not
burn through the free tier of an external service on page loads.

Mostly solved by F26-C1, but the limit is worth keeping.

---

## D. People and what they do

Our mentor's advice in the handover call was to measure first and decide where to display second.
Almost every stat idea in the current draft is a display decision resting on data nobody records.

There is a twist here that changes the estimate. **The mobile app already computes most of these
numbers.** Porting them is much cheaper than building from nothing.

### F26-D1. Record the activity that the stats are made of (5 points) — New

As SAPAA, I want visits, inspections and per person activity recorded, so that there is something
real to build profiles and badges on.

This should land before any profile or badge design work.

### F26-D2. Reuse the statistics the mobile app already has (5 points) — New

As SAPAA, I want the numbers the mobile app already calculates available in the web app.

Those are total sites inspected, the spread of site conditions, the top five sites, sites that
have not been visited in two years, and activity this year.

### F26-D3. Build the profile page (5 points) — Overlaps PR #2 US 1.0.1 and 1.0.2

As a user, I want a profile page for myself and for other stewards, so that I can see what people
have contributed.

Half the data model is already sitting there unused. The fields for full name, avatar and phone
are read in four places in the code and written in none.

### F26-D4. Compare one question across years (5 points) — New

As a steward, I want to pick one question and see how its answers changed over the years at a site,
so that I can see what is getting better or worse.

The mobile app has this. The web app has nothing like it. It is one of the more useful things
hiding in the inherited code and it is in nobody's backlog.

---

## E. Inspections

### F26-E1. Keep a history of inspection edits (5 points) — New

As an administrator, I want to see how an inspection record changed over time.

Editing an inspection currently deletes the old answers and inserts new ones, with no record of
what changed or who changed it. For conservation records that span decades this matters more than
it would elsewhere.

### F26-E2. Let stewards export their own reports (2 points) — New

As a steward, I want to export my inspection as a PDF. Today PDF export is admin only.

### F26-E3. Mark answers as not for publication (5 points) — New

As a steward, I want some answers kept private to SAPAA, so that sensitive information is not
published.

The Winter team specified this and never built it. Worth noting that it has to cover the generated
PDF as well as the web views, which is the part that is easy to miss.

### F26-E4. See all inspections in one view (5 points) — New

As an administrator, I want a summary across all inspections rather than one site at a time.

Frank asked for this at Dragons' Den and it was never built.

### F26-E5. See past inspections while filling in a new one (5 points) — New

As a steward, I want to see what previous visits recorded while I fill in my own, so that I can
tell what has changed.

Also asked for at Dragons' Den, also never built.

---

## F. Images

### F26-F1. Delete an image and clean up after it (5 points) — Extends PR #2 US 2.0.9

As an administrator, I want deleting an image to actually remove the stored file.

Nothing in the codebase can delete an image. There is no delete function and no delete route.
Deleting a report leaves its photos in storage permanently, which costs money against a storage
budget the client has capped at fifty dollars a year. The draft story covers removing the image
from view but not the cleanup, which is the half that costs.

### F26-F2. Take a photo in the field (8 points) — New

As a steward, I want to photograph a site from my phone while I am standing in it.

The one device with a camera is the only one that cannot attach a photo, while the web app has a
complete upload pipeline.

---

## G. Working offline

Stewards visit remote parks with no signal, so this is a functional requirement rather than a
convenience. The Winter team listed these in their last sprint and then never started them.

### G is where data is being lost today

### F26-G1. Stop throwing away edits made offline (8 points) — New

As a steward, I want an edit I make with no signal to be saved and sent when I get back online.

Right now the mobile app tries to contact the server regardless, shows an error, and discards the
edit. This is live data loss, not a missing feature.

Acceptance tests:

1. An edit made in airplane mode is still there afterwards.
2. It reaches the server once the connection returns.
3. The user can tell which of their changes have been sent.

### F26-G2. Handle two people editing the same thing (13 points) — New

As SAPAA, I want a rule for what happens when two stewards edit the same inspection and one of them
was offline.

There is no version column anywhere in the schema, so this is currently undefined behaviour.

### F26-G3. Say how old the offline data is (2 points) — New

As a steward, I want to know when the data on my phone was last updated, so that I know whether to
trust it.

### F26-G4. Make the sync button sync (2 points) — New

As a steward, I want the sync button to refresh site data.

It currently only refreshes the analytics numbers, while the user manual tells people to press it
to fix stale site data. Both of the remedies the manual gives are wrong.

---

## H. Getting the app to people

### F26-H1. Publish the mobile app so volunteers can install it (8 points) — New

As a volunteer, I want to install the app on my phone.

The build setup is Android only, there is no iOS configuration, nothing has been published, and the
user manual tells people to search an app store where the app does not appear. An iPhone volunteer
cannot get this app today. Worth resolving before December field testing if iPhones are in scope.

### F26-H2. Ask for camera and location permission properly (2 points) — New

As a user, I want to be asked before the app uses my camera or location.

None of these permissions are declared or requested at the moment.

### F26-H3. Fix the accessibility problems on sign in and sign up (2 points) — New

As a user with a screen reader or a password manager, I want the sign in page to work normally.

Observed on the live site: there is no form element even though the buttons say submit, so pressing
Enter does nothing and password managers will not save credentials. There are no autocomplete
attributes. The show password buttons have no accessible name at all. There are two page headings
where there should be one.

This matters more here than on a typical project, because the user base is explicitly older and
less comfortable with technology, which is why the previous team built a replayable tutorial.

---

## I. Keeping the project running

### F26-I1. Set up a staging environment (5 points) — New

As a developer, I want somewhere to test changes before they reach the client.

Frank deliberately left this for us to build. It also covers the obligation to push approved work
to his own deployment after each sprint.

### F26-I2. Make CI stop things breaking (2 points) — New

As a developer, I want the build, linter and tests to run on every pull request.

None of those run now. The workflow points at five branches that do not exist, and its deploy step
runs a compose file that is not in the repo, while the deployment manual says no CI is needed at
all.

### F26-I3. Make a fresh clone work (2 points) — New

As a new team member, I want to clone the repo and run it.

A clean clone does not start. The mobile app throws on import when environment variables are
missing, and no document says what they should be.

### F26-I4. Write down how to restore from a backup (2 points) — New

As SAPAA, I want a written recovery procedure, so that a bad release or a bad data change is
survivable.

### F26-I5. Get ready for the December field test (2 points) — New

As the team, I want the field test planned, so that we are not arranging it in the last week.

The client's brief commits to field testing in early December, and timed steward exercises are
something SAPAA has done before. We should ask Frank for this term's date and work backwards.

---

## Stories to drop, not estimate

These were checked against the code and the work already exists.

- **Admin editing of form questions.** Already built, including adding, editing, hiding and drag to
  reorder, with a rich text editor for the question wording.
- **PDF generation.** Already built as a proper background job with storage upload and a live
  notification when the file is ready.
- **Searching and filtering accounts.** Already built in account management.
- **Autosave of inspection drafts.** The Winter team already specified this as US 1.0.26. Check what
  actually shipped before writing it again.

## One story worth checking before we write it

The draft backlog has a story about finding and removing duplicate sites. Duplicate sites are not
mentioned in any document in this project, by any team, at any point. Before spending a sprint on
it, worth ten minutes with Frank to find out whether duplicates are a real problem he has or
something we assumed. F26-C3 is the defect near that area that definitely is real.

## Questions these raise for Frank

1. Which is the system of record, the web app's data or the forty years of historical inspections?
2. Should the Google Sheet keep write access to the database?
3. Should stewards see the map, or is geography admin only?
4. Do private answers need to be hidden from the PDF as well as from the website?
5. Are duplicate sites something you have actually run into?
6. Do iPhones need to work for December field testing?
7. What is the December field test date, and who is testing?
8. If you had to choose this term between gamification and a cleaner interface, which one?
