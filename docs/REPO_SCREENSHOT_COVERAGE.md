# Repository image coverage

Prepared by GPT-6 / Codex to verify project image coverage and source accuracy. Reasoning mode and token usage were unavailable.

Audited 28 September 2026 against the 61 public repositories returned by the portfolio's GitHub feed. The 27 screenshot PRs supplied by the owner are recorded in `src/assets/images/repo-screenshots/manifest.json`. This pass inspected the 34 other repositories. Source URL, SHA-256, size, and alternative text for every image used by a card are in that manifest.

| Repository                    | Decision                 | Evidence or reason                                                                                                                                   |
| ----------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mangeshrautarchive`          | Added                    | Existing light-mode homepage screenshot in its README.                                                                                               |
| `Crime-Investigation-System`  | Added                    | Existing captured Swing home window in its README.                                                                                                   |
| `financial-forecasting-model` | Added                    | Existing workbook-derived budget chart in its README; card labels it as project output.                                                              |
| `ai-ml-portfolio`             | Added                    | Existing ML lab charts in its README; card labels them as project output.                                                                            |
| `ForexScalpingBot`            | Awaiting current capture | README has iPhone images, but the home screen visibly shows May 2024. A current simulator capture is needed before presenting it as the current app. |
| `mangeshraut712`              | Skip                     | Profile README, rather than a separate app.                                                                                                          |
| `Stanford-CS336`              | Skip                     | Course notes and labs, without a user-facing product window.                                                                                         |
| `mangeshraut712.github.io`    | Skip                     | Host-root redirect and favicon repository.                                                                                                           |
| `LeetCodeByMangesh`           | Skip                     | Code solutions and interview notes.                                                                                                                  |
| `hiver-spotify-support-agent` | Skip                     | CLI prototype; README already shows real terminal runs.                                                                                              |
| `erdos142`                    | Skip                     | Research notebook and verifiers.                                                                                                                     |
| `apply-lens`                  | Skip                     | Command-line tool with no UI to capture.                                                                                                             |

The other 22 repositories in the feed are forks: `n8n-sarvam-node`, `n8n-nodes-firecrawl`, `llm_wer`, `cli`, `llm_intent_entity`, `openai-node`, `openGym`, `lexical-ios`, `password-manager-resources`, `decimen-optical-transfer`, `claude-code-action`, `skills`, `codex-security`, `sbsim`, `nvcf`, `solari-cookbook`, `sarvam-mcp`, `whoburnedmore`, `kimi-code`, `sarvam-ai-cookbook`, `pyrefly`, and `pdf-inspector`. They were left on their existing repository imagery; a screenshot of an upstream product would suggest it was built in this portfolio.

For further updates, capture the running product, check that the image matches its current UI and README, then add the file, provenance entry, and card mapping together. Do not turn source charts into claimed app screenshots or substitute a mock interface for an unavailable app.
