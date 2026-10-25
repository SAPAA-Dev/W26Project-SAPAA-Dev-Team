/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS script run directly by node */
// Install before require: local_supabase.js loads its packages at module level.
const { ensureNpmPackages } = require('./local_deps');
ensureNpmPackages();
require('./local_supabase');
/* eslint-enable @typescript-eslint/no-require-imports */
