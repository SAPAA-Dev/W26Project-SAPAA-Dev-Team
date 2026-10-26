/**
 * @jest-environment node
 */
// PR #309 review: the insert policy on gpx_tracks must check the shape of storage_path.
// Runs on a REAL local Supabase, not mocks. Skipped unless SUPABASE_LOCAL_URL is set.
// Run with `npm run test:db -- --runInBand` after `supabase start` and after the migration
// 20261024020000_check_gpx_track_path.sql is applied.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const localUrl = process.env.SUPABASE_LOCAL_URL;
const describeDb = localUrl ? describe : describe.skip;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const runId = Date.now();

describeDb('gpx_tracks insert policy checks storage_path', () => {
  let seed: Record<string, string>;
  let service: SupabaseClient;
  let steward: SupabaseClient;
  let stewardId: string;
  let siteId: number;
  const insertedPaths: string[] = [];

  beforeAll(async () => {
    const out = execFileSync('node', [path.join(__dirname, '../../scripts/e2e_seed.js')], { encoding: 'utf8' });
    seed = Object.fromEntries(out.trim().split('\n').map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
    expect(seed.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')).toBe(localUrl!.replace(/\/$/, ''));
    service = createClient(seed.NEXT_PUBLIC_SUPABASE_URL, seed.SUPABASE_SECRET, options);

    steward = createClient(seed.NEXT_PUBLIC_SUPABASE_URL, seed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
    const { data, error } = await steward.auth.signInWithPassword({
      email: seed.CYPRESS_STEWARD_EMAIL,
      password: seed.CYPRESS_STEWARD_PASSWORD,
    });
    if (error) throw error;
    stewardId = data.user!.id;

    const { data: site, error: siteError } = await service.from('sites_pa').select('id').limit(1).single();
    if (siteError) throw siteError;
    siteId = site!.id;
  }, 60_000);

  afterAll(async () => {
    if (insertedPaths.length > 0) await service.from('gpx_tracks').delete().in('storage_path', insertedPaths);
  });

  function insert(storagePath: string, userId = stewardId) {
    return steward.from('gpx_tracks').insert({
      site_id: siteId,
      user_id: userId,
      storage_path: storagePath,
      original_file_name: 'walk.gpx',
      track_point_count: 3,
    });
  }

  it('allows the path that saveGpxTrack writes: <own user id>/<upload id>/<name>.gpx', async () => {
    const storagePath = `${stewardId}/upload-${runId}/walk.gpx`;
    const { error } = await insert(storagePath);
    if (!error) insertedPaths.push(storagePath);
    expect(error).toBeNull();
  });

  it.each([
    ['a backslash path', (uid: string) => `${uid}\\..\\..\\start.gpx`],
    ['a backslash after the user folder', (uid: string) => `${uid}/up/x\\..\\..\\start.gpx`],
    ['a dot-dot segment', (uid: string) => `${uid}/../walk.gpx`],
    ['a three-dot segment', (uid: string) => `${uid}/.../walk.gpx`],
    ['a path with four segments', (uid: string) => `${uid}/a/b/walk.gpx`],
    ['a path with two segments', (uid: string) => `${uid}/walk.gpx`],
    ['a name that is not .gpx', (uid: string) => `${uid}/up/walk.txt`],
    ['a character outside the allowed set', (uid: string) => `${uid}/up/wa lk.gpx`],
    ['a leading slash', (uid: string) => `/${uid}/up/walk.gpx`],
    ['a very long name', (uid: string) => `${uid}/up/${'a'.repeat(400)}.gpx`],
  ])('refuses %s', async (_name, makePath) => {
    const storagePath = makePath(stewardId);
    const { error } = await insert(storagePath);
    if (!error) insertedPaths.push(storagePath);
    expect(error?.code).toBe('42501');
  });

  it("refuses a path in another user's folder", async () => {
    const storagePath = `00000000-0000-0000-0000-000000000000/up-${runId}/walk.gpx`;
    const { error } = await insert(storagePath);
    if (!error) insertedPaths.push(storagePath);
    expect(error?.code).toBe('42501');
  });
});
