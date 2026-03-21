/// <reference types="cypress" />
// US 1.0.17 – (Admin) Add Questions Site Inspections Form
describe('Admin Form Editor - Adding Questions', () => {
  beforeEach(() => {  
    cy.visit('http://localhost:3000/')
    cy.get('#email').click();
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').click();
    cy.get('#password').type('123Gctrmomy@');
    cy.get('button.font-bold').click();
    cy.get('button.text-white').click();
    cy.wait(5000);
    cy.contains('Admin').first().click();
    cy.wait(5000);
    cy.get('button[title="admin dropdown menu"]').scrollIntoView().click();
    cy.contains('Form Editor').scrollIntoView().click();
    cy.wait(5000);
    cy.url().should('include', '/admin/form-editor')
  });

  after(() => {
    // This runs once after all tests in this block are finished
    cy.task('cleanupTestQuestion', "Question Test (Q10)");
  });

  // Able to add new questions to the Site Inspection Form and save the form.
  // Other users who access the Site Inspection Form will be able to see the new questions
  it('should be able to add new questions and have them be visible on the site inspection form', function() {
    // Get all section buttons
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      if (testId == "section-button-3") {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains("General Information");
        cy.contains('Email (Q11)');

        // Editing a question by adding information and saving it
        cy.contains("Add Question").first().click();
        cy.get('[data-testid="add-question-title"]').click().type("Question Test (Q10)");
        cy.get('[data-testid="add-question-subtext"]').click().type("Test Description");
        cy.get('[data-testid="add-question-key"]').click().type("Q10_QuestionTest");
        cy.get('[data-testid="question-type-Text"]').click();
        cy.get('[data-testid="save-new-question"]').click();
        cy.contains("Question Test (Q10)");
      } 
    });

    cy.get('svg.lucide-house').scrollIntoView().click();
    cy.wait(4000);
    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.wait(4000);
    cy.contains('New Site Inspection Report').click();
    cy.wait(4000);
    cy.contains('I have read and agree to the terms and conditions').click();
    cy.contains('Continue to Form').click();
    cy.contains('Q10');
    cy.contains('Question Test');
  });
});

// Users who are not admins cannot add questions to the form
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