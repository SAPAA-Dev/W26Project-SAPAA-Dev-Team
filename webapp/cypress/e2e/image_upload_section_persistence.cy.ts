/// <reference types="cypress" />

beforeEach(() => {
  cy.viewport(1280, 720);
});

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

function loginWithCurrentPattern() {
  cy.visit("http://localhost:3000/");
  cy.get("#email").click().type("jason.liang5129@gmail.com");
  cy.get("#password").click().type("123Abc@@");
  cy.get("button.font-bold").click();

  cy.wait(3000);
  dismissTutorialIfPresent();

  cy.url().should("include", "/sites");
}

function openNewReport() {
  cy.get("div.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4", { timeout: 15000 })
    .should('exist');
  dismissTutorialIfPresent();

  cy.get("div.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4")
    .find("button")
    .first()
    .click();

  cy.url().should("include", "/detail", { timeout: 10000 });
  dismissTutorialIfPresent();

  cy.contains("button", "New Site Inspection Report", { timeout: 15000 }).click();
  cy.url().should("include", "/new-report", { timeout: 10000 });
}

function dismissVerificationModalIfVisible() {
  cy.wait(5000);
  cy.get("body").then(($body) => {
    if ($body.text().includes("The Fine Print Up Front")) {
      cy.get('[data-testid="fine-print-modal"] div.overflow-y-auto').click('topLeft');
      cy.get('[data-testid="terms-checkbox"]').check();
      cy.get('[data-testid="terms-checkbox"]').should('be.checked');
      cy.get('[data-testid="fine-print-modal"] button.text-white').should('not.have.attr', 'disabled');
      cy.get('[data-testid="fine-print-modal"] button.text-white').click();
      cy.wait(3000);
      cy.get('[data-testid="fine-print-modal"] button.text-white').should('not.exist');
      cy.get('[data-testid="fine-print-modal"]').should('not.exist');
      cy.wait(3000);
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

    cy.get('input[placeholder="Longer Description"]').first().scrollIntoView().clear().type(captionText);
    cy.get('input[placeholder="Short Description"]').first().clear().type(descriptionText);

    cy.get('input[placeholder="Longer Description"]').first().should("have.value", captionText);
    cy.get('input[placeholder="Short Description"]').first().should("have.value", descriptionText);

    goToDifferentSectionFromClose();
    goToCloseSection();

    cy.contains("test-image.jpg").should("be.visible");
    cy.contains(/1 image (total|selected)/i).should("be.visible");
    cy.get('input[placeholder="Longer Description"]').first().should("have.value", captionText);
    cy.get('input[placeholder="Short Description"]').first().should("have.value", descriptionText);
  });
});