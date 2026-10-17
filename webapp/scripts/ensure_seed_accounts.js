/* eslint-disable @typescript-eslint/no-require-imports -- CJS script run with node */
// Re-creates the local seed accounts that scripts/local_supabase.js makes (same emails, roles and
// password), for when a test run or another branch has wiped them. Local Supabase only.
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.API_URL;
if (!url || !/^http:\/\/(127\.0\.0\.1|localhost)/.test(url)) {
  console.error('ensure_seed_accounts: API_URL must point at the local Supabase.');
  process.exit(1);
}
const source = readFileSync(path.join(__dirname, 'local_supabase.js'), 'utf8');
const PASSWORD = source.match(/SEED_PASSWORD = '([^']+)'/)[1];
const admin = createClient(url, process.env.SERVICE_ROLE_KEY);

const ACCOUNTS = [
  { email: 'admin@example.com', role: 'admin', username: 'admin' },
  { email: 'user@example.com', role: 'steward', username: 'steward', fullName: 'Sample Steward' },
];

(async () => {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  for (const a of ACCOUNTS) {
    const existing = data.users.find((u) => u.email === a.email);
    const attrs = {
      email: a.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: a.username, ...(a.fullName ? { full_name: a.fullName } : {}) },
      app_metadata: { ...(existing?.app_metadata ?? {}), role: a.role, authenticated: true },
    };
    const res = existing
      ? await admin.auth.admin.updateUserById(existing.id, attrs)
      : await admin.auth.admin.createUser(attrs);
    if (res.error) throw res.error;
    console.log(`${a.email}: ready`);
  }
})().catch((e) => {
  console.error(`ensure_seed_accounts: ${e.message}`);
  process.exit(1);
});
