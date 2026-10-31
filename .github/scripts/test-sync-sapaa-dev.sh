#!/usr/bin/env bash
set -euo pipefail

script_directory=$(cd "$(dirname "$0")" && pwd)
test_directory=$(mktemp -d)
trap 'rm -rf "$test_directory"' EXIT
export GIT_CONFIG_NOSYSTEM=1
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_AUTHOR_NAME='Release test' GIT_COMMITTER_NAME='Release test'
export GIT_AUTHOR_EMAIL='test@example.invalid' GIT_COMMITTER_EMAIL='test@example.invalid'
git init -q --initial-branch=main "$test_directory/course"
cd "$test_directory/course"
git -c core.hooksPath=/dev/null commit -qm '(test): base' --allow-empty
base_commit=$(git rev-parse HEAD)
git init -q --bare "$test_directory/deployment.git"
git push -q "$test_directory/deployment.git" main
git -c core.hooksPath=/dev/null commit -qm '(test): release' --allow-empty
release_commit=$(git rev-parse HEAD)
git branch prod
git clone -q --branch main "$test_directory/deployment.git" "$test_directory/checkout"
cd "$test_directory/checkout"
git config http.https://github.com/.extraheader 'AUTHORIZATION: test-only'
git() {
  if [ "${1:-}" = '-c' ]; then
    local configuration_arguments=()
    while [ "${1:-}" = '-c' ]; do
      configuration_arguments+=("$1" "$2")
      shift 2
    done
    if [ "${1:-}" = 'fetch' ]; then
      test -z "$(command git "${configuration_arguments[@]}" config --get-urlmatch http.extraheader https://github.com/UAlberta-CMPUT401/F26project-SAPAA.git)" || return 1
    fi
    command git "${configuration_arguments[@]}" "$@"
  else
    command git "$@"
  fi
}
export -f git

bash "$script_directory/sync-sapaa-dev.sh" "$test_directory/course" "$release_commit"
test "$(git --git-dir="$test_directory/deployment.git" rev-parse main)" = "$release_commit"
echo '(release AT1) Success: copy the checked release.'
test "$(git config --get-urlmatch http.extraheader https://github.com/SAPAA-Dev/W26Project-SAPAA-Dev-Team.git)" = 'AUTHORIZATION: test-only'
echo '(release AT3) Success: source fetch has no authorization; destination authorization is retained.'

bash "$script_directory/sync-sapaa-dev.sh" "$test_directory/course" "$base_commit"
test "$(git --git-dir="$test_directory/deployment.git" rev-parse main)" = "$release_commit"
echo '(release AT1) Failure case: an old CI result cannot roll back main.'

git -C "$test_directory/course" switch -q prod
git -C "$test_directory/course" -c core.hooksPath=/dev/null commit -qm '(test): unmerged' --allow-empty
unmerged_commit=$(git -C "$test_directory/course" rev-parse HEAD)
if bash "$script_directory/sync-sapaa-dev.sh" "$test_directory/course" "$unmerged_commit"; then
  echo 'An unmerged release was accepted.' >&2; exit 1
fi
echo '(release AT2) Failure case: unmerged course changes are blocked.'

git -C "$test_directory/course" switch -q main
git -C "$test_directory/course" merge -q --ff-only prod
git fetch -q origin main
git merge -q --ff-only FETCH_HEAD
git -c core.hooksPath=/dev/null commit -qm '(test): destination change' --allow-empty
git push -q origin main
destination_commit=$(git rev-parse HEAD)
if bash "$script_directory/sync-sapaa-dev.sh" "$test_directory/course" "$unmerged_commit"; then
  echo 'Divergent destination history was replaced.' >&2; exit 1
fi
test "$(git --git-dir="$test_directory/deployment.git" rev-parse main)" = "$destination_commit"
if bash "$script_directory/sync-sapaa-dev.sh" "$test_directory/course" 'invalid'; then
  echo 'An invalid commit was accepted.' >&2; exit 1
fi
echo '(release AT2) Failure cases: destination changes and invalid input are preserved/rejected.'
