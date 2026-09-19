/// <reference types="cypress" />

const DISABLE_TEST_SITE = 'Riverlot 56 (NA)';

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

describe('Admin Disable Site Profile', () => {
  afterEach(() => {
    cy.task('setSiteActive', { namesite: DISABLE_TEST_SITE, is_active: true });
  });

  function loginAsAdmin() {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').type('123Abc@@');
    cy.get('button.font-bold').click();

    cy.wait(3000);
    dismissTutorialIfPresent();

    cy.get('button[title="Open menu"]').click();
    cy.contains('Go to admin dashboard').click();
    cy.url().should('include', '/admin/dashboard', { timeout: 10000 });

    cy.get('button[title="admin dropdown menu"]').click();
    cy.contains('Sites').click();
    cy.url().should('include', '/admin/sites', { timeout: 10000 });
  }

  function openEditModal() {
    cy.contains(DISABLE_TEST_SITE)
      .closest('.group')
      .find('[data-testid^="edit-site-button-"]')
      .click();
    cy.get('[data-testid="edit-site-modal"]').should('be.visible');
  }

  it('should show a visibility toggle in the edit site modal', () => {
    loginAsAdmin();
    openEditModal();

    cy.get('[data-testid="edit-site-active-toggle"]').should('be.visible');
    cy.get('[data-testid="edit-site-active-toggle"]').should('have.attr', 'aria-checked', 'true');
    cy.contains('Visible to all users').should('be.visible');
  });

  it('should disable a site via the visibility toggle and save', () => {
    loginAsAdmin();
    openEditModal();

    cy.get('[data-testid="edit-site-active-toggle"]').click();
    cy.contains('Hidden from users').should('be.visible');
    cy.get('[data-testid="edit-site-active-toggle"]').should('have.attr', 'aria-checked', 'false');

    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');

    // After save, app may redirect to dashboard — navigate back to admin/sites
    cy.url().then((url) => {
      if (!url.includes('/admin/sites')) {
        cy.visit('http://localhost:3000/admin/sites');
        cy.url().should('include', '/admin/sites', { timeout: 10000 });
      }
    });

    cy.contains(DISABLE_TEST_SITE)
      .closest('.group')
      .contains('Inactive')
      .should('be.visible');
  });

  it('should hide disabled site from the user-facing sites page', () => {
    loginAsAdmin();
    openEditModal();
    cy.get('[data-testid="edit-site-active-toggle"]').click();
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');

    cy.visit('http://localhost:3000/sites');
    cy.url().should('include', '/sites', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.contains(DISABLE_TEST_SITE).should('not.exist');
  });

  it('should not allow users to view the detail page of a disabled site', () => {
    cy.task('setSiteActive', { namesite: DISABLE_TEST_SITE, is_active: false });

    cy.visit('http://localhost:3000/');
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').type('123Abc@@');
    cy.get('button.font-bold').click();

    cy.wait(3000);
    dismissTutorialIfPresent();

    cy.visit(`http://localhost:3000/detail/${encodeURIComponent(DISABLE_TEST_SITE)}`);
    cy.url().should('include', '/detail', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.get('body').then(($body) => {
      expect($body.text()).to.not.include('New Site Inspection Report');
    });
  });

  it('should re-enable a disabled site via the visibility toggle', () => {
    cy.task('setSiteActive', { namesite: DISABLE_TEST_SITE, is_active: false });

    loginAsAdmin();

    cy.contains(DISABLE_TEST_SITE).should('be.visible');
    cy.contains(DISABLE_TEST_SITE)
      .closest('.group')
      .contains('Inactive')
      .should('be.visible');

    openEditModal();
    cy.get('[data-testid="edit-site-active-toggle"]').should('have.attr', 'aria-checked', 'false');
    cy.get('[data-testid="edit-site-active-toggle"]').click();
    cy.contains('Visible to all users').should('be.visible');
    cy.get('[data-testid="edit-site-save-button"]').click();
    cy.get('[data-testid="edit-site-modal"]').should('not.exist');

    cy.contains(DISABLE_TEST_SITE)
      .closest('.group')
      .find('span')
      .contains('Inactive')
      .should('not.exist');

    cy.visit('http://localhost:3000/sites');
    cy.url().should('include', '/sites', { timeout: 10000 });
    dismissTutorialIfPresent();
    cy.contains(DISABLE_TEST_SITE).should('be.visible');
  });
});

describe('Non-Admin Cannot Disable Site Profile', () => {
  it('should not expose the admin panel or visibility toggle to steward users', () => {
    cy.visit('http://localhost:3000/');
    cy.get('#email').type('awayt7398@gmail.com');
    cy.get('#password').type('Throw4w4!');
    cy.get('button.font-bold').click();

    cy.wait(3000);
    dismissTutorialIfPresent();

    // Open hamburger and confirm Admin option is absent
    cy.get('button[title="Open menu"]').click();
    cy.contains('Admin').should('not.exist');
     // close menu

    // Non-admin cannot access admin sites page directly
    cy.visit('http://localhost:3000/admin/sites');
    cy.url().should('include', '/admin/sites', { timeout: 10000 });

    cy.get('[data-testid^="edit-site-button-"]').should('not.exist');
    cy.get('[data-testid="edit-site-active-toggle"]').should('not.exist');
  });
});