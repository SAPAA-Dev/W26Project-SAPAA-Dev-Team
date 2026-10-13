// Builds the generated lines of the ER, models and services diagrams.
import path from 'node:path';
import { Project, Node, SyntaxKind, TypeFormatFlags, ts } from 'ts-morph';

const MAX_RETURN = 60;

// ---------- ER diagram (from the migrations) ----------

const erName = (table, cfg) => cfg.external[table] ?? table.replace(/[^\w]/g, '_');

function erColumn(table, col, cfg) {
  const keys = [col.pk && 'PK', col.fk && 'FK', col.unique && !col.pk && 'UK'].filter(Boolean);
  const notes = [];
  const safe = col.name.replace(/[^\w]/g, '_');
  if (safe !== col.name) notes.push(col.name);
  for (const u of table.uniques)
    if (u.cols.includes(col.name)) notes.push(`unique (${u.cols.join(', ')})`);
  if (cfg.notes[`${table.name}.${col.name}`]) notes.push(cfg.notes[`${table.name}.${col.name}`]);
  const comment = notes.length ? ` "${notes.join('; ').replace(/"/g, "'")}"` : '';
  return `    ${col.type} ${safe}${keys.length ? ' ' + keys.join(', ') : ''}${comment}`;
}

export function erLines(schema, cfg) {
  const tables = [...schema.tables.values()].filter((t) => !cfg.exclude.includes(t.name));
  const shown = new Set(tables.map((t) => t.name));
  const lines = ['%% Generated from webapp/supabase/migrations/*.sql, applied in filename order.'];
  for (const t of tables) {
    const cat = cfg.categories[t.name] ?? 'web';
    lines.push(`${erName(t.name, cfg)}["${cat.toUpperCase()} ${t.name}"] {`);
    for (const col of t.columns.values()) lines.push(erColumn(t, col, cfg));
    lines.push('}', '');
  }
  for (const t of tables) {
    for (const col of t.columns.values()) {
      if (!col.fk || !(shown.has(col.fk.table) || cfg.external[col.fk.table])) continue;
      const parent = col.notNull ? '||' : '|o';
      const child = (col.pk && !col.compositePk) || col.unique ? 'o|' : 'o{';
      lines.push(`${erName(col.fk.table, cfg)} ${parent}--${child} ${erName(t.name, cfg)} : "${col.name}"`);
    }
  }
  lines.push('');
  const byCat = new Map();
  for (const t of tables) {
    const cat = cfg.categories[t.name] ?? 'web';
    byCat.set(cat, [...(byCat.get(cat) ?? []), erName(t.name, cfg)]);
  }
  for (const [cat, names] of byCat) lines.push(`class ${names.join(',')} ${cat}`);
  return lines;
}

// ---------- Models class diagram (tables from the migrations, types from TypeScript) ----------

const TS_TYPE = {
  bigint: 'number', integer: 'number', smallint: 'number', numeric: 'number', real: 'number', double: 'number',
  text: 'string', uuid: 'string', varchar: 'string', char: 'string',
  boolean: 'boolean', date: 'date', timestamptz: 'timestamp', timestamp: 'timestamp', jsonb: 'json', json: 'json',
};
const modelType = (t) => (t.endsWith('[]') ? (TS_TYPE[t.slice(0, -2)] ?? t.slice(0, -2)) + '[]' : TS_TYPE[t] ?? t);

export function modelLines(schema, project, root, cfg) {
  const lines = ['%% Tables: webapp/supabase/migrations/*.sql. Types: the TypeScript source. ? = nullable.'];
  const rels = [];
  for (const [table, cls] of Object.entries(cfg.tables)) {
    const t = schema.tables.get(table);
    if (!t) continue; // the table was dropped or renamed: it leaves the diagram
    lines.push(`class ${cls} {`, `    <<table ${table}>>`);
    for (const c of t.columns.values()) {
      lines.push(`    +${c.name}: ${modelType(c.type)}${c.notNull ? '' : '?'}`);
      const parent = c.fk && cfg.tables[c.fk.table];
      if (!parent) continue;
      const pm = c.notNull ? '"1"' : '"0..1"';
      const cm = (c.pk && !c.compositePk) || c.unique ? '"0..1"' : '"0..*"';
      rels.push(c.fk.onDelete === 'cascade'
        ? `${parent} ${pm} *-- ${cm} ${cls} : ${c.name}`
        : `${parent} ${pm} <-- ${cm} ${cls} : ${c.name}`);
    }
    lines.push('}', '');
  }
  for (const ty of cfg.types) {
    const decl = sourceFile(project, root, ty.module).getInterfaceOrThrow(ty.name);
    lines.push(`class ${ty.class} {`, `    <<type in ${ty.module}>>`);
    for (const p of decl.getProperties()) {
      const type = p.getTypeNode()?.getText() ?? p.getType().getText(p);
      lines.push(`    +${p.getName()}: ${tidyTypeText(type)}${p.hasQuestionToken() ? '?' : ''}`);
    }
    lines.push('}', '');
  }
  return [...lines, ...rels];
}

// ---------- Services class diagram (exported functions and route handlers) ----------

// The output must not depend on whether webapp/node_modules is installed (CI does not install
// it). So imports from packages and @types never resolve, and their types print as "any".
export function createProject(root, tsconfig) {
  return new Project({
    tsConfigFilePath: path.join(root, tsconfig),
    skipAddingFilesFromTsConfig: true,
    compilerOptions: { types: [] },
    resolutionHost: (host, getOptions) => ({
      resolveModuleNames: (names, containingFile) => names.map((name) => {
        const r = ts.resolveModuleName(name, containingFile, getOptions(), host).resolvedModule;
        return r && !r.resolvedFileName.includes('/node_modules/') ? r : undefined;
      }),
      resolveTypeReferenceDirectives: (names) => names.map(() => undefined),
    }),
  });
}

function sourceFile(project, root, rel) {
  const abs = path.join(root, rel);
  return project.getSourceFile(abs) ?? project.addSourceFileAtPath(abs);
}

// Mermaid class members cannot hold < > { } or |. Keep the text short and readable.
function tidyTypeText(text) {
  return text
    .replace(/import\([^)]*\)\./g, '')
    .replace(/\s*\|\s*/g, ' or ')
    .replace(/\s+/g, ' ')
    .replace(/<.*>/, '')
    .replace(/[{};]/g, '')
    .trim();
}

function formatType(type, node, depth = 0) {
  if (depth > 3) return 'object';
  const promised = type.getSymbol()?.getName() === 'Promise' ? type.getTypeArguments()[0] : null;
  if (promised) return formatType(promised, node, depth + 1);
  if (type.isBoolean()) return 'boolean';
  const alias = type.getAliasSymbol()?.getName();
  if (alias) return alias;
  if (type.isUnion()) {
    const parts = type.getUnionTypes()
      .filter((t) => !t.isUndefined())
      .map((t) => (t.isBooleanLiteral() ? 'boolean' : formatType(t, node, depth + 1)));
    // "string or null", the way the hand-written diagrams say it
    const uniq = [...new Set(parts)].sort((a, b) => (a === 'null') - (b === 'null'));
    return uniq.join(' or ') || 'void';
  }
  if (type.isArray()) {
    const el = formatType(type.getArrayElementTypeOrThrow(), node, depth + 1);
    return /\s/.test(el) ? `list of ${el}` : `${el}[]`;
  }
  if (type.isVoid() || type.isUndefined()) return 'void';
  const name = type.getSymbol()?.getName();
  if (type.isObject() && (type.isAnonymous() || name === '__object' || name === '__type')) {
    return type.getProperties().map((p) => p.getName()).join(', ') || 'object';
  }
  if (type.isIntersection()) return type.getIntersectionTypes().map((t) => formatType(t, node, depth + 1)).join(' and ');
  return tidyTypeText(type.getText(node, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope));
}

function paramText(p) {
  const n = p.getNameNode();
  if (Node.isObjectBindingPattern(n)) return n.getElements().map((e) => e.getName()).join(', ');
  return p.getName();
}

function functionLine(name, fn) {
  const params = fn.getParameters().map(paramText).join(', ');
  let ret = formatType(fn.getReturnType(), fn);
  if (ret.length > MAX_RETURN) ret = ret.slice(0, ret.lastIndexOf(',', MAX_RETURN)) + ', ...';
  return `+${name}(${params}) ${ret}`;
}

// A route handler: the parameters are the path segments, the query keys and "body";
// the result is the keys of the JSON that a successful response returns.
function routeLine(name, fn, routePath) {
  const params = [...routePath.matchAll(/\[(\w+)\]/g)].map((m) => m[1]);
  const keys = [];
  for (const call of fn.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const callee = call.getExpression().getText();
    const arg = call.getArguments()[0];
    if (callee.endsWith('searchParams.get') && Node.isStringLiteral(arg)) params.push(arg.getLiteralText());
    else if (/\b(req|request)\.(json|formData)$/.test(callee)) params.push('body');
    else if (/^(NextResponse|Response)\.json$/.test(callee) && Node.isObjectLiteralExpression(arg)) {
      const status = call.getArguments()[1]?.getText().match(/status:\s*(\d+)/)?.[1];
      if (status && Number(status) >= 400) continue;
      for (const p of arg.getProperties()) {
        const k = p.getName?.()?.replace(/^['"]|['"]$/g, '');
        if (k && k !== 'error') keys.push(k);
      }
    }
  }
  const uniq = (a) => [...new Set(a)];
  return `+${name}(${uniq(params).join(', ')}) ${uniq(keys).join(', ') || 'Response'}`;
}

function exportedFunctions(file) {
  const out = [];
  for (const [name, decls] of file.getExportedDeclarations()) {
    const d = decls[0];
    if (d.getSourceFile() !== file) continue; // re-exports are drawn where they are declared
    if (Node.isFunctionDeclaration(d)) out.push([name, d, d.getStart()]);
    else if (Node.isVariableDeclaration(d)) {
      const init = d.getInitializer();
      if (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) out.push([name, init, d.getStart()]);
    }
  }
  return out.sort((a, b) => a[2] - b[2]);
}

export function serviceLines(project, root, cfg) {
  const lines = ['%% Exported functions and route handlers from the TypeScript source.'];
  const warnings = [];
  for (const [ns, classes] of Object.entries(cfg.namespaces)) {
    lines.push(`namespace ${ns} {`);
    for (const c of classes) {
      const file = sourceFile(project, root, c.module);
      const isRoute = c.module.endsWith('/route.ts');
      const routePath = isRoute ? '/' + path.dirname(c.module).replace(/^webapp\/app\//, '') : null;
      let fns = exportedFunctions(file);
      if (c.include) {
        const byName = new Map(fns.map((f) => [f[0], f]));
        for (const n of c.include) if (!byName.has(n)) warnings.push(`${c.class}: ${c.module} has no export ${n}`);
        fns = c.include.filter((n) => byName.has(n)).map((n) => byName.get(n));
      }
      lines.push(`    class ${c.class} {`, `        <<${isRoute ? 'route ' + routePath : c.module}>>`);
      for (const [name, fn] of fns)
        lines.push('        ' + (isRoute ? routeLine(name, fn, routePath) : functionLine(name, fn)));
      lines.push('    }');
    }
    lines.push('}', '');
  }
  return { lines, warnings };
}
