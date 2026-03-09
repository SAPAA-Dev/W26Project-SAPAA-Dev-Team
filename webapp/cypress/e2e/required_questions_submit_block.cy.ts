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
  cy.get("#password").type("123Gctrmomy@");
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
      cy.contains("The Fine Print Up Front")
        .should("be.visible")
        .parents("div.relative")
        .first()
        .as("verificationModal");

      cy.get("@verificationModal").within(() => {
        cy.get('input[type="checkbox"]').check({ force: true });
        cy.contains("button", "Continue to Form")
          .scrollIntoView()
          .should("be.visible")
          .and("not.be.disabled")
          .click({ force: true });
      });

      // Retry close click once if the modal is still mounted due to async state updates.
      cy.get("body").then(($nextBody) => {
        if ($nextBody.text().includes("The Fine Print Up Front")) {
          cy.contains("button", "Continue to Form").click({ force: true });
        }
      });

      cy.contains("The Fine Print Up Front", { timeout: 15000 }).should("not.exist");
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
  dismissVerificationModalIfVisible();
  dismissVerificationModalIfVisible();
}

function attemptSubmitExpectBlocked() {
  ensureFormReady();
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
