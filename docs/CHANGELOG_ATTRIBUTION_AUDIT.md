# Changelog attribution audit — October 1, 2026

## Scope and evidence

The audit checked all **282 existing changelog commit references** and **87 entries with coding attribution** against local Git commit messages. One commit absent locally was retrieved from GitHub by its full SHA. GitHub returned HTTP 422 for the nonexistent `70aa6988cdd2e5cbe7109c500a065cd7cc980f34` reference.

The [per-entry audit manifest](CHANGELOG_ATTRIBUTION_AUDIT.json) preserves original model/tool claims, corrected commit references, retained attribution, and the supporting commit-message lines. This manifest is an audit record: its previous values are not endorsed runtime facts.

## Corrections

| Entry                           | Previous reference              | Correct implementation reference                                   |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| Critical browser test migration | `39e89a34` (telemetry changes)  | `f4ef742a` (explicit migration description and removed unit suite) |
| Anti-slop installation          | `c7377474` (analytics snapshot) | `147052bc` (tooling installation)                                  |
| Separate AI-tool cards          | `d794dac6`                      | `e70c5e57` (landed tool-card implementation)                       |
| E2E and monitor resilience      | `90df6244`                      | `da6062ad` (landed resilience implementation)                      |

Dates for these four entries now use the implementation commit date. The missing visual-edition reference and the Tokenization dashboard's unrelated analytics-formatting reference no longer produce verified commit links. Their historical descriptions remain visible with an explicit verification limitation.

Of the 87 existing attribution records, **48 have model-family evidence** and **34 have coding-tool evidence** in commit attribution lines. **39 lack both** and now show “Not recorded.” One explicitly recorded reasoning string is retained as a contributor report; four unsupported “High / Extended Thinking” claims are cleared. No task token usage was recorded.

For the original-publisher media entry, the commit explicitly records **GPT-6 / Codex** and its image-verification purpose. It does not explicitly record “Codex desktop,” so the displayed tool is reduced to **Codex**. The model field shows the recorded **GPT-6** family without an invented variant.

## What verification means

- A verified commit link confirms that the commit reference resolves.
- A model or tool in a commit message is **contributor-reported attribution**, not provider-authenticated telemetry.
- For verified references, engineering scope uses the commit’s explicit purpose or its change subject. It is not evidence of a particular model’s abilities.
- Missing reasoning modes, exact model variants, and task token counts are not inferred from names, tool choice, account totals, or change complexity.
- The portfolio chatbot runtime is configured separately and is not the coding model that produced a change.

## Maintenance

Record the exposed model family, coding tool, and purpose in the implementation commit. Use `unavailable` in stored metadata when reasoning or task usage is not exposed; the UI renders one plain-language explanation. Keep historical attribution tied to that specific commit rather than copying the current agent into old entries.

Coding agent: **GPT-6 / Codex** in **Codex desktop**. Purpose: changelog provenance audit and accessible presentation. Exact variant, reasoning mode, and task token usage: **unavailable**.

## Verification

All retained model strings and non-empty reasoning records were checked against the per-entry commit evidence. Every published verified commit reference resolves. The expanded details were inspected at 1440px and 390px in light and dark themes: no horizontal overflow, no raw unavailable rows, and no links for the two unverified implementation records.
