/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('Invalid or unexpected token')) {
    return false;
  }
});

const TEST_SITE_NAME = 'Riverlot 56 (NA)';
const UPDATED_SITE_NAME = 'Riverlot 56 (NA) - Edited';

function dismissTutorialIfPresent() {
  cy.wait(2000);
  cy.get('body').then(($body) => {
    if ($body.find('.react-joyride__overlay').length > 0) {
      cy.get('[data-testid="tutorial-skip"], [aria-label="Skip"], button[data-action="skip"], button[data-action="close"]')
        .first()
        .click({ force: true });
      cy.get('.react-joyride__overlay').should('not.exist', { timeout: 5000 });
    }
  });
}

describe('Admin Edit Site Profile', () => {
  let originalCountyId: number | null = null;

  before(() => {
    cy.task('getSiteInfo', TEST_SITE_NAME).then((site: any) => {
      if (site) {
        originalCountyId = site.ab_county;
      }
    });
  });

  after(() => {
    cy.task('restoreSite', {
      namesite: UPDATED_SITE_NAME,
      originalName: TEST_SITE_NAME,
      originalCountyId,
    });
    cy.task('restoreSite', {
      namesite: TEST_SITE_NAME,
      originalName: TEST_SITE_NAME,
      originalCountyId,
    });
  });

  function loginAsAdmin() {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('jason.liang5129@gmail.com', { force: true });
    cy.get('#password').type('123Abc@@', { force: true });
    cy.get('button.font-bold').click({ force: true });

    cy.wait(3000);
    dismissTutorialIfPresent();

    cy.get('button[title="Open menu"]').click();
    cy.contains('Go to admin dashboard').click();
    cy.url().should('include', '/admin/dashboard', { timeout: 10000 });

    // Navigate directly to avoid dropdown redirect race condition
    cy.visit('http://localhost:3000/admin/sites');
    cy.url().should('include', '/admin/sites', { timeout: 10000 });
    cy.get('[data-testid^="edit-site-button-"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
  }

  function openEditModal(siteName: string) {
    cy.contains(siteName, { timeout: 10000 })
      .closest('.group')
      .find('[data-testid^="edit-site-button-"]')
      .click();
    cy.get('[data-testid="edit-site-modal"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="edit-site-name-input"]', { timeout: 10000 }).should('not.be.disabled');
  }

  it('should show edit (pencil) button on site cards for admins', () => {
    loginAsAdmin();
    cy.get('[data-testid^="edit-site-button-"]').should('have.length.greaterThan', 0);
  });

  it('should open edit site modal when pencil button is clicked', () => {
    loginAsAdmin();
    openEditModal(TEST_SITE_NAME);
    cy.get('[data-testid="edit-site-name-input"]').should('have.value', TEST_SITE_NAME);
  });

  it('should update the site name', () => {
    loginAsAdmin();
    openEditModal(TEST_SITE_NAME);

    cy.get('[data-testid="edit-site-name-input"]').clear().type(UPDATED_SITE_NAME);
    cy.get('[data-testid="edit-site-save-button"]').click();

    cy.get('[data-testid="edit-site-modal"]', { timeout: 10000 }).should('not.exist');

    cy.url().then((url) => {
      if (!url.includes('/admin/sites')) {
        cy.visit('http://localhost:3000/admin/sites');
        cy.url().should('include', '/admin/sites', { timeout: 10000 });
      }
    });

    cy.contains(UPDATED_SITE_NAME, { timeout: 10000 }).should('be.visible');

    openEditModal(UPDATED_SITE_NAME);
    cy.get('[data-testid="edit-site-name-input"]').clear().type(TEST_SITE_NAME);
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]', { timeout: 10000 }).should('not.exist');

    cy.url().then((url) => {
      if (!url.includes('/admin/sites')) {
        cy.visit('http://localhost:3000/admin/sites');
        cy.url().should('include', '/admin/sites', { timeout: 10000 });
      }
    });

    cy.contains(TEST_SITE_NAME, { timeout: 10000 }).should('be.visible');
  });
});

describe('Non-Admin Cannot Edit Site Profile', () => {
  it('should not show the admin panel or edit buttons to steward users', () => {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('awayt7398@gmail.com', { force: true });
    cy.get('#password').type('Throw4w4!', { force: true });
    cy.get('button.font-bold').click({ force: true });

    cy.wait(3000);
    dismissTutorialIfPresent();

    cy.get('button[title="Open menu"]').click();
    cy.contains('Admin').should('not.exist');
    cy.get('div.fixed.inset-0').click({ force: true });

    cy.visit('http://localhost:3000/admin/sites');
    cy.url().should('include', '/admin/sites', { timeout: 10000 });
    cy.get('[data-testid^="edit-site-button-"]').should('not.exist');
  });
});