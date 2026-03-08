/// <reference types="cypress" />

beforeEach(() => {
  cy.viewport(1280, 720);
});

function login() {
  cy.visit('http://localhost:3000/');
  cy.get('#email').type('zoeandguy@gmail.com');
  cy.get('#password').type('Cabbage4!');
  cy.contains('button', 'Sign In').click();
  cy.url().should('include', '/sites');
}

function navigateToNewReport() {
  cy.get('input[placeholder="Search by site name or county..."]').type('riverlot');
  cy.contains('Riverlot 56').click();
  cy.contains('button', 'New Site Inspection Report').click();
  dismissFinePrintModal()
  cy.contains('button', 'Close').click({ force: true });
}

function navigateToExistingSIR() {
  cy.get('input[placeholder="Search by site name or county..."]').type('riverlot');
  cy.contains('Riverlot 56').click();
  cy.contains('Edit').first().click();
  cy.wait(2000)
  cy.contains('Close').click();
}

function dismissFinePrintModal() {
  cy.contains('I have read and agree').closest('label, div').find('input[type="checkbox"]').check();
  cy.wait(1000);
  cy.contains('button', 'Continue to Form').click();
}

describe('Image Upload', () => {

  it('Able to add images and final remarks to an existing SIR', () => {
    cy.intercept('POST', '**/storage/v1/object/**', { statusCode: 200, body: { Key: 'mocked' } }).as('imageUpload');

    login();
    navigateToExistingSIR();

    cy.contains('Previously uploaded — cannot be removed').should('exist');

    cy.contains('Any Last Words').closest('[class*="rounded"]').find('textarea').type('Added final remarks');
  });

  it('Able to add images to a new SIR, with caption and description', () => {
    login();
    navigateToNewReport();

    cy.contains('Click to upload images').should('be.visible');

    cy.get('input[type="file"]').first().selectFile('cypress/fixtures/test-image-2.jpg', { force: true });

    cy.get('input[placeholder="Caption (optional)"]').first().type('Test caption');
    cy.get('textarea[placeholder="Description (optional)"]').first().type('Test description');

    cy.contains('Click to upload images').should('be.visible');
    cy.get('input[type="file"]').first().selectFile('cypress/fixtures/test-image-3.jpg', { force: true });

    cy.get('input[placeholder="Caption (optional)"]').eq(1).type('Test caption 2');
    cy.get('textarea[placeholder="Description (optional)"]').eq(1).type('Test description 2');

    cy.contains('2 images total').should('exist');
  });

  it('Able to remove an image before submitting a new SIR', () => {
    login();
    navigateToNewReport();

    cy.contains('Click to upload images').should('be.visible'); // wait for section to fully load

    cy.contains('Click to upload images').should('be.visible');
    cy.get('input[type="file"]').first().selectFile('cypress/fixtures/test-image-2.jpg', { force: true });

    cy.contains('1 image total').should('exist');
    cy.contains('button', 'Remove').click();
    cy.contains('1 image total').should('not.exist');
  });

});