#!/usr/bin/env node
// Pre-tool guard for AI coding agents. Tool-agnostic: it reads one JSON event on
// stdin, finds a shell command, a file path and new file content in it, and
// exits 2 with a reason on stderr to block. Exit 0 means allow.
//
// Accepted input shape (the Claude Code PreToolUse shape; other tools need an
// adapter if their shape differs):
//   { "session_id": "...", "tool_input": { "command": "...", "file_path": "...",
//     "content": "...", "new_string": "..." } }
//
// Turn off one rule for one command: AGENT_GUARD_OFF=repeat,stash <agent>

import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const JWT = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/;
const ENV_IN_COMMAND = /(^|[\s/"'=<>])\.env(\.(?!example\b)[\w.-]+)?(?=$|[\s"';|&)<>])/;

function isSecretFile(path) {
  const name = basename(path);
  if (name === 'cypress.env.json') return true;
  return /^\.env(\..+)?$/.test(name) && !name.endsWith('.example');
}

const rules = [
  {
    id: 'bulk-add',
    check: ({ command }) =>
      /\bgit\s+add\s+(-A\b|--all\b|\.(\s|$))/.test(command) ||
      /\bgit\s+commit\s+(-[a-zA-Z]*a[a-zA-Z]*\b|--all\b)/.test(command),
    reason: 'Stage files by name. Bulk staging can commit secrets or unrelated work.',
  },
  {
    id: 'stash',
    check: ({ command }) =>
      /\bgit\s+stash\b(?!\s+(list|show)\b)/.test(command),
    reason: 'Do not stash. Other sessions can lose work. Commit to a branch or ask the user.',
  },
  {
    id: 'no-verify',
    check: ({ command }) => /\bgit\b.*\s--no-verify\b/.test(command),
    reason: 'Do not skip git hooks. Fix the commit message or branch name.',
  },
  {
    id: 'cypress',
    check: ({ command }) => /\bcypress\s+(run|open)\b/.test(command),
    reason: 'Cypress tests write to the live Supabase database. Only a human runs them.',
  },
  {
    id: 'env-file',
    check: ({ command, filePath }) =>
      (filePath && isSecretFile(filePath)) || ENV_IN_COMMAND.test(command) ||
      /\bcypress\.env\.json\b/.test(command),
    reason: 'Do not read or change secret files (.env*, cypress.env.json). Ask the user for the value you need.',
  },
  {
    id: 'jwt-literal',
    check: ({ newContent }) => JWT.test(newContent),
    reason: 'New content has a JWT. Put keys in environment variables, not in code or docs.',
  },
  {
    id: 'repeat',
    check: ({ command, sessionId }) => command !== '' && isThirdRepeat(command, sessionId),
    reason: 'Same command 3 times in a row. Stop and find the cause, or ask the user.',
  },
];

function isThirdRepeat(command, sessionId) {
  const stateFile = join(tmpdir(), `agent-guard-${sessionId || 'default'}.json`);
  let state = { command: '', count: 0 };
  try {
    state = JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch {
    // First command in this session: no state file yet.
  }
  state = state.command === command ? { command, count: state.count + 1 } : { command, count: 1 };
  writeFileSync(stateFile, JSON.stringify(state));
  return state.count >= 3;
}

export function evaluate(event, disabled = []) {
  const input = event.tool_input ?? {};
  const facts = {
    command: typeof input.command === 'string' ? input.command : '',
    filePath: input.file_path ?? input.path ?? input.notebook_path ?? '',
    newContent: [input.content, input.new_string, input.new_source]
      .filter((value) => typeof value === 'string')
      .join('\n'),
    sessionId: event.session_id,
  };
  for (const rule of rules) {
    if (disabled.includes(rule.id)) continue;
    if (rule.check(facts)) return `[guard:${rule.id}] ${rule.reason}`;
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let blockReason = null;
  try {
    const event = JSON.parse(readFileSync(0, 'utf8'));
    const disabled = (process.env.AGENT_GUARD_OFF ?? '').split(',').map((id) => id.trim());
    blockReason = evaluate(event, disabled);
  } catch {
    // Fail open: a broken guard must not stop all work.
  }
  if (blockReason) {
    process.stderr.write(blockReason + '\n');
    process.exit(2);
  }
}
