/**
 * @jest-environment node
 */
// PR #321 review: checks for the seed guard, the duplicate protected area pre-check, the
// priority score constraint and the site delete impact keys.
// Runs on a REAL local Supabase, not mocks. Skipped unless SUPABASE_LOCAL_URL is set.
// Run with `npm run test:db -- --runInBand` after `supabase start`. It needs `psql` on the PATH.
// Every script runs inside begin ... rollback, and each test applies the migration or seed it
// checks first, so the local database is left unchanged and the result does not depend on
// which migrations the local database already has.
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const localUrl = process.env.SUPABASE_LOCAL_URL;
const describeDb = localUrl ? describe : describe.skip;
const dbUrl = process.env.SUPABASE_LOCAL_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const supabaseDir = path.join(__dirname, '../../supabase');
const migration = (name: string) => `\\i '${path.join(supabaseDir, 'migrations', name)}'`;
const seedFile = `\\i '${path.join(supabaseDir, 'seed.sql')}'`;

function runSql(script: string) {
  const result = spawnSync('psql', [dbUrl, '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1'], {
    input: `begin;\n${script}\nrollback;\n`,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  return { ok: result.status === 0, out: result.stdout, err: result.stderr };
}

const probeSite = "insert into public.sites_pa (namesite) values ('Migration safety probe');";
const probeSiteId = "(select id from public.sites_pa where namesite = 'Migration safety probe')";

describeDb('seed.sql guard', () => {
  const foreignRows: Array<[string, string]> = [
    ['sites_pa', probeSite],
    [
      'form_responses',
      "insert into public.form_responses (site_id, inspection_no, inspection_date, is_active) values (null, 'GUARD-001', current_date, true);",
    ],
    [
      'question_keys',
      "insert into public.question_keys (category, \"question key\", comment, definition) values ('9', 'Guard_Probe', true, 'probe');",
    ],
    [
      'form_sections',
      "insert into public.form_sections (title, description, header) values ('Guard probe', 'probe', 'probe');",
    ],
  ];

  it.each(foreignRows)('skips the whole seed when %s holds rows it did not write', (table, insert) => {
    const { ok, err } = runSql(`${insert}\n${seedFile}`);
    expect(ok).toBe(true);
    expect(err).toContain('Skipping seed');
    expect(err).toContain(table);
  });
});

describeDb('protected area link constraint', () => {
  it('stops with a readable error when two sites share a protected area', () => {
    const { ok, err } = runSql(`
      alter table public.sites_pa drop constraint if exists sites_pa_protected_area_id_key;
      with area as (
        insert into public.protected_areas (name, area_type, geometry, folder, fid)
        values ('Migration safety probe', 'probe',
          '{"type":"MultiPolygon","coordinates":[[[[0,0],[1,0],[1,1],[0,0]]]]}'::jsonb, 'probe', -1)
        returning id
      )
      insert into public.sites_pa (namesite, protected_area_id)
      select 'Migration safety probe A', id from area
      union all
      select 'Migration safety probe B', id from area;
      ${migration('20261009120100_sites_pa_protected_area_id_unique.sql')}
    `);
    expect(ok).toBe(false);
    expect(err).toContain('Two or more sites link to protected area');
  });
});

describeDb('site priority scores constraint', () => {
  const apply = `${probeSite}\n${migration('20261024000000_add_site_priority_scores.sql')}`;

  it('rejects a partly scored row', () => {
    const { ok, err } = runSql(`${apply}
      update public.sites_pa set priority_abuses = 3, priority_saved_at = now() where id = ${probeSiteId};`);
    expect(ok).toBe(false);
    expect(err).toContain('sites_pa_priority_scores_valid');
  });

  it('rejects a score outside 0 to 5', () => {
    const { ok, err } = runSql(`${apply}
      update public.sites_pa set priority_abuses = 6, priority_biological = 1, priority_time = 1,
        priority_saved_at = now() where id = ${probeSiteId};`);
    expect(ok).toBe(false);
    expect(err).toContain('sites_pa_priority_scores_valid');
  });

  it('accepts a site with no scores and a site with all three', () => {
    const { ok, err } = runSql(`${apply}
      update public.sites_pa set priority_abuses = 3, priority_biological = 0, priority_time = 5,
        priority_saved_at = now() where id = ${probeSiteId};
      update public.sites_pa set priority_abuses = null, priority_biological = null, priority_time = null,
        priority_saved_at = null where id = ${probeSiteId};`);
    expect(err).not.toContain('ERROR');
    expect(ok).toBe(true);
  });

  it('can run twice', () => {
    const { ok, err } = runSql(`${apply}\n${migration('20261024000000_add_site_priority_scores.sql')}`);
    expect(err).not.toContain('ERROR');
    expect(ok).toBe(true);
  });
});

describeDb('site delete impact', () => {
  it('reports the GPX track and page field counts', () => {
    const { ok, err, out } = runSql(`${probeSite}
      ${migration('20261025000000_fix_site_delete_impact.sql')}
      select public.get_site_delete_impact(${probeSiteId});`);
    expect(err).not.toContain('ERROR');
    expect(ok).toBe(true);
    const impact = JSON.parse(out.split('\n').find((line) => line.startsWith('{')) ?? '{}');
    expect(impact).toMatchObject({
      siteName: 'Migration safety probe',
      gpxTrackCount: 0,
      sitePageFieldCount: 0,
    });
  });
});
