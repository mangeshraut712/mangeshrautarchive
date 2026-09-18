# Codex Insights

This repository uses the community `codex-insights` plugin and its
`codex-session-insights` CLI for private reports about how local Codex work is performed. It is a
workflow report, not a billing or quota report.

## Installation

The plugin and CLI are currently installed on this Mac. On another machine, install both layers:

```bash
codex plugin marketplace add mangeshraut712/codex-insights
codex plugin add codex-insights@codex-insights
npm install --global github:mangeshraut712/codex-insights
```

Start a new Codex task after installation so the `$insights` skill is discovered.

## Run a private report

```bash
npm run insights
```

The command is local-only and makes zero model calls. The latest files are written outside the
repository:

- `~/.codex/usage-data/report.html`
- `~/.codex/usage-data/report.json`

Timestamped copies are kept beside the latest report; copies older than 30 days are removed when the
tool starts or writes a new report. Treat reports as private and untrusted. Do not publish, upload,
email, or use report recommendations to edit the repository without a separate explicit request.

The historical codebase scorecard generator remains available as:

```bash
npm run insights:architecture
```

That command updates this Markdown file from repository metrics. It is separate from Codex session
insights.

## Latest local-only run

Generated on 2026-09-19 from this machine's Codex app-server index:

- 18 sessions analyzed out of 354 discovered.
- 31 sessions were eligible; 14 results were reused and 17 eligible sessions remain unseen.
- 4 analyzed sessions were associated with `mangeshrautarchive`.
- 191 user messages and 373 tool calls were included across the analyzed population.
- 282 redactions were applied; no sessions failed and none were excluded by the run cap.
- Analysis mode: deterministic local-only. Model interpretations: none.

Open the full private HTML report for the actual findings. Do not paste transcript-derived report
content into public documentation.
