# Testing Documentation Index

Use this folder as the single reference point for Chrome testing and release readiness.

## Documents

- `CHROME_QA_RUNBOOK.md`:
  End-to-end setup, testing, validation, deployment, and rollback process.

- `CHROME_TEST_MATRIX.md`:
  Functional/performance/security/usability checklist and critical user-story test cases.

- `RELEASE_TEST_REPORT_TEMPLATE.md`:
  Required template for release sign-off evidence.

- `POST_DEPLOYMENT_FEEDBACK_LOOP.md`:
  Process for feedback intake, triage, SLA, and conversion to regression prevention.

## Operational Mapping

- **Local full gate command**: `npm run qa:prod-ready`
- **CI quality + deploy workflow**: `.github/workflows/deploy.yml`
- **Post-deploy validation** (Chrome smoke + a11y against live URL): `post_deploy_validation` job in `.github/workflows/deploy.yml`
- **Scheduled production monitoring** (Lighthouse desktop + mobile against `PRODUCTION_URL`): `.github/workflows/post-deploy-monitoring.yml`
