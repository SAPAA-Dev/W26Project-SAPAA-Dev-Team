/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Select text in an input/textarea by setting selectionStart and selectionEnd
Cypress.Commands.add('setSelection', { prevSubject: 'element' }, (subject, start: number, end: number) => {
  const el = subject[0] as HTMLTextAreaElement;
  el.focus();
  el.setSelectionRange(start, end);
  return cy.wrap(subject);
});

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      setSelection(start: number, end: number): Chainable<JQuery<HTMLElement>>;
    }
  }
}
