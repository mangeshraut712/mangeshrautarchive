# Compact changelog and portable AI guidance

## Approved outcome

Replace paragraph-heavy changelog rows with dates, concise titles, type badges,
area labels, and native Details disclosures. Preserve full historical summaries
and commit references. Follow DESIGN.md in light, dark, high-contrast, mobile,
and reduced-motion states. Keep the existing vanilla HTML/CSS/ES module stack.

## Execution checkpoints

1. Add behavior tests for collapsed details, combined filtering, focus retention,
   month disclosure, and empty-state reset. Run them against the current renderer.
   Update `src/js/modules/changelog-page.js`, `src/js/data/changelog-entries.js`,
   `src/assets/css/changelog.css`, and `src/changelog.html`. Preserve pre-existing edits.
2. Review project Markdown and repository-owned skills. Consolidate repeated AI
   instructions into AGENTS.md, retain safety and release checks, and document
   confirmed editor/model attribution without guessing usage. Update relevant
   current documentation; label historical plans as historical where necessary.
3. Run focused tests, `npm run check`, `npm run security-check`, and `npm run build`
   with Node 22. Inspect actual browser output at desktop and phone widths in both
   themes, check contrast and keyboard behaviors, fix findings, and rerun affected
   checks. Record evidence and remaining limitations before completion.

## Boundaries

- The user approved implementation and routine verification without repeated prompts.
- Existing changes belong to other work; preserve them and review scoped diffs.
- No commit, push, deployment, recurring automation, or personal/vendor skill edits
  are part of this implementation.
- Session: Codex desktop; model family exposed as GPT-6. Exact model variant,
  reasoning setting, and task token usage are unavailable in the session metadata.
- Engineering purpose: compact changelog UX, theme/accessibility verification,
  and consistent guidance across coding agents.

## Progress

- [x] Inspect current renderer, data, styles, design system, and canonical commands.
- [x] Implement and verify compact changelog (Apple HIG & shadcn details disclosure, concise titles, attribution table).
- [x] Review and update documentation (AGENTS.md, GEMINI.md, README.md, STRUCTURE.md, INSIGHTS.md, tests/README.md).
- [x] Complete browser checks and quality gates; record results (273 Vitest, 175 pytest, clean lint, security, build).
