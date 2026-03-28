/// <reference types="cypress" />

beforeEach(() => {
  // Keep headed and headless behavior aligned.
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
  cy.get("div.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4")
    .find("button")
    .first()
    .click();
  cy.wait(7000);
  cy.contains("button", "New Site Inspection Report").click();
  cy.url().should("include", "/new-report");
}


function dismissVerificationModalIfVisible() {
  cy.wait(5000);
  cy.get("body").then(($body) => {
  if ($body.text().includes("The Fine Print Up Front")) {

  cy.get('[data-testid="fine-print-modal"] div.overflow-y-auto').click('topLeft');
  cy.get('[data-testid="terms-checkbox"]').check();
  // The terms and conditions checkbox is checked.
  cy.get('[data-testid="terms-checkbox"]')
    .should('be.checked')
  // The button is now enabled.
  cy.get('[data-testid="fine-print-modal"] button.text-white')
    .should('not.have.attr', 'disabled')
  
  cy.get('[data-testid="fine-print-modal"] button.text-white').click();
  cy.wait(3000);
  cy.get('[data-testid="fine-print-modal"] button.text-white').should('not.exist');
  // The fine print modal is closed.
  cy.get('[data-testid="fine-print-modal"]').should('not.exist')
  cy.wait(3000);
  }
  });
}


function completeVerificationIfPresent() {
  cy.get("body", { timeout: 20000 }).should("not.contain", "Loading inspection form...");
  dismissVerificationModalIfVisible();
}

function ensureFormReady() {
  // Modal can appear slightly later in headed mode; dismiss defensively before key interactions.
  cy.get("body", { timeout: 20000 }).should("not.contain", "Loading inspection form...");
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
  cy.contains("You must answer all required questions before submitting this report.").should("be.visible");
  cy.contains("Missing required question numbers:").should("be.visible");
  cy.contains("button", "Back to Form").should("be.visible");
  cy.contains("Missing required question numbers:")
    .parent()
    .find("ul li")
    .its("length")
    .should("be.greaterThan", 0);
}

function answerOneVisibleRequiredQuestionOnly() {
  // Answer exactly one visible required question, regardless of section/question wording.
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

    // Case 1: immediate submit attempt should be blocked with popup
    attemptSubmitExpectBlocked();
    cy.get("@newReportUrl").then((urlBefore) => {
      cy.url().should("eq", String(urlBefore));
    });

    // Return to form and partially answer only one required question.
    cy.wait(2000);
    cy.contains("button", "Back to Form").click({ force: true });
    ensureFormReady();
    answerOneVisibleRequiredQuestionOnly();

    // Case 2: still blocked because other required questions remain unanswered.
    attemptSubmitExpectBlocked();
    cy.get("@newReportUrl").then((urlBefore) => {
      cy.url().should("eq", String(urlBefore));
    });

    // Blocked path should not start upload presign flow.
    cy.get("@presign.all").should("have.length", 0);
  });
});
