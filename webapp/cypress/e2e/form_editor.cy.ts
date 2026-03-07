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
    cy.get('button.text-white').click();
    cy.contains('Admin').first().click();
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

  // cy.get('[data-testid="section-button-3"] span.truncate').click();
  it('should be able to hide a question', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      if (testId == "section-button-3") {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains("General Information");
        cy.contains('Email (Q11)');
        cy.get('[data-testid="Email (Q11) Hide Button"]').click();
        // Verify the title changed to "Show Question" (confirming it's now hidden)
        cy.get('[data-testid="Email (Q11) Show Button"]').should('exist');
      } 
    });
  });

  it('should verify hidden questions are gone from reports', () => {
    cy.get('svg.lucide-house').click();
    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.get(`[data-testid="edit-form-button"]`).click();
    cy.get('.your-element').should('not.be.visible');
    cy.get('.your-element').should('not.exist');
  });
 

  // it('should send the correct update request to Supabase without modifying the DB', () => {
  //   const updatedTitle = 'Updated Question Title';
  //   const updatedSubtext = 'Updated Question Description/Subtext';

  //   // 1. Intercept the PATCH request to your specific Supabase table
  //   // We use a wildcard for the ID and return a mock 200 OK response
  //   cy.intercept('PATCH', '**/rest/v1/W26_questions*', {
  //     statusCode: 200,
  //     body: [{ success: true }]
  //   }).as('updateQuestion');

  //   // 2. Navigate to a section and click "Edit" on the first question
  //   cy.get('[data-testid^="section-button-"]').first().click();
  //   cy.get('[data-testid="edit-question-icon"]').first().click();

  //   // 3. Clear and type new values into the form
  //   cy.get('[data-testid="edit-question-title"]').clear().type(updatedTitle);
  //   cy.get('[data-testid="edit-question-subtext"]').clear().type(updatedSubtext);

  //   // 4. Click save
  //   cy.get('[data-testid="save-question-button"]').click();

  //   // 5. Verify the request intercepted by Cypress matches our input
  //   cy.wait('@updateQuestion').then((interception) => {
  //     // Assert that the body sent to Supabase contains our new text
  //     expect(interception.request.body.question_text).to.equal(updatedTitle);
  //     expect(interception.request.body.subtext).to.equal(updatedSubtext);
  //   });

  //   // 6. Optional: Verify UI feedback (if you have a toast or success message)
  //   cy.contains('Question updated').should('be.visible');
  // });

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