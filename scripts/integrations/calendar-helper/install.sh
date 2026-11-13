#!/bin/bash
set -euo pipefail
umask 077
root="$(cd "$(dirname "$0")" && pwd)"
config="${1:?Usage: install.sh /absolute/config.json [--allow-ad-hoc-signing]}"
[[ "$config" = /* && -f "$config" ]] || { echo 'An absolute existing config is required.' >&2; exit 1; }
[[ "$#" -le 2 && ( "$#" -eq 1 || "$2" = '--allow-ad-hoc-signing' ) ]] || { echo 'Unknown installation option.' >&2; exit 1; }
if [[ "${2:-}" = '--allow-ad-hoc-signing' ]]; then
  export CALENDAR_SIGNING_IDENTITY='-'
  echo 'Local ad hoc build: renew Calendar, Reminders and Keychain consent after changed builds.'
else
  : "${CALENDAR_SIGNING_IDENTITY:?Set a signing identity or explicitly pass --allow-ad-hoc-signing for this Mac.}"
  [[ "$CALENDAR_SIGNING_IDENTITY" != '-' ]] || { echo 'Use --allow-ad-hoc-signing to acknowledge per-build consent.' >&2; exit 1; }
fi
base="$HOME/Library/Application Support/PortfolioCalendarSync"
plist="$HOME/Library/LaunchAgents/pro.mangeshraut.calendar-sync.plist"
[[ ! -e "$plist" && ! -e "$base" ]] || { echo 'An installation already exists; stop and review it before replacing.' >&2; exit 1; }
command -v python3 >/dev/null
mkdir -p "$base" "$HOME/Library/LaunchAgents"
"$root/build.sh" "$base/CalendarSync.app"
cp "$config" "$base/config.json"
chmod 600 "$base/config.json"
python3 - "$base" "$plist" <<'PY'
import pathlib, plistlib, sys
base, target = map(pathlib.Path, sys.argv[1:])
with target.open('wb') as stream:
    plistlib.dump({
        'Label': 'pro.mangeshraut.calendar-sync',
        'ProgramArguments': [str(base / 'CalendarSync.app/Contents/MacOS/calendar-helper'), 'sync', str(base / 'config.json')],
        'StartInterval': 900,
        'RunAtLoad': True,
        'ProcessType': 'Background',
        'StandardOutPath': str(base / 'status.log'),
        'StandardErrorPath': str(base / 'error.log'),
    }, stream)
PY
chmod 600 "$plist"
/usr/bin/plutil -lint "$plist"
printf 'Installed files only. Authorize, select IDs, store the scoped token, then activate with:\nlaunchctl bootstrap gui/%s "%s"\n' "$(id -u)" "$plist"
