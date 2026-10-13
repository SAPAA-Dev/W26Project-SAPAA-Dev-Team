/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS script run directly by node */
const { execFileSync, spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { ensureLocalS3 } = require('./local_s3');
/* eslint-enable @typescript-eslint/no-require-imports */

const webappDir = path.resolve(__dirname, '..');
const supabaseDir = path.join(webappDir, 'supabase');
const seedFile = path.join(supabaseDir, 'seed.sql');
const migrationFile = path.join(supabaseDir, 'migrations', '20260925000000_local_app_schema.sql');

if (
  !existsSync(path.join(supabaseDir, 'config.toml')) ||
  !existsSync(migrationFile) ||
  !existsSync(seedFile)
) {
  console.error('Local Supabase requires its config, app schema migration, and seed.sql before startup.');
  process.exit(1);
}

function runSupabaseCommand(args, options = {}) {
  try {
    return execFileSync('supabase', args, {
      cwd: webappDir,
      encoding: 'utf8',
      stdio: options.stdio ?? ['ignore', 'pipe', 'inherit'],
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Supabase CLI is required. Install it, then run npm run dev again.');
    }
    process.exit(error.status || 1);
  }
}

runSupabaseCommand(['start', '--exclude', 'postgres-meta,studio,edge-runtime'], { stdio: 'inherit' });
runSupabaseCommand(['migration', 'up', '--local'], { stdio: 'inherit' });
runSupabaseCommand(['db', 'query', '--local', '--file', seedFile], { stdio: 'inherit' });

const supabaseEnv = dotenv.parse(runSupabaseCommand(['status', '-o', 'env']));
const url = supabaseEnv.API_URL;
const publishableKey = supabaseEnv.PUBLISHABLE_KEY || supabaseEnv.ANON_KEY;
const secretKey = supabaseEnv.SERVICE_ROLE_KEY;

if (!url || !publishableKey || !secretKey) {
  console.error('Supabase did not return the local URL and keys. Check `supabase status -o env`.');
  process.exit(1);
}

const SEED_PASSWORD = 's&&uper$#sec&&ure';

async function ensureSeedAccount(supabaseAdmin, userList, emails, username, role, fullName) {
  const existing = userList.users.find((user) => emails.includes(user.email));
  const attributes = {
    email: emails[0],
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: {
      username,
      ...(fullName ? { full_name: fullName } : {}),
    },
    app_metadata: {
      ...(existing?.app_metadata ?? {}),
      role,
      authenticated: true,
    },
  };
  const { data, error } = existing
    ? await supabaseAdmin.auth.admin.updateUserById(existing.id, attributes)
    : await supabaseAdmin.auth.admin.createUser(attributes);
  if (error) throw error;
  return existing ?? data.user;
}

async function startDevServer() {
  const supabaseAdmin = createClient(url, secretKey);

  const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  await ensureSeedAccount(
    supabaseAdmin,
    userList,
    ['admin@example.com', 'admin@local.test'],
    'admin',
    'admin'
  );
  const steward = await ensureSeedAccount(
    supabaseAdmin,
    userList,
    ['user@example.com'],
    'steward',
    'steward',
    'Sample Steward'
  );

  // Five sample reports belong to the seed steward, so the steward PDF export can be tested.
  const currentYear = new Date().getFullYear();
  const stewardReportNumbers = [0, 1, 2, 3, 4].map(
    (index) => `${currentYear}-${String(index).padStart(3, '0')}`
  );
  const { data: linkedReports, error: linkError } = await supabaseAdmin
    .from('form_responses')
    .update({ user_id: steward.id })
    .in('inspection_no', stewardReportNumbers)
    .select('id');
  if (linkError) throw linkError;
  console.log(`Connected ${linkedReports?.length ?? 0} sample reports to seed steward user@example.com.`);

  const localS3Env = await ensureLocalS3(webappDir);

  const child = spawn('next', ['dev'], {
    cwd: webappDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      SUPABASE_SECRET: secretKey,
      ...localS3Env,
    },
  });

  child.on('error', (error) => {
    console.error(`Could not start Next.js: ${error.message}`);
    process.exit(1);
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 1);
  });
}

startDevServer().catch((error) => {
  console.error(`Could not seed the local admin account: ${error.message}`);
  process.exit(1);
});
