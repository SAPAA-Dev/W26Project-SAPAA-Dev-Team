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
//
export {};
import { createBrowserClient } from '@supabase/ssr'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in via Supabase API bypassing the UI
       * @example cy.loginByApi('email@example.com', 'password123')
       */
      loginByApi(email?: string, password?: string): Chainable<void>
    }
  }
}

// this doesn't work right now
Cypress.Commands.add('loginByApi', (email, password) => {
  const userEmail = email || Cypress.env('TEST_USER_EMAIL');
  const userPassword = password || Cypress.env('TEST_USER_PASSWORD');

  // 1. Get the session directly from Supabase Auth API
  cy.request({
    method: 'POST',
    url: `${Cypress.env('SUPABASE_URL')}/auth/v1/token?grant_type=password`,
    headers: {
      'apikey': Cypress.env('SUPABASE_ANON_KEY'),
      'Content-Type': 'application/json'
    },
    body: { email: userEmail, password: userPassword }
  }).then((response) => {
    const session = response.body;

    // 2. Use the Supabase SSR client to set the cookies correctly
    // This handles the chunking and naming (sb-xxx-auth-token.0, .1) automatically
    const supabase = createBrowserClient(
      Cypress.env('SUPABASE_URL'),
      Cypress.env('SUPABASE_ANON_KEY')
    );

    // 3. This is the crucial step: manually setting the session in the client
    // The browser client will automatically write the necessary cookies 
    // that your server-side middleware is looking for.
    supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });

    // 4. Also set localStorage as a fallback for client-side components
    const storageKey = `sb-${Cypress.env('SUPABASE_PROJECT_ID')}-auth-token`;
    window.localStorage.setItem(storageKey, JSON.stringify(session));
  });
});