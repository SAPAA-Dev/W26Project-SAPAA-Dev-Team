#!/usr/bin/env bash
set -euo pipefail

source_repository=${1:?Source repository is required}
source_commit=${2:?Source commit is required}
[[ "$source_commit" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid source commit.' >&2; exit 1; }

# The course repository is public. Do not send the deployment credential to it.
git -c http.extraheader= -c http.https://github.com/.extraheader= fetch "$source_repository" \
  refs/heads/main:refs/remotes/course/main \
  refs/heads/prod:refs/remotes/course/prod

if [ "$(git rev-parse refs/remotes/course/prod)" != "$source_commit" ]; then
  echo 'Skip an old release: course prod has moved.'
  exit 0
fi
git merge-base --is-ancestor "$source_commit" refs/remotes/course/main || {
  echo 'Release rejected: this commit is not in course main.' >&2
  exit 1
}

git fetch origin refs/heads/main
destination_commit=$(git rev-parse FETCH_HEAD)
git merge-base --is-ancestor "$destination_commit" "$source_commit" || {
  echo 'Release rejected: SAPAA-Dev main has changes absent from this release.' >&2
  exit 1
}

# A normal push rejects a concurrent change. Never replace deployment history.
git push origin "$source_commit:refs/heads/main"
echo "SAPAA-Dev main is at $source_commit. Check the Vercel staged build before promotion."
