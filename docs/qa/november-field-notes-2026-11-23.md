# November Field Notes — editorial and release evidence

Reviewed November 23, 2026. Coding agent: GPT-6 / Codex. Purpose: research,
authoring, source-image integration, and release verification. Exact model variant,
reasoning mode, and token usage: unavailable.

## Published pair

- `gta-vi-launch-engineering-2026`: release facts sourced to Rockstar's
  [November 19 release page](https://www.rockstargames.com/VI/out-now) and
  [official game site](https://www.rockstargames.com/VI). Streaming numbers,
  scheduling, and persistence examples are explicitly hypothetical. No hands-on
  benchmark or undisclosed Rockstar implementation is asserted.
- `nue-health-data-ux-trust-2026`: public-material product review using
  [Nue's site](https://www.nuehealth.in/) and its
  [Google Play listing](https://play.google.com/store/apps/details?id=in.nuehealth.app).
  The November connection is the programme beginning November 30, not a claim
  about the company's launch date. Design recommendations are distinguished from
  verified capabilities. No clinical outcomes or security audit are claimed.

Both carry November 23 publication and review dates. The archive now contains
22 articles, exactly two per month from January through November. Older articles'
review dates remain unchanged.

## Media

Original Rockstar JPEG and Nue programme PNG are stored without modification.
Source URLs, dimensions, and SHA-256 hashes are recorded in
`src/assets/data/blog-media-sources.json`; each article shows a publisher credit
and source link. A portrait app screenshot was considered during drafting, but
the publisher's landscape programme artwork fits the reading surface better.
The artwork's weight-loss wording is labelled as a publisher claim.

## Verification

- Content audit validates monthly balance, word count, computed reading time,
  source sections, dated evidence sections, figures, diagrams, tables, and hashes.
- API catalogue regression checks include both November titles.
- Rendered article checks cover 375px, 768px, and 1440px in light and dark mode,
  with reduced motion enabled: 12 combinations, no horizontal overflow or broken
  sourced images, and working diagram/table rendering.
- Inspected representative desktop, tablet, and mobile screenshots. Original
  image proportions and visible credits are preserved.
- Release commands: `npm run check`, `npm test`, `npm run test:tester-army:ci`,
  `npm run security-check`, and `npm run build`. Remote CI and live pages must be
  checked after pushing; local evidence does not establish deployment success.
