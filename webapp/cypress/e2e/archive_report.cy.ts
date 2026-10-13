/// <reference types="cypress" />

// US 7.0.8 - Delete a Site Inspection Report (acceptance tests in docs/user-stories.md).
// Delete archives the report (form_responses.archived_at), so it can be restored.
// Needs the local seed (scripts/e2e_seed.js): report E2E-ARCHIVE-1 on "Riverlot 56 (NA)" with
// one answer and one image row. Every test restores the report afterwards.

export {};

const APP = 'http://localhost:3000';
const SITE = 'Riverlot 56 (NA)';
const REPORT = 'E2E-ARCHIVE-1';
const REPORT_DATE = 'January 15, 2026';
const ADMIN_SITE_PAGE = `${APP}/admin/sites/${encodeURIComponent(SITE)}`;

type Report = { id: number; site_id: number; is_active: boolean; archived_at: string | null; answers: { count: number }[] };

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

function login(user: 'ADMIN' | 'STEWARD') {
  cy.clearCookies();
  cy.visit(`${APP}/`);
  cy.get('#email').type(Cypress.env(`${user}_EMAIL`));
  cy.get('#password').type(Cypress.env(`${user}_PASSWORD`), { log: false });
  cy.get('button.font-bold').click();
  cy.url().should('include', '/sites');
}

function report() {
  return cy.task<Report>('getReport', REPORT);
}

function expectNotArchived() {
  report().should((row) => expect(row.archived_at, 'archived_at').to.equal(null));
}

// Opens the confirmation for the seeded report and waits for its counts.
function openArchiveDialog(id: number) {
  cy.visit(ADMIN_SITE_PAGE);
  cy.get(`[data-testid="archive-report-button-${id}"]`).click();
  cy.get('[role="dialog"]').should('contain', REPORT).and('contain', SITE);
  cy.contains('1 answers will be preserved').should('be.visible');
}

describe('Archive a Site Inspection Report (US 7.0.8)', () => {
  it('(7.0.8 AT1) admin must confirm before the report is archived; cancel keeps it', () => {
    login('ADMIN');
    report().then(({ id }) => {
      openArchiveDialog(id);
      cy.contains('1 images will be preserved').should('be.visible');
      cy.get('[role="dialog"]').contains('button', 'Cancel').click();

      cy.get('[role="dialog"]').should('not.exist');
      cy.get(`[data-testid="archive-report-button-${id}"]`).should('be.visible');
      expectNotArchived();
    });
  });

  it('(7.0.8 AT2) after confirming, the report leaves the site and report lists and shows under archived reports', () => {
    login('ADMIN');
    cy.visit(`${APP}/detail/${encodeURIComponent(SITE)}`);
    cy.contains(REPORT_DATE).should('exist');

    report().then(({ id }) => {
      openArchiveDialog(id);
      cy.get('[data-testid="confirm-archive-report"]').click();
      cy.get('[role="dialog"]').should('not.exist');
      cy.get(`[data-testid="archive-report-button-${id}"]`).should('not.exist');
      report().its('archived_at').should('be.a', 'string');

      // Still gone after a reload, on the admin page and on the site page users see.
      cy.reload();
      cy.contains('h1, h2', SITE).should('exist');
      cy.get(`[data-testid="archive-report-button-${id}"]`).should('not.exist');
      cy.visit(`${APP}/detail/${encodeURIComponent(SITE)}`);
      cy.contains('h1', SITE).should('be.visible');
      cy.contains(REPORT_DATE).should('not.exist');

      cy.visit(`${APP}/admin/reports/archived`);
      cy.get(`[data-testid="archived-report-row-${id}"]`).should('contain', REPORT).and('contain', SITE);
    });
  });

  it('(7.0.8 AT3) the images of an archived report are no longer shown', () => {
    login('ADMIN');
    report().then(({ id, site_id }) => {
      const responseIds = () =>
        cy.request(`${APP}/api/sites/${site_id}/gallery`).its('body.items').then((items: { response_id: number }[]) => items.map((item) => item.response_id));

      responseIds().should('include', id);
      cy.visit(ADMIN_SITE_PAGE);
      cy.contains('button', 'Image Gallery').click();
      cy.contains('Image Gallery (1 images)').should('exist');
      cy.contains('button', 'View by Date').click();
      cy.get(`[data-testid="archive-report-button-${id}"]`).click();
      cy.contains('1 images will be preserved').should('be.visible');
      cy.get('[data-testid="confirm-archive-report"]').click();
      cy.get('[role="dialog"]').should('not.exist');

      cy.contains('button', 'Image Gallery').click();
      cy.contains('Image Gallery (0 images)').should('exist');
      responseIds().should('not.include', id);
    });
  });

  it('(7.0.8 AT4) a steward has no archive control and the server refuses their archive request', () => {
    // Read the server action id from a real admin archive, then restore the report.
    let actionId = '';
    login('ADMIN');
    report().then(({ id }) => {
      cy.intercept('POST', '/admin/sites/*', (req) => {
        if (req.body === JSON.stringify([id])) actionId = String(req.headers['next-action']);
      });
      openArchiveDialog(id);
      cy.get('[data-testid="confirm-archive-report"]').click();
      cy.get('[role="dialog"]').should('not.exist');
      cy.task('restoreReport', REPORT);
      cy.then(() => expect(actionId, 'archive action id').to.match(/^[0-9a-f]{20,}$/));

      login('STEWARD');
      cy.visit(ADMIN_SITE_PAGE);
      cy.get(`[data-testid="archive-report-button-${id}"]`).should('not.exist');
      cy.get('[data-testid="confirm-archive-report"]').should('not.exist');

      cy.then(() =>
        cy.request({
          method: 'POST',
          url: ADMIN_SITE_PAGE,
          headers: { 'Next-Action': actionId, 'Content-Type': 'text/plain;charset=UTF-8', Accept: 'text/x-component' },
          body: JSON.stringify([id]),
          failOnStatusCode: false,
        })
      ).its('status').should('equal', 500);
      expectNotArchived();
    });
  });

  it('(7.0.8 AT5) when the archive fails, an error shows and the report and its answers stay', () => {
    login('ADMIN');
    report().then(({ id }) => {
      openArchiveDialog(id);
      // The dialog has loaded its counts, so the next action call with this id is the archive.
      cy.intercept('POST', '/admin/sites/*', (req) => {
        if (req.body === JSON.stringify([id])) req.reply({ statusCode: 500, body: 'Archive failed' });
      });
      cy.get('[data-testid="confirm-archive-report"]').click();

      cy.get('[role="dialog"] [role="alert"]').should('be.visible');
      cy.get('[role="dialog"]').contains('button', 'Cancel').click();
      cy.get(`[data-testid="archive-report-button-${id}"]`).should('be.visible');
      report().should((row) => {
        expect(row.archived_at).to.equal(null);
        expect(row.answers[0].count).to.equal(1);
      });
    });
  });
});
