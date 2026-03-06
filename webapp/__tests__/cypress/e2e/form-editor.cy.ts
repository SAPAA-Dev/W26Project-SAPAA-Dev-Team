describe('Admin Form Editor - Question Visibility', () => {
  beforeEach(() => {
    // Intercept the Supabase API call to load initial questions
    cy.intercept('GET', '**/rest/v1/W26_questions*').as('getQuestions');
    
    // Visit your local development server
    cy.visit('http://localhost:3000/admin/editor');
    
    // Wait for the initial data to load
    cy.wait('@getQuestions');
  });

  // it('should toggle the visibility of a question correctly', () => {
  //   // 1. Select the first question card
  //   cy.get('[class*="QuestionCard"]').first().as('targetCard');

  //   // 2. Check if it is currently active (should not have the "Hidden" badge or dashed border)
  //   cy.get('@targetCard').should('not.contain', 'Hidden');
  //   cy.get('@targetCard').should('not.have.class', 'border-dashed');

  //   // 3. Click the Visibility (Eye) button
  //   // Note: We use {force: true} if the button is only visible on hover
  //   cy.get('@targetCard').find('button[title="Hide Question"]').click({ force: true });

  //   // 4. Assert visual changes for the "Hidden" state
  //   cy.get('@targetCard').should('contain', 'Hidden');
  //   cy.get('@targetCard').should('have.class', 'opacity-60');
  //   cy.get('@targetCard').should('have.class', 'border-dashed');

  //   // 5. Verify the Preview Pane also shows the hidden status
  //   cy.get('@targetCard').click(); // Select the question to update preview
  //   cy.get('div').contains('Hidden from Form').should('be.visible');
  // });

  // it('should clear the preview when switching sections', () => {
  //   // 1. Select a question to open the preview
  //   cy.get('[class*="QuestionCard"]').first().click();
  //   cy.contains('Live Preview').should('be.visible');

  //   // 2. Click on a different section tab
  //   // Adjust the selector to match your section button styling
  //   cy.get('button').contains('Section 2').click();

  //   // 3. Assert that the preview is cleared and shows the placeholder
  //   cy.contains('Select a question to see preview').should('be.visible');
  //   cy.contains('Live Preview').should('not.exist');
  // });
});
