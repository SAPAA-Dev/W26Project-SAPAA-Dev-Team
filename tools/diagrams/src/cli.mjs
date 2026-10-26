#!/usr/bin/env node
// npm run diagrams        -> generate, lint, render the changed diagrams
// npm run diagrams:check  -> fail if a generated block or an SVG is out of date (writes nothing)
//
// node src/cli.mjs generate | render [--force] [--only X.mmd] | lint | all | check [--svg-only]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from './config.mjs';
import { schemaFromMigrations } from './schema.mjs';
import { applyGenerated } from './markers.mjs';
import { createProject, erLines, modelLines, serviceLines } from './generate.mjs';
import { hashOf, plan, render } from './render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const abs = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(abs(p), 'utf8');

async function generate({ write }) {
  const schema = await schemaFromMigrations(abs(C.MIGRATIONS));
  const project = createProject(ROOT, C.TSCONFIG);
  const tables = new Set(schema.tables.keys());
  const services = serviceLines(project, ROOT, C.SERVICES);
  const jobs = [
    [C.ER, erLines(schema, C.ER), 'er'],
    [C.MODELS, modelLines(schema, project, ROOT, C.MODELS), 'class'],
    [C.SERVICES, services.lines, 'class'],
  ];
  const warnings = [...services.warnings];
  const changed = [];
  for (const [cfg, lines, kind] of jobs) {
    const before = read(cfg.file);
    const result = applyGenerated(before, cfg.marker, lines, kind, tables);
    warnings.push(...result.warnings.map((w) => `${cfg.file}: ${w}`));
    if (result.text !== before) {
      changed.push(cfg.file);
      if (write) fs.writeFileSync(abs(cfg.file), result.text);
    }
  }
  return { schema, changed, warnings };
}

// Names that a migration removed (renamed or dropped tables, dropped columns) must not
// appear in the hand-written diagrams.
function lint(schema) {
  const warnings = [];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
  const removed = [
    ...[...schema.history.tables].map((t) => [t, new RegExp(`(?<![\\w-])${esc(t)}(?![\\w-])`)]),
    ...[...schema.history.columns].map((tc) => [tc, new RegExp(`\\b${esc(tc)}\\b`)]),
  ];
  for (const f of fs.readdirSync(abs(C.ASSETS)).sort()) {
    if (!C.LINT_GLOBS.some((re) => re.test(f))) continue;
    read(path.join(C.ASSETS, f)).split('\n').forEach((line, i) => {
      // A line that says the name was dropped or renamed is history, not drift.
      if (/\b(dropped|removed|renamed)\b/i.test(line)) return;
      for (const [name, re] of removed)
        if (re.test(line)) warnings.push(`${C.ASSETS}/${f}:${i + 1}: names ${name}, which a migration removed`);
    });
  }
  return warnings;
}

function readHashes() {
  try {
    return JSON.parse(read(C.HASHES));
  } catch {
    return {};
  }
}

function renderPlan(force) {
  return plan({
    assetsDir: abs(C.ASSETS), imagesDir: abs(C.IMAGES), designDoc: read(C.DESIGN_DOC),
    hashes: readHashes(), force,
  });
}

async function doRender(args) {
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
  const all = renderPlan(args.includes('--force'));
  const jobs = all.filter((j) => j.stale && (!only || j.mmd === only));
  const failed = await render(jobs, abs(C.IMAGES));
  // Save both hashes only after a successful render, so an edited SVG fails the check.
  const hashes = readHashes();
  for (const job of jobs) if (!failed.includes(job.mmd)) {
    hashes[job.mmd] = { source: job.hash, svg: hashOf(read(path.join(C.IMAGES, job.svg))) };
  }
  for (const k of Object.keys(hashes)) if (!all.some((j) => j.mmd === k)) delete hashes[k];
  const sorted = Object.fromEntries(Object.keys(hashes).sort().map((k) => [k, hashes[k]]));
  fs.writeFileSync(abs(C.HASHES), JSON.stringify(sorted, null, 2) + '\n');
  if (!jobs.length) console.log('all SVGs are up to date');
  return failed.length ? 1 : 0;
}

function report(warnings) {
  for (const w of warnings) console.log(`warning: ${w}`);
}

const [cmd = 'all', ...args] = process.argv.slice(2);
let code = 0;
if (cmd === 'generate' || cmd === 'all') {
  const { schema, changed, warnings } = await generate({ write: true });
  report([...warnings, ...lint(schema)]);
  console.log(changed.length ? `updated ${changed.join(', ')}` : 'generated blocks are up to date');
  if (cmd === 'all') code = await doRender(args);
} else if (cmd === 'render') {
  code = await doRender(args);
} else if (cmd === 'lint') {
  const schema = await schemaFromMigrations(abs(C.MIGRATIONS));
  report(lint(schema));
} else if (cmd === 'check') {
  // The separate diagrams workflow updates generated blocks; this check needs no browser.
  const svgOnly = args.includes('--svg-only');
  const { schema, changed, warnings } = svgOnly
    ? { schema: null, changed: [], warnings: [] }
    : await generate({ write: false });
  if (!svgOnly) report([...warnings, ...lint(schema)]);
  const stale = renderPlan(false).filter((j) => j.stale).map((j) => j.mmd);
  for (const f of changed) console.log(`out of date: ${f} (generated block)`);
  for (const f of stale) console.log(`out of date: ${C.ASSETS}/${f} (source or SVG differs from the recorded render)`);
  if (changed.length || stale.length) {
    console.log('Run `npm run diagrams` and commit the result.');
    code = 1;
  } else console.log('diagrams are up to date');
} else {
  console.error(`unknown command: ${cmd}`);
  code = 2;
}
process.exitCode = code;
