# Website Hardening Design

**Date:** 2026-08-01

## Goal

Finish the portfolio hardening pass without changing its Apple-inspired visual identity. The completed site must use the MR brand mark everywhere, fit cleanly on desktop and mobile, meet WCAG AA on audited controls, keep every public page functional, and publish consistent metadata to both production hosts.

## Verified problems

- Root-absolute favicon paths break on the GitHub Pages project path, the raster Apple icon is soft, and mutable favicon files are cached as immutable.
- Homepage controls fail contrast checks in light and dark themes, while mobile floating controls can cover hero content.
- Projects and Uses omit content required by the existing page contract; Systems and Monitor have responsive/card-style regressions; the chatbot test does not model its hold-to-clear interaction.
- Decorative WebGL, eager map startup, and late geometry-changing styles cause excessive main-thread work and layout shift on subpages.
- Canonical metadata incorrectly identifies the GitHub Pages mirror as primary even though `mangeshraut.pro` is the canonical production URL.
- The local static server cannot resolve percent-encoded filenames and the sanitizer dependency resolves to a vulnerable DOMPurify version.
- Production hosts are behind the local branch and must be verified after publishing.

## Design decisions

1. Keep the existing MR SVG mark and Apple/Liquid Glass styling. Generate all raster favicon variants from the clean 512 px source and use path-relative references so both root and project-path deployments work.
2. Put small, essential contrast and geometry rules in blocking critical CSS. Preserve animation and glass effects when they do not alter initial layout or input responsiveness.
3. Treat WebGL as an optional enhancement rather than a startup requirement. Keep the CSS glass treatment as the baseline and defer the travel map until the browser is idle or the user asks to interact with it.
4. Use `https://mangeshraut.pro` as the sole canonical/structured-data origin. Keep GitHub Pages described as a mirror and preserve its API fallback behavior.
5. Correct tests that encode the wrong interaction contract, while adding regression coverage for real user-visible defects.
6. Validate source, built `dist`, Desktop Chrome E2E, accessibility, Lighthouse, and both deployed hosts before declaring completion.

## Success criteria

- Safari tabs/favorites and install metadata use the MR logo on Vercel and GitHub Pages.
- No audited WCAG AA contrast violations, horizontal overflow, overlapping floating controls, or undersized mobile telemetry tiles.
- All existing lint, unit, API, E2E, security, build, and deploy-readiness checks pass.
- Desktop and mobile homepage Lighthouse retain the project floors; subpage CLS and blocking time materially improve.
- Canonical, Open Graph, JSON-LD, robots, and sitemap origins agree on `mangeshraut.pro`.
- `main` is committed and pushed, both public hosts report the new commit, and post-deploy smoke checks pass.
