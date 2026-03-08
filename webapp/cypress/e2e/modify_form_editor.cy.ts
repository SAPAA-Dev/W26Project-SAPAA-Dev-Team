/// <reference types="cypress" />
// US 1.0.24 – Modify my Site Inspections Form Questions
describe('Admin Form Editor - Editing Questions', () => {
  beforeEach(() => {  
    cy.visit('http://localhost:3000/')
    cy.get('#email').click();
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').click();
    cy.get('#password').type('123Gctrmomy@');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.wait(4000);
    cy.contains('Admin').first().click();
    cy.wait(4000);
    cy.get('button[title="admin dropdown menu"]').click();
    cy.contains('Form Editor').click();
    cy.url().should('include', '/admin/form-editor')
  });

  // Admin should be able to access the form editor
  it('should be able to access the form editor through the admin dashboard', function() {
    cy.contains("Manage inspection form sections and questions").should('be.visible')
  });

  // Form editor should display the right number of questions
  it('should have each section button display the correct amount of questions the section actually contains', () => {
    // Get all section buttons
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      // Get the ID and expected count
      const testId = $el.attr('data-testid') ?? 'null-testid';
      const sectionId = testId.replace('section-button-', '');
      
      cy.get(`[data-testid="${testId}"]`, { timeout: 10000 }).click();

      // Find the badge using the ID and verify the count
      cy.get(`[data-testid="section-count-${sectionId}"]`).then(($badge) => {
        const expectedCount = parseInt($badge.text().trim(), 10);

        if (expectedCount === 0) {
          cy.contains('No questions in this section yet.').should('be.visible');
        } else {
          cy.get('.space-y-3').find('> div').should('have.length', expectedCount);
        }
      });
      
      cy.log(`Successfully verified section ${sectionId}`);
    });
  });

  // Able to modify questions in the Site Inspection Form to add, remove, or change information from a particular question
  it('should be able to modify questions to add, remove, or change information in it', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      if (testId == "section-button-3") {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains("General Information");
        cy.contains('Email (Q11)');

        // This question currently has no description/subtext in it
        // Editing a question by adding information and saving it
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.wait(5000);
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().type("hello this is a change");
        cy.get('[data-testid="save-question-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]').first().click();
        cy.contains("hello this is a change");

        // Editing a question to change information and saving it
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().clear().type("hello this is a second change");
        cy.get('[data-testid="save-question-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.contains("hello this is a second change");

        // If admin begins to edit a question, they can discard edits before officially submitting the change
        // Editing a question by changing information and cancelling
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().clear().type("hello this is a third change");
        cy.get('[data-testid="cancel-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.wait(2000);
        cy.contains("hello this is a second change");

        // Editing a question to remove information from it and saving
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().clear();
        cy.get('[data-testid="save-question-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.wait(2000);
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).should('have.value', '');
      } 
    });
  });

  // Other users who access the Site Inspection Form will be able to see the modified questions
  it('should be able to modify questions and have the changes be visible to users on the site inspection form', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      if (testId == "section-button-3") {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains("General Information");
        cy.contains('Email (Q11)');

        // Editing a question by adding information and saving it
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().type("hello this is a change");
        cy.wait(3000);
        cy.get('[data-testid="save-question-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.wait(2000);
        cy.contains("hello this is a change");
      }
    });

    cy.get('svg.lucide-house').click();
    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.wait(2000);
    cy.contains('New Site Inspection Report').click();
    cy.contains('I have read and agree to the terms and conditions').click();
    cy.contains('Continue to Form').click();
    cy.contains('hello this is a change');
  });

  it('undoing changes from previous tests', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      if (testId == "section-button-3") {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains("General Information");
        cy.contains('Email (Q11)');

        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().clear();
        cy.wait(2000);
        cy.get('[data-testid="save-question-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.wait(2000);
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).should('have.value', '');
      }
    });
  });
});

// Non-admin users cannot change or edit any questions
describe('User View - No Admin Form Editor', () => {
  it('should disallow users from accessing the admin panel that contains the form editor', () => {
    cy.visit('http://localhost:3000/')
    cy.get('#email').click();
    cy.get('#email').type('awayt7398@gmail.com');
    cy.get('#password').click();
    cy.get('#password').type('Throw4w4!');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.contains('Admin').should('not.exist')
  });
});