/// <reference types="cypress" />

describe('Admin Form Editor - Question Visibility', () => {
  beforeEach(() => {  
    // cy.loginByApi(); // this doesnt work right now

    cy.visit('http://localhost:3000/')
    cy.get('#email').click();
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').click();
    cy.get('#password').type('123Gctrmomy@');
    cy.get('button.font-bold').click();

    // // Intercept the Supabase API call to load initial questions
    // cy.intercept('GET', '**/rest/v1/W26_questions*').as('getQuestions');
    
    // // Wait for the initial data to load
    // cy.wait('@getQuestions');
  });

  it('should successfully login', function() {
    cy.contains("Monitor and track site inspections across Alberta")
  });

  it('should access the form editor through the admin dashboard', function() {
    cy.get('button.text-white').click();
    cy.contains('Admin').first().click();
    cy.get('button[title="admin dropdown menu"]').click();
    cy.contains('Form Editor').click();
    cy.contains("Manage inspection form sections and questions").should('be.visible')
  });

  // it('should toggle the visibility of a question correctly', () => {
  //   // Select the first question card
  //   // Note: The selector corresponds to the QuestionCard component in your page.tsx
  //   cy.get('div').filter(':contains("Untitled Question")').first().as('targetCard');

  //   // Click the Visibility (Eye) button
  //   cy.get('@targetCard').find('button[title="Hide Question"]').click({ force: true });

  //   // Assert visual changes based on the state logic in your page.tsx
  //   // Since page.tsx uses a toggle, we verify the icon or class changes
  //   cy.get('@targetCard').find('svg').should('exist');
  // });

  // it('should clear the preview when switching sections', () => {
  //   // Select a question to open the preview in the PreviewPanel
  //   cy.get('div').filter(':contains("Untitled Question")').first().click();
    
  //   // Click on a different section tab in the Sidebar
  //   cy.get('button').contains('Section 2').click();

  //   // Assert that the preview is cleared and shows the placeholder text from page.tsx
  //   cy.contains('Select a question to preview').should('be.visible');
  // });
});
