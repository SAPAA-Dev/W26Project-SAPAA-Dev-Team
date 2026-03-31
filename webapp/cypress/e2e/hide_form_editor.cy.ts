/// <reference types="cypress" />

const TEST_RESPONSE_ID = 3237;

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

function navigateToFormEditor() {
  cy.visit('http://localhost:3000/');
  cy.get('#email').click().type('jason.liang5129@gmail.com');
  cy.get('#password').click().type('123Abc@@');
  cy.get('button.font-bold').click();

  cy.wait(3000);
  dismissTutorialIfPresent();

  cy.url({ timeout: 15000 }).should('include', '/sites');

  cy.get('button[title="Open menu"]').click();
  cy.contains('Go to admin dashboard').click();
  cy.url({ timeout: 15000 }).should('include', '/admin/dashboard');

  cy.visit('http://localhost:3000/admin/form-editor');
  cy.url({ timeout: 15000 }).should('include', '/admin/form-editor');
}

describe('Admin Form Editor - Question Visibility', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    navigateToFormEditor();
  });

  it('should be able to hide a question and verify hidden questions are not visible when making new reports nor editing reports', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      const nextTestId = testId.replace('3', '4');
      if (testId == "section-button-3") {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains("General Information");
        cy.contains('Email (Q11)');
        cy.get('[data-testid="Email (Q11) Hide Button"]', { timeout: 10000 }).click();
        cy.get(`[data-testid="${nextTestId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get('[data-testid="Email (Q11) Show Button"]', { timeout: 10000 }).should('exist');
      }
    });

    // Navigate home via direct visit — form editor has no navbar
    cy.visit('http://localhost:3000/sites');
    cy.url().should('include', '/sites', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.contains('Riverlot 56', { timeout: 5000 }).should('be.visible').scrollIntoView().click();
    cy.url().should('include', '/detail', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.contains('New Site Inspection Report', { timeout: 10000 }).should('be.visible').click();
    cy.url().should('include', '/new-report', { timeout: 10000 });

    cy.wait(5000);
    cy.get('[data-testid="fine-print-modal"]').click('topLeft', { force: true });
    cy.get('[data-testid="terms-checkbox"]').check();
    cy.get('[data-testid="terms-checkbox"]').should('be.checked');
    cy.get('[data-testid="fine-print-modal"] button.text-white').should('not.have.attr', 'disabled');
    cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').click();
    cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').should('not.exist');
    cy.get('[data-testid="fine-print-modal"]').should('not.exist');

    cy.wait(3000);
    cy.get(`[data-testid="Email (Q11)-question-title"]`, { timeout: 10000 }).should('not.exist');
    cy.get('[data-testid="fine-print-modal"]', { timeout: 10000 }).should('not.exist');
    cy.get(`[data-testid="back-button"]`).click();

    cy.wait(2000);
    cy.visit(`http://localhost:3000/detail/Riverlot%2056%20(NA)/edit-report/${TEST_RESPONSE_ID}`);
    cy.contains('Edit Inspection Report', { timeout: 10000 }).should('be.visible');
    cy.get(`[data-testid="Email (Q11)-question-title"]`, { timeout: 10000 }).should('not.exist');
  });

  it('should verify hidden questions still have their answers shows in past reports', () => {
    cy.visit('http://localhost:3000/sites');
    cy.url().should('include', '/sites', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.url().should('include', '/detail', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.get(`[data-testid="expand-inspection-button"]`, { timeout: 10000 }).first().click();
    cy.contains("SECTION: General Information");
    cy.contains("Email (Q11):");
  });

  it('should be able to show a question and verify re-shown questions are visible when making new reports plus editing reports', () => {
    cy.contains('Form Editor').should('be.visible');

    cy.get('[data-testid^="section-button-"]', { timeout: 5000 })
      .should('have.length.at.least', 1)
      .each(($el) => {
        const testId = $el.attr('data-testid') ?? 'null-testid';
        const nextTestId = testId.replace('3', '4');
        if (testId == "section-button-3") {
          cy.get(`[data-testid="${testId}"]`).click();
          cy.get(`[data-testid="${testId}"]`).click();
          cy.contains("General Information");
          cy.contains('Email (Q11)');
          cy.get('[data-testid="Email (Q11) Show Button"]', { timeout: 10000 }).click();
          cy.get(`[data-testid="${nextTestId}"]`).click();
          cy.get(`[data-testid="${testId}"]`).click();
          cy.get('[data-testid="Email (Q11) Hide Button"]', { timeout: 10000 }).should('exist');
        }
      });

    cy.visit('http://localhost:3000/sites');
    cy.url().should('include', '/sites', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.url().should('include', '/detail', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.contains('New Site Inspection Report', { timeout: 10000 }).should('be.visible').click();
    cy.url().should('include', '/new-report', { timeout: 10000 });

    cy.wait(5000);
    cy.get('[data-testid="fine-print-modal"]').click('topLeft', { force: true });
    cy.get('[data-testid="terms-checkbox"]').check();
    cy.get('[data-testid="terms-checkbox"]').should('be.checked');
    cy.get('[data-testid="fine-print-modal"] button.text-white').should('not.have.attr', 'disabled');
    cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').click();
    cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').should('not.exist');
    cy.get('[data-testid="fine-print-modal"]').should('not.exist');

    cy.wait(3000);
    cy.contains('WhoRYou', { timeout: 15000 }).click();
    cy.contains('Email', { timeout: 15000 }).should('be.visible');
    cy.get(`[data-testid="back-button"]`).click();

    cy.wait(2000);
    cy.visit(`http://localhost:3000/detail/Riverlot%2056%20(NA)/edit-report/${TEST_RESPONSE_ID}`);
    cy.contains('Edit Inspection Report', { timeout: 10000 }).should('be.visible');
    cy.contains('WhoRYou', { timeout: 15000 }).click();
    cy.get(`[data-testid="Email (Q11)-question-title"]`, { timeout: 10000 }).should('exist');
  });
});