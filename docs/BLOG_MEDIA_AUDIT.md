# Blog media source audit

Reviewed September 30, 2026 by GPT-6 / Codex. Exact variant, reasoning mode, and token usage: unavailable.

All 18 active articles were reviewed. Seventeen use original publisher media; one retains explicitly labeled conceptual artwork after a documented source search. Apple’s September article includes separate official Duo and Pro / Pro Max images. The 19 active image assets have unique SHA-256 hashes. The [machine-readable manifest](../src/assets/data/blog-media-sources.json) records original pages and asset URLs, original and local hashes, dimensions, conversions, credits, and the fallback reason.

| Article                                                                                       | Lead media             | Original source                                                                                                            |
| --------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Google AI Ecosystem Field Notes: Put Intelligence Where Context Already Lives                 | publisher-artwork      | [Google](https://ai.google/)                                                                                               |
| OpenClaw Field Notes: Local Agents, Messaging Gateways, and Permission Reality                | publisher-artwork      | [OpenClaw contributors](https://github.com/openclaw/openclaw/blob/main/README.md)                                          |
| Wispr Flow Field Notes: Voice Capture, Cleanup, and Privacy Controls                          | publisher-artwork      | [Wispr Flow](https://wisprflow.ai/)                                                                                        |
| NVIDIA Field Notes: Why the AI Path Matters More Than the Spec Sheet                          | official-product-image | [NVIDIA](https://www.nvidia.com/en-us/data-center/technologies/blackwell-architecture/)                                    |
| Global AI Race Field Notes: Four Lenses Beyond the Leaderboard                                | publisher-artwork      | [Stanford HAI](https://hai.stanford.edu/ai-index/2026-ai-index-report)                                                     |
| AI Code Editors Field Notes: Scope, Checks, and Diff Discipline                               | official-screenshot    | [Microsoft](https://code.visualstudio.com/docs/agents/overview)                                                            |
| Apple at 50 Field Notes: Integration, Restraint, and Taste You Can Measure                    | publisher-artwork      | [Apple](https://www.apple.com/newsroom/2026/03/apple-to-celebrate-50-years-of-thinking-different/)                         |
| Anthropic Reasoning Field Notes: Observer Bias Without Safety Theater                         | author-portrait        | [The Anthropic Principle / Nick Bostrom](https://anthropic-principle.com/anthropic-bias/)                                  |
| X Algorithm Field Notes: Phoenix, Retrieval, and Grok-Based Ranking                           | conceptual-fallback    | [Codex / OpenAI](https://github.com/xai-org/x-algorithm)                                                                   |
| Google I/O 2026 Field Notes: Agents, WebMCP, and What to Ignore in the Keynote                | publisher-artwork      | [Google](https://blog.google/innovation-and-ai/technology/ai/google-io-2026-all-our-announcements/)                        |
| Gemini Notebook (formerly NotebookLM): Source Grounding Under Agentic Pressure                | publisher-artwork      | [Google](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/)                       |
| WWDC 2026 Field Notes: Siri AI, App Schemas, and Liquid Glass Year Two                        | official-product-image | [Apple](https://www.apple.com/newsroom/2026/06/apple-introduces-siri-ai-a-profoundly-more-capable-and-personal-assistant/) |
| OpenRouter Field Notes: The AI USB Hub and 2026 Routing Policy                                | publisher-diagram      | [OpenRouter](https://openrouter.ai/blog/tutorials/prompt-caching-sticky-routing/)                                          |
| Grok 4.5 and Grok Build Field Notes: Model + Open Harness                                     | publisher-artwork      | [xAI](https://x.ai/news/grok-build-open-source)                                                                            |
| Cursor Origin in 2026: Native Git Hosting, Mirrors, and the Agent Review Loop                 | official-screenshot    | [Cursor](https://cursor.com/changelog/origin-code-hosting)                                                                 |
| Razorpay Vulcan: 4 Billion Payments, 3 Trillion Data Points, and a Foundation Model for Money | publisher-artwork      | [Razorpay](https://razorpay.com/blog/vulcan-how-razorpay-built-a-foundation-model-for-payment-decisions/)                  |
| Apple September Event 2026: Hardware Announcements, Software Decisions                        | official-product-image | [Apple](https://www.apple.com/newsroom/2026/09/apple-unveils-iphone-duo/)                                                  |
| OpenAI DevDay 2026: Models, Ongoing Agents, and Reliable Workflows                            | publisher-artwork      | [OpenAI](https://devday.openai.com/)                                                                                       |

## Editorial and technical figures

The 18 HTML workflow diagrams are explicitly labeled as conceptual or editorial. Ordered frameworks describe author priorities; stale references to bars and numerical scores were removed. The Cursor and Razorpay tables identify their source context, and Razorpay results remain company-reported. Publisher images are credited individually and kept at their native proportions. Archive and homepage cards use contain or scale-down fitting to preserve text and device silhouettes. The low-resolution Bostrom portrait is displayed at native size in the article.

X algorithm fallback: the original repository README and Phoenix documentation were checked. Their architecture is supplied as text diagrams; no suitable downloadable architecture image was found. The retained illustration is labeled conceptual, and its technical reference is distinct from an original image-source link.

Original publisher media retains its publisher attribution; the portfolio’s code license does not assert ownership of those assets. WebP conversion preserves subject and proportions without adding content. No new generated imagery was created for this audit.

## Browser verification

All 18 article pages were rendered at 1440px and 390px in light and dark themes: 72 article states. Each image loaded, each figure had visible attribution, and no horizontal overflow was observed. The archive and homepage preview were also checked at both widths and themes. The Apple article’s supplemental Pro / Pro Max figure was inspected separately. The local release checks passed: 184 API tests, nine critical browser journeys, lint and formatting, the security scan, and the production build.
