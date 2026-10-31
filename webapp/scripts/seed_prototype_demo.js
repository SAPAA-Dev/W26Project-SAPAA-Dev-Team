/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS script run directly by node */
// Demo data for the "Boreal" UI prototype: ~40 real Alberta protected areas (approximate centroids
// and sizes, simple polygons), their sites, five years of inspection reports, demo stewards, and
// site assignments for the seed steward user@example.com.
//
//   node scripts/seed_prototype_demo.js
//
// LOCAL ONLY. Idempotent: it deletes and re-inserts everything it owns (protected_areas with
// source 'prototype-demo', the sites named below and their reports, the demo people below).
// It needs the seed accounts from scripts/local_supabase.js (`npm run dev`) to exist.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
/* eslint-enable @typescript-eslint/no-require-imports */

const SOURCE = 'prototype-demo';
const FOLDER = 'Prototype Demo';

// [official name, site name, area type, lat, lng, approx hectares, county, plan]
// plan: M inspected this month, R within a year, D 1-2 years ago, O over 2 years, N never, - no site.
const AREAS = [
  ['Wagner Natural Area', 'Wagner (NA)', 'Natural Area', 53.5603, -113.8233, 186, 'Parkland', 'R'],
  ['Bilby Natural Area', 'Bilby (NA)', 'Natural Area', 53.735, -114.245, 255, 'Lac Ste. Anne', 'D'],
  ['Halfmoon Lake Natural Area', 'Halfmoon Lake (NA)', 'Natural Area', 53.452, -112.938, 63, 'Strathcona', 'D'],
  ['Sherwood Park Natural Area', 'Sherwood Park (NA)', 'Natural Area', 53.512, -113.285, 105, 'Strathcona', 'M'],
  ['Northwest of Bruderheim Natural Area', 'Northwest of Bruderheim (NA)', 'Natural Area', 53.835, -112.985, 140, 'Lamont', 'R'],
  ['Redwater Natural Area', 'Redwater (NA)', 'Natural Area', 53.965, -113.06, 1150, 'Sturgeon', 'O'],
  ['Coyote Lake Natural Area', 'Coyote Lake (NA)', 'Natural Area', 53.21, -114.36, 620, 'Leduc', 'O'],
  ['Opal Natural Area', 'Opal (NA)', 'Natural Area', 54.02, -113.27, 210, 'Thorhild', 'N'],
  ['Kimiwan Lake Natural Area', 'Kimiwan Lake (NA)', 'Natural Area', 55.74, -116.93, 470, 'Smoky River', 'R'],
  ['Saskatoon Mountain Natural Area', 'Saskatoon Mountain (NA)', 'Natural Area', 55.22, -119.33, 1250, 'Grande Prairie', 'D'],
  ['Red Rock Coulee Natural Area', 'Red Rock Coulee (NA)', 'Natural Area', 49.656, -110.86, 325, 'Forty Mile', 'R'],
  ['Pakowki Sandhills Natural Area', 'Pakowki Sandhills (NA)', 'Natural Area', 49.29, -110.93, 2400, 'Forty Mile', 'O'],
  ['Milk River Natural Area', 'Milk River (NA)', 'Natural Area', 49.1, -110.55, 5300, 'Forty Mile', 'D'],
  ['Beehive Natural Area', 'Beehive (NA)', 'Natural Area', 50.02, -114.58, 7200, 'Ranchland', 'R'],
  ['Rumsey Natural Area', 'Rumsey (NA)', 'Natural Area', 51.96, -112.86, 14900, 'Starland', 'R'],
  ['Clyde Fen Ecological Reserve', 'Clyde Fen (ER)', 'Ecological Reserve', 54.18, -113.62, 1100, 'Westlock', 'M'],
  ['Wainwright Dunes Ecological Reserve', 'Wainwright Dunes (ER)', 'Ecological Reserve', 52.69, -110.83, 2800, 'Wainwright', 'R'],
  ['Rumsey Ecological Reserve', 'Rumsey (ER)', 'Ecological Reserve', 51.82, -112.68, 3400, 'Starland', 'D'],
  ['Hand Hills Ecological Reserve', 'Hand Hills (ER)', 'Ecological Reserve', 51.46, -112.26, 2200, 'Starland', 'R'],
  ['Kennedy Coulee Ecological Reserve', 'Kennedy Coulee (ER)', 'Ecological Reserve', 49.03, -111.02, 1060, 'Forty Mile', 'N'],
  ['Plateau Mountain Ecological Reserve', 'Plateau Mountain (ER)', 'Ecological Reserve', 50.21, -114.52, 2300, 'Ranchland', 'R'],
  ['Kootenay Plains Ecological Reserve', 'Kootenay Plains (ER)', 'Ecological Reserve', 52.06, -116.42, 3200, 'Clearwater', 'M'],
  ['Bob Creek Wildland Provincial Park', 'Bob Creek (WPP)', 'Wildland Provincial Park', 49.92, -114.18, 20600, 'Willow Creek', 'O'],
  ['Don Getty Wildland Provincial Park', 'Don Getty (WPP)', 'Wildland Provincial Park', 50.35, -114.6, 60000, 'Kananaskis', 'R'],
  ['Elbow-Sheep Wildland Provincial Park', 'Elbow-Sheep (WPP)', 'Wildland Provincial Park', 50.78, -114.78, 75500, 'Kananaskis', 'D'],
  ['Bow Valley Wildland Provincial Park', 'Bow Valley (WPP)', 'Wildland Provincial Park', 51.08, -115.3, 43000, 'Kananaskis', 'M'],
  ['Rock Lake-Solomon Creek Wildland Provincial Park', 'Rock Lake-Solomon Creek (WPP)', 'Wildland Provincial Park', 53.47, -118.15, 32000, 'Yellowhead', 'R'],
  ['Kakwa Wildland Provincial Park', 'Kakwa (WPP)', 'Wildland Provincial Park', 54.05, -119.95, 66000, 'Grande Prairie', 'N'],
  ['Fort Assiniboine Sandhills Wildland Provincial Park', 'Fort Assiniboine Sandhills (WPP)', 'Wildland Provincial Park', 54.38, -114.55, 6700, 'Woodlands', 'D'],
  ['Lesser Slave Lake Wildland Provincial Park', 'Lesser Slave Lake (WPP)', 'Wildland Provincial Park', 55.6, -115.55, 7500, 'Lesser Slave River', 'R'],
  ['Caribou Mountains Wildland Provincial Park', null, 'Wildland Provincial Park', 59.2, -115.5, 591000, null, '-'],
  ['Birch River Wildland Provincial Park', null, 'Wildland Provincial Park', 58.55, -113.4, 332000, null, '-'],
  ['Marguerite River Wildland Provincial Park', null, 'Wildland Provincial Park', 57.45, -110.7, 205000, null, '-'],
  ['Gipsy Lake Wildland Provincial Park', 'Gipsy Lake (WPP)', 'Wildland Provincial Park', 56.55, -110.35, 30000, 'Wood Buffalo', 'N'],
  ['Grand Rapids Wildland Provincial Park', 'Grand Rapids (WPP)', 'Wildland Provincial Park', 56.3, -112.65, 36000, 'Wood Buffalo', 'O'],
  ['Stony Mountain Wildland Provincial Park', 'Stony Mountain (WPP)', 'Wildland Provincial Park', 56.05, -111.25, 21000, 'Wood Buffalo', 'R'],
  ['Whitemud Falls Wildland Provincial Park', null, 'Wildland Provincial Park', 56.72, -110.05, 17000, null, '-'],
  ['Chinchaga Wildland Provincial Park', null, 'Wildland Provincial Park', 57.4, -119.35, 80000, null, '-'],
  ['Hay-Zama Lakes Wildland Provincial Park', 'Hay-Zama Lakes (WPP)', 'Wildland Provincial Park', 58.75, -119.05, 48700, 'Mackenzie', 'D'],
  ['Dunvegan West Wildland Provincial Park', 'Dunvegan West (WPP)', 'Wildland Provincial Park', 56.1, -118.85, 21000, 'Fairview', 'R'],
  ['Peace River Wildland Provincial Park', 'Peace River (WPP)', 'Wildland Provincial Park', 56.15, -117.6, 23000, 'Northern Sunrise', 'O'],
];

// The seed steward looks after these; two are due and one is overdue.
const USER_SITES = ['Wagner (NA)', 'Sherwood Park (NA)', 'Bilby (NA)', 'Halfmoon Lake (NA)', 'Coyote Lake (NA)'];

const DEMO_PEOPLE = [
  'Marion Kowalchuk', 'Dev Patel', 'Aiyana Cardinal', 'Gordon Lindquist', 'Priya Nair',
  'Hélène Gagnon', 'Tom Okafor', 'Wren Halvorsen', 'Lise Bergeron', 'Arjun Sidhu',
];

const LABELS = ['Poor', 'Fair', 'Good', 'Excellent'];
const NOTES = {
  Excellent: [
    'Native vegetation intact; no new disturbance since the last visit.',
    'Healthy aspen and white spruce stands. Moose and beaver sign throughout.',
    'Trails narrow and little used. No litter or invasive plants found.',
    'Wetland margins undisturbed; heard sora and yellow rails at dusk.',
  ],
  Good: [
    'Minor trail widening near the parking area; otherwise intact.',
    'Small patch of Canada thistle along the access road. Pulled what we could.',
    'Some deadfall across the main trail after the windstorm. Wildlife sign abundant.',
    'Boundary signs faded on the north side; vegetation in good shape.',
  ],
  Fair: [
    'Quad tracks entering from the east boundary; ruts in the wet meadow.',
    'Scentless chamomile spreading along the fence line.',
    'Dumped yard waste near the gate. Reported to the county.',
    'Cattle got through a broken fence; grazing pressure on the south slope.',
  ],
  Poor: [
    'Extensive off-highway vehicle damage across the wet meadow.',
    'Fire pit and garbage at the lakeshore; shoreline vegetation trampled.',
    'Leafy spurge has spread across most of the south field.',
    'New unauthorised trail cut through the old-growth stand.',
  ],
};

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261017);
const between = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];

const DAY_MS = 86_400_000;
const isoDaysAgo = (days) => new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);

/** A 6-10 vertex ring around the centre, roughly the area's size. */
function polygon(lat, lng, hectares) {
  const radius = Math.sqrt((hectares * 10_000) / Math.PI); // metres
  const n = between(6, 10);
  const ring = [];
  for (let i = 0; i < n; i += 1) {
    const angle = (2 * Math.PI * i) / n + rand() * 0.3;
    const r = radius * (0.75 + rand() * 0.4);
    const dLat = (r * Math.sin(angle)) / 111_320;
    const dLng = (r * Math.cos(angle)) / (111_320 * Math.cos((lat * Math.PI) / 180));
    ring.push([+(lng + dLng).toFixed(5), +(lat + dLat).toFixed(5)]);
  }
  ring.push(ring[0]);
  return { type: 'MultiPolygon', coordinates: [[ring]] };
}

function check(result, what) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

async function insertChunks(supabase, table, rows, select) {
  const out = [];
  for (let i = 0; i < rows.length; i += 500) {
    const query = supabase.from(table).insert(rows.slice(i, i + 500));
    out.push(...(check(await (select ? query.select(select) : query), `insert ${table}`) ?? []));
  }
  return out;
}

async function main() {
  const env = dotenv.parse(
    execFileSync('supabase', ['status', '-o', 'env'], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    })
  );
  const url = env.API_URL;
  const key = env.SERVICE_ROLE_KEY || env.SECRET_KEY;
  if (!url || !key) throw new Error('`supabase status -o env` returned no API_URL or SERVICE_ROLE_KEY.');
  if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) throw new Error(`Refusing to seed a non-local Supabase: ${url}`);
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Seed accounts (created by scripts/local_supabase.js).
  const users = check(await supabase.auth.admin.listUsers({ perPage: 1000 }), 'list users').users;
  const steward = users.find((u) => u.email === 'user@example.com');
  if (!steward) {
    throw new Error('user@example.com does not exist. Start the app with `npm run dev` (scripts/local_supabase.js) first.');
  }
  const admin = users.find((u) => u.email === 'admin@example.com') ?? null;
  if (!admin) console.warn('admin@example.com not found; demo reports will not be attributed to the admin.');

  async function ensurePerson(user, fallbackName) {
    const found = check(
      await supabase.from('people').select('id, display_name').eq('auth_user_id', user.id).maybeSingle(),
      'read person'
    );
    if (found) return found;
    return check(
      await supabase.from('people').insert({ auth_user_id: user.id, display_name: fallbackName }).select('id, display_name').single(),
      'create person'
    );
  }
  const stewardPerson = await ensurePerson(steward, 'Sample Steward');
  if (admin) await ensurePerson(admin, 'admin');

  // Questions from supabase/seed.sql.
  const questions = check(
    await supabase.from('questions').select('id, "question key"').in('"question key"', [
      'Q21_Date_Of_Visit', 'Q31_Naturalness', 'Q32_Natural_Comm', 'Q13_FirstandLastNameForGuests',
    ]),
    'read questions'
  );
  const q = Object.fromEntries(questions.map((row) => [row['question key'], row.id]));
  for (const k of ['Q21_Date_Of_Visit', 'Q31_Naturalness', 'Q32_Natural_Comm', 'Q13_FirstandLastNameForGuests']) {
    if (!q[k]) throw new Error(`Question ${k} is missing. Run supabase/seed.sql first.`);
  }

  // 1. Remove the previous demo data. form_responses.site_id is ON DELETE RESTRICT, so reports go first.
  const siteNames = AREAS.map((a) => a[1]).filter(Boolean);
  const oldSites = check(await supabase.from('sites_pa').select('id').in('namesite', siteNames), 'read old sites');
  const oldSiteIds = oldSites.map((s) => s.id);
  if (oldSiteIds.length) {
    check(await supabase.from('form_responses').delete().in('site_id', oldSiteIds), 'delete old reports');
    check(await supabase.from('sites_pa').delete().in('id', oldSiteIds), 'delete old sites');
  }
  check(await supabase.from('protected_areas').delete().eq('source', SOURCE), 'delete old areas');
  check(
    await supabase.from('people').delete().is('auth_user_id', null).in('display_name', DEMO_PEOPLE),
    'delete old demo people'
  );

  // 2. Counties (kept between runs; ab_counties is a lookup table).
  const countyNames = [...new Set(AREAS.map((a) => a[6]).filter(Boolean))];
  check(
    await supabase.from('ab_counties').upsert(countyNames.map((county) => ({ county })), { onConflict: 'county', ignoreDuplicates: true }),
    'upsert counties'
  );
  const counties = check(await supabase.from('ab_counties').select('id, county').in('county', countyNames), 'read counties');
  const countyId = new Map(counties.map((c) => [c.county, c.id]));

  // 3. Protected areas and their sites.
  const areas = await insertChunks(
    supabase,
    'protected_areas',
    AREAS.map(([name, , areaType, lat, lng, ha], i) => ({
      name,
      area_type: areaType,
      folder: FOLDER,
      fid: i + 1,
      source: SOURCE,
      hectares: ha,
      acres: Math.round(ha * 2.47105),
      geometry: polygon(lat, lng, ha),
    })),
    'id, name'
  );
  const areaId = new Map(areas.map((a) => [a.name, a.id]));
  const sites = await insertChunks(
    supabase,
    'sites_pa',
    AREAS.filter((a) => a[1]).map(([name, siteName, , , , , county]) => ({
      namesite: siteName,
      ab_county: countyId.get(county) ?? null,
      is_active: true,
      protected_area_id: areaId.get(name),
    })),
    'id, namesite'
  );
  const siteId = new Map(sites.map((s) => [s.namesite, s.id]));

  // 4. Demo stewards and assignments.
  const people = await insertChunks(supabase, 'people', DEMO_PEOPLE.map((display_name) => ({ display_name })), 'id, display_name');
  const stewardOf = new Map(); // site name -> { id, display_name }
  for (const name of USER_SITES) stewardOf.set(name, stewardPerson);
  const others = AREAS.filter((a) => a[1] && !USER_SITES.includes(a[1]));
  others.forEach((a, i) => {
    if (i % 4 !== 3) stewardOf.set(a[1], people[i % people.length]); // about a quarter have no steward
  });
  await insertChunks(
    supabase,
    'site_stewards',
    [...stewardOf].map(([name, person]) => ({ site_id: siteId.get(name), steward_id: person.id, assigned_by: admin?.id ?? null }))
  );

  // 5. Reports. Numbers start at <year>-501 so they never collide with seed.sql (<year>-000..050).
  const nextNumber = new Map();
  const reports = [];
  for (const [, siteName, areaType, , , , , plan] of AREAS) {
    if (!siteName || plan === 'N') continue;
    const lastDaysAgo = { M: between(1, 14), R: between(30, 350), D: between(380, 720), O: between(760, 1450) }[plan];
    const days = [lastDaysAgo];
    const history = between(1, 6);
    for (let i = 0; i < history; i += 1) {
      const next = days[days.length - 1] + between(120, 420);
      if (next > 2200) break;
      days.push(next);
    }
    let level = { 'Natural Area': 2.6, 'Ecological Reserve': 3.1, 'Wildland Provincial Park': 3.4 }[areaType] + (rand() - 0.5);
    const mine = USER_SITES.includes(siteName);
    for (const ago of days.reverse()) {
      level = Math.min(4.4, Math.max(0.6, level + (rand() - 0.5) * 0.9));
      const label = LABELS[Math.min(3, Math.max(0, Math.round(level) - 1))];
      const date = isoDaysAgo(ago);
      const year = date.slice(0, 4);
      const number = (nextNumber.get(year) ?? 501);
      nextNumber.set(year, number + 1);
      const author = mine ? steward : admin && rand() < 0.1 ? admin : null;
      const stewardName = mine ? stewardPerson.display_name : stewardOf.get(siteName)?.display_name ?? pick(DEMO_PEOPLE);
      reports.push({
        row: {
          site_id: siteId.get(siteName),
          user_id: author?.id ?? null,
          inspection_no: `${year}-${number}`,
          inspection_date: date,
          created_at: new Date(Date.parse(date) + between(1, 30) * 3_600_000).toISOString(),
          is_active: true,
        },
        label: rand() < 0.08 ? null : label, // a few reports skip the naturalness question
        note: pick(NOTES[label]),
        stewardName,
      });
    }
  }
  const inserted = await insertChunks(supabase, 'form_responses', reports.map((r) => r.row), 'id, inspection_no');
  const reportId = new Map(inserted.map((r) => [r.inspection_no, r.id]));

  // Answers stored the way the new-report page stores them (obs_value / obs_comm per question config).
  const answers = reports.flatMap((r) => {
    const response_id = reportId.get(r.row.inspection_no);
    const rows = [
      { response_id, question_id: q.Q21_Date_Of_Visit, obs_value: r.row.inspection_date, obs_comm: null },
      { response_id, question_id: q.Q13_FirstandLastNameForGuests, obs_value: null, obs_comm: r.stewardName },
    ];
    if (r.label) {
      rows.push(
        { response_id, question_id: q.Q31_Naturalness, obs_value: r.label, obs_comm: r.label },
        { response_id, question_id: q.Q32_Natural_Comm, obs_value: null, obs_comm: r.note }
      );
    }
    return rows;
  });
  await insertChunks(supabase, 'answers', answers);

  console.log(
    `Seeded ${areas.length} protected areas, ${sites.length} sites, ${people.length} demo people, ` +
      `${stewardOf.size} steward assignments (${USER_SITES.length} for user@example.com), ` +
      `${reports.length} reports, ${answers.length} answers.`
  );
}

main().catch((error) => {
  console.error(`Prototype demo seed failed: ${error.message}`);
  process.exit(1);
});
