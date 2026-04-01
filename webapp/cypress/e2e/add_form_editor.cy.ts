/// <reference types="cypress" />

// Helper to dismiss the tutorial if it appears
function dismissTutorialIfPresent() {
  cy.wait(3000);
  cy.get('body').then(($body) => {
    if ($body.find('.react-joyride__overlay').length > 0) {
      // Find and click the skip/close button inside the joyride tooltip
      cy.get('[data-testid="tutorial-skip"], [aria-label="Skip"], button[data-action="skip"], button[data-action="close"]')
        .first()
        .click({ force: true });
    }
  });
}

// Helper to open the hamburger menu and click a nav item by label
function hamburgerNavigateTo(label: string) {
  // Sites page uses "Open menu", admin pages use "user dropdown menu"
  cy.get('button[title="Open menu"], button[title="user dropdown menu"]')
    .first()
    .click();
  cy.contains(label).click();
}
// US 1.0.17 – (Admin) Add Questions Site Inspections Form
describe('Admin Form Editor - Adding Questions', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/');
    cy.get('#email').click().type('jason.liang5129@gmail.com');
    cy.get('#password').click().type('123Abc@@');
    cy.get('button.font-bold').click();

    // Dismiss the "first login" tutorial overlay if it appears
    cy.wait(3000);
    dismissTutorialIfPresent();

    // Navigate to admin dashboard via hamburger menu
    hamburgerNavigateTo('Go to admin dashboard');
    cy.wait(3000);

    // Navigate to form editor via the admin panel's own dropdown
    cy.get('button[title="admin dropdown menu"]').scrollIntoView().click();
    cy.contains('Form Editor').scrollIntoView().click();

    cy.wait(3000);
    cy.url().should('include', '/admin/form-editor');
  });

  after(() => {
    cy.task('cleanupTestQuestion', 'Question Test (Q10)');
  });

  it('should be able to add new questions and have them be visible on the site inspection form', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      if (testId === 'section-button-3') {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains('General Information');
        cy.contains('Email (Q11)');

        cy.contains('Add Question').first().click();
        cy.get('[data-testid="add-question-title"]').click().type('Question Test (Q10)');
        cy.get('[data-testid="add-question-subtext"]').click().type('Test Description');
        cy.get('[data-testid="add-question-key"]').click().type('Q10_QuestionTest');
        cy.get('[data-testid="question-type-Text"]').click();
        cy.get('[data-testid="save-new-question"]').click();
        cy.contains('Question Test (Q10)');
      }
    });

     // Navigate directly — form editor and new-report pages have no reliable navbar
      cy.visit('http://localhost:3000/sites');
      cy.url().should('include', '/sites', { timeout: 10000 });
      dismissTutorialIfPresent();

      cy.contains('Riverlot 56').scrollIntoView().click();
      cy.url().should('include', '/detail', { timeout: 10000 });
      dismissTutorialIfPresent();

      cy.contains('New Site Inspection Report').click();
      cy.url().should('include', '/new-report', { timeout: 10000 });

      cy.contains('I have read and agree to the terms and conditions').click();
      cy.contains('Continue to Form').click();
      cy.contains('Q10');
      cy.contains('Question Test');``

  });
});

// Users who are not admins cannot add questions to the form
describe('User View - No Admin Form Editor', () => {
  it('should disallow users from accessing the admin panel', () => {
    cy.visit('http://localhost:3000/');
    cy.get('#email').click().type('awayt7398@gmail.com');
    cy.get('#password').click().type('Throw4w4!');
    cy.get('button.font-bold').click();

    cy.wait(3000);
    dismissTutorialIfPresent();

    // Open hamburger and confirm Admin option is absent
    cy.get('button[title="Open menu"]').click();
    cy.contains('Admin').should('not.exist');
  });
});