/// <reference types="cypress" />

// Keeps the helpers below local to this spec instead of clashing with other specs' globals.
export {};

// Runs against a real database, so row level security and the column grant on public.people
// are what is tested, not mocks. Set these in cypress.env.json or as CYPRESS_* variables:
//   PROFILE_USER_A_EMAIL, PROFILE_USER_A_PASSWORD, PROFILE_USER_B_EMAIL, PROFILE_USER_B_PASSWORD
//   SUPABASE_URL, SUPABASE_ANON_KEY (the same values as NEXT_PUBLIC_SUPABASE_URL and
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
// Both users must be approved accounts with a people row.

function env(name: string): string {
  const value = Cypress.env(name);
  if (!value) throw new Error(`Set the Cypress env value ${name} to run the profile tests.`);
  return value;
}

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
  cy.get('#password').click().type(password, { log: false });
  cy.get('button.font-bold').click();
  cy.wait(3000);
  dismissTutorialIfPresent();
}

function logout() {
  cy.get('button[title="Open menu"]').click();
  cy.contains('Logout').should('exist');
  cy.contains('button', 'Logout').click();
}

// Signs in through the Supabase auth API and returns the user's access token.
function accessToken(email: string, password: string) {
  return cy
    .request({
      method: 'POST',
      url: `${env('SUPABASE_URL')}/auth/v1/token?grant_type=password`,
      headers: { apikey: env('SUPABASE_ANON_KEY') },
      body: { email, password },
      log: false,
    })
    .then((response) => response.body.access_token as string);
}

function restHeaders(token: string) {
  return { apikey: env('SUPABASE_ANON_KEY'), Authorization: `Bearer ${token}` };
}

describe('Profile on a real database', () => {
  it('keeps saved profile edits after signing out and back in (1.0.2 AT5)', () => {
    const email = env('PROFILE_USER_A_EMAIL');
    const password = env('PROFILE_USER_A_PASSWORD');
    const stamp = Date.now().toString();
    const displayName = `Cypress A ${stamp}`;
    const skill = `skill-${stamp}`;
    const contactEmail = `cypress-${stamp}@example.com`;

    login(email, password);
    cy.visit('http://localhost:3000/profile');
    cy.contains('button', 'Edit profile').click();
    cy.contains('label', 'Display name').find('input').clear().type(displayName);
    cy.contains('label', 'Skills').find('input').clear().type(skill);
    cy.contains('form label', 'Email').find('input').clear().type(contactEmail);
    cy.contains('button', 'Save changes').click();
    cy.contains('h1', displayName).should('exist');

    logout();
    cy.url().should('include', '/login');

    login(email, password);
    cy.visit('http://localhost:3000/profile');
    cy.contains('h1', displayName).should('exist');
    cy.contains(skill).should('exist');
    cy.get('[data-testid="profile-contact"]').should('contain', contactEmail);
  });

  it('does not let one user change another user\'s profile (1.0.2 AT2)', () => {
    const emailA = env('PROFILE_USER_A_EMAIL');
    const passwordA = env('PROFILE_USER_A_PASSWORD');
    const emailB = env('PROFILE_USER_B_EMAIL');
    const passwordB = env('PROFILE_USER_B_PASSWORD');
    const peopleUrl = `${env('SUPABASE_URL')}/rest/v1/people`;

    accessToken(emailA, passwordA).then((tokenA) => {
      const userA = JSON.parse(atob(tokenA.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub as string;
      cy.request({
        url: `${peopleUrl}?auth_user_id=eq.${userA}&select=id,display_name`,
        headers: restHeaders(tokenA),
      }).then(({ body: rowsA }) => {
        expect(rowsA, "user A's people row").to.have.length(1);
        const personA = rowsA[0] as { id: number; display_name: string };

        // The app route: B's PATCH can only ever reach B's own row.
        login(emailB, passwordB);
        cy.request('GET', 'http://localhost:3000/api/profile').then(({ body: own }) => {
          expect(own.profile.id).not.to.equal(personA.id);
          const nameB = `Cypress B ${Date.now()}`;
          cy.request('PATCH', 'http://localhost:3000/api/profile', {
            personId: personA.id,
            displayName: nameB,
            skills: own.profile.skills,
            focusAreas: own.profile.focusAreas,
          }).then(({ body: saved }) => {
            expect(saved.profile.id).to.equal(own.profile.id);
            expect(saved.profile.displayName).to.equal(nameB);
          });
        });
        cy.request('GET', `http://localhost:3000/api/profile?personId=${personA.id}`)
          .its('body.profile.displayName')
          .should('equal', personA.display_name);

        // Straight to PostgREST with B's token: row level security must leave A's row alone.
        accessToken(emailB, passwordB).then((tokenB) => {
          cy.request({
            method: 'PATCH',
            url: `${peopleUrl}?id=eq.${personA.id}`,
            headers: { ...restHeaders(tokenB), Prefer: 'return=representation' },
            body: { display_name: 'Changed by user B' },
            failOnStatusCode: false,
          }).then((response) => {
            if (response.status < 300) expect(response.body, 'rows B updated').to.have.length(0);
          });
          cy.request({
            url: `${peopleUrl}?id=eq.${personA.id}&select=display_name`,
            headers: restHeaders(tokenA),
          })
            .its('body.0.display_name')
            .should('equal', personA.display_name);
        });
      });
    });
  });
});
