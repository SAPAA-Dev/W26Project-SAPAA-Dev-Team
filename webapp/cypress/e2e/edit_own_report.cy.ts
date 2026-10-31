/// <reference types="cypress" />

// US 4.0.4 - Edit My Previous Inspections (acceptance tests in docs/user-stories.md).
// Needs the local seed (scripts/e2e_seed.js): report E2E-ARCHIVE-1 on "Riverlot 56 (NA)" is
// owned by the seeded STEWARD. The profile user A is another approved steward and must be
// refused. Row level security and the server ownership check run for real, with no mocks.

export {};

const APP = 'http://localhost:3000';
const SITE = 'Riverlot 56 (NA)';
const REPORT = 'E2E-ARCHIVE-1';
const REPORT_DATE = 'January 15, 2026';

type Report = { id: number; site_id: number; is_active: boolean; archived_at: string | null };

beforeEach(() => {
  cy.viewport(1280, 1000);
  // The first-login tutorial overlay can block clicks, so every tutorial reads as seen.
  cy.on('window:before:load', (win) => {
    const getItem = win.Storage.prototype.getItem;
    win.Storage.prototype.getItem = function (key: string) {
      return key.startsWith('sapaa_tutorial_') ? 'true' : getItem.call(this, key);
    };
  });
  cy.task('restoreReport', REPORT);
});

after(() => cy.task('restoreReport', REPORT));

function login(user: 'STEWARD' | 'PROFILE_USER_A') {
  cy.clearCookies();
  cy.visit(`${APP}/`);
  cy.get('#email').type(Cypress.env(`${user}_EMAIL`));
  cy.get('#password').type(Cypress.env(`${user}_PASSWORD`), { log: false });
  cy.get('button.font-bold').click();
  cy.url().should('include', '/sites');
}

function editPath() {
  return cy
    .task<Report>('getReport', REPORT)
    .then(({ id }) => `${APP}/detail/${encodeURIComponent(SITE)}/edit-report/${id}`);
}

describe('Edit a previous inspection (US 4.0.4)', () => {
  it('(4.0.4 AT1) the author opens a past SIR and enters edit mode', () => {
    login('STEWARD');
    editPath().then((path) => {
      cy.visit(path);

      cy.contains('h1', 'Edit Inspection Report').should('be.visible');
      cy.contains('button', 'Save Changes').should('be.visible');
      // The seeded report is linked from its site page, so the history shows the date.
      cy.visit(`${APP}/detail/${encodeURIComponent(SITE)}`);
      cy.contains(REPORT_DATE).should('exist');
    });
  });

  it('(4.0.4 AT2) another steward cannot enter edit mode or change the SIR', () => {
    editPath().then((path) => {
      login('PROFILE_USER_A');
      cy.visit(path);

      cy.contains('h2', 'Access Denied').should('be.visible');
      cy.contains('You can only edit reports that you submitted.').should('be.visible');
      cy.contains('h1', 'Edit Inspection Report').should('not.exist');
      cy.contains('button', 'Save Changes').should('not.exist');
    });
  });
});
