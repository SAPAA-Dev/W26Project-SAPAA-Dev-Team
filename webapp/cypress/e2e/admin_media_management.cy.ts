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

describe("Admin Image Gallery", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
    cy.get("#email").click().type("jason.liang5129@gmail.com");
    cy.get("#password").click().type("123Abc@@");
    cy.get("button.font-bold").click();

    cy.wait(3000);
    dismissTutorialIfPresent();

    cy.get('button[title="Open menu"]').click();
    cy.contains('Go to admin dashboard').click();
    cy.url().should("include", "/admin/dashboard", { timeout: 10000 });
  });

  it('should be able to go to the admin image gallery, search for an image, and see the metadata', function() {
    cy.contains("Image Gallery").click();
    cy.wait(2000);
    cy.get('[data-testid="admin-gallery-search-bar"]').click().type("trails");
    cy.get('[data-testid="image-Ski Trails"]').should('be.visible');
    cy.get('[data-testid="image-Broken Tree Trunk"]').should('not.exist');
    cy.get('[data-testid="admin-gallery-search-bar"]').click().clear().type("tree");
    cy.get('[data-testid="image-Ski Trails"]').should('not.exist');
    cy.get('[data-testid="image-Broken Tree Trunk"]').should('be.visible').click({ force: true });

    cy.contains('Site').should('be.visible');
    cy.contains('Caption').should('be.visible');
    cy.contains('Identifier').should('be.visible');
    cy.contains('Date').should('be.visible');
  });
});