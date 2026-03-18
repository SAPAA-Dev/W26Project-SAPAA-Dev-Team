/// <reference types="cypress" />
// US 1.0.30 – (Admin) Edit Site Profile
// As an Admin, I want to be able to update a profile for each site,
// so that users of the app can stay informed about the state of the site.

const TEST_SITE_NAME = 'Riverlot 56 (NA)';
const UPDATED_SITE_NAME = 'Riverlot 56 (NA) - Edited';
const UPDATED_COUNTY = 'Clearwater County';

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
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').type('123Gctrmomy@');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.wait(5000);
    cy.contains('Admin').first().click();
    cy.wait(5000);
    cy.get('button[title="admin dropdown menu"]').click();
    cy.contains('Sites').click();
    cy.url().should('include', '/admin/sites');
    cy.wait(3000);
  }

  // Helper: login as steward (non-admin)
  function loginAsSteward() {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('awayt7398@gmail.com');
    cy.get('#password').type('Throw4w4!');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.wait(5000);
  }

  // Admins can access option to edit site profile
  it('should show edit (pencil) button on site cards for admins', () => {
    loginAsAdmin();
    cy.get('[data-testid^="edit-site-button-"]').should('have.length.greaterThan', 0);
  });

  // Admins can open the edit modal
  it('should open edit site modal when pencil button is clicked', () => {
    loginAsAdmin();
    cy.contains(TEST_SITE_NAME)
      .closest('.group')
      .find('[data-testid^="edit-site-button-"]')
      .click();
    cy.get('[data-testid="edit-site-modal"]').should('be.visible');
    cy.get('[data-testid="edit-site-name-input"]').should('have.value', TEST_SITE_NAME);
  });

  // Name of site should be able to be updated
  it('should update the site name', () => {
    loginAsAdmin();
    cy.contains(TEST_SITE_NAME)
      .closest('.group')
      .find('[data-testid^="edit-site-button-"]')
      .click();
    cy.get('[data-testid="edit-site-modal"]').should('be.visible');

    // Clear and type new name
    cy.get('[data-testid="edit-site-name-input"]').clear().type(UPDATED_SITE_NAME);
    cy.get('[data-testid="edit-site-save-button"]').click();

    // Modal should close and card should show updated name
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');
    cy.contains(UPDATED_SITE_NAME).should('be.visible');

    // Revert name back for subsequent tests
    cy.contains(UPDATED_SITE_NAME)
      .closest('.group')
      .find('[data-testid^="edit-site-button-"]')
      .click();
    cy.get('[data-testid="edit-site-name-input"]').clear().type(TEST_SITE_NAME);
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');
    cy.contains(TEST_SITE_NAME).should('be.visible');
  });

  // County of site can be updated
  it('should update the county of a site', () => {
    loginAsAdmin();
    cy.contains(TEST_SITE_NAME)
      .closest('.group')
      .find('[data-testid^="edit-site-button-"]')
      .click();
    cy.get('[data-testid="edit-site-modal"]').should('be.visible');

    // Clear existing county if any (click the X button)
    cy.get('[data-testid="edit-site-modal"]').then(($modal) => {
      const clearBtn = $modal.find('button').filter((_, el) => {
        return el.querySelector('svg.lucide-x') !== null && el.closest('[data-testid="edit-site-modal"] .p-6') !== null;
      });
      if (clearBtn.length > 0) {
        cy.wrap(clearBtn.first()).click();
      }
    });

    // Search and select new county
    cy.get('[data-testid="edit-site-county-search"]').type(UPDATED_COUNTY);
    cy.get('[data-testid="edit-site-modal"]')
      .find('div.cursor-pointer')
      .first()
      .trigger('mousedown', { bubbles: true });

    // Verify county is displayed as selected
    cy.get('[data-testid="edit-site-modal"]').contains(UPDATED_COUNTY).should('be.visible');

    // Save
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');

    // Card should now show the updated county
    cy.contains(TEST_SITE_NAME)
      .closest('.group')
      .contains(UPDATED_COUNTY)
      .should('be.visible');
  });

  // Updates made to a site profile are visible to users
  it('should show updated county on the user-facing detail page', () => {
    // First update the county as admin
    loginAsAdmin();
    cy.contains(TEST_SITE_NAME)
      .closest('.group')
      .find('[data-testid^="edit-site-button-"]')
      .click();
    cy.get('[data-testid="edit-site-modal"]').should('be.visible');

    // Clear existing county
    cy.get('[data-testid="edit-site-modal"]').then(($modal) => {
      const clearBtn = $modal.find('button').filter((_, el) => {
        return el.querySelector('svg.lucide-x') !== null && el.closest('[data-testid="edit-site-modal"] .p-6') !== null;
      });
      if (clearBtn.length > 0) {
        cy.wrap(clearBtn.first()).click();
      }
    });

    // Select county
    cy.get('[data-testid="edit-site-county-search"]').type(UPDATED_COUNTY);
    cy.get('[data-testid="edit-site-modal"]')
      .find('div.cursor-pointer')
      .first()
      .trigger('mousedown', { bubbles: true });
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');
    cy.wait(2000);

    // Navigate to the user-facing detail page
    cy.visit(`http://localhost:3000/detail/${encodeURIComponent(TEST_SITE_NAME)}`);
    cy.wait(3000);

    // Verify both name and county are visible
    cy.contains(TEST_SITE_NAME).should('be.visible');
    cy.contains(UPDATED_COUNTY).should('be.visible');
  });
});

// Non-admin users cannot access option to edit site profile
describe('Non-Admin Cannot Edit Site Profile', () => {
  it('should not show the admin panel or edit buttons to steward users', () => {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('awayt7398@gmail.com');
    cy.get('#password').type('Throw4w4!');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.wait(5000);

    // Non-admin should not see Admin menu at all
    cy.contains('Admin').should('not.exist');

    // Non-admin cannot directly navigate to admin sites page
    cy.visit('http://localhost:3000/admin/sites');
    cy.wait(3000);
    cy.get('[data-testid^="edit-site-button-"]').should('not.exist');
  });
});
