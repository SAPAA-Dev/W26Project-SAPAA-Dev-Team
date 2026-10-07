// Puts generated lines between "%% BEGIN GENERATED: <name>" and "%% END GENERATED: <name>".
// Everything outside the markers is hand-written and is kept, with these updater rules:
// - In a hand-written class block that the generator also defines, the members that the
//   generator now makes are removed. Members the code does not have yet (proposed
//   [NEW x.y.z] members) stay in that block; Mermaid merges both blocks of a class.
// - ER diagrams only: in a hand-written entity block for a generated table, every column
//   is removed, also a column the schema does not have (with a warning). Proposed ER
//   columns go in ER_Diagram_Proposed_User_Stories.mmd.
// - A hand-written "Name : member" line is removed when the generated Name has that member.
// - A hand-written <<new table x>> class is removed when table x exists.
// - A hand-written relation is removed when the generator makes the same relation.
// - A tag such as [CHANGE 2.0.3] at the end of a member line is kept on the generated
//   line (class diagrams only). [NEW ...] tags are dropped, because the item now exists.

export const begin = (name) => `%% BEGIN GENERATED: ${name}`;
export const end = (name) => `%% END GENERATED: ${name}`;

const INDENT = '    ';
const TAGS = /((?:\s*\[[^\]]+\])+)\s*$/;
const BLOCK_START = {
  class: /^\s*class\s+(\w+)\s*(?:\[[^\]]*\])?\s*\{\s*$/,
  er: /^\s*([\w-]+)\s*(?:\["[^"]*"\])?\s*\{\s*$/,
};
const BLOCK_END = /^\s*\}\s*$/;
const MEMBER_LINE = /^\s*(\w+)\s*:\s*(.+)$/; // class diagram "Name : member"
const RELATION = {
  class: /^\s*(\w+)\s+(?:"[^"]*"\s+)?[<*o.|}-]*(?:--|\.\.)[>*o.|]*\s+(?:"[^"]*"\s+)?(\w+)\s*(?::\s*(.*))?$/,
  er: /^\s*([\w-]+)\s+[|}o]{2}(?:--|\.\.)[|{o]{2}\s+([\w-]+)\s*:\s*"?([^"]*)"?\s*$/,
};
const CLASS_ASSIGN = /^\s*class\s+([\w,]+)\s+(\w+)\s*;?\s*$/;

export function memberName(kind, line) {
  const s = line.trim().replace(TAGS, '');
  if (kind === 'er') return s.split(/\s+/)[1];
  return s.replace(/^[+\-#~]/, '').match(/^([^(:]+?)\s*(?:\(|:|$)/)?.[1]?.trim();
}

const tagsOf = (line) => line.match(TAGS)?.[1].trim().match(/\[[^\]]+\]/g) ?? [];
const keepTags = (tags) => tags.filter((t) => !/^\[\s*NEW\b/i.test(t));
const relKey = (a, b, label) => [[a, b].sort().join('|'), (label ?? '').replace(TAGS, '').trim()].join(':');

// Reads the blocks, members and relations that a list of lines defines.
export function readDiagram(kind, lines) {
  const blocks = new Map(); // name -> Set(member names)
  const relations = new Set();
  const assigned = new Set();
  let current = null;
  for (const line of lines) {
    if (current) {
      if (BLOCK_END.test(line)) current = null;
      else if (line.trim() && !line.trim().startsWith('<<') && !line.trim().startsWith('%%'))
        blocks.get(current).add(memberName(kind, line));
      continue;
    }
    const start = line.match(BLOCK_START[kind]);
    if (start) {
      current = start[1];
      if (!blocks.has(current)) blocks.set(current, new Set());
      continue;
    }
    const rel = line.match(RELATION[kind]);
    if (rel) relations.add(relKey(rel[1], rel[2], rel[3]));
    const assign = line.match(CLASS_ASSIGN);
    if (assign) assign[1].split(',').forEach((n) => assigned.add(n));
  }
  return { blocks, relations, assigned };
}

function headerEnd(lines) {
  let i = 0;
  if (lines[0]?.trim() === '---') {
    i = lines.indexOf('---', 1) + 1;
  }
  for (; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t && !t.startsWith('%%') && !/^(erDiagram|classDiagram|direction\s)/.test(t)) return i;
  }
  return lines.length;
}

// Removes "namespace X {" blocks that have nothing left in them.
function dropEmptyNamespaces(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*namespace\s+\w+\s*\{\s*$/.test(lines[i])) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (BLOCK_END.test(lines[j] ?? '')) {
        i = j;
        continue;
      }
    }
    out.push(lines[i]);
  }
  return out;
}

// Applies the updater rules to the hand-written lines.
function cleanHandWritten(kind, lines, gen, tagMap, existingTables, warnings) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const start = line.match(BLOCK_START[kind]);
    if (start) {
      let j = i + 1;
      while (j < lines.length && !BLOCK_END.test(lines[j])) j++;
      const body = lines.slice(i + 1, j);
      const name = start[1];
      const newTable = body.join('\n').match(/<<new table (\w+)/)?.[1];
      if (kind === 'class' && newTable && existingTables.has(newTable) && !gen.blocks.has(name)) {
        warnings.push(`removed proposed class ${name}: table ${newTable} exists now`);
        i = j;
        continue;
      }
      if (gen.blocks.has(name)) {
        const kept = [];
        for (const m of body) {
          const t = m.trim();
          if (!t || t.startsWith('<<') || t.startsWith('%%')) continue;
          const mName = memberName(kind, m);
          if (gen.blocks.get(name).has(mName)) {
            const key = `${name}.${mName}`;
            if (!tagMap.has(key)) tagMap.set(key, keepTags(tagsOf(m)));
          } else if (kind === 'class') {
            if (!/\[\s*NEW\b/i.test(t)) warnings.push(`${name}.${mName} is not in the code and has no [NEW] tag`);
            kept.push(m);
          } else {
            warnings.push(`dropped ${name}.${mName}: the schema has no such column`);
          }
        }
        // Mermaid merges two blocks of one class, so the proposed members stay in their own block.
        if (kept.length) out.push(line, ...kept, lines[j]);
        i = j;
        continue;
      }
      out.push(...lines.slice(i, j + 1));
      i = j;
      continue;
    }
    if (kind === 'class') {
      const m = line.match(MEMBER_LINE);
      if (m && gen.blocks.has(m[1]) && !RELATION.class.test(line)) {
        const mName = memberName(kind, m[2]);
        if (gen.blocks.get(m[1]).has(mName)) {
          const key = `${m[1]}.${mName}`;
          if (!tagMap.has(key)) tagMap.set(key, keepTags(tagsOf(m[2])));
          continue;
        }
      }
    }
    const rel = line.match(RELATION[kind]);
    if (rel && gen.relations.has(relKey(rel[1], rel[2], rel[3]))) continue;
    // A relation between two generated blocks whose key column neither block has any more.
    const label = rel?.[3]?.replace(TAGS, '').trim();
    const columnLabel = kind === 'er' ? /^\w+$/ : /^[a-z0-9]+_\w+$/; // class labels: snake_case only
    if (rel && columnLabel.test(label ?? '') && gen.blocks.has(rel[1]) && gen.blocks.has(rel[2]) &&
        !gen.blocks.get(rel[1]).has(label) && !gen.blocks.get(rel[2]).has(label)) {
      warnings.push(`removed relation ${rel[1]} - ${rel[2]} : ${label}: neither side has ${label}`);
      continue;
    }
    const assign = line.match(CLASS_ASSIGN);
    if (assign && kind === 'er') {
      const rest = assign[1].split(',').filter((n) => !gen.assigned.has(n));
      if (rest.length) out.push(line.replace(assign[1], rest.join(',')));
      continue;
    }
    out.push(line);
  }
  return collapseBlankLines(dropEmptyNamespaces(out));
}

// Removing a block leaves its blank lines behind. Keep at most one blank line in a row.
function collapseBlankLines(lines) {
  return lines.filter((l, i) => l.trim() || (i > 0 && lines[i - 1].trim()));
}

function applyTags(kind, genLines, tagMap) {
  if (kind !== 'class') return genLines;
  let current = null;
  return genLines.map((line) => {
    const start = line.match(BLOCK_START.class);
    if (start) current = start[1];
    else if (BLOCK_END.test(line)) current = null;
    else if (current && line.trim() && !line.trim().startsWith('<<')) {
      const tags = tagMap.get(`${current}.${memberName(kind, line)}`);
      if (tags?.length) return `${line} ${tags.join(' ')}`;
    }
    return line;
  });
}

/**
 * @param {string} text  the .mmd file
 * @param {string} name  marker name
 * @param {string[]} genLines  generated lines, without indent
 * @param {'class'|'er'} kind
 * @param {Set<string>} existingTables  table names in the current schema
 */
export function applyGenerated(text, name, genLines, kind, existingTables = new Set()) {
  const warnings = [];
  const lines = text.replace(/\n$/, '').split('\n');
  const b = lines.findIndex((l) => l.trim() === begin(name));
  const e = lines.findIndex((l) => l.trim() === end(name));
  let before, after;
  const tagMap = new Map();
  if (b >= 0 && e > b) {
    before = lines.slice(0, b);
    after = lines.slice(e + 1);
    // Tags that people added to generated lines on an earlier run.
    let current = null;
    for (const l of lines.slice(b + 1, e)) {
      const start = l.match(BLOCK_START[kind]);
      if (start) current = start[1];
      else if (BLOCK_END.test(l)) current = null;
      else if (current && kind === 'class') {
        const tags = keepTags(tagsOf(l));
        if (tags.length) tagMap.set(`${current}.${memberName(kind, l)}`, tags);
      }
    }
  } else {
    const at = headerEnd(lines);
    before = lines.slice(0, at);
    after = lines.slice(at);
    if (before.at(-1)?.trim()) before.push('');
  }
  const gen = readDiagram(kind, genLines);
  before = cleanHandWritten(kind, before, gen, tagMap, existingTables, warnings);
  after = cleanHandWritten(kind, after, gen, tagMap, existingTables, warnings);
  while (genLines.length && !genLines.at(-1).trim()) genLines = genLines.slice(0, -1);
  const body = applyTags(kind, genLines, tagMap).map((l) => (l ? INDENT + l : ''));
  if (before.length && before.at(-1).trim()) before.push('');
  if (after.length && after[0].trim()) after.unshift('');
  const out = [...before, INDENT + begin(name), ...body, INDENT + end(name), ...after];
  return { text: out.join('\n') + '\n', warnings };
}
