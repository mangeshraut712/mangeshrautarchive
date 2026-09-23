# Shared guidance and changelog implementation plan

Goal: apply the supplied workflow references without adopting unverified product claims or
another person's machine configuration. Keep the portfolio's vanilla stack and security gates.

1. Condense AGENTS.md into shared project constraints, authorization, verification, model choice,
   and process ownership. Point platform files to it and retain required release checks.
2. Document reference generation, design analysis, implementation, and browser verification
   in visual-workflow.md and DESIGN.md. Update README and the documentation index.
3. Generate a changelog concept. Apply its timeline spine, markers, spacing, and control clarity
   to changelog.css while preserving all historical data and disclosure/filter behavior.
4. Run npm run check, npm run security-check, npm run build, and the existing changelog tests.
   Inspect desktop/mobile light/dark browser screenshots and changed controls. Record limits.

The user authorized implementation directly. Execute in this task; no model-specific delegation
or global IDE configuration changes are required.
