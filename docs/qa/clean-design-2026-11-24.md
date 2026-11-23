# Portfolio design verification — November 24, 2026

The portfolio now shares a restrained presentation foundation across the homepage,
standalone pages, generated blog articles, and case studies. The foundation uses
semantic color, weight, and motion tokens. It removes gradients, glow, heavy type,
decorative labels, and nested visual containers while retaining interactive controls.
Existing content images and payment QR assets are unchanged.

Skills appear once in a static responsive grid instead of a repeated marquee. The
mobile navigation schedules initial focus after its visible state is applied.

## Rendered verification

Captured 19 surfaces at 390, 768, and 1440 pixels in light and dark themes (114 views):
home, projects, contact, blog, systems, monitor, travel, uses, changelog, error,
offline, article, case study, about, skills, experience, education, publications,
and awards. Every captured view had zero document horizontal overflow. Reviewed
representative screenshots from each surface family; repeated affected captures
after polishing skills, education records, clocks, and case-study metrics.

The automated presentation checks visit 13 routes at all six viewport/theme
combinations, checking overflow, painted gradients, heading weight, and visible
keyboard focus. Chrome and WebKit were exercised. On macOS, WebKit's Option-Tab
navigation includes links; the test uses that native key combination.

Support controls were exercised at 375, 768, and 1440 pixels in both themes:
one-time/monthly/QR selection, all three payment providers, enlarged QR dismissal,
and touch targets. Apple Vision decoded the displayed UPI, Zelle, and Cash App
codes and matched their original payment destinations. No payment was initiated.

## Checks

- Production build, ESLint, Stylelint, Oxlint, Prettier, and secret scanning.
- API, Worker, unit, and critical Chrome journeys through `npm test`.
- All 23 deterministic Tester Army journeys.
- Project showcase, blog reader, and presentation regression coverage in Chrome
  and WebKit, including a focused successful rerun of Safari navigation and clocks.
- Deployment workflow includes the presentation regression suite before publishing.

Local screenshots and command logs are in the ignored `scratch/clean-design/`
directory. External services can return unavailable data; their availability is
not guaranteed by visual checks. No physical-device or payment-processing test is
claimed. CI and live deployment verification are recorded in the release result.

Coding agent: GPT-6 / Codex. Purpose: portfolio-wide presentation consistency,
responsive verification, and preserving functional interactions. Exact model
variant, reasoning mode, and token usage: unavailable.
