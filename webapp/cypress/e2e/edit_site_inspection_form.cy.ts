/// <reference types="cypress" />

const TEST_RESPONSE_ID = 3237; 
const NEW_VALUE = 'Thank you Frank Potter for hosting this field trip!';

describe("US 1.0.22 - Editing Site Inspection Form", () => {

  beforeEach(() => {
    cy.visit("http://localhost:3000/");
    cy.get("#email").type("jason.liang5129@gmail.com");
    cy.get("#password").type("123Abc@@");
    cy.get("button.font-bold").click();
    cy.get("button.text-white").click();
    cy.wait(4000);
    cy.visit(`http://localhost:3000/detail/Riverlot%2056%20(NA)`);
    cy.wait(3000);
    cy.contains('Riverlot 56').should('be.visible');
  });
  
  it("user can navigate to an edit report they own", () => {
    cy.visit(`http://localhost:3000/detail/Riverlot%2056%20(NA)/edit-report/${TEST_RESPONSE_ID}`);
    cy.contains('Edit Inspection Report', { timeout: 10000 }).should('be.visible');
  });
  
  it("user can navigate through all sections and verify inputs exist", () => {
    cy.visit(`http://localhost:3000/detail/Riverlot%2056%20(NA)/edit-report/${TEST_RESPONSE_ID}`);
    cy.contains('Edit Inspection Report', { timeout: 10000 }).should('be.visible');
  
    // ── WhoRYou (default) ────────────────────────────────────────────────────
    cy.get('[data-testid="question-input-32"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="question-input-34"]', { timeout: 10000 }).should('be.visible');
  
    // ── WhereUGo ─────────────────────────────────────────────────────────────
    cy.contains('button', 'Next →').click();
    cy.get('input[type="date"]').should('be.visible');         
    cy.contains('Just Interested').should('exist');       
  
    // ── Impression ───────────────────────────────────────────────────────────
    cy.contains('button', 'Next →').click();
    cy.contains('4 = Great').should('exist');               
  
    // ── How Visit ────────────────────────────────────────────────────────────
    cy.contains('button', 'Next →').click();
    cy.get('[data-testid="question-input-4"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Birding').should('exist');               
  
    // ── Be There ─────────────────────────────────────────────────────────────
    cy.contains('button', 'Next →').click();
    cy.contains('Washroom').should('exist');                   
    cy.contains('No, Not this time').should('exist');           
  
    // ── Not There ────────────────────────────────────────────────────────────
    cy.contains('button', 'Next →').click();
    cy.contains('Domestic Animal Grazing').should('exist');    
    cy.contains('Off Highway Vehicles (4x4, ATVs)').should('exist'); 
  
    // ── 2B Done ──────────────────────────────────────────────────────────────
    cy.contains('button', 'Next →').click();
    cy.contains('Nothing, all good').should('exist');               
    cy.contains('Cleanup (e.g. Trash removal)').should('exist');  
  
    // ── Close ────────────────────────────────────────────────────────────────
    cy.contains('button', 'Next →').click();
    cy.get('[data-testid="question-input-28"]', { timeout: 10000 }).should('be.visible'); 
    cy.contains(/click to upload images/i).should('be.visible');      
  });

  it("edited value persists after submission", () => {
    cy.visit(`http://localhost:3000/detail/Riverlot%2056%20(NA)/edit-report/${TEST_RESPONSE_ID}`);
    cy.contains('Edit Inspection Report', { timeout: 10000 }).should('be.visible');

    cy.contains('button', 'Close').click();
    cy.get('[data-testid="question-input-28"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="question-input-28"]', { timeout: 10000 }).clear().type(NEW_VALUE);
    cy.contains('Save Changes').click();

    cy.url().should('include', '/sites');

    cy.visit(`http://localhost:3000/detail/Riverlot%2056%20(NA)/edit-report/${TEST_RESPONSE_ID}`);
    cy.wait(5000);
    cy.contains('button', 'Close').click();
    cy.get('[data-testid="question-input-28"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="question-input-28"]', { timeout: 10000 }).should('have.value', NEW_VALUE);
  });
});