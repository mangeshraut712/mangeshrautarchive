# Website Hardening Implementation Plan

> Execute each batch with the smallest focused regression test first, then run the affected check before proceeding.

## 1. Brand assets and deployment metadata

- Add a deterministic Sharp-based favicon generator sourced from `src/assets/icons/icon-512.png`.
- Generate and synchronize ICO, 16/32 px PNG, and Apple touch assets.
- Convert page and manifest favicon references to deployment-safe relative paths, including generated nested pages.
- Stop marking mutable favicon URLs immutable.
- Change canonical, Open Graph, JSON-LD, robots, sitemap, and generated-page defaults to `https://mangeshraut.pro` while preserving explicit mirror references.
- Add regression checks for favicon paths, output dimensions, and metadata origins.

## 2. Accessibility, layout, and page-contract fixes

- Add blocking WCAG AA color locks for the chatbot CTA, active media tabs, and other audited active controls.
- Tighten homepage vertical rhythm and ensure floating controls never overlap initial mobile hero content.
- Restore the Projects section subtitle and the Uses related-page navigation.
- Make Systems mobile telemetry one column and remove Monitor resting card glow.
- Update the chatbot E2E test to perform the documented hold-to-clear gesture.
- Run focused accessibility, responsive, card-hover, chatbot, and page-content E2E tests.

## 3. Startup performance and stability

- Make the WebGL renderer explicitly opt-in while retaining CSS glass styling.
- Defer travel-map initialization until idle/interaction and preserve its accessible fallback.
- Ensure initial critical geometry matches final subpage layout to prevent whole-main shifts.
- Rebuild and compare Lighthouse CLS/TBT on Systems, Monitor, Travel, and Uses.

## 4. Tooling and dependency integrity

- Safely decode static request paths before resolving files, with traversal protection and unit coverage.
- Update `isomorphic-dompurify` so the lockfile resolves a patched DOMPurify.
- Run audit, security scan, formatting, lint, unit, and API tests.

## 5. Full release verification

- Build a clean `dist` and run the complete Desktop Chrome E2E suite plus production-readiness checks.
- Inspect the final diff and worktree for generated artifacts, secrets, or unrelated edits.
- Commit logical changes to `main`, push without force, and verify the remote commit.
- Run dual-host surface/parity/post-deploy checks and confirm favicons, metadata, accessibility, APIs, and commit markers on both hosts.
