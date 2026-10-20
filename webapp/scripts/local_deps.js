/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS script run directly by node */
const { execFileSync } = require('node:child_process');
const { existsSync, mkdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
/* eslint-enable */

const scriptsDir = __dirname;
const webappDir = path.resolve(scriptsDir, '..');
const depsDir = path.join(scriptsDir, '.deps');
const isWindows = process.platform === 'win32';

// Windows runs .cmd and .exe files only through a shell; quoting guards
// paths with spaces or &.
function runCommand(command, args, options = {}) {
  if (isWindows) {
    const commandLine = [`"${command}"`, ...args.map((argument) => `"${argument}"`)].join(' ');
    return execFileSync(commandLine, [], { ...options, shell: true });
  }
  return execFileSync(command, args, options);
}

function ensureNpmPackages() {
  const requiredPackages = ['next', 'dotenv', '@supabase/supabase-js', '@aws-sdk/client-s3'];
  const installed = requiredPackages.every((packageName) =>
    existsSync(path.join(webappDir, 'node_modules', ...packageName.split('/')))
  );
  if (installed) {
    return;
  }
  console.log('webapp npm packages are missing. Installing them locally...');
  runCommand('npm', ['install', '--no-audit', '--no-fund'], { cwd: webappDir, stdio: 'inherit' });
}

function ensureSupabaseCli() {
  const cliPath = path.join(depsDir, 'node_modules', '.bin', isWindows ? 'supabase.cmd' : 'supabase');
  if (existsSync(cliPath)) {
    return cliPath;
  }
  const webappPackage = JSON.parse(readFileSync(path.join(webappDir, 'package.json'), 'utf8'));
  const versionSpec = webappPackage.devDependencies?.supabase || 'latest';
  console.log(`Supabase CLI is missing. Installing supabase@${versionSpec} into scripts/.deps...`);
  mkdirSync(depsDir, { recursive: true });
  runCommand(
    'npm',
    ['install', '--no-audit', '--no-fund', '--prefix', depsDir, `supabase@${versionSpec}`],
    { cwd: scriptsDir, stdio: 'inherit' }
  );
  if (!existsSync(cliPath)) {
    console.error('The Supabase CLI install did not create a binary in scripts/.deps.');
    process.exit(1);
  }
  return cliPath;
}

function ensureDocker() {
  try {
    runCommand('docker', ['version', '--format', '{{.Server.Version}}'], { stdio: 'ignore' });
  } catch {
    console.error(
      'Docker is required but is not reachable. Docker is a system service, so this script ' +
      'cannot install it. Install and start Docker, then run npm run dev again.'
    );
    process.exit(1);
  }
}

module.exports = { depsDir, isWindows, runCommand, ensureNpmPackages, ensureSupabaseCli, ensureDocker };
