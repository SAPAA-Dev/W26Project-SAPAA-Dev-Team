<!-- Title must follow "(<type>): <description>", e.g. "(feat): add site search".
     With squash merge, the title becomes the commit on main.
     One PR is one whole user story. Tests and docs are part of the story, not a later PR. -->

## What and why

Closes #

## Story and acceptance tests

- Story: US x.x.x
- ATs this PR covers: AT1, AT2, ...
- ATs not covered yet, and why:

## Tests

- [ ] Each AT has a test, with a success case and a failure case (for example good and bad input).
- [ ] Test names carry the story and AT, for example `(2.0.9 AT2)`.
- [ ] A UI story has a UI test (Cypress), or this PR says why it has none.
- [ ] I ran the unit tests, type check and lint for the changed directory (see `AGENTS.md`).

## Docs

- [ ] `docs/traceability-matrix.md`: a row for each AT, with the test path and the status.
- [ ] `docs/project-management.md`: story status and task table.
- [ ] `docs/ui-design.md`: for a UI change, the heuristics, contrast and keyboard use.
- [ ] Other docs this change touches (manuals, API, schema), or "none needed" with the reason.

## Sprint timing

- [ ] This PR targets `sprint-N`, not `main`.
- [ ] I merge it before the code freeze. A story that cannot make the freeze is raised at the standup, not held back for the last day.

## Screenshots (UI changes only)

## Reviewers
<!-- Assign 2 or more reviewers (sidebar > Assignees). Every assignee must approve and only
     their approvals count. With no assignees, any 2 people can approve. -->

- [ ] I assigned at least 2 reviewers.
- [ ] Reviewers: read **every changed file, top to bottom**, before approving. No skimming.
- [ ] Reviewers: check the PR against the ATs above, run it or read the tests, and say in the review what you checked. "LGTM" alone is not a review.
