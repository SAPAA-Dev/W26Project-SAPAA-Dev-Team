// Replays the SQL migrations with the real Postgres parser (libpg-query, WebAssembly)
// and returns the schema that exists after the last migration.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'libpg-query';

const TYPE_NAMES = {
  int2: 'smallint', int4: 'integer', int8: 'bigint', bool: 'boolean',
  float4: 'real', float8: 'double', bpchar: 'char',
};

// 'auth.users' for other schemas, the bare name for public.
const tableKey = (rel) =>
  rel.schemaname && rel.schemaname !== 'public' ? `${rel.schemaname}.${rel.relname}` : rel.relname;

const sval = (n) => n?.String?.sval;

function typeOf(typeName) {
  const names = typeName.names.map(sval).filter((n) => n !== 'pg_catalog');
  const base = names.at(-1);
  return (TYPE_NAMES[base] ?? base) + (typeName.arrayBounds ? '[]' : '');
}

export function emptySchema() {
  // history keeps every name that a migration removed, for the drift lint.
  return { tables: new Map(), history: { tables: new Set(), columns: new Set() } };
}

function applyConstraint(schema, table, c, colName) {
  const cols = colName ? [colName] : (c.keys ?? c.fk_attrs ?? []).map(sval);
  const col = (n) => table.columns.get(n);
  switch (c.contype) {
    case 'CONSTR_NOTNULL':
      col(cols[0]).notNull = true;
      break;
    case 'CONSTR_PRIMARY':
      // A column of a composite key is not unique alone, so it is not one-to-one.
      for (const n of cols) Object.assign(col(n), { pk: true, notNull: true, compositePk: cols.length > 1 });
      break;
    case 'CONSTR_UNIQUE':
      if (cols.length === 1) col(cols[0]).unique = true;
      else table.uniques.push({ name: c.conname, cols });
      break;
    case 'CONSTR_FOREIGN':
      cols.forEach((n, i) => {
        col(n).fk = {
          table: tableKey(c.pktable),
          column: sval(c.pk_attrs?.[i]) ?? 'id',
          onDelete: { c: 'cascade', n: 'set null', r: 'restrict', d: 'set default' }[c.fk_del_action] ?? 'no action',
        };
      });
      break;
  }
}

function addColumn(schema, table, def) {
  if (table.columns.has(def.colname)) return;
  table.columns.set(def.colname, { name: def.colname, type: typeOf(def.typeName), notNull: false });
  for (const { Constraint: c } of def.constraints ?? []) applyConstraint(schema, table, c, def.colname);
}

function dropColumn(schema, tableName, table, name) {
  if (!table.columns.delete(name)) return;
  schema.history.columns.add(`${tableName}.${name}`);
  table.uniques = table.uniques.filter((u) => !u.cols.includes(name));
}

function applyStatement(schema, stmt) {
  const [kind, s] = Object.entries(stmt)[0];
  const { tables, history } = schema;
  if (kind === 'CreateStmt') {
    const name = tableKey(s.relation);
    if (tables.has(name)) return;
    const table = { name, columns: new Map(), uniques: [] };
    tables.set(name, table);
    for (const el of s.tableElts ?? []) {
      if (el.ColumnDef) addColumn(schema, table, el.ColumnDef);
      else if (el.Constraint) applyConstraint(schema, table, el.Constraint);
    }
  } else if (kind === 'AlterTableStmt') {
    const name = tableKey(s.relation);
    const table = tables.get(name);
    if (!table) return;
    for (const { AlterTableCmd: cmd } of s.cmds) {
      switch (cmd.subtype) {
        case 'AT_AddColumn': addColumn(schema, table, cmd.def.ColumnDef); break;
        case 'AT_DropColumn': dropColumn(schema, name, table, cmd.name); break;
        case 'AT_AddConstraint': applyConstraint(schema, table, cmd.def.Constraint); break;
        case 'AT_DropConstraint':
          table.uniques = table.uniques.filter((u) => u.name !== cmd.name);
          break;
        case 'AT_SetNotNull': table.columns.get(cmd.name).notNull = true; break;
        case 'AT_DropNotNull': table.columns.get(cmd.name).notNull = false; break;
        case 'AT_AlterColumnType': table.columns.get(cmd.name).type = typeOf(cmd.def.ColumnDef.typeName); break;
      }
    }
  } else if (kind === 'RenameStmt') {
    const name = tableKey(s.relation ?? {});
    const table = tables.get(name);
    if (!table) return;
    if (s.renameType === 'OBJECT_TABLE') {
      // Keep the table in its place, so a rename does not reorder the diagram.
      const entries = [...tables].map(([k, v]) => (k === name ? [s.newname, v] : [k, v]));
      tables.clear();
      for (const [k, v] of entries) tables.set(k, v);
      history.tables.add(name);
      table.name = s.newname;
      // FKs that point at the old name follow the rename, like in Postgres.
      for (const t of tables.values())
        for (const c of t.columns.values()) if (c.fk?.table === name) c.fk.table = s.newname;
    } else if (s.renameType === 'OBJECT_COLUMN') {
      const col = table.columns.get(s.subname);
      if (!col) return;
      dropColumn(schema, name, table, s.subname);
      col.name = s.newname;
      table.columns.set(s.newname, col);
    }
  } else if (kind === 'DropStmt' && s.removeType === 'OBJECT_TABLE') {
    for (const obj of s.objects) {
      const parts = obj.List.items.map(sval);
      const name = parts.length > 1 && parts[0] !== 'public' ? parts.join('.') : parts.at(-1);
      if (tables.delete(name)) history.tables.add(name);
    }
  }
}

// Table and column renames keep the old names in `history`. A name that comes back
// later (for example a table that is dropped and created again) is not "removed".
function pruneHistory(schema) {
  for (const t of schema.history.tables) if (schema.tables.has(t)) schema.history.tables.delete(t);
  for (const tc of schema.history.columns) {
    const [t, c] = [tc.slice(0, tc.lastIndexOf('.')), tc.slice(tc.lastIndexOf('.') + 1)];
    if (schema.tables.get(t)?.columns.has(c)) schema.history.columns.delete(tc);
  }
}

export async function schemaFromSql(sqlTexts) {
  const schema = emptySchema();
  for (const sql of sqlTexts) {
    const { stmts = [] } = await parse(sql);
    for (const { stmt } of stmts) applyStatement(schema, stmt);
  }
  pruneHistory(schema);
  return schema;
}

export async function schemaFromMigrations(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  return schemaFromSql(files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')));
}
