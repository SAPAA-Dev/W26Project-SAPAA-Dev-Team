# Branch integration audit — October 31, 2026

This audit supports the requested integration PR into the course repository's `main`.
The source snapshot had **165 references and 105 distinct branch heads**. Of those heads,
99 had commits ahead of `origin/main` (`d5264583`). The initial integration head was
`87be5a06`. Commit counts alone do not prove that a feature is missing: squash merges and
older local histories can have different commit IDs for work already on main.

## Included work

- The full `feat/ui-prototypes` app, API, map, report, photo, account, cache and mobile fixes.
- Course `main` and `sprint-4`, already ancestors of the integration source.
- All three remaining commits from `origin/feat/site-visit-history`: boundary-load retry,
  visible GPX load errors, comment cleanup, and local GPX test data. The seed merge keeps
  the existing seeded user objects and the local-only host guard. The seed was not executed.
- Equivalent GPX failure/retry feedback in the new v2 map, with a regression test.
- `origin/docs/week9-slides` and the inherited Sprint 4 review slide deck.
- The completed October 27 coverage/count updates from the local Sprint 3 count branches,
  checked against `test-plan.md`. The current contribution evidence remains in the documents.
- The production deployment guide, screenshots, UI/API documentation, project task record,
  and feedback acceptance-test matrix.

## Explicit scope decisions

The user confirmed **Keep Frank's approved scope** after the audit found retired work.
The iNaturalist photo-import branch and the steward-without-account branch are excluded.
US 3.0.4 and PR #310 were explicitly removed/closed. The iNaturalist work was also excluded
from the current plan. See [Project Management](project-management.md) and
[User Stories](user-stories.md). These branches remain intact.

`gh-pages` contains generated website output with a separate history. It is not application
source. Older SAPAA-Dev upstream branches are inherited references, not new course work.
The local alternate GPX implementation uses an older schema; the current GPX implementation
and its tests are retained. Old diagram-check snapshots would replace newer SVG validation
with an older version, so the stronger current code is retained.

**No branch was deleted. No main merge or production database write is part of this audit.**
The PR requires normal human review and checks before main changes. No seed or Cypress run
was made. A slide file being included does not mean its presentation content was validated.

## Head-by-head record

The names and hashes below are the audit snapshot. Later integration commits update only
the integration branch. The table groups references that pointed to the same commit.
“Superseded” means a historic snapshot is not used to replace newer released source.

| References at audit | Head | Ahead of main | Result / evidence |
| --- | --- | ---: | --- |
| `chore/fix-merge-hook` | `0f651823` | 1 | Merged PR [#33](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/33); newer released implementation retained |
| `chore/ignore-swarm` | `49ffd649` | 1 | Equivalent patches already included |
| `chore/remove-leftovers` | `45730880` | 78 | Merged PR [#278](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/278); newer released implementation retained |
| `chore/remove-mobile-ci` | `f2eda2d2` | 1 | Equivalent patches already included |
| `chore/sprint-2-followups` | `9f9b7d22` | 113 | Merged PR [#276](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/276); newer released implementation retained |
| `chore/sprint-2-integration` | `8cc03bf1` | 79 | Historic local snapshot; superseded by the integrated Sprint 2/3 source |
| `chore/sprint-2-integration-2` | `0c516471` | 74 | Historic local snapshot; superseded by the integrated Sprint 2/3 source |
| `ci/alpha-release-branch` | `531b4272` | 1 | Equivalent patches already included |
| `ci/diagram-svg-check` | `d40990e3` | 72 | Merged PR [#305](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/305); newer released implementation retained |
| `ci/e2e-cypress-workflow` | `bf4f457d` | 2 | Merged PR [#257](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/257); newer released implementation retained |
| `ci/lint-clean-and-blocking` | `f246f9be` | 5 | Merged PR [#262](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/262); newer released implementation retained |
| `docs/alpha-move-meetings` | `f15bdc16` | 2 | Merged PR [#118](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/118); newer released implementation retained |
| `docs/alpha-move-review-findings` | `a82d96de` | 1 | Equivalent patches already included |
| `docs/alpha-sprint-2-3-plan` | `61e6c224` | 5 | Merged PR [#156](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/156); newer released implementation retained |
| `docs/alpha-user-model-fixes` | `160a3954` | 2 | Merged PR [#130](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/130); newer released implementation retained |
| `docs/alpha-week5-client-slides` | `07639879` | 2 | Equivalent patches already included |
| `docs/alpha-week5-slides-to-docs` | `40eae998` | 2 | Merged PR [#123](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/123); newer released implementation retained |
| `docs/alpha-week6-client-slides` | `12dce050` | 1 | Equivalent patches already included |
| `docs/architecture-diagrams`, `pr/29` | `b0d0b051` | 6 | Historic closed PR snapshot; newer released source retained |
| `docs/design-docs-refresh` | `31db139e` | 8 | Merged PR [#254](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/254); newer released implementation retained |
| `docs/diagrams-refresh` | `50c6658b` | 9 | Merged PR [#247](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/247); newer released implementation retained |
| `docs/local-test-run-oct-27` | `1a40d63a` | 1 | Equivalent patches already included |
| `docs/release-and-deploy-runbook` | `44b27dad` | 13 | Merged PR [#246](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/246); newer released implementation retained |
| `docs/remove-doc-markers` | `3c5fa9da` | 1 | Equivalent patches already included |
| `docs/reorder-priority` | `96c8c8cc` | 21 | Merged PR [#53](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/53); newer released implementation retained |
| `docs/reorganized-docs` | `b6b3836a` | 6 | Merged PR [#43](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/43); newer released implementation retained |
| `docs/sept-25-stories` | `f24beb47` | 10 | Merged PR [#31](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/31); newer released implementation retained |
| `docs/sprint-1-final-fixes` | `f29656a0` | 3 | Merged PR [#111](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/111); newer released implementation retained |
| `docs/sprint-1-release-fixes` | `b19ff37b` | 6 | Merged PR [#99](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/99); newer released implementation retained |
| `docs/sprint-1-stories` | `ada0f9d9` | 4 | Historic closed PR snapshot; newer released source retained |
| `docs/sprint-2-process-docs` | `f43e5262` | 78 | Merged PR [#277](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/277); newer released implementation retained |
| `docs/sprint-2-status-and-feedback` | `82e69cc3` | 13 | Merged PR [#248](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/248); newer released implementation retained |
| `docs/sprint-2-status-refresh` | `e91ca3a7` | 7 | Merged PR [#253](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/253); newer released implementation retained |
| `docs/sprint-3-count-fixes` | `7abc368c` | 1 | Count corrections incorporated; historic contribution record retained |
| `docs/sprint-3-counts`, `heads/refs/heads/sprint-3` | `77c0075e` | 189 | Count corrections incorporated; historic contribution record retained |
| `docs/sprint-goals-and-glossary` | `7f8dc487` | 1 | Equivalent patches already included |
| `docs/week6-slides-pptx`, `origin/docs/week6-slides-pptx` | `98bcc723` | 1 | Equivalent patches already included |
| `docs/week7-client-slides` | `ad6f6719` | 1 | Equivalent patches already included |
| `feat/agents-guideline` | `64494320` | 6 | Merged PR [#28](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/28); newer released implementation retained |
| `feat/alpha-diagram-automation` | `034ccea7` | 2 | Equivalent patches already included |
| `feat/alpha-profile-socials` | `648b19a4` | 2 | Merged PR [#142](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/142); newer released implementation retained |
| `feat/alpha-steward-sites-on-profile` | `415def30` | 3 | Merged PR [#140](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/140); newer released implementation retained |
| `feat/alpha-user-model` | `ddbe773e` | 2 | Merged PR [#116](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/116); newer released implementation retained |
| `feat/alpha-user-profiles-us101` | `5d9fd985` | 1 | Equivalent patches already included |
| `feat/export-all-files` | `e934627b` | 75 | Included: ancestor of integration head |
| `feat/gpx-track-upload` | `b0cab13c` | 6 | Superseded: current GPX schema, uploader, map lines and tests already included |
| `feat/mapping-data` | `846df6e6` | 10 | Merged PR [#152](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/152); newer released implementation retained |
| `feat/migrate-user-model` | `41b38fb9` | 1 | Equivalent patches already included |
| `feat/profile-skill-dropdowns` | `fea06837` | 74 | Included: ancestor of integration head |
| `feat/protected-areas-table` | `f85f38fe` | 1 | Equivalent patches already included |
| `feat/set-link-between-sites-and-protected-areas` | `e805debc` | 10 | Merged PR [#167](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/167); newer released implementation retained |
| `feat/site-priority-score` | `8fb3221f` | 75 | Included: ancestor of integration head |
| `feat/site-steward` | `b799cccc` | 1 | Merged PR [#133](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/133); newer released implementation retained |
| `feat/site-steward-ui` | `0ab5de1c` | 2 | Merged PR [#134](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/134); newer released implementation retained |
| `feat/steward-without-account` | `0d3f47a1` | 72 | Excluded: removed scope, confirmed by user; branch preserved |
| `feat/ui-prototypes`, `origin/feat/ui-prototypes`, `upstream/feat/ui-prototypes` | `87be5a06` | 209 | Included: ancestor of integration head |
| `feat/v2-auth-upload-admin-port` | `59735f12` | 80 | Included: ancestor of integration head |
| `feat/v2-map-gpx` | `bec8a87b` | 83 | Included: ancestor of integration head |
| `feat/v2-reports-profile-port` | `d08ab676` | 80 | Included: ancestor of integration head |
| `fix/alpha-approval-screen-on-sites` | `5804fe5c` | 1 | Merged PR [#256](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/256); newer released implementation retained |
| `fix/alpha-code-quality` | `7747acc4` | 7 | Merged PR [#255](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/255); newer released implementation retained |
| `fix/alpha-invalid-identifier` | `99a06931` | 1 | Equivalent patches already included |
| `fix/alpha-profile-name-validation` | `6eb98a78` | 2 | Merged PR [#151](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/151); newer released implementation retained |
| `fix/alpha-reviewer-gate-status` | `b8f906da` | 1 | Equivalent patches already included |
| `fix/alpha-sign-out-all-pages` | `928a1e0d` | 2 | Equivalent patches already included |
| `fix/alpha-site-details-session-mock` | `f09cf1c2` | 1 | Equivalent patches already included |
| `fix/alpha-steward-profile-link` | `0254636b` | 1 | Equivalent patches already included |
| `fix/auth-gates` | `0123db1c` | 7 | Merged PR [#240](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/240); newer released implementation retained |
| `fix/beta-sprint-2-gaps` | `86cb255d` | 9 | Merged PR [#261](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/261); newer released implementation retained |
| `fix/form-editor-save-errors` | `3596c574` | 76 | Merged PR [#280](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/280); newer released implementation retained |
| `fix/gallery-and-image-delete` | `7a3d27b3` | 7 | Merged PR [#234](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/234); newer released implementation retained |
| `fix/gamma-sprint-2-gaps` | `df196f84` | 6 | Merged PR [#258](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/258); newer released implementation retained |
| `fix/gpx-track-path-policy` | `e4bca575` | 71 | Included: ancestor of integration head |
| `fix/pdf-queries-server-only` | `11ea8fe8` | 77 | Merged PR [#279](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/279); newer released implementation retained |
| `fix/pr233-review` | `ccad15e9` | 11 | Historic local snapshot; superseded by the integrated Sprint 2/3 source |
| `fix/profile-and-steward-fixes` | `dc63eabb` | 15 | Merged PR [#238](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/238); newer released implementation retained |
| `fix/report-read-caller-checks` | `a3220fc6` | 4 | Merged PR [#259](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/259); newer released implementation retained |
| `fix/report-write-authz` | `6530a4b7` | 14 | Merged PR [#242](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/242); newer released implementation retained |
| `heads/sprint-3` | `b48e3554` | 189 | Count corrections incorporated; historic contribution record retained |
| `origin/docs/sprint-4` | `a8445191` | 2 | Equivalent patches already included |
| `origin/docs/week9-slides` | `fe4d99ca` | 1 | Included: ancestor of integration head |
| `origin/feat/inaturalist-integration-in-sir` | `d550a2f8` | 1 | Excluded: removed scope, confirmed by user; branch preserved |
| `origin/feat/password-reset` | `c9afefa4` | 27 | Equivalent patches already included |
| `origin/feat/site-visit-history` | `e9bc7a6c` | 71 | Included: ancestor of integration head |
| `origin/feat/steward-without-account` | `244023d1` | 82 | Excluded: removed scope, confirmed by user; branch preserved |
| `origin/gh-pages` | `e722d059` | 53 | Excluded: generated documentation, separate history |
| `origin/release` | `7e1ce196` | 2 | Equivalent patches already included |
| `origin/sprint-4` | `d58c59e7` | 2 | Included: ancestor of integration head |
| `pr/40` | `f99b3dce` | 3 | Historic local snapshot; superseded by the integrated Sprint 2/3 source |
| `refactor/alpha-remove-w26-prefix` | `8c02881b` | 1 | Merged PR [#129](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/129); newer released implementation retained |
| `test/e2e-and-db-rules` | `23aada59` | 78 | Merged PR [#282](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/282); newer released implementation retained |
| `test/jest-quality-gates` | `e074d0ff` | 5 | Merged PR [#260](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/260); newer released implementation retained |
| `test/matrix-and-failure-cases` | `ac57692b` | 83 | Merged PR [#281](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/281); newer released implementation retained |
| `test/story-labels-and-coverage` | `3a583288` | 19 | Merged PR [#243](https://github.com/UAlberta-CMPUT401/F26project-SAPAA/pull/243); newer released implementation retained |
| `upstream/Sprint-4-test` | `5c08b3f7` | 10 | Inherited upstream snapshot; current course implementation retained |
| `upstream/gh-pages` | `e4de16ee` | 4 | Inherited upstream snapshot; current course implementation retained |
| `upstream/image_extract` | `e0b29967` | 2 | Inherited upstream snapshot; current course implementation retained |
| `upstream/public-sprint-5` | `46812a93` | 15 | Inherited upstream snapshot; current course implementation retained |
| `upstream/sprint-4-review-slides` | `af546146` | 1 | Slide deck incorporated as an equivalent cherry-pick |

Six distinct heads had no commits ahead of main and required no additional source changes.
The generated raw comparison and PR-history lookup were read-only. This report makes no
claim that all historic branch implementations should be active at the same time.
