#!/bin/sh
# Run: sh .github/scripts/test-reviewer-gate.sh
g="$(dirname "$0")/reviewer-gate.sh"; fail=0
t() { # name want AUTHOR ASSIGNEES APPROVED
  AUTHOR=$3 ASSIGNEES=$4 APPROVED=$5 sh "$g" >/dev/null; got=$?
  [ "$got" -eq "$2" ] || { echo "FAIL: $1 (want $2 got $got)"; fail=1; }
}
t "none, 0 approvals"        1 me ""        ""
t "none, 2 anyone"           0 me ""        "x
y"
t "none, author self-approve" 1 me ""       "me
x"
t "1 assignee"               1 me "a"       "a
b"
t "author + 1 assignee"      1 me "me
a"      "a
b"
t "2 assignees, 1 approved"  1 me "a
b"       "a
c"
t "2 assignees, both"        0 me "a
b"       "a
b"
t "2 assignees + extra"      0 me "a
b"       "a
b
c"
t "3 assignees, 2 approved"  1 me "a
b
c"     "a
b"
t "3 assignees, all"         0 me "a
b
c"     "c
b
a"
[ "$fail" -eq 0 ] && echo "reviewer-gate: all ok"; exit "$fail"
