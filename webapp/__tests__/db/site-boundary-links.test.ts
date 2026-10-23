/**
 * @jest-environment node
 */
// #181: these tests run the real SQL function on a local Supabase, not mocks.
// Skipped unless SUPABASE_LOCAL_URL is set. Run with `npm run test:db -- --runInBand`
// after `supabase start`, so this file and rls.test.ts do not seed the same database together.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const localUrl = process.env.SUPABASE_LOCAL_URL;
const describeDb = localUrl ? describe : describe.skip;

const options = { auth: { persistSession: false, autoRefreshToken: false } };

const runId = Date.now();
const PREFIX = `Issue181 ${runId}`;
const FOLDER = `ISSUE-181-${runId}`;

function square(longitude: number, latitude: number) {
  return {
    type: 'MultiPolygon' as const,
    coordinates: [[[
      [longitude, latitude],
      [longitude + 2, latitude],
      [longitude + 2, latitude + 2],
      [longitude, latitude + 2],
      [longitude, latitude],
    ]]],
  };
}

describeDb('site and protected area links (#181)', () => {
  let service: SupabaseClient;
  let nextFid = 1;

  beforeAll(() => {
    const out = execFileSync('node', [path.join(__dirname, '../../scripts/e2e_seed.js')], { encoding: 'utf8' });
    const seed = Object.fromEntries(
      out.trim().split('\n').map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)])
    );
    expect(seed.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')).toBe(localUrl!.replace(/\/$/, ''));
    service = createClient(seed.NEXT_PUBLIC_SUPABASE_URL, seed.SUPABASE_SECRET, options);
  }, 60_000);

  afterAll(async () => {
    if (!service) return;
    await service.from('sites_pa').delete().like('namesite', `${PREFIX}%`);
    await service.from('protected_areas').delete().eq('folder', FOLDER);
  }, 30_000);

  async function must<T extends { error: unknown }>(query: PromiseLike<T>): Promise<T> {
    const result = await query;
    if (result.error) throw result.error;
    return result;
  }

  async function addArea(name: string, areaType: string, geometry: ReturnType<typeof square>): Promise<number> {
    const { data } = await must(
      service
        .from('protected_areas')
        .upsert(
          { folder: FOLDER, fid: nextFid++, name, area_type: areaType, geometry },
          { onConflict: 'folder,fid' }
        )
        .select('id')
        .single()
    );
    return data!.id as number;
  }

  async function addSite(
    namesite: string,
    protectedAreaId: number | null = null,
    archivedAt: string | null = null
  ): Promise<number> {
    const { data } = await must(
      service
        .from('sites_pa')
        .insert({ namesite, is_active: true, protected_area_id: protectedAreaId, archived_at: archivedAt })
        .select('id')
        .single()
    );
    return data!.id as number;
  }

  async function readSite(siteId: number) {
    const { data } = await must(
      service
        .from('sites_pa')
        .select('protected_area_id, centre_latitude, centre_longitude')
        .eq('id', siteId)
        .single()
    );
    return data!;
  }

  async function runLinker(shouldLink = true) {
    await must(service.rpc('link_sites_to_protected_areas', { p_link: shouldLink }));
  }

  it('links an exact "Name (TYPE)" site name and stores the bounding-box centre', async () => {
    const areaId = await addArea(`${PREFIX} Alexo`, 'NA', square(-113, 53));
    const siteId = await addSite(`${PREFIX} Alexo (NA)`);

    await runLinker();

    const site = await readSite(siteId);
    expect(site.protected_area_id).toBe(areaId);
    expect(site.centre_longitude).toBeCloseTo(-112, 6);
    expect(site.centre_latitude).toBeCloseTo(54, 6);
  });

  it('leaves a site with no exact match unlinked', async () => {
    const siteId = await addSite(`${PREFIX} No Match (NA)`);

    await runLinker();

    const site = await readSite(siteId);
    expect(site.protected_area_id).toBeNull();
    expect(site.centre_latitude).toBeNull();
    expect(site.centre_longitude).toBeNull();
  });

  it('leaves an ambiguous area name unlinked', async () => {
    await addArea(`${PREFIX} Twin`, 'NA', square(-100, 50));
    await addArea(`${PREFIX} Twin`, 'NA', square(-90, 50));
    const siteId = await addSite(`${PREFIX} Twin (NA)`);

    await runLinker();

    expect((await readSite(siteId)).protected_area_id).toBeNull();
  });

  it('does not overwrite a manual link and uses the manual area for the centre', async () => {
    const manualAreaId = await addArea(`${PREFIX} Manual Target`, 'NA', square(-80, 50));
    await addArea(`${PREFIX} Manual`, 'NA', square(-70, 50));
    const siteId = await addSite(`${PREFIX} Manual (NA)`, manualAreaId);

    await runLinker();

    const site = await readSite(siteId);
    expect(site.protected_area_id).toBe(manualAreaId);
    expect(site.centre_longitude).toBeCloseTo(-79, 6);
    expect(site.centre_latitude).toBeCloseTo(51, 6);
  });

  it('does not link an archived site', async () => {
    await addArea(`${PREFIX} Archived`, 'NA', square(-60, 50));
    const siteId = await addSite(`${PREFIX} Archived (NA)`, null, new Date().toISOString());

    await runLinker();

    expect((await readSite(siteId)).protected_area_id).toBeNull();
  });

  it('clears the centre on an unlink and does not link the site again', async () => {
    const areaId = await addArea(`${PREFIX} Unlink`, 'NA', square(-40, 50));
    const siteId = await addSite(`${PREFIX} Unlink (NA)`);
    await runLinker();
    expect((await readSite(siteId)).protected_area_id).toBe(areaId);

    await must(service.from('sites_pa').update({ protected_area_id: null }).eq('id', siteId));
    await runLinker(false);

    const site = await readSite(siteId);
    expect(site.protected_area_id).toBeNull();
    expect(site.centre_latitude).toBeNull();
    expect(site.centre_longitude).toBeNull();
  });

  it('is idempotent', async () => {
    await addArea(`${PREFIX} Repeat`, 'NA', square(-50, 50));
    await addSite(`${PREFIX} Repeat (NA)`);
    await runLinker();

    const { data } = await must(service.rpc('link_sites_to_protected_areas', { p_link: true }));

    expect(data).toMatchObject({ linked: 0, centred: 0 });
  });
});
