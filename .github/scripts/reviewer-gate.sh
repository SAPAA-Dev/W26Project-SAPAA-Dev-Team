#!/bin/sh
# Decides whether a PR's reviewers are valid. Reads AUTHOR, ASSIGNEES, APPROVED
# (newline-separated logins; APPROVED = current approvals on the head commit).
# Exit 0 = ok. The PR author never counts as a reviewer.
req=$(printf '%s\n' "$ASSIGNEES" | grep -v '^$' | grep -vxF "$AUTHOR")
ok=$(printf '%s\n' "$APPROVED" | grep -v '^$' | grep -vxF "$AUTHOR")
n=$(printf '%s' "$req" | grep -c .)

if [ "$n" -eq 0 ]; then
  a=$(printf '%s' "$ok" | grep -c .)
  [ "$a" -ge 2 ] && { echo "No assignees: $a approvals from anyone (need 2). Assign 2 reviewers."; exit 0; }
  echo "No assignees: need 2 approvals from anyone, have $a. Assign 2 reviewers to pick who."; exit 1
fi
if [ "$n" -lt 2 ]; then
  echo "Only 1 assignee besides the author. Assign at least 2 reviewers, or none to let any 2 people review."; exit 1
fi
missing=""
for r in $req; do
  printf '%s\n' "$ok" | grep -qxF "$r" || missing="$missing $r"
done
[ -z "$missing" ] && { echo "All $n assigned reviewers approved."; exit 0; }
echo "Waiting on assigned reviewers: $(echo $missing | sed 's/ /, /g'). Only assignees' approvals count."; exit 1
