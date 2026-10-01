# Contact calendar, world clocks, and official Panchang

## Interface

- Events and reminders show five compact cards initially. View all reveals the rest in a bounded, keyboard-focusable scrolling region. Calendar controls remain outside it. Year progress is restored as a compact native progress bar.
- Import counts, last-import timestamps, source-calendar names are omitted from the public card.
- Direct Outreach includes live clocks for New York, London, Mumbai, Tokyo, Sydney, and Paris. JavaScript `Intl.DateTimeFormat` uses IANA timezones and applies daylight-saving rules; clock dates follow each city rather than the visitor’s date. New York, London, and Mumbai are shown first; View more reveals Tokyo, Sydney, and Paris.
- The New button opens an accessible editor with a review preview. Parsing runs locally; it is not branded as an Antigravity AI service. Reminders are stored in the browser and do not automatically write to an Apple account.

Send a Message sits directly below Follow Me in the left column. Heading icons use Apple blue; all guided-action icons stay white on the blue button in both themes. Panchang uses a compact three-column summary.

## Official Panchang

Source: [Kalnirnay’s homepage](https://www.kalnirnay.com/), which publishes a dated Today’s Panchang section with tithi, nakshatra, yog, karan, sunrise, and sunset.

`scripts/integrations/sync-kalnirnay-panchang.py` extracts those published text values with Python’s standard library. It validates the date and reported time formats, requires the source date to match the current Asia/Kolkata day, and writes only verified current values to `src/assets/data/kalnirnay-panchang.json`. It never calculates or fills missing almanac values. Sunrise and sunset are the publisher’s reported values; they are not claimed to apply to every visitor or world-clock city.

The `Daily official Kalnirnay Panchang` workflow runs at 01:15 and 07:15 UTC (06:45 and 12:45 IST), with manual dispatch available. It publishes changes through the existing repository token configuration and the Pages CI path. Scheduled runs can be delayed by GitHub, and source availability remains outside this project’s control. On October 1, local official-source fetching succeeded, but both Ubuntu and macOS GitHub-hosted runners received HTTP 403. The scheduled job records publisher refusal as a warning and preserves the snapshot; automatic fresh values are not guaranteed while that restriction remains. Other fetch or parsing errors fail the job.

The frontend checks the source identity, India date, and required fields. It refreshes on a new India day and checks the snapshot every 30 minutes while the page is visible. A stale, missing, or malformed publication is replaced by a simple official-source link. Old data is not presented as today’s Panchang.

## Verification

The critical browser journey covers bounded keyboard scrolling, all six timezone results at a fixed instant, rejection of stale Panchang, reminder creation and persistence after reload, keyboard focus trapping, and Escape focus restoration. The critical suite now contains 12 journeys; API coverage remains 184 tests. Visual review includes desktop/mobile widths in both themes.

Coding agent: GPT-6 / Codex in Codex desktop. Purpose: clean contact presentation, world clocks, official daily source integration, and accessible reminders. Exact model variant, reasoning mode, and task token usage: unavailable.
