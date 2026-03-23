/// <reference types="cypress" />

beforeEach(() => {
  // Keep headed (`cypress open`) and headless (`cypress run`) layout behavior aligned.
  cy.viewport(1280, 720);
});

function login() {
  cy.visit("http://localhost:3000/");
  cy.get("#email").click();
  cy.get("#email").type("jason.liang5129@gmail.com");
  cy.get("#password").click();
  cy.get("#password").type("123Abc@@");
  cy.get("button.font-bold").click();
  cy.get("button.text-white").click();
  cy.url().should("include", "/sites");
}

function openNewReport() {
  cy.get("div.grid.gap-4.md\\:grid-cols-2.lg\\:grid-cols-3")
    .find("button")
    .first()
    .click();

  cy.contains("button", "New Site Inspection Report").click();
  cy.url().should("include", "/new-report");
}

function dismissVerificationModalIfVisible() {
  cy.get("body").then(($body) => {
    if ($body.text().includes("The Fine Print Up Front")) {
      cy.contains("The Fine Print Up Front").should("be.visible");
      cy.get('label:has(input[type="checkbox"]) input[type="checkbox"]').check({ force: true });
      cy.wait(2000);
      cy.contains("button", "Continue to Form")
        .should("be.visible")
        .and("not.be.disabled")
        .click({ force: true });
      cy.wait(2000);
    }
  });
}

function completeVerificationIfPresent() {
  // Wait until user/steward check is done; only then can the modal state be trusted.
  cy.get("body", { timeout: 20000 }).should("not.contain", "Loading inspection form...");
  dismissVerificationModalIfVisible();
}

function goToCloseSection() {
  // Handle modal races in headed mode right before nav interaction.
  dismissVerificationModalIfVisible();
  cy.contains('button', 'Close').click();
  // cy.contains("button", "Close", { timeout: 10000 }).click({ force: true });
  cy.contains("Upload Images, GPS Files, etc.").should("be.visible");
}

function uploadOneImage() {
  cy.get('input[type="file"][id^="image-upload-"]')
    .first()
    .selectFile("cypress/fixtures/test-image.jpg", { force: true });
}

function captionInput() {
  return cy.get('input[placeholder="Longer Description"]').first().scrollIntoView();
}

describe("Image Caption Behavior - Q81.1", () => {
  it("supports viewing, adding, editing, clearing, and removing image caption before submit", () => {
    login();
    cy.wait(1000);
    openNewReport();
    cy.wait(1000);
    completeVerificationIfPresent();
    goToCloseSection();
    uploadOneImage();

    // Case A: caption field appears empty after upload
    cy.contains(/1 image (selected|total)/i).should("exist");
    cy.contains("test-image.jpg").should("exist");
    captionInput().should("exist").and("have.value", "");

    // Case B: add caption
    captionInput().type("Broken branch near trail entrance");
    captionInput().should("have.value", "Broken branch near trail entrance");

    // Case C: edit caption
    captionInput().type("Initial caption");
    captionInput().clear().type("Edited caption");
    captionInput().should("have.value", "Edited caption");

    // Case D: clear/delete caption text
    captionInput().type("Temporary caption");
    captionInput().clear();
    captionInput().should("have.value", "");

    // Optional hardening: remove uploaded image
    cy.contains(/1 image (selected|total)/i).should("exist");
    cy.contains("button", "Remove").first().scrollIntoView().click();
    cy.contains(/1 image (selected|total)/i).should("not.exist");
    cy.contains("test-image.jpg").should("not.exist");
  });
});
