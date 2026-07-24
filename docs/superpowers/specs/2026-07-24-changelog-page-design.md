# Changelog page design

**Date:** 2026-07-24  
**Status:** Approved (Option 1)  
**Audience:** Public visitors + owner (concise product feed)

## Goal

Dedicated `changelog.html` inspired by [GitHub Changelog](https://github.blog/changelog/): month-grouped timeline, type badges (Release / Improvement / Retired), area tags, Apple/shadcn-style filters in vanilla CSS.

## Scope (v1)

- Static data module `src/js/data/changelog-entries.js`
- Page shell `src/changelog.html`, CSS `changelog.css`, module `changelog-page.js`
- Type + tag filters; empty state
- Nav, sitemap, vercel clean URL, search/404/offline discovery

## Out of scope

RSS, per-entry detail pages, CMS, auto-git ingestion

## Stack

Vanilla HTML / CSS / ES modules — no React.
