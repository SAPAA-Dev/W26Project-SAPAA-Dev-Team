import fs from 'fs';
import path from 'path';

// Logins come from Cypress.env() (gitignored cypress.env.json), never from the specs.
describe('Cypress specs', () => {
  const dir = path.join(__dirname, '..', 'cypress', 'e2e');
  const specs = fs.readdirSync(dir).filter((f) => f.endsWith('.cy.ts'));

  it.each(specs)('%s types no hard-coded email or password', (spec) => {
    const source = fs.readFileSync(path.join(dir, spec), 'utf8');
    expect(source).not.toMatch(/#(email|password)['"]\)(\.click\(\))?\.type\(\s*['"]/);
    expect(source).not.toMatch(/(Email|Password)\s*=\s*['"]/);
  });
});
