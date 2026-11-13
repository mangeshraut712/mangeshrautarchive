#!/bin/bash
set -euo pipefail
base="$HOME/Library/Application Support/PortfolioCalendarSync"
exec "$base/CalendarSync.app/Contents/MacOS/calendar-helper" "${1:-sync}" "$base/config.json"
