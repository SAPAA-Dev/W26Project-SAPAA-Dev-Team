/// <reference types="cypress" />

beforeEach(() => {
    cy.viewport(1280, 720);
    login();
    openModal();
    uploadOneImage();
});
  
function login() {
    cy.visit("http://localhost:3000/");
    cy.get("#email").type("jason.liang5129@gmail.com");
    cy.get("#password").type("123Gctrmomy@");
    cy.get("button.font-bold").click();
    cy.get("button.text-white").click();
    cy.url().should("include", "/sites");
}
  
function openModal() {
    cy.contains("button", "Upload Images").click();
}

function uploadOneImage() {
    cy.get('input[type="file"]').first().selectFile("cypress/fixtures/test-image-4.jpg", { force: true });
}

function siteInput() {
    return cy.get('[data-testid="upload-modal"]')
        .find('input[placeholder="Search by site name or county..."]')
        .first()
        .scrollIntoView();
}

function selectSite(siteName: string) {
    siteInput().click();
    siteInput().type(siteName);
    cy.get('[data-testid="upload-modal"]')
        .find('div.cursor-pointer')
        .first()
        .trigger("mousedown", { bubbles: true });
}

function photographerInput() {
    return cy.get('input[placeholder="Owner of Digital File"]').first().scrollIntoView();
}

function identifierInput() {
    return cy.get('input[placeholder="Shorter Description"]').first().scrollIntoView();
}

function captionInput() {
    return cy.get('textarea[placeholder="Longer Description"]').first().scrollIntoView();
}

function fillAllFields() {
    photographerInput().type("Vishal Sivakumar");
    identifierInput().type("CMPUT401W26 Visit");
    captionInput().type("Riverlot56 Visit with Frank Potter to gain an idea of how stewards inspect sites + as a team bonding activity!");
    selectSite("Riverlot 56");
}

describe("US 2.0.8 - User Upload of Standalone Site Images", () => {
    it("shows empty fields after uploading an image", () => {
        cy.contains(/Image 1 of 1/i).should("exist");
        siteInput().should("have.value", "");
        photographerInput().should("have.value", "");
        identifierInput().should("have.value", "");
        captionInput().should("have.value", "");
    });

    it("allows typing, editing, and clearing the identifier field", () => {
        identifierInput().type("CMPUT401W25 Visit");
        identifierInput().should("have.value", "CMPUT401W25 Visit");

        identifierInput().clear().type("CMPUT401W26 Visit");
        identifierInput().should("have.value", "CMPUT401W26 Visit");

        identifierInput().clear();
        identifierInput().should("have.value", "");
    });

    it("allows typing, editing, and clearing the photographer field", () => {
        photographerInput().type("Vishal SivakumAAAr");
        photographerInput().should("have.value", "Vishal SivakumAAAr");

        photographerInput().clear().type("Vishal Sivakumar");
        photographerInput().should("have.value", "Vishal Sivakumar");

        photographerInput().clear();
        photographerInput().should("have.value", "");
    });

    it("allows typing, editing, and clearing the caption field", () => {
        captionInput().type("Riverlot56 Visit with Frank Potter to gain an idea of how stewards inspect sites + as a team bonding");
        captionInput().should("have.value", "Riverlot56 Visit with Frank Potter to gain an idea of how stewards inspect sites + as a team bonding");

        captionInput().clear().type("Riverlot56 Visit with Frank Potter to gain an idea of how stewards inspect sites + as a team bonding activity!");
        captionInput().should("have.value", "Riverlot56 Visit with Frank Potter to gain an idea of how stewards inspect sites + as a team bonding activity!");
        
        captionInput().clear();
        captionInput().should("have.value", "");
    });

    it("removes the image when the delete button is clicked", () => {
        cy.contains(/Image 1 of 1/i).should("exist");
        cy.get('button').filter(':has(svg.lucide-trash-2)').first().click();
        cy.contains(/Image 1 of 1/i).should("not.exist");
    });

    it("keeps upload button disabled when fields are incomplete", () => {
        cy.get('[data-testid="upload-submit-btn"]').should("be.disabled");
    });
    
    it("enables upload button when all fields are filled", () => {
        fillAllFields();
        cy.get('[data-testid="upload-submit-btn"]').should("not.be.disabled");
    });
});