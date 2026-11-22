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
  reviewable draft PR for source snapshots. Separately, the Pages workflow refreshes
  public work every six hours and before main-branch builds, then publishes only
  after the existing quality gates. No automated merge or direct main push is needed.
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

The first remote run exposed a test ordering issue: touch-target measurement ran
before the below-fold activity graph entered the viewport and initialized. The
journey now scrolls to the graph and waits for its settings control before
measuring targets, preserving the production lazy-loading behavior.

## Automatic publication

Coding agent: GPT-6 / Codex. Purpose: scheduled publication, stream classification,
and deduplication. Exact model variant, reasoning mode, and token usage: unavailable.

The Pages workflow runs at minute 23 every six hours (05:53, 11:53, 17:53, and
23:53 IST). GitHub can delay scheduled jobs; this is periodic, not real-time sync.
Main-branch pushes and manual Pages runs refresh the same public data. The fresh
snapshot is included in the tested deployment artifact, so it does not wait for
the weekly source-cache draft PR. A failed or incomplete contribution fetch blocks
publication and leaves the last successful Pages deployment available. GitHub may
disable scheduled workflows after prolonged repository inactivity; the workflow
can be re-enabled from Actions and run manually.

For new public original repositories, add `hackathon`, `hackathons`, or
`portfolio-hackathon` as a GitHub topic to select Hackathons automatically.
Removing those topics moves an uncurated repository back to Projects. Existing
verified editorial mappings remain authoritative. `portfolio-exclude`, private,
archived, and forked repositories are excluded from original-work streams.
No award, participation, or bounty claim is inferred from an ordinary repository.

GitHub repository IDs survive renames; lowercase repository/PR-number identities
remove case-variant duplicates. Each refresh replaces the complete snapshot rather
than appending rows. Browser catalog caches use the updated identity rules.
Regression coverage exercises new PRs, renamed repositories, newly tagged builds,
stream transitions, private exclusions, and repeated refreshes.
