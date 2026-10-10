# Teamwork
This page gives an overview of the team and its members.

## Team Canvas

Select the image to open it at full size.

[![Team Canvas](images/team_canvas.png)](images/team_canvas.png)

## Scrum Roles

The Scrum Master and the Product Owner change each sprint.

| Sprint | Scrum Master | Product Owner |
|--------|--------------|---------------|
| Sprint 1 | Chris | Alissa |
| Sprint 2 | Aaron | Chris |
| Sprint 3 | Jayden | Aaron |
| Sprint 4 | Abhinav | Zanab |
| Sprint 5 | Alissa | Abhinav |

### Scrum Master

The Scrum Master runs the Scrum ceremonies, removes impediments and makes sure that the team follows the Scrum
principles.

### Product Owner

The Product Owner defines the product backlog items and sets their priority from customer needs and business value. The
Product Owner is the voice of the customer and makes sure that the development team builds a product that meets the
expectations of the customer.


## Sprint 2 contributions

This table counts the 54 pull requests merged after the Sprint 1 release (September 29, 2026) up to October 9, 2026:
52 merged into `main`, and 2 stacked PRs (#130, #134) that reached `main` through #129 and #133. The counts come
from `gh pr list --state merged` and the commit history. They do not include work that has no pull request, such as
the client meetings, the lab sessions and the pair work before a merge.

- **Coding** counts the pull requests that the member authored and that are not documentation. It includes CI and
  migration changes.
- **Testing** counts the coding pull requests that add or change a test file (`__tests__`, Cypress or `.test.`).
- **Reviews** counts the pull requests of other members on which the member submitted a review. The Copilot reviewer
  is not counted.
- **Documentation** counts the pull requests whose title starts with `(docs)`.

| Member | Mini-team | Coding (PRs) | Testing | Reviews | Documentation | Management |
|--------|-----------|--------------|---------|---------|---------------|------------|
| Saumya | Alpha | 17: user model migrations, steward server actions and profile links, `W26_` rename, CI reviewer gate and release branch checks, diagram generator, sign-out on every page | 10 of 17 | 9 | 10: user model proposal, Oct 2 client deck and talk track, Sprint 2 status and Sprint 3 plan | Oct 2 client update ([PR #122](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/122), [PR #123](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/123)) |
| Aaron | Alpha | 2: admin navigation on the site page, profile page with inspection history | 2 of 2 | 37 | 3: week 5 notes, Oct 2 and Oct 9 meeting transcripts | Scrum Master, Sprint 2 |
| Alissa | Beta | 4: field selection for PDF export, optional photo identifier, protected area map search, linking sites to protected areas | 4 of 4 | 7 | None merged | None merged |
| Abhinav | Beta | 5: KML parser, mapping data in the database, Protomaps and MapLibre basemap, site boundaries, form keeps its section | 5 of 5 | 17 | 1: Oct 2 transcript file name | None merged |
| Chris | Gamma | 4: release branch, `app_metadata` checks, image delete with local S3, steward PDF download | 3 of 4 | 34 | 1: removed the git co-author instruction from `AGENTS.md` | Product Owner, Sprint 2 |
| Jayden | Gamma | 3: admin view of inactive sites, archive and delete sites, archive and delete reports | 3 of 3 | 12 | None merged | None merged. Planned: the Sprint 2 release notes ([#97](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/97)) and the retrospective ([#98](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/issues/98)), both not started on October 9 |
| Zanab | Gamma | 4: site links, add a site, map area suggestions, show, hide and edit site page fields | 4 of 4 | 1 | None merged | None merged. Planned: the same items as Jayden |

Jayden and Zanab have no merged documentation or management work in Sprint 2 yet.

### Merged pull requests by member

- **Saumya**: code [#119](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/119), [#124](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/124), [#125](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/125), [#128](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/128), [#129](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129), [#131](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/131), [#132](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/132), [#133](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/133), [#134](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/134), [#139](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/139), [#140](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/140), [#141](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/141), [#142](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/142), [#151](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151), [#154](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/154), [#157](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/157), [#158](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/158); documentation [#111](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/111), [#112](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/112), [#115](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/115), [#116](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/116), [#118](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/118), [#122](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/122), [#123](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/123), [#130](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/130), [#143](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/143), [#156](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/156).
- **Aaron**: code [#120](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/120), [#138](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/138); documentation [#126](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/126), [#127](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/127), [#168](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/168).
- **Alissa**: code [#146](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/146), [#147](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/147), [#166](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/166), [#167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167); documentation none.
- **Abhinav**: code [#137](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/137), [#152](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152), [#159](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/159), [#161](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/161), [#164](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/164); documentation [#136](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/136).
- **Chris**: code [#121](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/121), [#144](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/144), [#148](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/148), [#155](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/155); documentation [#117](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/117).
- **Jayden**: code [#150](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/150), [#160](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/160), [#165](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/165); documentation none.
- **Zanab**: code [#145](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/145), [#153](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/153), [#162](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/162), [#163](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/163); documentation none.

## Belbin Roles
Source: [https://www.belbin.com/about/belbin-team-roles](https://www.belbin.com/about/belbin-team-roles)

| Name | Preferred Roles | Manageable Roles | Least Preferred Roles |
|------|-----------------|------------------|-----------------------|
| Chris | SH | PL | RI |
| Abhinav | TW | IMP | RI |
| Jayden | IMP | TW | SH |
| Saumya | CF | TW | SH |
| Aaron | CO | TW | ME |
| Alissa | TW | CO | PL |
| Zanab | TW | IMP | RI |

The lists below come from the table. Each list gives the members who have the role as a preferred role or as a
manageable role.

### Thinking Roles

#### PL (Plant)
> The Plant is creative and finds new solutions to difficult problems.

- Chris (manageable)

#### ME (Monitor Evaluator)
> The Monitor Evaluator examines all options with logic and makes impartial decisions.

- No member has this role as a preferred or manageable role.

#### SP (Specialist)
> The Specialist gives the team deep knowledge of one key area.

- No member has this role as a preferred or manageable role.

### Action Roles

#### SH (Shaper)
> The Shaper gives the team the drive to keep its focus and momentum when work is difficult.

- Chris (preferred)

#### IMP (Implementer)
> The Implementer changes ideas into a practical plan and does the plan efficiently.

- Jayden (preferred)
- Abhinav (manageable)
- Zanab (manageable)

#### CF (Completer Finisher)
> The Completer Finisher examines the work at the end of a task, finds errors and makes sure that the quality is high.

- Saumya (preferred)

### People Roles

#### RI (Resource Investigator)
> The Resource Investigator speaks with people outside the team to find information, ideas and help for the team.

- No member has this role as a preferred or manageable role.

#### TW (Teamworker)
> The Teamworker helps the team to work well together, listens to all members and supports them where necessary.

- Abhinav (preferred)
- Alissa (preferred)
- Zanab (preferred)
- Jayden (manageable)
- Saumya (manageable)
- Aaron (manageable)

#### CO (Coordinator)
> The Coordinator makes the team goals clear, gives tasks to the correct members and makes sure that all members know
> their part of the work.

- Aaron (preferred)
- Alissa (manageable)
