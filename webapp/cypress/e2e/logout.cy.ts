/// <reference types="cypress" />

function dismissTutorialIfPresent() {
    cy.wait(3000);
    cy.get('body').then(($body) => {
      if ($body.find('.react-joyride__overlay').length > 0) {
        cy.get('[data-testid="tutorial-skip"], [aria-label="Skip"], button[data-action="skip"], button[data-action="close"]')
          .first()
          .click({ force: true });
      }
    });
  }
  
  function login(email: string, password: string) {
    cy.visit('http://localhost:3000/');
    cy.get('#email').click().type(email);
    cy.get('#password').click().type(password);
    cy.get('button.font-bold').click();
    cy.wait(3000);
    dismissTutorialIfPresent();
  }
  
  function logout() {
    cy.get('button[title="Open menu"]').click();
    cy.contains('Logout').should('exist');
    cy.contains('button', 'Logout').click();
  }
  
  describe('Logout Flow', () => {
    const adminEmail = 'jason.liang5129@gmail.com';
    const adminPassword = '123Abc@@';
  
    it('user is redirected to login screen on logout', () => {
      login(adminEmail, adminPassword);
  
      logout();
  
      cy.url().should('include', '/login');
      
      // login form must be visible, confirming full page redirect
      cy.get('#email').should('exist');
      cy.get('#password').should('exist');
    });
  
    it('back navigation after logout does not return to the webapp', () => {
      login(adminEmail, adminPassword);
  
      // confirm we're inside the app
      cy.url().should('include', '/sites');
  
      logout();
      cy.url().should('include', '/login');
  
      // press the browser back button
      cy.go('back');
  
      // session is gone so the app should redirect back to /login, not show /sites
      cy.url().should('include', '/login');
    });
  
    it('user is able to sign back in after logout', () => {
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