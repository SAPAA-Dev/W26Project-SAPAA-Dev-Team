/// <reference types="cypress" />

// US 5.0.4 - Sign Out Properly (acceptance tests in docs/user-stories.md)

// Keeps the helpers below local to this spec instead of clashing with other specs' globals.
export {};

// The first-login tutorial overlay can open late and block clicks, so every tutorial reads as seen.
// The admin menu is taller than the default 660px viewport, which puts Logout under the
// floating "Upload Images" button.
beforeEach(() => {
    cy.viewport(1280, 1000);
    cy.on('window:before:load', (win) => {
      const getItem = win.Storage.prototype.getItem;
      win.Storage.prototype.getItem = function (key: string) {
        return key.startsWith('sapaa_tutorial_') ? 'true' : getItem.call(this, key);
      };
    });
  });

  function login(email: string, password: string) {
    cy.visit('http://localhost:3000/');
    cy.get('#email').click().type(email);
    cy.get('#password').click().type(password, { log: false });
    cy.get('button.font-bold').click();
    cy.url().should('include', '/sites');
  }

  function logout() {
    cy.get('button[title="Open menu"]').click();
    cy.contains('Logout').should('exist');
    cy.contains('button', 'Logout').click();
  }

  // Supabase keeps the session in sb-<project>-auth-token cookies (chunked as .0, .1, ...).
  function expectNoAuthCookies() {
    cy.getCookies().should((cookies) => {
      expect(cookies.map((c) => c.name).filter((name) => name.startsWith('sb-'))).to.have.length(0);
    });
  }

  describe('Logout Flow (US 5.0.4)', () => {
    const adminEmail = Cypress.env('ADMIN_EMAIL');
    const adminPassword = Cypress.env('ADMIN_PASSWORD');

    it('US 5.0.4 AT1: user is redirected to login screen on logout', () => {
      login(adminEmail, adminPassword);

      logout();

      cy.url().should('include', '/login');

      // login form must be visible, confirming full page redirect
      cy.get('#email').should('exist');
      cy.get('#password').should('exist');
    });

    it('US 5.0.4 AT1: the session is gone after logout, so reopening the app shows the sign-in page', () => {
      login(adminEmail, adminPassword);
      cy.getCookies().should((cookies) => {
        expect(cookies.some((c) => c.name.startsWith('sb-')), 'auth cookie while signed in').to.equal(true);
      });

      logout();
      cy.url().should('include', '/login');
      expectNoAuthCookies();

      // Opening protected pages again in the same browser must land on the sign-in page.
      cy.visit('http://localhost:3000/sites');
      cy.url().should('include', '/login');
      cy.get('#email').should('be.visible');
      cy.visit('http://localhost:3000/profile');
      cy.url().should('include', '/login');
      cy.request({ url: 'http://localhost:3000/api/profile', failOnStatusCode: false, followRedirect: false })
        .its('status')
        .should('not.eq', 200);
    });

    it('US 5.0.4 AT2: back navigation after logout does not return to the webapp', () => {
      login(adminEmail, adminPassword);

      // confirm we're inside the app
      cy.url().should('include', '/sites');
      cy.get('button[title="Open menu"]').should('exist');

      logout();
      cy.url().should('include', '/login');

      // press the browser back button
      cy.go('back');

      // session is gone so the app should redirect back to /login, not show /sites
      cy.url().should('include', '/login');
      cy.get('#email').should('be.visible');
      cy.get('button[title="Open menu"]').should('not.exist');
    });

    it('US 5.0.4 AT3: user can sign out from a page other than the sites list', () => {
      login(adminEmail, adminPassword);
      cy.visit('http://localhost:3000/profile');
      cy.url().should('include', '/profile');

      logout();

      cy.url().should('include', '/login');
      expectNoAuthCookies();
    });

    it('US 5.0.4: user is able to sign back in after logout', () => {
      login(adminEmail, adminPassword);

      logout();
      cy.url().should('include', '/login');

      // sign back in using the same credentials
      cy.get('#email').click().type(adminEmail);
      cy.get('#password').click().type(adminPassword);
      cy.get('button.font-bold').click();

      // should be back inside the app
      cy.url().should('include', '/sites');
    });
  });
