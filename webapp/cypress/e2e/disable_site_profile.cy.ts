/// <reference types="cypress" />
// US 1.0.31 – (Admin) Disable Site Profile
// As an Admin, I want to be able to disable the profile for a given site,
// so that I can keep what crown land is up to date.

const DISABLE_TEST_SITE = 'Riverlot 56 (NA)';

describe('Admin Disable Site Profile', () => {
  // Always restore the site to active after tests
  afterEach(() => {
    cy.task('setSiteActive', { namesite: DISABLE_TEST_SITE, is_active: true });
  });

  function loginAsAdmin() {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').type('123Abc@@');
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

  function openEditModal() {
    cy.contains(DISABLE_TEST_SITE)
      .closest('.group')
      .find('[data-testid^="edit-site-button-"]')
      .click();
    cy.get('[data-testid="edit-site-modal"]').should('be.visible');
  }

  // Admins have access to the option to disable a site profile
  it('should show a visibility toggle in the edit site modal', () => {
    loginAsAdmin();
    openEditModal();

    cy.get('[data-testid="edit-site-active-toggle"]').should('be.visible');
    cy.get('[data-testid="edit-site-active-toggle"]').should('have.attr', 'aria-checked', 'true');
    cy.contains('Visible to all users').should('be.visible');
  });

  // Site is disabled from the app
  it('should disable a site via the visibility toggle and save', () => {
    loginAsAdmin();
    openEditModal();

    // Toggle off
    cy.get('[data-testid="edit-site-active-toggle"]').click();
    cy.contains('Hidden from users').should('be.visible');
    cy.get('[data-testid="edit-site-active-toggle"]').should('have.attr', 'aria-checked', 'false');

    // Save changes
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');

    // Card should show Inactive badge
    cy.contains(DISABLE_TEST_SITE)
      .closest('.group')
      .contains('Inactive')
      .should('be.visible');
  });

  // Users cannot interact with the site anymore
  it('should hide disabled site from the user-facing sites page', () => {
    // First disable the site as admin
    loginAsAdmin();
    openEditModal();
    cy.get('[data-testid="edit-site-active-toggle"]').click();
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');
    cy.wait(2000);

    // Now visit the user sites page
    cy.visit('http://localhost:3000/sites');
    cy.wait(3000);

    // The disabled site should not appear
    cy.contains(DISABLE_TEST_SITE).should('not.exist');
  });

  // Users cannot interact with the site anymore (detail page)
  it('should not allow users to view the detail page of a disabled site', () => {
    // Disable the site via task
    cy.task('setSiteActive', { namesite: DISABLE_TEST_SITE, is_active: false });

    // Try to visit the detail page directly
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').type('123Abc@@');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.wait(5000);

    cy.visit(`http://localhost:3000/detail/${encodeURIComponent(DISABLE_TEST_SITE)}`);
    cy.wait(3000);

    // The site should not load its content (getSiteByName filters is_active=true)
    cy.get('body').then(($body) => {
      // Should not show site details - either error/empty state or redirected
      const text = $body.text();
      expect(text).to.not.include('New Site Inspection Report');
    });
  });

  // Admin can re-enable a disabled site
  it('should re-enable a disabled site via the visibility toggle', () => {
    // Disable the site first
    cy.task('setSiteActive', { namesite: DISABLE_TEST_SITE, is_active: false });

    loginAsAdmin();

    // Admin should still see the disabled site with Inactive badge
    cy.contains(DISABLE_TEST_SITE).should('be.visible');
    cy.contains(DISABLE_TEST_SITE)
      .closest('.group')
      .contains('Inactive')
      .should('be.visible');

    // Open edit modal and re-enable
    openEditModal();
    cy.get('[data-testid="edit-site-active-toggle"]').should('have.attr', 'aria-checked', 'false');
    cy.get('[data-testid="edit-site-active-toggle"]').click();
    cy.contains('Visible to all users').should('be.visible');
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');

    // Inactive badge should be gone
    cy.contains(DISABLE_TEST_SITE)
      .closest('.group')
      .find('span')
      .contains('Inactive')
      .should('not.exist');

    // Verify it's back on the user sites page
    cy.visit('http://localhost:3000/sites');
    cy.wait(3000);
    cy.contains(DISABLE_TEST_SITE).should('be.visible');
  });
});

// Non-admin users cannot access the option to disable a site profile
describe('Non-Admin Cannot Disable Site Profile', () => {
  it('should not expose the admin panel or visibility toggle to steward users', () => {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('awayt7398@gmail.com');
    cy.get('#password').type('Throw4w4!');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.wait(5000);

    // Non-admin should not see Admin menu
    cy.contains('Admin').should('not.exist');

    // Non-admin cannot access admin sites page directly
    cy.visit('http://localhost:3000/admin/sites');
    cy.wait(3000);

    // No edit buttons or toggle should be available
    cy.get('[data-testid^="edit-site-button-"]').should('not.exist');
    cy.get('[data-testid="edit-site-active-toggle"]').should('not.exist');
  });
});
