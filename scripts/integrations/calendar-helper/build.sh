#!/bin/bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
output="${1:?Usage: build.sh /absolute/output/CalendarSync.app}"
[[ "$output" = /* && "$output" = *.app ]] || { echo 'An absolute .app output path is required.' >&2; exit 1; }
mkdir -p "$output/Contents/MacOS"
cp "$root/Info.plist" "$output/Contents/Info.plist"
/usr/bin/xcrun swiftc -parse-as-library -O -target "$(uname -m)-apple-macosx14.0" \
  "$root/Core.swift" "$root/CalendarHelper.swift" -o "$output/Contents/MacOS/calendar-helper"
/usr/bin/codesign --force --sign "${CALENDAR_SIGNING_IDENTITY:--}" "$output"
/usr/bin/codesign --verify --strict "$output"
printf 'Built and verified %s\n' "$output"
