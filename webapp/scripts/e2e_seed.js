/* eslint-disable @typescript-eslint/no-require-imports -- CJS script run with node */
// Seeds a LOCAL Supabase (started with `supabase start`) for the Cypress E2E specs, then prints
// the env the app and Cypress need as KEY=value lines on stdout (logs go to stderr):
//   node scripts/e2e_seed.js >> "$GITHUB_ENV"                      (CI)
//   node scripts/e2e_seed.js > .env.e2e && set -a && . ./.env.e2e  (local, .env* is gitignored)
// The accounts below exist only in the throwaway local database. Never point this at a real project.
const { execFileSync } = require('node:child_process');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const PASSWORD = 'e2e-local-only-Passw0rd';
const USERS = {
  ADMIN: { email: 'e2e-admin@example.com', role: 'admin', authenticated: true },
  STEWARD: { email: 'e2e-steward@example.com', role: 'steward', authenticated: true },
  UNAPPROVED: { email: 'e2e-unapproved@example.com', role: 'steward', authenticated: false },
  PROFILE_USER_A: { email: 'e2e-profile-a@example.com', role: 'steward', authenticated: true },
  PROFILE_USER_B: { email: 'e2e-profile-b@example.com', role: 'steward', authenticated: true },
};

const status = dotenv.parse(
  execFileSync('npx', ['--no-install', 'supabase', 'status', '-o', 'env'], {
    cwd: `${__dirname}/..`,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
);
const url = status.API_URL;
const publishableKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
const secretKey = status.SERVICE_ROLE_KEY || status.SECRET_KEY;
if (!url || !publishableKey || !secretKey) throw new Error('`supabase status -o env` returned no URL or keys.');
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) throw new Error(`Refusing to seed a non-local Supabase: ${url}`);

async function main() {
  const admin = createClient(url, secretKey, { auth: { persistSession: false } });

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  for (const [key, user] of Object.entries(USERS)) {
    const attributes = {
      email: user.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: key.toLowerCase() },
      app_metadata: { role: user.role, authenticated: user.authenticated },
    };
    const existing = list.users.find((u) => u.email === user.email);
    const { error } = existing
      ? await admin.auth.admin.updateUserById(existing.id, attributes)
      : await admin.auth.admin.createUser(attributes);
    if (error) throw error;
  }

  // Several specs (edit/disable site, PDF export, site gallery) look for this site by name.
  const { data: county, error: countyError } = await admin
    .from('ab_counties')
    .upsert({ county: 'Strathcona' }, { onConflict: 'county' })
    .select('id')
    .single();
  if (countyError) throw countyError;
  const { error: siteError } = await admin
    .from('sites_pa')
    .upsert({ namesite: 'Riverlot 56 (NA)', ab_county: county.id, is_active: true }, { onConflict: 'namesite' });
  if (siteError) throw siteError;

  // Map and add-site specs (2.0.2, 2.0.6): three small boundaries far apart. Two are linked to sites
  // in different counties, the third is unlinked, so it is a KML suggestion and a free boundary.
  const square = (lng, lat) => ({
    type: 'MultiPolygon',
    coordinates: [[[[lng, lat], [lng + 0.02, lat], [lng + 0.02, lat + 0.02], [lng, lat + 0.02], [lng, lat]]]],
  });
  const areas = [
    { fid: 1, name: 'Riverlot 56 (NA)', geometry: square(-113.0, 53.6), site: 'Riverlot 56 (NA)', county: 'Strathcona' },
    { fid: 2, name: 'E2E Lamont Meadow', geometry: square(-111.0, 55.0), site: 'E2E Lamont Meadow', county: 'Lamont' },
    { fid: 3, name: 'E2E Unlinked Fen', geometry: square(-115.5, 52.0) },
  ];
  for (const area of areas) {
    const { data: row, error } = await admin
      .from('protected_areas')
      .upsert(
        { folder: 'E2E', fid: area.fid, name: area.name, area_type: 'Natural Area', geometry: area.geometry },
        { onConflict: 'folder,fid' }
      )
      .select('id')
      .single();
    if (error) throw error;
    if (!area.site) continue;
    const { data: areaCounty, error: areaCountyError } = await admin
      .from('ab_counties')
      .upsert({ county: area.county }, { onConflict: 'county' })
      .select('id')
      .single();
    if (areaCountyError) throw areaCountyError;
    const { error: linkError } = await admin
      .from('sites_pa')
      .upsert(
        { namesite: area.site, ab_county: areaCounty.id, is_active: true, archived_at: null, protected_area_id: row.id },
        { onConflict: 'namesite' }
      );
    if (linkError) throw linkError;
  }

  // Archive spec (7.0.8) and deactivate spec (2.0.3 AT4): one report on Riverlot 56 with an answer
  // and an image row, reset to active and not archived on every run.
  const { data: riverlot, error: riverlotError } = await admin
    .from('sites_pa').select('id').eq('namesite', 'Riverlot 56 (NA)').single();
  if (riverlotError) throw riverlotError;
  const { data: report, error: reportError } = await admin
    .from('form_responses')
    .upsert(
      { site_id: riverlot.id, inspection_no: 'E2E-ARCHIVE-1', inspection_date: '2026-01-15', is_active: true, archived_at: null },
      { onConflict: 'inspection_no' }
    )
    .select('id')
    .single();
  if (reportError) throw reportError;
  const { data: question, error: questionError } = await admin
    .from('questions').select('id').eq('question key', 'Q32_Natural_Comm').single();
  if (questionError) throw questionError;
  for (const table of ['answers', 'attachments']) {
    const { error } = await admin.from(table).delete().eq('response_id', report.id);
    if (error) throw error;
  }
  const { error: answerError } = await admin
    .from('answers')
    .insert({ response_id: report.id, question_id: question.id, obs_comm: 'E2E archive report answer' });
  if (answerError) throw answerError;
  const { error: attachmentError } = await admin.from('attachments').insert({
    response_id: report.id,
    site_id: riverlot.id,
    storage_key: 'e2e/archive-report.jpg',
    filename: 'archive-report.jpg',
    content_type: 'image/jpeg',
    caption: 'E2E archive report image',
  });
  if (attachmentError) throw attachmentError;

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SECRET: secretKey,
    CYPRESS_SUPABASE_URL: url,
    CYPRESS_SUPABASE_ANON_KEY: publishableKey,
    // Fake S3 settings. Signing a URL needs no network, so the galleries list the seeded image row,
    // and a real bucket can never be reached from an E2E run.
    AWS_REGION: 'ca-central-1',
    AWS_S3_BUCKET_NAME: 'e2e-local-only',
    AWS_ACCESS_KEY_ID: 'e2e-local-only',
    AWS_SECRET_ACCESS_KEY: 'e2e-local-only',
  };
  for (const [key, user] of Object.entries(USERS)) {
    env[`CYPRESS_${key}_EMAIL`] = user.email;
    env[`CYPRESS_${key}_PASSWORD`] = PASSWORD;
  }
  process.stdout.write(Object.entries(env).map(([k, v]) => `${k}=${v}\n`).join(''));
  console.error(`Seeded ${Object.keys(USERS).length} E2E users, 2 sites, ${areas.length} boundaries and 1 report into ${url}.`);
}

main().catch((error) => {
  console.error(`E2E seed failed: ${error.message}`);
  process.exit(1);
});
