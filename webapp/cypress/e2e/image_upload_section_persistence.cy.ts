/// <reference types="cypress" />

beforeEach(() => {
  cy.viewport(1280, 720);
});

function loginWithCurrentPattern() {
  cy.visit("http://localhost:3000/");
  cy.get("#email").click();
  cy.get("#email").type("jason.liang5129@gmail.com");
  cy.get("#password").click();
  cy.get("#password").type("123Abc@@");
  cy.get("button.font-bold").click();
  cy.get("button.text-white").click();
  cy.wait(4000);
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
      cy.get('label:has(input[type="checkbox"]) input[type="checkbox"]').check({ force: true });
      cy.wait(1000);
      cy.contains("button", "Continue to Form")
        .should("be.visible")
        .and("not.be.disabled")
        .click({ force: true });
      cy.wait(1000);
      cy.contains("The Fine Print Up Front").should("not.exist");
    }
  });
}

function completeVerificationIfPresent() {
  cy.get("body", { timeout: 20000 }).should("not.contain", "Loading inspection form...");
  dismissVerificationModalIfVisible();
}

function goToCloseSection() {
  dismissVerificationModalIfVisible();
  cy.contains("button", "Close", { timeout: 10000 }).click({ force: true });
  dismissVerificationModalIfVisible();
  cy.contains("Upload Images, GPS Files, etc.").should("be.visible");
}

function goToDifferentSectionFromClose() {
  dismissVerificationModalIfVisible();
  cy.get("main aside nav button").then(($buttons) => {
    const target = [...$buttons].find((button) => !/close/i.test(button.innerText));
    if (!target) {
      throw new Error("Could not find a non-Close section button");
    }
    cy.wrap(target).scrollIntoView().click({ force: true });
  });
}

function uploadOneImage() {
  cy.get('input[type="file"][id^="image-upload-"]')
    .first()
    .selectFile("cypress/fixtures/test-image.jpg", { force: true });
}

describe("Image Upload Persistence Across Section Switching - Q81.1", () => {
  it("keeps image and metadata when switching sections and returning", () => {
    const captionText = "Broken branch near trail entrance";
    const descriptionText = "Large crack up trunk";

    loginWithCurrentPattern();
    openNewReport();
    completeVerificationIfPresent();
    goToCloseSection();
    uploadOneImage();

    cy.contains(/1 image (total|selected)/i).should("be.visible");
    cy.contains("test-image.jpg").should("be.visible");

    cy.get('input[placeholder="Longer Description"]')
      .first()
      .scrollIntoView()
      .clear()
      .type(captionText);
    cy.get('input[placeholder="Short Description"]')
      .first()
      .clear()
      .type(descriptionText);

    cy.get('input[placeholder="Longer Description"]').first().should("have.value", captionText);
    cy.get('input[placeholder="Short Description"]')
      .first()
      .should("have.value", descriptionText);

    goToDifferentSectionFromClose();
    goToCloseSection();

    cy.contains("test-image.jpg").should("be.visible");
    cy.contains(/1 image (total|selected)/i).should("be.visible");
    cy.get('input[placeholder="Longer Description"]').first().should("have.value", captionText);
    cy.get('input[placeholder="Short Description"]')
      .first()
      .should("have.value", descriptionText);
  });
});
