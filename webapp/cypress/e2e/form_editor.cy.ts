/// <reference types="cypress" />

describe('Admin Form Editor - Question Visibility', () => {
  beforeEach(() => {  
    cy.visit('http://localhost:3000/')
    cy.get('#email').click();
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').click();
    cy.get('#password').type('123Gctrmomy@');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.contains('Admin').first().click();
    cy.wait(1000);
    cy.get('button[title="admin dropdown menu"]').click();
    cy.contains('Form Editor').click();
    cy.url().should('include', '/admin/form-editor')
  });

  it('should be able to access the form editor through the admin dashboard', function() {
    cy.contains("Manage inspection form sections and questions").should('be.visible')
  });

  it('should have each section button display the correct amount of questions the section actually contains', () => {
    // 1. Get all section buttons
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      // 2. Get the ID and expected count while the element is still stable
      const testId = $el.attr('data-testid') ?? 'null-testid';
      const sectionId = testId.replace('section-button-', '');
      
      // Use cy.get with the specific ID instead of wrapping the old element ($el)
      // This ensures Cypress finds the "fresh" version of the button if it re-renders
      cy.get(`[data-testid="${testId}"]`).click();

      // 3. Find the badge using the ID and verify the count
      cy.get(`[data-testid="section-count-${sectionId}"]`).then(($badge) => {
        const expectedCount = parseInt($badge.text().trim(), 10);

        // 4. Verify the main content area
        if (expectedCount === 0) {
          cy.contains('No questions in this section yet.').should('be.visible');
        } else {
          // Target the container that holds your QuestionCards
          cy.get('.space-y-3').find('> div').should('have.length', expectedCount);
        }
      });
      
      cy.log(`Successfully verified section ${sectionId}`);
    });
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
        cy.get('[data-testid="Email (Q11) Hide Button"]').click();
        // Refresh the section to verify the question is
        cy.get(`[data-testid="${nextTestId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        // Verify the title changed to "Show Question" (confirming it's now hidden)
        cy.get('[data-testid="Email (Q11) Show Button"]').should('exist');
      } 
    });

    cy.get('svg.lucide-house').click();
    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.contains('New Site Inspection Report').click();
    cy.contains('I have read and agree to the terms and conditions').click();
    cy.contains('Continue to Form').click();
    cy.get(`[data-testid="Email (Q11)-question-title"]`).should('not.exist');
    cy.get(`[data-testid="back-button"]`).click();

    // Verifying editing reports
    cy.get(`[data-testid="edit-form-button"]`).click();
    cy.get(`[data-testid="Email (Q11)-question-title"]`).should('not.exist');
  });

  it('should verify hidden questions still have their answers shows in past reports', () => {
    // Verifying past reports
    cy.get('svg.lucide-house').click();
    cy.wait(3000);
    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.get(`[data-testid="expand-inspection-button"]`).first().click()
    cy.contains("SECTION: General Information");
    cy.contains("Email (Q11):");
  });

  it('should be able to show a question and verify re-shown questions are visible when making new reports plus editing reports', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      const nextTestId = testId.replace('3', '4');
      if (testId == "section-button-3") {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains("General Information");
        cy.contains('Email (Q11)');
        cy.get('[data-testid="Email (Q11) Show Button"]').click();
        // Refresh the section to verify the question is
        cy.get(`[data-testid="${nextTestId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        // Verify the title changed to "Show Question" (confirming it's now hidden)
        cy.get('[data-testid="Email (Q11) Hide Button"]').should('exist');
      } 
    });

    // Verifying new reports
    cy.get('svg.lucide-house').click();
    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.contains('New Site Inspection Report').click();
    cy.contains('I have read and agree to the terms and conditions').click();
    cy.contains('Continue to Form').click();
    cy.contains('Continue to Form').click();
    cy.get(`[data-testid="Email (Q11)-question-title"]`).should('exist');
    cy.get(`[data-testid="back-button"]`).click();

    // Verifying editing reports
    cy.get(`[data-testid="edit-form-button"]`).click();
    cy.get(`[data-testid="Email (Q11)-question-title"]`).should('exist');
  });
});