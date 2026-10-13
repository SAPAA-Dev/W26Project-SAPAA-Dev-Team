/// <reference types="cypress" />

// US 2.0.3 - Deactivate and Reactivate a Site (acceptance tests in docs/user-stories.md).
// Needs the local seed (scripts/e2e_seed.js): the admin and steward users, the site
// "Riverlot 56 (NA)" with its map boundary and report E2E-ARCHIVE-1. Every test leaves the
// site active, and sites the spec creates ("E2E Added ...") are deleted afterwards.

export {};

const APP = 'http://localhost:3000';
const SITE = 'Riverlot 56 (NA)';

beforeEach(() => {
  cy.viewport(1280, 1000);
  // The first-login tutorial overlay can block clicks, so every tutorial reads as seen.
  cy.on('window:before:load', (win) => {
    const getItem = win.Storage.prototype.getItem;
    win.Storage.prototype.getItem = function (key: string) {
      return key.startsWith('sapaa_tutorial_') ? 'true' : getItem.call(this, key);
    };
  });
  // The map is not under test here, so its base style is an empty local one.
  cy.intercept('GET', 'https://api.protomaps.com/**', { version: 8, sources: {}, layers: [] });
  cy.task('setSiteActive', { namesite: SITE, is_active: true });
});

afterEach(() => cy.task('setSiteActive', { namesite: SITE, is_active: true }));
after(() => cy.task('deleteAddedSites'));

function login(user: 'ADMIN' | 'STEWARD') {
  cy.clearCookies();
  cy.visit(`${APP}/`);
  cy.get('#email').type(Cypress.env(`${user}_EMAIL`));
  cy.get('#password').type(Cypress.env(`${user}_PASSWORD`), { log: false });
  cy.get('button.font-bold').click();
  cy.url().should('include', '/sites');
}

function siteCard() {
  return cy.contains('h3', SITE).closest('.group');
}

// Opens the edit modal for the site on /admin/sites, flips "Visible to all users" and saves.
function toggleVisibility(expectedAfter: 'true' | 'false') {
  cy.visit(`${APP}/admin/sites`);
  cy.task<{ id: number }>('getSiteInfo', SITE).then(({ id }) => {
    cy.get(`[data-testid="edit-site-button-${id}"]`).click();
  });
  cy.get('[data-testid="edit-site-active-toggle"]').click().should('have.attr', 'aria-checked', expectedAfter);
  cy.get('[data-testid="edit-site-save-button"]').click();
  cy.get('[data-testid="edit-site-modal"]').should('not.exist');
}

// What a steward sees: the site cards and the map search on /sites.
function stewardFindsSite(found: boolean) {
  login('STEWARD');
  cy.get('input[aria-label="Search"]').type('Riverlot');
  if (found) cy.contains('h3', SITE).should('be.visible');
  else cy.contains('No sites found').should('be.visible');

  cy.contains('button', 'Map View').click();
  cy.contains(/protected areas? found/).should('be.visible');
  cy.get('input[aria-label="Search"]').clear().type('Riverlot');
  if (found) cy.get('ul[aria-label="Matching protected areas"]').should('contain', SITE);
  else {
    cy.contains('0 protected areas found').should('be.visible');
    cy.get('ul[aria-label="Matching protected areas"]').should('not.exist');
  }
}

describe('Deactivate and reactivate a site (US 2.0.3)', () => {
  it('(2.0.3 AT1) admin toggles a site between active and inactive', () => {
    login('ADMIN');
    toggleVisibility('false');
    siteCard().should('contain', 'Inactive');
    cy.task('getSiteInfo', SITE).its('is_active').should('equal', false);

    toggleVisibility('true');
    siteCard().should('not.contain', 'Inactive');
    cy.task('getSiteInfo', SITE).its('is_active').should('equal', true);
  });

  it('(2.0.3 AT2) a deactivated site is gone from the steward site list, search and map search', () => {
    login('ADMIN');
    toggleVisibility('false');
    stewardFindsSite(false);
  });

  it('(2.0.3 AT3) a reactivated site is back in the steward site list, search and map search', () => {
    cy.task('setSiteActive', { namesite: SITE, is_active: false });
    login('ADMIN');
    toggleVisibility('true'); // the toggle starts off, so it now reads checked
    siteCard().should('not.contain', 'Inactive');
    stewardFindsSite(true);
  });

  it('(2.0.3 AT3) failure case: a steward has no control to deactivate or reactivate a site', () => {
    login('STEWARD');
    cy.get('button[title="Open menu"]').click();
    cy.contains('Go to admin dashboard').should('not.exist');

    cy.visit(`${APP}/admin/sites`);
    cy.get('[data-testid="add-site-button"]').should('not.exist');
    cy.get('[data-testid^="edit-site-button-"]').should('not.exist');
    cy.get('[data-testid="edit-site-active-toggle"]').should('not.exist');
    cy.task('getSiteInfo', SITE).its('is_active').should('equal', true);
  });

  it('(2.0.3 AT4) the inspections of a deactivated site can still be viewed', () => {
    cy.task('setSiteActive', { namesite: SITE, is_active: false });
    login('ADMIN');
    cy.visit(`${APP}/admin/sites/${encodeURIComponent(SITE)}`);
    cy.contains('Inspection Reports (1)').should('be.visible');
    cy.contains('h3', 'January 15, 2026').should('be.visible').click();
    cy.contains('E2E archive report answer').should('be.visible');
  });

  it('(2.0.3 AT5) a new site is active by default', () => {
    const name = `E2E Added Active ${Date.now()}`;
    login('ADMIN');
    cy.visit(`${APP}/admin/sites`);
    cy.get('[data-testid="add-site-button"]').click();
    cy.get('[data-testid="add-site-name-input"]').type(name);
    cy.get('[data-testid="add-site-save-button"]').click();
    cy.get('[data-testid="add-site-modal"]').should('not.exist');

    cy.contains('h3', name).closest('.group').should('not.contain', 'Inactive');
    cy.task('getSiteInfo', name).its('is_active').should('equal', true);
  });
});
