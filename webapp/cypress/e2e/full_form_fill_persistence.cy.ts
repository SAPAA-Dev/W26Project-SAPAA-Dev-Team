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
  cy.get("#email").click().type("jason.liang5129@gmail.com");
  cy.get("#password").click().type("123Abc@@");
  cy.get("button.font-bold").click();

  cy.wait(3000);
  dismissTutorialIfPresent();

  cy.url().should("include", "/sites");
}

  function openNewReport() {
    cy.contains('Riverlot 56', { timeout: 15000 })
      .should('be.visible');

    dismissTutorialIfPresent();

    cy.contains('Riverlot 56')
      .scrollIntoView()
      .click();

    cy.url().should("include", "/detail", { timeout: 10000 });

    dismissTutorialIfPresent();

    cy.contains("button", "New Site Inspection Report", { timeout: 15000 })
      .should("be.visible")
      .click({ force: true });

    cy.url().should("include", "/new-report", { timeout: 10000 });
  }


function dismissVerificationModalIfVisible() {
  cy.wait(5000);
  cy.get('[data-testid="fine-print-modal"]').click('topLeft', { force: true });
  cy.get('[data-testid="terms-checkbox"]').check();
  cy.get('[data-testid="terms-checkbox"]').should('be.checked');
  cy.get('[data-testid="fine-print-modal"] button.text-white').should('not.have.attr', 'disabled');
  cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').click();
  cy.get('[data-testid="fine-print-modal"] div.bg-\\[\\#F7F2EA\\]\\/50').should('not.exist');
  cy.get('[data-testid="fine-print-modal"]').should('not.exist');
  cy.contains("The Fine Print Up Front", { timeout: 15000 }).should("not.exist");
}

function ensureFormReady() {
  cy.get("body", { timeout: 20000 }).should("not.contain", "Loading inspection form...");
  dismissVerificationModalIfVisible();
}

function clickSectionByIndex(index: number) {
  cy.get("main aside nav button:visible").eq(index).scrollIntoView().click({ force: true });
  cy.get("section.flex-1").should("be.visible");
}

function getSectionProgressText(index: number) {
  return cy
    .get("main aside nav button:visible")
    .eq(index)
    .invoke("text")
    .then((txt) => {
      const match = txt.match(/(\d+)\s*\/\s*(\d+)/);
      return match ? `${match[1]}/${match[2]}` : "";
    });
}

function getSectionSnapshot() {
  return cy.get("section.flex-1").then(($section) => {
    const root = $section[0];
    const checkedControls = Array.from(
      root.querySelectorAll('input[type="radio"], input[type="checkbox"]')
    ).filter((el) => (el as HTMLInputElement).checked).length;

    const textAreasWithValue = Array.from(root.querySelectorAll("textarea")).filter(
      (el) => (el as HTMLTextAreaElement).value.trim().length > 0
    ).length;

    const textInputsWithValue = Array.from(root.querySelectorAll('input[type="text"]')).filter(
      (el) => (el as HTMLInputElement).value.trim().length > 0
    ).length;

    const datesWithValue = Array.from(root.querySelectorAll('input[type="date"]')).filter(
      (el) => (el as HTMLInputElement).value.trim().length > 0
    ).length;

    const answeredPills = Array.from(root.querySelectorAll("span")).filter(
      (el) => el.textContent?.trim() === "Answered"
    ).length;

    return {
      checkedControls,
      textAreasWithValue,
      textInputsWithValue,
      datesWithValue,
      answeredPills,
      totalSignals:
        checkedControls + textAreasWithValue + textInputsWithValue + datesWithValue + answeredPills,
    };
  });
}

function fillQuestionCard($card: JQuery<HTMLElement>, sectionIndex: number, cardIndex: number) {
  const textValue = `auto-answer-s${sectionIndex + 1}-q${cardIndex + 1}`;
  cy.wrap($card)
    .scrollIntoView()
    .then(($el) => {
      const root = $el[0];

      const fileInput = root.querySelector(
        'input[type="file"][id^="image-upload-"]'
      ) as HTMLInputElement | null;
      if (fileInput) {
        cy.wrap(fileInput).selectFile("cypress/fixtures/test-image.jpg", { force: true });
        const captionInput = root.querySelector(
          'input[placeholder="Caption (optional)"]'
        ) as HTMLInputElement | null;
        if (captionInput) {
          cy.wrap(captionInput).clear({ force: true }).type(`${textValue}-caption`, { force: true });
        }
        const descriptionInput = root.querySelector(
          'textarea[placeholder="Description (optional)"]'
        ) as HTMLTextAreaElement | null;
        if (descriptionInput) {
          cy.wrap(descriptionInput).clear({ force: true }).type(`${textValue}-description`, { force: true });
        }
        return;
      }

      const uncheckedRadio =
        (Array.from(root.querySelectorAll('input[type="radio"]')).find(
          (el) => !(el as HTMLInputElement).checked
        ) as HTMLInputElement | undefined) ||
        (root.querySelector('input[type="radio"]') as HTMLInputElement | null);
      if (uncheckedRadio) {
        cy.wrap(uncheckedRadio).check({ force: true });
        return;
      }

      const uncheckedCheckbox =
        (Array.from(root.querySelectorAll('input[type="checkbox"]')).find(
          (el) => !(el as HTMLInputElement).checked
        ) as HTMLInputElement | undefined) ||
        (root.querySelector('input[type="checkbox"]') as HTMLInputElement | null);
      if (uncheckedCheckbox) {
        cy.wrap(uncheckedCheckbox).check({ force: true });
        return;
      }

      const dateInput = root.querySelector('input[type="date"]') as HTMLInputElement | null;
      if (dateInput) {
        if (!dateInput.value) {
          cy.wrap(dateInput).clear({ force: true }).type("2026-03-08", { force: true });
        }
        return;
      }

      const textareaTarget =
        (Array.from(root.querySelectorAll("textarea")).find((el) =>
          (el as HTMLTextAreaElement).placeholder.includes("Enter your response here")
        ) as HTMLTextAreaElement | undefined) ||
        (root.querySelector("textarea") as HTMLTextAreaElement | null);
      if (textareaTarget) {
        cy.wrap(textareaTarget).clear({ force: true }).type(textValue, { force: true });
        return;
      }

      const textInputTarget =
        (Array.from(root.querySelectorAll('input[type="text"]')).find(
          (el) => (el as HTMLInputElement).value.trim().length === 0
        ) as HTMLInputElement | undefined) ||
        (root.querySelector('input[type="text"]') as HTMLInputElement | null);
      if (textInputTarget) {
        cy.wrap(textInputTarget).clear({ force: true }).type(textValue, { force: true });
      }
    });
}

function fillVisibleQuestionsInSection(sectionIndex: number) {
  cy.get("section.flex-1 div.bg-white.p-6.rounded-2xl.border-2:visible").each(($card, idx) => {
    fillQuestionCard($card, sectionIndex, idx);
  });
}

describe("Full form fill + section persistence (no submit)", () => {
  it("fills all sections and keeps data persisted when switching sections", () => {
    const progressBeforeRoundTrip: Record<number, string> = {};
    const snapshotsBeforeRoundTrip: Record<number, { totalSignals: number; answeredPills: number }> = {};

    login();
    openNewReport();
    ensureFormReady();

    cy.get("main aside nav button:visible").then(($buttons) => {
      const totalSections = $buttons.length;
      expect(totalSections).to.be.greaterThan(1);

      for (let i = 0; i < totalSections; i += 1) {
        clickSectionByIndex(i);
        fillVisibleQuestionsInSection(i);

        getSectionProgressText(i).then((progress) => {
          progressBeforeRoundTrip[i] = progress;
        });

        getSectionSnapshot().then((snap) => {
          snapshotsBeforeRoundTrip[i] = {
            totalSignals: snap.totalSignals,
            answeredPills: snap.answeredPills,
          };
          expect(snap.totalSignals).to.be.greaterThan(0);
        });

        const otherIndex = i === totalSections - 1 ? 0 : i + 1;
        clickSectionByIndex(otherIndex);
        clickSectionByIndex(i);

        getSectionProgressText(i).then((progressAfter) => {
          expect(progressAfter).to.eq(progressBeforeRoundTrip[i]);
        });

        getSectionSnapshot().then((snapAfter) => {
          expect(snapAfter.totalSignals).to.be.greaterThan(0);
          expect(snapAfter.answeredPills).to.be.greaterThan(0);
          expect(snapAfter.totalSignals).to.be.gte(snapshotsBeforeRoundTrip[i].totalSignals);
        });
      }
    });

    cy.get("footer")
      .contains(/\d+\s*\/\s*\d+\s*answered/i)
      .should("be.visible")
      .invoke("text")
      .then((txt) => {
        const match = txt.match(/(\d+)\s*\/\s*(\d+)\s*answered/i);
        if (!match) {
          throw new Error(`Could not parse answered progress text from footer: "${txt}"`);
        }
        const answered = Number(match![1]);
        const total = Number(match![2]);
        expect(answered).to.eq(total);
      });

    cy.contains("button", "Review & Submit").should("be.visible");
  });
});