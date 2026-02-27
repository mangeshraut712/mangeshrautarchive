# Project Structure Guide

This repository is organized by runtime boundary first (backend vs frontend), then by responsibility.

## Top-Level Layout

- `api/`: FastAPI backend entrypoint and integrations.
- `src/`: Frontend app source served statically in dev and copied to `dist/` for build output.
- `scripts/`: Build/dev/maintenance scripts.
- `docs/`: Engineering documentation and contributor guides.
  - `docs/testing/`: Chrome QA runbooks, release checklists, and templates.
- `.dockerignore`: Keeps Docker build context small for faster container builds.

## Frontend Layout (`src/`)

- `index.html`: Single-page shell; keeps markup and resource links only.
- `assets/`
  - `css/`: Stylesheets by concern.
  - `images/`, `icons/`, `files/`: Static assets.
- `js/`
  - `core/`: App wiring and orchestration (`bootstrap.js`, `script.js`, chat core).
  - `modules/`: Feature modules (projects, calendar, search, overlays, etc).
  - `services/`: Shared service primitives (markdown, streaming, analytics, voice).
  - `components/`: Reusable UI building blocks.
  - `utils/`: Focused helper scripts.

## Module Ownership Rules

- Keep startup logic in `src/js/core/bootstrap.js`.
- Keep feature behavior in `src/js/modules/*`.
- Keep API/utility wrappers in `src/js/services/*`.
- Avoid new inline `<script>` blocks in `index.html`; add/extend modules instead.
- Add new CSS by section/feature instead of appending large overrides to unrelated files.

## Maintenance Checklist

1. Run `npm run lint` before commit.
2. Run `npm run lint:css` after CSS edits.
3. Run `npm run build` after structural changes.
4. Run `npm run clean` periodically to clear generated artifacts.
5. Keep generated/local artifacts out of git (`.npmcache/`, `.npmrc`, local cache dirs).
