/// <reference types="cypress" />

// US 2.0.6 - Search and Filter Sites by County on the Map (acceptance tests in docs/user-stories.md).
// Needs the local seed (scripts/e2e_seed.js): three small boundaries, "Riverlot 56 (NA)"
// (Strathcona), "E2E Lamont Meadow" (Lamont) and "E2E Unlinked Fen" (no site, no county).
// The base map style is stubbed with an empty local one, so no Protomaps key or network is needed.

export {};

const APP = 'http://localhost:3000';

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
  cy.task('setSiteActive', { namesite: 'Riverlot 56 (NA)', is_active: true });

  cy.clearCookies();
  cy.visit(`${APP}/`);
  cy.get('#email').type(Cypress.env('STEWARD_EMAIL'));
  cy.get('#password').type(Cypress.env('STEWARD_PASSWORD'), { log: false });
  cy.get('button.font-bold').click();
  cy.url().should('include', '/sites');
  cy.contains('button', 'Map View').click();
  cy.contains('3 protected areas found').should('be.visible');
});

function countySection() {
  return cy.get('section[aria-label="County"]');
}

function openFilter() {
  cy.contains('button', 'Filter').click();
  countySection().should('be.visible');
}

// Clicks the middle of the map. A popup opens only when a boundary is under that point.
function clickMapCentre() {
  cy.get('.maplibregl-canvas').click();
}

describe('Map search and county filter (US 2.0.6)', () => {
  it('(2.0.6 AT1) only areas in the chosen counties stay on the map', () => {
    openFilter();
    countySection().contains('button', 'Select all').click(); // clears every county
    cy.contains('0 protected areas found').should('be.visible');

    countySection().contains('label', 'Lamont').find('input').check();
    cy.contains('1 protected area found').should('be.visible');
    countySection().contains('1 selected').should('be.visible');

    countySection().contains('label', 'Strathcona').find('input').check();
    cy.contains('2 protected areas found').should('be.visible');
  });

  it('(2.0.6 AT2) clearing the filter brings every active area back', () => {
    openFilter();
    countySection().contains('label', 'Strathcona').find('input').uncheck();
    cy.contains('2 protected areas found').should('be.visible');

    countySection().contains('button', 'Select all').click();
    cy.contains('3 protected areas found').should('be.visible');
    countySection().contains('All').should('be.visible');
  });

  it('(2.0.6 AT3) picking a search match centres the map on that area', () => {
    // At the start the map shows all of Alberta, and no boundary is under its centre.
    cy.get('.maplibregl-canvas').should('be.visible');
    clickMapCentre();
    cy.get('.maplibregl-popup').should('not.exist');

    cy.get('input[aria-label="Search"]').type('Lamont');
    cy.contains('1 protected area found').should('be.visible');
    cy.get('ul[aria-label="Matching protected areas"]').contains('li', 'E2E Lamont Meadow').click();

    // ponytail: fixed wait for the fitBounds animation (about 1 s); poll the map camera if it gets flaky.
    cy.wait(2000);
    clickMapCentre();
    cy.get('.maplibregl-popup').should('contain', 'E2E Lamont Meadow');
  });

  it('(2.0.6 AT3) failure case: a name with no match lists nothing and leaves the map in place', () => {
    cy.get('input[aria-label="Search"]').type('No such protected area');
    cy.contains('0 protected areas found').should('be.visible');
    cy.get('ul[aria-label="Matching protected areas"]').should('not.exist');
    clickMapCentre();
    cy.get('.maplibregl-popup').should('not.exist');
  });
});
