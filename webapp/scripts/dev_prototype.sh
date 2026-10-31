#!/bin/bash
# Runs the /v2 prototype against the local Supabase as it is now.
# Use this instead of `npm run dev` when the local DB has migrations from another branch
# (npm run dev stops on "Remote migration versions not found").
# Needs: supabase start (Docker/Colima) and LocalStack (`lstk start`) already running.
set -euo pipefail
cd "$(dirname "$0")/.."

eval "$(supabase status -o env 2>/dev/null | sed 's/^/export /')"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${PUBLISHABLE_KEY:-$ANON_KEY}"
export SUPABASE_SECRET="$SERVICE_ROLE_KEY"
export AWS_ENDPOINT_URL_S3="http://s3.localhost.localstack.cloud:4566"
export AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_REGION=us-east-1
export AWS_S3_BUCKET_NAME=sapaa-inspection-images

node scripts/ensure_seed_accounts.js
# First run on a fresh DB: also run `node scripts/seed_prototype_demo.js` for the demo sites.
echo "Prototype: http://localhost:3000/v2/sites (sign in at /login as user@example.com)"
exec node_modules/.bin/next dev -p 3000
