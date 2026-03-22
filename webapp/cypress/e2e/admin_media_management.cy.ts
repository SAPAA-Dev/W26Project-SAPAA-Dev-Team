describe("Admin Image Gallery", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
    cy.get("#email").click();
    cy.get("#email").type("jason.liang5129@gmail.com");
    cy.get("#password").click();
    cy.get("#password").type("123Abc@@");
    cy.get("button.font-bold").click();
    cy.get("button.text-white").click();
    cy.wait(3000);
    cy.contains("Admin").first().click();
    cy.wait(3000);
    cy.url().should("include", "/admin/dashboard");
  });

  it('should be able to go to the admin image gallery, search for an image, and see the metadata', function() {
    cy.contains("Image Gallery").click();
    cy.wait(3000);
    cy.get('[data-testid="admin-gallery-search-bar"]').click().type("tree");
    cy.wait(2000);
    cy.get('[data-testid="image-Tree Test image 2"]').should('be.visible');
    cy.get('[data-testid="image-Tree Test image 3"]').should('be.visible');
    cy.get('[data-testid="image-Ski Trails"]').should('not.exist');
    cy.get('[data-testid="admin-gallery-search-bar"]').click().clear().type("trails");
    cy.wait(2000);
    cy.get('[data-testid="image-Tree Test image 2"]').should('not.exist');
    cy.get('[data-testid="image-Tree Test image 3"]').should('not.exist');
    cy.get('[data-testid="image-Ski Trails"]').should('be.visible').click();
  });

});