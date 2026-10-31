/// <reference types="cypress" />

// US 5.0.2 - Reset a Forgotten Password (acceptance tests in docs/user-stories.md).
// The request route answers the same for a known and an unknown email, so this spec needs no
// SMTP message. It checks the delivered code step with a wrong code and with a malformed code.
// Needs the local seed (scripts/e2e_seed.js) for the STEWARD account.

export {};

const APP = 'http://localhost:3000';

beforeEach(() => {
  cy.viewport(1280, 1000);
  cy.clearCookies();
  cy.visit(`${APP}/forgot-password`);
});

function requestCode() {
  cy.get('#email').type(Cypress.env('STEWARD_EMAIL'));
  cy.contains('button', 'Send verification code').click();
  // The request route calls the Auth service, which can take a moment on a cold local stack.
  cy.get('#code', { timeout: 15000 }).should('be.visible');
}

describe('Password reset with a wrong code (US 5.0.2)', () => {
  it('(5.0.2 AT1) a known email reaches the code step without admin help', () => {
    requestCode();

    cy.contains('Enter the six-digit code sent to').should('be.visible');
    cy.contains('If an account exists for that email, a verification code is on its way.').should('be.visible');
  });

  it('(5.0.2 AT2) a wrong code is refused and the reset page stays closed', () => {
    requestCode();
    cy.get('#code').type('000000');
    cy.contains('button', 'Verify code').click();

    cy.get('[role="alert"]').should(
      'contain',
      'That code is invalid or has expired. Request a new code and try again.'
    );
    cy.url().should('include', '/forgot-password');
    cy.url().should('not.include', '/reset-password');
  });

  it('(5.0.2 AT2) a code shorter than six digits is refused before verification', () => {
    requestCode();
    cy.get('#code').type('12345');
    cy.contains('button', 'Verify code').click();

    cy.get('[role="alert"]').should('contain', 'Enter the six-digit code from your email.');
    cy.url().should('include', '/forgot-password');
  });
});
