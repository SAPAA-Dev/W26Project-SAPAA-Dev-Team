/// <reference types="cypress" />
// US 1.0.30 – Rich Text Editor Formatting
describe('Rich Text Editor - Formatting', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/')
    cy.get('#email').click();
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').click();
    cy.get('#password').type('123Abc@@');
    cy.get('button.font-bold').click();
    cy.wait(1000);
    cy.get('button.text-white').click();
    cy.wait(5000);
    cy.contains('Admin').first().click({force: true});
    cy.wait(5000);
    cy.get('button[title="admin dropdown menu"]').click();
    cy.wait(2000);
    cy.contains('Form Editor').click();
    cy.wait(3000);
    cy.url().should('include', '/admin/form-editor')

    // Open a section and click edit on the first question to access the rich text editor
    cy.get('[data-testid^="section-button-"]').first().click();
    cy.wait(3000);
    cy.get('[data-testid="edit-question-button"]').first().click();
    cy.wait(2000);
  });

  it('should apply bold formatting when the Bold button is clicked', () => {
    const testText = 'bold text';
    cy.get('[data-testid="edit-question-subtext"]').clear().type(testText);
    cy.wait(1000);

    // Select the text
    cy.get('[data-testid="edit-question-subtext"]')
      .invoke('val')
      .then((val) => {
        cy.get('[data-testid="edit-question-subtext"]')
          .setSelection(0, testText.length);
      });
    cy.wait(1000);

    // Click the Bold button
    cy.get('button[title="Bold (Ctrl+B)"]').first().click();
    cy.wait(1000);

    // Verify bold markdown markers were applied
    cy.get('[data-testid="edit-question-subtext"]')
      .should('have.value', `**${testText}**`);
  });

  it('should apply italic formatting when the Italic button is clicked', () => {
    const testText = 'italic text';
    cy.get('[data-testid="edit-question-subtext"]').clear().type(testText);
    cy.wait(1000);

    // Select the text
    cy.get('[data-testid="edit-question-subtext"]')
      .setSelection(0, testText.length);
    cy.wait(1000);

    // Click the Italic button
    cy.get('button[title="Italic (Ctrl+I)"]').first().click();
    cy.wait(1000);

    // Verify italic markdown markers were applied
    cy.get('[data-testid="edit-question-subtext"]')
      .should('have.value', `*${testText}*`);
  });

  it('should apply underline formatting when the Underline button is clicked', () => {
    const testText = 'underline text';
    cy.get('[data-testid="edit-question-subtext"]').clear().type(testText);
    cy.wait(1000);

    // Select the text
    cy.get('[data-testid="edit-question-subtext"]')
      .setSelection(0, testText.length);
    cy.wait(1000);

    // Click the Underline button
    cy.get('button[title="Underline (Ctrl+U)"]').first().click();
    cy.wait(1000);

    // Verify underline HTML tags were applied
    cy.get('[data-testid="edit-question-subtext"]')
      .should('have.value', `<u>${testText}</u>`);
  });
});
