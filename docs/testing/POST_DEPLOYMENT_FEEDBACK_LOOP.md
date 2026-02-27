# Post-Deployment Feedback Loop

This process captures real user feedback after production deployment and turns it into measurable improvements.

## 1. Collection Channels

- GitHub Issues (bugs/usability/performance)
- Direct user reports from portfolio contact channels
- Analytics and runtime telemetry anomalies
- Automated monitoring alerts (Lighthouse monitor workflow)
- Standard intake form:
  - `.github/ISSUE_TEMPLATE/post_deploy_feedback.yml`

## 2. Review Cadence

- Initial triage: within 4 business hours of report
- Release checkpoints: 24h, 72h, and 7 days after deployment
- Weekly review: aggregate trends and recurring friction points

## 3. Triage Workflow

1. Capture issue with reproducibility details, environment, and screenshots.
2. Label severity:
   - Sev-1: outage/data loss/security risk
   - Sev-2: critical feature broken
   - Sev-3: degraded UX or non-blocking defect
3. Assign owner and target date.
4. Link to release report and deployment SHA.

## 4. Action and Verification

- Fix in branch with explicit regression test when feasible.
- Re-run `qa:chrome` (or targeted gates for hotfix scope).
- Verify on staging or production canary.
- Close issue only after validation evidence is attached.

## 5. Continuous Improvement Rules

- Any Sev-1/Sev-2 issue must produce at least one new automated test or gate enhancement.
- Repeated Sev-3 issues trigger UX checklist updates.
- Monthly QA review updates `docs/testing/CHROME_TEST_MATRIX.md`.

## 6. Reporting Template (per release)

- Total feedback items
- Open vs closed issues by severity
- Mean time to acknowledge (MTTA)
- Mean time to resolve (MTTR)
- Regressions prevented by newly added tests
