/// <reference types="cypress" />

// US 2.0.2 - Allow Admins to Add New Sites (acceptance tests in docs/user-stories.md).
// Needs the local seed (scripts/e2e_seed.js): the admin and steward users, the site
// "Riverlot 56 (NA)" and the unlinked boundary "E2E Unlinked Fen". Created sites are named
// "E2E Added ..." and deleted after the spec.

export {};

const APP = 'http://localhost:3000';
const FREE_AREA = 'E2E Unlinked Fen';
const EXISTING_SITE = 'Riverlot 56 (NA)';

beforeEach(() => {
  cy.viewport(1280, 1000);
  // The first-login tutorial overlay can block clicks, so every tutorial reads as seen.
  cy.on('window:before:load', (win) => {
    const getItem = win.Storage.prototype.getItem;
    win.Storage.prototype.getItem = function (key: string) {
      return key.startsWith('sapaa_tutorial_') ? 'true' : getItem.call(this, key);
    };
  });
});

before(() => cy.task('deleteAddedSites'));
after(() => cy.task('deleteAddedSites'));

function login(user: 'ADMIN' | 'STEWARD') {
  cy.clearCookies();
  cy.visit(`${APP}/`);
  cy.get('#email').type(Cypress.env(`${user}_EMAIL`));
  cy.get('#password').type(Cypress.env(`${user}_PASSWORD`), { log: false });
  cy.get('button.font-bold').click();
  cy.url().should('include', '/sites');
}

function openAddSite() {
  login('ADMIN');
  cy.visit(`${APP}/admin/sites`);
  cy.get('[data-testid="add-site-button"]').click();
  cy.get('[data-testid="add-site-modal"]').should('be.visible');
}

// Saves a new site through the modal and waits until its card shows.
function addSite(name: string) {
  openAddSite();
  cy.get('[data-testid="add-site-name-input"]').type(name);
  cy.get('[data-testid="add-site-save-button"]').click();
  cy.get('[data-testid="add-site-modal"]').should('not.exist');
  cy.contains('h3', name).should('be.visible');
}

describe('Add a site (US 2.0.2)', () => {
  it('(2.0.2 AT1) admin selects a boundary for a new site and the site is saved with it', () => {
    const name = `E2E Added Boundary ${Date.now()}`;
    openAddSite();
    cy.get('[data-testid="add-site-name-input"]').type(name);

    cy.get('[data-testid="add-site-protected-area-search"]').type('E2E');
    // Only boundaries that no site uses are offered. Riverlot 56 already has its boundary.
    cy.get('ul[aria-label="Protected areas"]').within(() => {
      cy.contains('li', EXISTING_SITE).should('not.exist');
      cy.contains('li', FREE_AREA).click();
    });
    cy.get('[data-testid="add-site-protected-area-selected-name"]').should('have.text', FREE_AREA);

    cy.get('[data-testid="add-site-save-button"]').click();
    cy.get('[data-testid="add-site-modal"]').should('not.exist');
    cy.contains('h3', name).should('be.visible');
    cy.task('getSiteInfo', name).should((site) => {
      expect(site, 'saved site').to.have.property('protected_area_id').that.is.a('number');
    });
  });

  it('(2.0.2 AT2) a possible duplicate name shows a warning, and an exact duplicate is refused on save', () => {
    const alerts = cy.stub().as('alert');
    cy.on('window:alert', alerts);
    openAddSite();

    cy.get('[data-testid="add-site-name-input"]').type(EXISTING_SITE).blur();
    cy.get('[data-testid="add-site-duplicate-warning"]').should('contain', EXISTING_SITE);

    // Failure case: the database refuses the duplicate and the admin is told why.
    cy.get('[data-testid="add-site-save-button"]').click();
    cy.get('@alert').should('have.been.calledWith', 'A site with this name already exists.');
    cy.get('[data-testid="add-site-modal"]').should('be.visible');
  });

  it('(2.0.2 AT3) an empty name blocks creation and highlights the field', () => {
    openAddSite();
    cy.get('[data-testid="add-site-save-button"]').click();

    cy.contains('Site name is required.').should('be.visible');
    cy.get('[data-testid="add-site-name-input"]')
      .should('have.attr', 'aria-invalid', 'true')
      .and('have.class', 'border-red-500');
    cy.get('[data-testid="add-site-modal"]').should('be.visible');
  });

  it('(2.0.2 AT4) a steward who sends the create-site request straight to the server is refused', () => {
    // Read the server action id from a real admin create, then replay it with a steward session.
    const adminName = `E2E Added Admin ${Date.now()}`;
    const stewardName = `E2E Added By Steward ${Date.now()}`;
    let actionId = '';
    cy.intercept('POST', '/admin/sites', (req) => {
      const args = JSON.parse(String(req.body || 'null'));
      if (Array.isArray(args) && args.length === 3 && args[0] === adminName) {
        actionId = String(req.headers['next-action']);
      }
    });
    addSite(adminName);
    cy.then(() => expect(actionId, 'createSite action id').to.match(/^[0-9a-f]{20,}$/));

    login('STEWARD');
    cy.then(() =>
      cy.request({
        method: 'POST',
        url: `${APP}/admin/sites`,
        headers: { 'Next-Action': actionId, 'Content-Type': 'text/plain;charset=UTF-8', Accept: 'text/x-component' },
        body: JSON.stringify([stewardName, null, null]),
        failOnStatusCode: false,
      })
    ).its('body').should('contain', 'Only admins can edit sites.');
    cy.task('getSiteInfo', stewardName).should('equal', null);
  });

  it('(2.0.2 AT5) a new site appears in the site search results', () => {
    const name = `E2E Added Search ${Date.now()}`;
    addSite(name);

    cy.get('input[aria-label="Search"]').type(name);
    cy.contains('1 site found').should('be.visible');
    cy.contains('h3', name).should('be.visible');

    // A steward finds it too, in the sites list they use.
    login('STEWARD');
    cy.get('input[aria-label="Search"]').type(name);
    cy.contains('h3', name).should('be.visible');
  });

  it('(2.0.2 AT6) name suggestions list map areas that are not sites yet', () => {
    openAddSite();
    cy.get('[data-testid="add-site-name-input"]').type('E2E');

    cy.get('[data-testid="add-site-suggestions"]').within(() => {
      cy.contains('li', FREE_AREA).should('be.visible');
      // "E2E Lamont Meadow" is a boundary that is already a site, so it is not suggested.
      cy.contains('li', 'E2E Lamont Meadow').should('not.exist');
      cy.contains('li', FREE_AREA).click();
    });
    cy.get('[data-testid="add-site-name-input"]').should('have.value', FREE_AREA);
    cy.get('[data-testid="add-site-suggestions"]').should('not.exist');
  });
});
