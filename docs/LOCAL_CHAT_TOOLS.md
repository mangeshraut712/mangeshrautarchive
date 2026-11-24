# AssistMe local tools

AssistMe resolves supported everyday questions in the browser before either AI backend is called. These paths are deterministic, credential-free, and do not consume the AI message allowance. They work without a network connection once the page and chat assets have loaded; this is not a promise that a first visit can load offline.

## Supported questions

- Current time/date: `what's the time in New York?`, `time in Asia/Kolkata`, `date today`.
- Arithmetic: `0.1 + 0.2`, `(12 + 8) * 3`, `2^3`, `sqrt(144)`.
- Percentages/tips: `15% of 200`, `15% tip on 80`.
- Length, mass, duration, volume, temperature: `10 kg to lb`, `32 F to C`, `2 hours to minutes`.
- Date differences: `days between 2024-02-28 and 2024-03-01`.

`src/js/chatbot/local-tools.js` owns parsing and results. `ChatAPI.processQuery` invokes it before network initialization/inference; both Worker-backed and FastAPI-backed portfolio hosts therefore use the same browser logic. Direct API consumers continue using the server's general chat path. Attachments bypass local utility interpretation.

The pinned decimal.js 10.6.0 library is self-hosted in `src/js/vendor/decimal.js`; `npm run vendor:local-tools` rebuilds it from the locked package, and production builds run that command automatically. Its MIT license is retained. Arithmetic uses 40 significant digits internally and displays up to 15, with an approximation marker when rounded. A bounded grammar accepts arithmetic only, never JavaScript evaluation. Integer powers are bounded to prevent excessive work.

Clocks use `Intl.DateTimeFormat`, IANA timezones, and the device clock. Daylight-saving rules come from the browser/OS timezone database. Unknown cities and ambiguous abbreviations require clarification. Date differences count elapsed calendar days, excluding the starting date. Decimal and unit conversions are mathematical; they do not imply measurement precision.

Unsupported units, mixed dimensions, temperatures below absolute zero, undefined arithmetic, and invalid calendar dates receive an explanation. Gallons require US or Imperial qualification. Live currency rates, weather, news, and arbitrary knowledge still require online sources or the existing AI service. No paid provider or spending is enabled.

Validation includes unit cases for decimal accuracy, operator precedence, malicious expressions, bounds, DST, date rollover, leap years, and conversions. Browser tests disconnect networking and exhaust the AI quota, then assert local replies and zero inference requests in Chromium and WebKit.

Coding agent: GPT-6 / Codex. Purpose: dependable everyday answers without model guesses or network dependency. Exact model variant, reasoning mode, and token usage: unavailable.
