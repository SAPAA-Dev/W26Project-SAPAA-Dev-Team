/// <reference types="cypress" />

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

describe('Rich Text Editor - Formatting', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/')
    cy.get('#email').click();
    cy.get('#email').type('jason.liang5129@gmail.com');
    cy.get('#password').click();
    cy.get('#password').type('123Abc@@');
    cy.get('button.font-bold').click();
    cy.wait(3000);
    dismissTutorialIfPresent();
    cy.url().should('include', '/sites');

    cy.visit('http://localhost:3000/admin/form-editor');
    cy.url().should('include', '/admin/form-editor', { timeout: 10000 });

    cy.get('[data-testid^="section-button-"]').first().click();
    cy.wait(3000);
    cy.get('[data-testid="edit-question-button"]').first().click();
    cy.wait(2000);
  });

  it('should apply bold formatting when the Bold button is clicked', () => {
    const testText = 'bold text';
    cy.get('[data-testid="edit-question-subtext"]').clear().type(testText);
    cy.wait(1000);

    cy.get('[data-testid="edit-question-subtext"]')
      .invoke('val')
      .then((val) => {
        cy.get('[data-testid="edit-question-subtext"]')
          .setSelection(0, testText.length);
      });
    cy.wait(1000);

    cy.get('button[title="Bold (Ctrl+B)"]').first().click();
    cy.wait(1000);

    cy.get('[data-testid="edit-question-subtext"]')
      .should('have.value', `**${testText}**`);
  });

  it('should apply italic formatting when the Italic button is clicked', () => {
    const testText = 'italic text';
    cy.get('[data-testid="edit-question-subtext"]').clear().type(testText);
    cy.wait(1000);


    cy.get('[data-testid="edit-question-subtext"]')
      .setSelection(0, testText.length);
    cy.wait(1000);

    cy.get('button[title="Italic (Ctrl+I)"]').first().click();
    cy.wait(1000);


    cy.get('[data-testid="edit-question-subtext"]')
      .should('have.value', `*${testText}*`);
  });

  it('should apply underline formatting when the Underline button is clicked', () => {
    const testText = 'underline text';
    cy.get('[data-testid="edit-question-subtext"]').clear().type(testText);
    cy.wait(1000);


    cy.get('[data-testid="edit-question-subtext"]')
      .setSelection(0, testText.length);
    cy.wait(1000);


    cy.get('button[title="Underline (Ctrl+U)"]').first().click();
    cy.wait(1000);


    cy.get('[data-testid="edit-question-subtext"]')
      .should('have.value', `<u>${testText}</u>`);
  });
});