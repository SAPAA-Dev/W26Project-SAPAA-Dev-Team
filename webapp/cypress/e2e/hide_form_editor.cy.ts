/// <reference types="cypress" />

const TEST_RESPONSE_ID = 3237;

// US 1.0.25 – Hide a Site Inspections Form Questions
describe('Admin Form Editor - Question Visibility', () => {
  beforeEach(() => {  
    cy.viewport(1280, 720);
    cy.visit('http://localhost:3000/')
    cy.get('#email').click();
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').click();
    cy.get('#password').type('123Abc@@');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.wait(5000);
    cy.url({ timeout: 15000 }).should('include', '/sites');

    cy.get('body', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="admin-button"]', { timeout: 20000 })
      .should('exist')
      .should('be.visible')
      .click();
    cy.wait(5000);
    cy.url({ timeout: 15000 }).should('include', '/admin/dashboard');
    cy.get('button[title="admin dropdown menu"]').scrollIntoView().click();
    cy.contains('Form Editor').scrollIntoView().click();
    cy.wait(5000);
    cy.url({ timeout: 15000 }).should('include', '/admin/form-editor');
  });

  // If an admin toggles a question to be hidden, users can no longer access it when filling out the form
  // If an admin toggles a question to be hidden, users can no longer edit their responses to it in previous forms
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
        // Refresh the section to verify the question is
        cy.get(`[data-testid="${nextTestId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        // Verify the title changed to "Show Question" (confirming it's now hidden)
        cy.get('[data-testid="Email (Q11) Show Button"]', { timeout: 10000 }).should('exist');
      } 
    });
    
    cy.intercept('POST', '**/sites').as('getSites');
    cy.get('svg.lucide-house').click();
    cy.wait('@getSites');
    cy.contains('Riverlot 56', { timeout: 5000 })
      .should('be.visible')
      .scrollIntoView()
      .click();
    cy.contains('New Site Inspection Report', { timeout: 10000 })
      .should('be.visible')
      .click();


  cy.wait(5000);
  cy.get('[data-testid="fine-print-modal"]')
  .click('topLeft', { force: true });
  cy.get('[data-testid="terms-checkbox"]').check();
  // The terms and conditions checkbox is checked.
  cy.get('[data-testid="terms-checkbox"]')
    .should('be.checked')
  // The button is now enabled.
  cy.get('[data-testid="fine-print-modal"] button.text-white')
    .should('not.have.attr', 'disabled')
  
  cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').click();
  cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').should('not.exist');
  // The fine print modal is closed.
  cy.get('[data-testid="fine-print-modal"]')
    .should('not.exist')
    cy.wait(3000);
    cy.get(`[data-testid="Email (Q11)-question-title"]`, { timeout: 10000 }).should('not.exist');
    
    cy.get('[data-testid="fine-print-modal"]', { timeout: 10000 })
      .should('not.exist');
    
    cy.get(`[data-testid="back-button"]`).click();
    
    // Verifying editing reports
    cy.wait(2000);
    
    cy.visit(`http://localhost:3000/detail/Riverlot%2056%20(NA)/edit-report/${TEST_RESPONSE_ID}`);
    cy.contains('Edit Inspection Report', { timeout: 10000 }).should('be.visible');
    
    cy.get(`[data-testid="Email (Q11)-question-title"]`, { timeout: 10000 }).should('not.exist');
  });

  // If an admin toggles a question to be hidden, it will still be shown on existing / past reports
  it('should verify hidden questions still have their answers shows in past reports', () => {
    // Verifying past reports
    cy.get('svg.lucide-house').click();
    cy.wait(3000);
    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.get(`[data-testid="expand-inspection-button"]`, { timeout: 10000 }).first().click();
    cy.contains("SECTION: General Information");
    cy.contains("Email (Q11):");
  });

  // If an admin toggles a question to be visible, users will be able to access it when filling out the form
  // If an admin toggles a question to be visible, users will be able edit their responses to it in previous forms
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
        // Refresh the section to verify the question is
        cy.get(`[data-testid="${nextTestId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        // Verify the title changed to "Show Question" (confirming it's now hidden)
        cy.get('[data-testid="Email (Q11) Hide Button"]', { timeout: 10000 }).should('exist');
      } 
    });

    // Verifying new reports
    cy.get('svg.lucide-house').click();
    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.contains('New Site Inspection Report', { timeout: 10000 })
      .should('be.visible')
      .click();

  cy.wait(5000);
  cy.get('[data-testid="fine-print-modal"]')
  .click('topLeft', { force: true });
  cy.get('[data-testid="terms-checkbox"]').check();
  // The terms and conditions checkbox is checked.
  cy.get('[data-testid="terms-checkbox"]')
    .should('be.checked')
  // The button is now enabled.
  cy.get('[data-testid="fine-print-modal"] button.text-white')
    .should('not.have.attr', 'disabled')
  
  cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').click();
  cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').should('not.exist');
  // The fine print modal is closed.
  cy.get('[data-testid="fine-print-modal"]')
    .should('not.exist')

    cy.wait(3000);
      cy.contains('WhoRYou', { timeout: 15000 }).click();
    cy.contains('Email', { timeout: 15000 }).should('be.visible');
    cy.get(`[data-testid="back-button"]`).click();

    // Verifying editing reports
    cy.wait(2000);
    cy.visit(`http://localhost:3000/detail/Riverlot%2056%20(NA)/edit-report/${TEST_RESPONSE_ID}`);
    cy.contains('Edit Inspection Report', { timeout: 10000 }).should('be.visible');
    cy.contains('WhoRYou', { timeout: 15000 }).click();
    cy.get(`[data-testid="Email (Q11)-question-title"]`, { timeout: 10000 }).should('exist');
  });
});

