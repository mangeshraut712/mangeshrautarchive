# Work showcase — November 23, 2026

Coding agent: GPT-6 / Codex. Purpose: verified contribution storytelling, repository
organization, and responsive work discovery. Exact model variant, reasoning mode,
and token usage: unavailable. The chatbot runtime is unchanged.

## Evidence and scope

The GitHub connector search and GitHub REST search agreed on 99 public merged PRs
outside `mangeshraut712`, `dayx61`, and `Roojool`. The snapshot covers 44 repositories
and 29 repository owners. This is not a count of employers, endorsements, bounty
awards, or exclusively code changes; documentation contributions are included.

Every record in `src/js/data/work-evidence.js` has an author-checked public PR URL
and GitHub's `merged_at` timestamp. Search completeness and count consistency are
checked before writing. Duplicate URLs, unmerged PRs, and associated-account PRs
are excluded. The sync fails closed above GitHub's 1,000-result search cap until
partitioning is implemented.

Full repository pagination returned 119 public repositories, 43 original
repositories. The curated streams contain 31 projects and eight hackathon builds;
forks, profile infrastructure, and the explicitly named reproduction repository
are excluded from the original-work browser. The wider GitHub view keeps the full
public catalogue count and explains activity coverage.

Hackathon labels come from public READMEs or repository topics. `repair-proof`
explicitly says it was not submitted. `gravekeeper` does not claim submission.
`actions-nurse` documents an Open Agent submission. None is labelled a winner.
Public GitHub security fixes are not described as paid bug bounties. No public
bounty award or disclosure acknowledgement was verified for this release.

## Implementation

- The existing Projects destination retains search, sort, lenses, bounded card
  loading, previews, focus restoration, graph controls, and theme behavior.
- Contribution evidence and project metadata have separate synchronization and
  presentation modules. Old hand-maintained fallback records are replaced by the
  verified repository snapshot.
- The existing scheduled stats workflow refreshes both data files into its
  reviewable draft PR. It does not automatically merge or push to main.
- Stats pagination includes later pages and retains the last snapshot on failure.
  Fabricated no-data defaults are removed. The local development proxy marks an
  unavailable backend as degraded instead of a successful empty catalogue.

## Verification scope

Real-data browser review covers 375px, 768px, and 1440px, all three streams, light
and dark themes, and reduced motion. Automated checks cover stream separation,
searchable contribution evidence, preview focus, catalogue pagination, failure
recovery, request bounds, and axe accessibility. Release gates include lint,
formatting, unit/API/Worker tests, critical browser journeys, Tester Army,
security scanning, and a production build. Deployment is verified separately.

Local verification completed: 214 API, 67 Worker, 60 unit checks, 20 critical
Chromium journeys against the production build, 23 Tester Army journeys, and
nine focused showcase scenarios each in Chrome and WebKit. Axe checks passed
at 375/768/1440 widths in light and dark modes. Real-data rendering covered
18 stream/width/theme combinations with no horizontal overflow. Missing WebKit
binaries were installed before its successful run; no browser test was waived.
