/// <reference types="cypress" />
// US 1.0.30 – (Admin) Edit Site Profile
// As an Admin, I want to be able to update a profile for each site,
// so that users of the app can stay informed about the state of the site.

Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('Invalid or unexpected token')) {
    return false;
  }
});

const TEST_SITE_NAME = 'Riverlot 56 (NA)';
const UPDATED_SITE_NAME = 'Riverlot 56 (NA) - Edited';

describe('Admin Edit Site Profile', () => {
  let originalCountyId: number | null = null;

  before(() => {
    // Capture original site info for cleanup
    cy.task('getSiteInfo', TEST_SITE_NAME).then((site: any) => {
      if (site) {
        originalCountyId = site.ab_county;
      }
    });
  });

  after(() => {
    // Restore site to original state after all tests
    // The site name may have been changed, so try both names
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

  // Helper: login as admin and navigate to admin sites
  function loginAsAdmin() {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('jason.liang5129@gmail.com', { force: true });
    cy.get('#password').type('123Abc@@', { force: true });
    cy.get('button.font-bold').click({ force: true });
    cy.get('button.text-white').click({ force: true });
    cy.wait(5000);
    cy.contains('Admin', { timeout: 15000 }).first().click();
    cy.wait(5000);
    cy.get('button[title="admin dropdown menu"]', { timeout: 10000 }).click();
    cy.contains('Sites').click();
    cy.url().should('include', '/admin/sites');
    // Wait for site cards to be loaded
    cy.get('[data-testid^="edit-site-button-"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
  }

  // Helper: open the edit modal for a given site and wait for it to be ready
  function openEditModal(siteName: string) {
    cy.contains(siteName, { timeout: 10000 })
      .closest('.group')
      .find('[data-testid^="edit-site-button-"]')
      .click();
    cy.get('[data-testid="edit-site-modal"]', { timeout: 10000 }).should('be.visible');
    // Wait for the input to be enabled (not in saving state)
    cy.get('[data-testid="edit-site-name-input"]', { timeout: 10000 }).should('not.be.disabled');
  }

  // Admins can access option to edit site profile
  it('should show edit (pencil) button on site cards for admins', () => {
    loginAsAdmin();
    cy.get('[data-testid^="edit-site-button-"]').should('have.length.greaterThan', 0);
  });

  // Admins can open the edit modal
  it('should open edit site modal when pencil button is clicked', () => {
    loginAsAdmin();
    openEditModal(TEST_SITE_NAME);
    cy.get('[data-testid="edit-site-name-input"]').should('have.value', TEST_SITE_NAME);
  });

  // Name of site should be able to be updated
  it('should update the site name', () => {
    loginAsAdmin();
    openEditModal(TEST_SITE_NAME);

    // Clear and type new name
    cy.get('[data-testid="edit-site-name-input"]').clear().type(UPDATED_SITE_NAME);
    cy.get('[data-testid="edit-site-save-button"]').click();

    // Modal should close and card should show updated name
    cy.get('[data-testid="edit-site-modal"]', { timeout: 10000 }).should('not.exist');
    cy.contains(UPDATED_SITE_NAME, { timeout: 10000 }).should('be.visible');

    // Revert name back for subsequent tests
    openEditModal(UPDATED_SITE_NAME);
    cy.get('[data-testid="edit-site-name-input"]').clear().type(TEST_SITE_NAME);
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]', { timeout: 10000 }).should('not.exist');
    cy.contains(TEST_SITE_NAME, { timeout: 10000 }).should('be.visible');
  });
});

// Non-admin users cannot access option to edit site profile
describe('Non-Admin Cannot Edit Site Profile', () => {
  it('should not show the admin panel or edit buttons to steward users', () => {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('awayt7398@gmail.com', { force: true });
    cy.get('#password').type('Throw4w4!', { force: true });
    cy.get('button.font-bold').click({ force: true });
    cy.get('button.text-white').click({ force: true });
    cy.wait(5000);

    // Non-admin should not see Admin menu at all
    cy.contains('Admin').should('not.exist');

    // Non-admin cannot directly navigate to admin sites page
    cy.visit('http://localhost:3000/admin/sites');
    cy.wait(3000);
    cy.get('[data-testid^="edit-site-button-"]').should('not.exist');
  });
});
