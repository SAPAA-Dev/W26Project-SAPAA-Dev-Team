const { execFileSync, spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

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

runSupabaseCommand(['start'], { stdio: 'inherit' });
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

const child = spawn('next', ['dev'], {
  cwd: webappDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SECRET: secretKey,
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
