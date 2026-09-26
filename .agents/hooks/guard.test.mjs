import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluate } from './guard.mjs';

const bash = (command) => ({ session_id: `test-${Math.random()}`, tool_input: { command } });
const blockedBy = (event) => evaluate(event)?.match(/\[guard:([\w-]+)\]/)?.[1] ?? null;

test('blocks the risky commands', () => {
  assert.equal(blockedBy(bash('git add -A')), 'bulk-add');
  assert.equal(blockedBy(bash('git add .')), 'bulk-add');
  assert.equal(blockedBy(bash('git commit -am "(fix): x"')), 'bulk-add');
  assert.equal(blockedBy(bash('git stash')), 'stash');
  assert.equal(blockedBy(bash('git stash pop')), 'stash');
  assert.equal(blockedBy(bash('git commit --no-verify -m "(fix): x"')), 'no-verify');
  assert.equal(blockedBy(bash('cd webapp && npx cypress run')), 'cypress');
  assert.equal(blockedBy(bash('cat webapp/.env.local')), 'env-file');
  assert.equal(blockedBy(bash('cat .env')), 'env-file');
  assert.equal(blockedBy(bash('cat webapp/cypress.env.json')), 'env-file');
});

test('allows the normal commands', () => {
  for (const command of [
    'git add webapp/app/page.tsx',
    'git commit --amend -m "(fix): x"',
    'git stash list',
    'cd webapp && npm test',
    'cp .env.example .env.example.bak',
    'grep -rn process.env.NEXT_PUBLIC webapp/utils',
  ]) {
    assert.equal(evaluate(bash(command)), null, command);
  }
});

test('blocks secret file paths and JWT content in edits', () => {
  assert.equal(blockedBy({ tool_input: { file_path: '/repo/FNR/.env.local' } }), 'env-file');
  assert.equal(blockedBy({ tool_input: { file_path: '/repo/.env.example' } }), null);
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9';
  assert.equal(blockedBy({ tool_input: { file_path: 'a.ts', new_string: `const key = '${jwt}'` } }), 'jwt-literal');
  assert.equal(blockedBy({ tool_input: { file_path: 'a.ts', content: 'process.env.SUPABASE_KEY' } }), null);
});

test('blocks the third identical command in a row', () => {
  const event = bash('npm test');
  assert.equal(evaluate(event), null);
  assert.equal(evaluate(event), null);
  assert.equal(blockedBy(event), 'repeat');
});

test('disabled rules do not fire', () => {
  assert.equal(evaluate(bash('git stash'), ['stash']), null);
});

test('CLI exits 2 to block and fails open on bad input', () => {
  const guard = fileURLToPath(new URL('./guard.mjs', import.meta.url));
  const blocked = spawnSync('node', [guard], { input: JSON.stringify(bash('git add -A')) });
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr.toString(), /guard:bulk-add/);
  assert.equal(spawnSync('node', [guard], { input: 'not json' }).status, 0);
});
