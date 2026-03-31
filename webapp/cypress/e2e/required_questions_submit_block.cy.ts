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

function login() {
  cy.visit("http://localhost:3000/");
  cy.get("#email").click();
  cy.get("#email").type("jason.liang5129@gmail.com");
  cy.get("#password").click();
  cy.get("#password").type("123Abc@@");
  cy.get("button.font-bold").click();
  cy.wait(3000);
  dismissTutorialIfPresent();
  cy.url().should("include", "/sites");
}

function openNewReport() {
  cy.get("div.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4", { timeout: 15000 }).should('exist');
  dismissTutorialIfPresent();

  cy.get("div.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4").find("button").first().click();
  cy.url().should("include", "/detail", { timeout: 10000 });
  dismissTutorialIfPresent();

  cy.contains("button", "New Site Inspection Report", { timeout: 15000 }).click();
  cy.url().should("include", "/new-report", { timeout: 10000 });
  dismissTutorialIfPresent();
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
  dismissTutorialIfPresent();
  dismissVerificationModalIfVisible();
}

function ensureFormReady() {
  cy.get("body", { timeout: 20000 }).should("not.contain", "Loading inspection form...");
  dismissTutorialIfPresent();
  cy.wait(2000);
  dismissVerificationModalIfVisible();
  dismissVerificationModalIfVisible();
}

function attemptSubmitExpectBlocked() {
  ensureFormReady();
  cy.wait(2000);
  cy.contains('button', 'Close').click();
  cy.wait(2000);
  cy.contains("button", "Review & Submit").scrollIntoView().click({ force: true });
  cy.contains("Required Questions Missing").should("be.visible");
  cy.contains("You must answer all required questions and complete required image metadata before submitting this report.").should("be.visible");
  cy.contains("Missing required question numbers:").should("be.visible");
  cy.contains("button", "Back to Form").should("be.visible");
  cy.contains("Missing required question numbers:")
    .parent()
    .find("ul li")
    .its("length")
    .should("be.greaterThan", 0)
}

function answerOneVisibleRequiredQuestionOnly() {
  ensureFormReady();
  cy.contains('How Visit').click();
  cy.contains("span", "Required")
    .filter(":visible")
    .first()
    .parents("div.bg-white.p-6.rounded-2xl.border-2")
    .first()
    .within(() => {
      cy.get(
        'input[type="radio"], input[type="checkbox"], textarea, input[type="date"], input[type="text"]'
      )
        .first()
        .then(($input) => {
          const tag = String($input.prop("tagName")).toLowerCase();
          const type = String($input.attr("type") || "").toLowerCase();

          if (type === "radio" || type === "checkbox") {
            cy.wrap($input).check({ force: true });
            return;
          }

          if (type === "date") {
            cy.wrap($input).scrollIntoView().clear({ force: true }).type("2026-03-08", { force: true });
            return;
          }

          if (tag === "textarea") {
            cy.wrap($input)
              .scrollIntoView()
              .clear({ force: true })
              .type("Partial required answer", { force: true });
            return;
          }

          cy.wrap($input)
            .scrollIntoView()
            .clear({ force: true })
            .type("Partial required answer", { force: true });
        });
    });
}

describe("Required question enforcement on submit", () => {
  it("shows missing-required popup and blocks submission until required questions are completed", () => {
    cy.intercept("POST", "**/api/s3/presign").as("presign");

    login();
    openNewReport();
    completeVerificationIfPresent();

    cy.url().as("newReportUrl");

    attemptSubmitExpectBlocked();
    cy.get("@newReportUrl").then((urlBefore) => {
      cy.url().should("eq", String(urlBefore));
    });

    cy.wait(2000);
    cy.contains("button", "Back to Form").click({ force: true });
    ensureFormReady();
    answerOneVisibleRequiredQuestionOnly();

    attemptSubmitExpectBlocked();
    cy.get("@newReportUrl").then((urlBefore) => {
      cy.url().should("eq", String(urlBefore));
    });

    cy.get("@presign.all").should("have.length", 0);
  });
});