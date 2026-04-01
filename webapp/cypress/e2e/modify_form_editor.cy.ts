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

describe('Admin Form Editor - Editing Questions', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:3000/');
    cy.get('#email').click().type('jason.liang5129@gmail.com');
    cy.get('#password').click().type('123Abc@@');
    cy.get('button.font-bold').click();

    cy.wait(3000);
    dismissTutorialIfPresent();

    cy.get('button[title="Open menu"]').click();
    cy.contains('Go to admin dashboard').click();
    cy.url().should('include', '/admin/dashboard', { timeout: 10000 });

    cy.visit('http://localhost:3000/admin/form-editor');
    cy.url().should('include', '/admin/form-editor', { timeout: 10000 });
  });

  it('should be able to access the form editor through the admin dashboard', function() {
    cy.contains("Manage inspection form sections and questions").should('be.visible');
  });

  it('should have each section button display the correct amount of questions the section actually contains', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      const sectionId = testId.replace('section-button-', '');

      cy.get(`[data-testid="${testId}"]`, { timeout: 10000 }).click();

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

  it('should be able to modify questions to add, remove, or change information in it', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      if (testId == "section-button-3") {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains("General Information");
        cy.contains('Email (Q11)');

        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.wait(5000);
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().type("hello this is a change");
        cy.get('[data-testid="save-question-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]').first().click();
        cy.contains("hello this is a change");

        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().clear().type("hello this is a second change");
        cy.get('[data-testid="save-question-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.contains("hello this is a second change");

        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().clear().type("hello this is a third change");
        cy.get('[data-testid="cancel-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.wait(2000);
        cy.contains("hello this is a second change");

        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).click().clear();
        cy.get('[data-testid="save-question-button"]', { timeout: 10000 }).click();
        cy.wait(3000);
        cy.get('[data-testid="edit-question-button"]', { timeout: 10000 }).first().click();
        cy.wait(2000);
        cy.get('[data-testid="edit-question-subtext"]', { timeout: 10000 }).should('have.value', '');
      }
    });
  });

  it('should be able to modify questions and have the changes be visible to users on the site inspection form', () => {
    cy.get('[data-testid^="section-button-"]').each(($el) => {
      const testId = $el.attr('data-testid') ?? 'null-testid';
      if (testId == "section-button-3") {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.get(`[data-testid="${testId}"]`).click();
        cy.contains("General Information");
        cy.contains('Email (Q11)');

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

    // Form editor has no navbar — navigate directly
    cy.visit('http://localhost:3000/sites');
    cy.url().should('include', '/sites', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.contains('Riverlot 56').scrollIntoView().click();
    cy.url().should('include', '/detail', { timeout: 10000 });
    dismissTutorialIfPresent();

    cy.contains('New Site Inspection Report', { timeout: 10000 }).click();
    cy.url().should('include', '/new-report', { timeout: 10000 });

    cy.wait(5000);
    cy.get('[data-testid="fine-print-modal"]').click('topLeft', { force: true });
    cy.get('[data-testid="terms-checkbox"]').check();
    cy.get('[data-testid="terms-checkbox"]').should('be.checked');
    cy.get('[data-testid="fine-print-modal"] button.text-white').should('not.have.attr', 'disabled');
    cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').click();
    cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').should('not.exist');
    cy.get('[data-testid="fine-print-modal"]').should('not.exist');

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

describe('User View - No Admin Form Editor', () => {
  it('should disallow users from accessing the admin panel that contains the form editor', () => {
    cy.visit('http://localhost:3000/');
    cy.get('#email').click().type('awayt7398@gmail.com');
    cy.get('#password').click().type('Throw4w4!');
    cy.get('button.font-bold').click();

    cy.wait(3000);
    dismissTutorialIfPresent();

    cy.get('button[title="Open menu"]').click();
    cy.contains('Admin').should('not.exist');
    cy.get('div.fixed.inset-0').click({ force: true });
  });
});