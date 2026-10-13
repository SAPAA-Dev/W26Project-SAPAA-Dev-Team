/**
 * @jest-environment node
 */
// Database rule tests (#272): row level security and function grants on a REAL local Supabase,
// not mocks. Each user signs in with the publishable (anon) key, so every request goes through
// RLS the same way the app's does. Skipped unless SUPABASE_LOCAL_URL is set, so `npm test` and CI
// need no database. Run with `npm run test:db` after `supabase start` (see webapp/README.md).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const localUrl = process.env.SUPABASE_LOCAL_URL;
const describeDb = localUrl ? describe : describe.skip;

type Seed = Record<string, string>;
const options = { auth: { persistSession: false, autoRefreshToken: false } };

describeDb('database access rules on the local Supabase (#272)', () => {
  let seed: Seed;
  let service: SupabaseClient;

  // The seed script creates the users, refuses a non-local URL and prints URL, keys and logins.
  beforeAll(async () => {
    const out = execFileSync('node', [path.join(__dirname, '../../scripts/e2e_seed.js')], { encoding: 'utf8' });
    seed = Object.fromEntries(out.trim().split('\n').map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
    expect(seed.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')).toBe(localUrl!.replace(/\/$/, ''));
    service = createClient(seed.NEXT_PUBLIC_SUPABASE_URL, seed.SUPABASE_SECRET, options);

    // Rows an unapproved user must not see: a steward assignment and another person's socials.
    const steward = await personOf('STEWARD');
    const other = await personOf('PROFILE_USER_B');
    const { data: site } = await service.from('sites_pa').select('id').eq('namesite', 'Riverlot 56 (NA)').single();
    await must(service.from('site_stewards').upsert({ site_id: site!.id, steward_id: steward.id }));
    await must(service.from('socials').upsert({ person_id: other.id, email: 'rls-test@example.com' }));
  }, 60_000);

  async function must<T extends { error: unknown }>(query: PromiseLike<T>): Promise<T> {
    const result = await query;
    if (result.error) throw result.error;
    return result;
  }

  async function signIn(user: string): Promise<SupabaseClient> {
    const client = createClient(seed.NEXT_PUBLIC_SUPABASE_URL, seed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
    await must(client.auth.signInWithPassword({ email: seed[`CYPRESS_${user}_EMAIL`], password: seed[`CYPRESS_${user}_PASSWORD`] }));
    return client;
  }

  async function personOf(user: string): Promise<{ id: number; auth_user_id: string; display_name: string }> {
    const { data: list } = await must(service.auth.admin.listUsers({ perPage: 1000 }));
    const authUser = list.users.find((u) => u.email === seed[`CYPRESS_${user}_EMAIL`]);
    const { data } = await must(service.from('people').select('id, auth_user_id, display_name').eq('auth_user_id', authUser!.id).single());
    return data!;
  }

  it('(1.0.2 AT1) allow: a steward updates the display name on their own people row', async () => {
    const client = await signIn('STEWARD');
    const own = await personOf('STEWARD');
    const name = `RLS ${Date.now() % 100000}`;
    const { data, error } = await client.from('people').update({ display_name: name }).eq('id', own.id).select('display_name');
    expect(error).toBeNull();
    expect(data).toEqual([{ display_name: name }]);
  });

  it("(1.0.2 AT2) deny: a steward cannot update another person's people row", async () => {
    const client = await signIn('STEWARD');
    const other = await personOf('PROFILE_USER_A');
    const { data, error } = await client.from('people').update({ display_name: 'Changed by steward' }).eq('id', other.id).select();
    if (!error) expect(data).toEqual([]); // RLS filters the row out, so 0 rows change
    expect((await personOf('PROFILE_USER_A')).display_name).toBe(other.display_name);
  });

  it('(approval gate) deny: an unapproved user reads only their own people row, no site_stewards and no other socials', async () => {
    const client = await signIn('UNAPPROVED');
    const own = await personOf('UNAPPROVED');

    const people = await must(client.from('people').select('id'));
    expect(people.data).toEqual([{ id: own.id }]);
    const stewards = await must(client.from('site_stewards').select('site_id'));
    expect(stewards.data).toEqual([]);
    const socials = await must(client.from('socials').select('person_id'));
    expect(socials.data).toEqual([]);

    // The same reads as an approved user do see the rows, so the empty results above are the policy.
    const approved = await signIn('STEWARD');
    expect((await must(approved.from('people').select('id'))).data!.length).toBeGreaterThan(1);
    expect((await must(approved.from('site_stewards').select('site_id'))).data!.length).toBeGreaterThan(0);
    expect((await must(approved.from('socials').select('person_id'))).data!.length).toBeGreaterThan(0);
  });

  it('deny: a signed-in user cannot call get_max_inspection_number', async () => {
    const client = await signIn('ADMIN');
    const { error } = await client.rpc('get_max_inspection_number', { p_year: 2026 });
    expect(error?.code).toBe('42501'); // permission denied
    // The service role still can, as the app's server code does.
    expect((await service.rpc('get_max_inspection_number', { p_year: 2026 })).error).toBeNull();
  });

  it('deny: anon cannot call get_naturalness_distribution, a signed-in user can', async () => {
    const anon = createClient(seed.NEXT_PUBLIC_SUPABASE_URL, seed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
    const { error } = await anon.rpc('get_naturalness_distribution');
    expect(error?.code).toBe('42501');
    const signedIn = await signIn('STEWARD');
    expect((await signedIn.rpc('get_naturalness_distribution')).error).toBeNull();
  });
});
