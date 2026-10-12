/// <reference types="cypress" />

describe("Unauthorized user check", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
    
    cy.get("#email").type(Cypress.env('UNAPPROVED_EMAIL'));
    cy.get("#password").type(Cypress.env('UNAPPROVED_PASSWORD'));
    cy.contains("Sign In").click();
  });

  it("shows awaiting admin approval screen", () => {
    cy.contains("Awaiting Admin Approval").should("be.visible");

    cy.contains("Your account has been created successfully").should("be.visible");
    cy.contains("an administrator needs to review and approve your access").should("be.visible");

    cy.contains("You'll receive an email notification").should("be.visible");
    cy.contains("within 24 hours").should("be.visible");

    cy.contains("Sign Out")
      .should("be.visible")
      .and("be.enabled");
  });
});