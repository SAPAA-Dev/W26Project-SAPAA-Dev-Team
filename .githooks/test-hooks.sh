#!/bin/sh
# Self-check for .githooks/commit-msg. Run: sh .githooks/test-hooks.sh
set -e

hook=$(cd "$(dirname "$0")" && pwd)/commit-msg
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

git -C "$tmp" init -q
git -C "$tmp" checkout -q -b feat/supplier-search

fails=0
check() { # expect(pass|fail) branch message
  git -C "$tmp" checkout -q -B "$2"
  printf '%s\n' "$3" > "$tmp/MSG"
  if (cd "$tmp" && "$hook" MSG >/dev/null 2>&1); then got=pass; else got=fail; fi
  if [ "$got" = "$1" ]; then
    echo "ok   $1: [$2] $3"
  else
    echo "FAIL expected $1, got $got: [$2] $3"
    fails=$((fails + 1))
  fi
}

check pass feat/supplier-search    "(feat): add supplier search"
check pass fix/duplicate-checkout  "(fix): prevent duplicate checkout"
check pass del/old-scripts         "(del): drop unused scripts"
check pass main                    "(docs): update setup instructions"
check pass feat/supplier-search    "Merge branch 'main' into feat/supplier-search"
check fail feat/supplier-search    "add supplier search"
check fail feat/supplier-search    "feat: add supplier search"
check fail feat/supplier-search    "(feature): add supplier search"
check pass feat/supplier-search    "(feat):no space after colon"
check fail feat/supplier-search    "(feat):"
check fail feat/supplier-search    "(feat): "
check fail supplier-search         "(feat): add supplier search"
check fail feat/Supplier-Search     "(feat): add supplier search"
check fail feat/supplier_search    "(feat): add supplier search"
check fail feature/supplier-search "(feat): add supplier search"
check fail Zanab-Akbar-patch-1     "(docs): update readme"

[ "$fails" -eq 0 ] || { echo "$fails check(s) failed"; exit 1; }
echo "all checks passed"
