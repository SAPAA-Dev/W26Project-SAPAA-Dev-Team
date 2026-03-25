/// <reference types="cypress" />

beforeEach(() => {
  cy.viewport(1280, 720);
});

function loginAsAdmin() {
  cy.visit('http://localhost:3000/');
  cy.get('#email').type('jason.liang5129@gmail.com');
  cy.get('#password').type('123Abc@@');
  cy.get('button.font-bold').click();
  cy.get('button.text-white').click();
  cy.wait(2000);
  cy.contains('Admin').first().click();
  cy.wait(2000);
  cy.url().should('include', '/admin/dashboard');
}

function navigateToSiteDetails() {
  cy.visit('http://localhost:3000/admin/sites');
  cy.url().should('include', '/admin/sites');
  cy.wait(2000);
  cy.get('input[placeholder="Search by site name or county..."]').type('riverlot');
  cy.contains('Riverlot 56').first().click();
  cy.wait(2000);
}

function openSitePdfModal() {
  cy.wait(2000);
  cy.contains('Export').click();
  cy.contains('Export as PDF').click();
  cy.contains('Export PDF Report').should('be.visible');
}

describe('PDF Export - Admin Access Only', () => {

  it('Export PDF button is accessible on the Admin panel', () => {
    loginAsAdmin();
    navigateToSiteDetails();
    cy.contains('Export').click();
    cy.contains('Export as PDF').should('be.visible');
  });

  it('Bulk PDF button is accessible on the Admin sites list', () => {
    loginAsAdmin();
    cy.visit('http://localhost:3000/admin/sites');
    cy.url().should('include', '/admin/sites');
    cy.wait(2000);
    cy.contains('Bulk PDF').should('be.visible');
  });
});

describe('PDF Export - Select Sections', () => {

  beforeEach(() => {
    loginAsAdmin();
    navigateToSiteDetails();
  });

  it('Allows Admin to select sections in Advanced Options', () => {
    openSitePdfModal();
    cy.contains('Advanced Options').click();
    cy.contains('Sections').scrollIntoView().should('be.visible');
    cy.contains('All selected').scrollIntoView().should('be.visible');
  });

  it('Allows Admin to deselect a section', () => {
    openSitePdfModal();
    cy.contains('Advanced Options').click();
    // Click the first section to deselect it
    cy.contains('Sections').parent().parent().find('button').filter(':has(svg)').first().click();
    cy.contains('Select all').should('be.visible');
  });

  it('Shows error when all sections are deselected and disables export', () => {
    openSitePdfModal();
    cy.contains('Advanced Options').click();
    // Deselect all sections one by one
    cy.contains('Sections').parent().parent().find('div.space-y-2 button').each(($btn) => {
      cy.wrap($btn).click();
    });
    cy.contains('At least one section must be selected').should('be.visible');
    cy.contains('button', 'Export PDF').should('be.disabled');
  });
});

describe('PDF Export - Select Time Period', () => {

  beforeEach(() => {
    loginAsAdmin();
    navigateToSiteDetails();
  });

  it('Allows Admin to set a date range filter', () => {
    openSitePdfModal();
    cy.contains('Date Range').should('be.visible');
    cy.get('input[type="date"]').first().type('2024-01-01');
    cy.get('input[type="date"]').last().type('2024-12-31');
    cy.contains('Clear dates').should('be.visible');
  });

  it('Shows error for invalid date range (from > to)', () => {
    openSitePdfModal();
    cy.get('input[type="date"]').first().type('2025-06-01');
    cy.get('input[type="date"]').last().type('2024-01-01');
    cy.contains('Start date cannot be after end date').should('be.visible');
    cy.contains('button', 'Export PDF').should('be.disabled');
  });

  it('Allows Admin to clear dates', () => {
    openSitePdfModal();
    cy.get('input[type="date"]').first().type('2024-01-01');
    cy.contains('Clear dates').click();
    cy.get('input[type="date"]').first().should('have.value', '');
    cy.get('input[type="date"]').last().should('have.value', '');
  });
});

describe('PDF Export - Generates PDF Given Criteria', () => {

  beforeEach(() => {
    loginAsAdmin();
  });

  it('Generates a site PDF with default options', () => {
    navigateToSiteDetails();

    cy.intercept('POST', '/api/pdf', {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="SAPAA_Report.pdf"',
      },
      body: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
    }).as('pdfRequest');

    openSitePdfModal();
    cy.contains('button', 'Export PDF').click();
    cy.wait('@pdfRequest');
    cy.contains('Export PDF Report').should('not.exist');
  });

  it('Generates a site PDF with a date range and section filter', () => {
    navigateToSiteDetails();

    cy.intercept('POST', '/api/pdf', (req) => {
      expect(req.body.options.dateFrom).to.eq('2024-01-01');
      expect(req.body.options.dateTo).to.eq('2024-12-31');
      expect(req.body.options.selectedSections).to.not.eq('all');
      req.reply({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="SAPAA_Report.pdf"',
        },
        body: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      });
    }).as('pdfRequest');

    openSitePdfModal();

    // Set date range
    cy.get('input[type="date"]').first().type('2024-01-01');
    cy.get('input[type="date"]').last().type('2024-12-31');

    // Deselect a section
    cy.contains('Advanced Options').click();
    cy.contains('Sections').parent().parent().find('div.space-y-2 button').first().click();

    cy.contains('button', 'Export PDF').click();
    cy.wait('@pdfRequest');
    cy.contains('Export PDF Report').should('not.exist');
  });

  it('Generates a bulk multi-site PDF', () => {
    cy.visit('http://localhost:3000/admin/sites');
    cy.url().should('include', '/admin/sites');
    cy.wait(2000);

    cy.intercept('POST', '/api/pdf', (req) => {
      expect(req.body.mode).to.eq('multi-site');
      expect(req.body.siteNames).to.be.an('array').and.have.length.greaterThan(0);
      req.reply({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="SAPAA_MultiSite_Report.pdf"',
        },
        body: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      });
    }).as('pdfRequest');

    cy.contains('Bulk PDF').click();
    cy.contains('button', 'Export PDF').click();
    cy.wait('@pdfRequest');
    cy.contains('Export PDF Report').should('not.exist');
  });

  it('Shows error when PDF generation fails', () => {
    navigateToSiteDetails();

    cy.intercept('POST', '/api/pdf', {
      statusCode: 500,
      body: { error: 'Failed to generate PDF' },
    }).as('pdfRequest');

    openSitePdfModal();
    cy.contains('button', 'Export PDF').click();
    cy.wait('@pdfRequest');
    cy.contains('Failed to generate PDF').should('be.visible');
  });
});
