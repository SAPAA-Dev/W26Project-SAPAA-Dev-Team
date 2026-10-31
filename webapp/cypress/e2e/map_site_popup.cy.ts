/// <reference types="cypress" />

// US 2.0.8 - View a Site's Details From the Map (acceptance tests in docs/user-stories.md).
// Needs the local seed (scripts/e2e_seed.js): "Riverlot 56 (NA)" is linked to its boundary and
// has report E2E-ARCHIVE-1, so the popup has a county and a last inspection date.
// The base map style is stubbed with an empty local one, so no Protomaps key is needed.

export {};

const APP = 'http://localhost:3000';
const SITE = 'Riverlot 56 (NA)';
const DETAIL_PATH = `/detail/${encodeURIComponent(SITE)}`;

beforeEach(() => {
  cy.viewport(1280, 1000);
  // The first-login tutorial overlay can block clicks, so every tutorial reads as seen.
  cy.on('window:before:load', (win) => {
    const getItem = win.Storage.prototype.getItem;
    win.Storage.prototype.getItem = function (key: string) {
      return key.startsWith('sapaa_tutorial_') ? 'true' : getItem.call(this, key);
    };
  });
  cy.intercept('GET', 'https://api.protomaps.com/**', {
    version: 8,
    sources: {},
    layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#ffffff' } }],
  });

  cy.clearCookies();
  cy.visit(`${APP}/`);
  cy.get('#email').type(Cypress.env('STEWARD_EMAIL'));
  cy.get('#password').type(Cypress.env('STEWARD_PASSWORD'), { log: false });
  cy.get('button.font-bold').click();
  cy.url().should('include', '/sites');
  cy.contains('button', 'Map View').click();
  cy.get('.maplibregl-canvas').should('be.visible');
});

// Clicks the middle of the map. A popup opens only when a boundary is under that point.
function clickMapCentre() {
  cy.get('.maplibregl-canvas').click();
}

// The search list centres the map on the chosen area, so the centre then holds that boundary.
function focusArea(name: string) {
  cy.get('input[aria-label="Search"]').clear().type(name);
  cy.get('ul[aria-label="Matching protected areas"]').contains('li', name).click();
  // Fixed wait for the fitBounds animation (about 1 s); poll the camera if this gets flaky.
  cy.wait(2000);
}

describe('Site details from the map (US 2.0.8)', () => {
  it('(2.0.8 AT1) selecting a Site opens its detail view, and a click with no Site opens nothing', () => {
    // At the start the map shows all of Alberta, and no boundary is under its centre.
    clickMapCentre();
    cy.get('.maplibregl-popup').should('not.exist');

    focusArea(SITE);
    clickMapCentre();
    cy.get('.maplibregl-popup').should('contain', SITE);
  });

  it('(2.0.8 AT2) the popup shows the name, county and last inspection date of the Site', () => {
    focusArea(SITE);
    clickMapCentre();

    cy.get('.maplibregl-popup [data-site-name="true"]').should('have.text', SITE);
    cy.get('.maplibregl-popup [data-site-county="true"] [data-field-value="true"]').should('have.text', 'Strathcona');
    cy.get('.maplibregl-popup [data-last-inspection="true"] [data-field-value="true"]').should('have.text', 'Jan 15, 2026');
  });

  it('(2.0.8 AT3) "View site & SIRs" opens the Site page, and no link shows for an unlinked area', () => {
    focusArea(SITE);
    clickMapCentre();

    cy.get('.maplibregl-popup [data-view-sirs="true"]')
      .should('have.attr', 'href', DETAIL_PATH)
      .click();
    cy.url().should('include', DETAIL_PATH);

    // E2E Unlinked Fen has no Site, so its popup offers no link. Search centres it in turn.
    cy.visit(`${APP}/sites`);
    cy.contains('button', 'Map View').click();
    focusArea('E2E Unlinked Fen');
    clickMapCentre();
    cy.get('.maplibregl-popup').should('contain', 'No linked site');
    cy.get('.maplibregl-popup [data-view-sirs="true"]').should('not.exist');
  });
});
