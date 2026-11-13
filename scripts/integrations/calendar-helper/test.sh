#!/bin/bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
/usr/bin/xcrun swiftc "$root/Core.swift" "$root/CoreTests.swift" -o "$tmp/tests"
"$tmp/tests"
"$root/build.sh" "$tmp/CalendarSync.app"
if "$tmp/CalendarSync.app/Contents/MacOS/calendar-helper" invalid "$root/config.example.json" >"$tmp/out" 2>"$tmp/err"; then
  echo 'Invalid operation unexpectedly succeeded.' >&2
  exit 1
fi
[[ "$(cat "$tmp/err")" = 'Calendar helper failed: permission. Previous server snapshot is preserved.' || "$(cat "$tmp/err")" = 'Calendar helper failed: configuration. Previous server snapshot is preserved.' ]]
echo 'Helper compilation, signing and fail-closed execution passed.'
