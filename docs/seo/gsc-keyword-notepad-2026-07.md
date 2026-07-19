# GSC keyword notepad — July 2026

**Source:** `/Users/mangeshraut/Downloads/https___mangeshraut/`  
**Filter:** Web · Last 3 months · Page `https://mangeshraut.pro/`  
**Analyzed:** 2026-07-19

## Page performance

| Page                       | Clicks | Impressions | CTR  | Avg position |
| -------------------------- | ------ | ----------- | ---- | ------------ |
| `https://mangeshraut.pro/` | 6      | 754         | 0.8% | 6.4          |

## Top queries (saved)

| Query                          | Clicks | Impressions | CTR   | Position | Action                                    |
| ------------------------------ | ------ | ----------- | ----- | -------- | ----------------------------------------- |
| **mangesh raut**               | 3      | **122**     | 2.46% | 5.61     | Primary — strengthen brand SERP + CTR     |
| saesha mangesh raut            | 0      | 2           | 0%    | 9        | Noise / unrelated name collision — ignore |
| ritesh raut                    | 0      | 2           | 0%    | 17       | Noise — ignore                            |
| bhavesh / rupesh / rakesh raut | 0      | 1 each      | 0%    | 8–21     | Noise — ignore                            |
| shioaji api persistence…       | 0      | 1           | 0%    | 29       | Irrelevant filter query — ignore          |

## Underserved / expand-from-winner phrases

These are **not** high-impression GSC rows yet, but they are natural expansions of the only query that drives volume (`mangesh raut`) and were **missing or weak as exact phrases** on the homepage:

1. `mangesh raut portfolio`
2. `mangesh raut software engineer`
3. `mangesh raut drexel`
4. `who is mangesh raut`
5. `mangesh raut resume`
6. `full stack` (two-word form; page had `full-stack` only)
7. `software engineer portfolio` (intent companion to brand)

## Content placement plan

| Phrase                         | Placement                                                |
| ------------------------------ | -------------------------------------------------------- |
| mangesh raut portfolio         | Title, meta description, OG/Twitter, about subtitle, FAQ |
| mangesh raut software engineer | Meta, about intro, FAQ, image ALT                        |
| mangesh raut drexel            | About paragraph, FAQ, schema alumni already present      |
| who is mangesh raut            | FAQ question + FAQPage schema                            |
| mangesh raut resume            | Meta description, FAQ answer                             |
| full stack                     | Hero / about copy (natural prose)                        |

## Geo note

India drove most impressions (111) for this page — keep English brand clarity; no geo-keyword stuffing.

## Applied (2026-07-19)

Homepage + light subpage meta updates landed in source (`src/index.html`, FAQ section + FAQPage JSON-LD, ALTs, about/hero copy, systems/uses/monitor/travel titles). Await deploy to GitHub Pages for crawlers.

## GA4 MCP audit (property 537627192, last 90 days)

| Finding                      | Evidence                                                                  | Fix                                                           |
| ---------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Localhost polluted analytics | `127.0.0.1` = **9,325** sessions (~87%)                                   | GA allowlist: only production hosts                           |
| Primary domain disabled      | `mangeshraut.pro` → **402**; organic (7) still landed there               | `robots.txt` Sitemap/Host → GitHub Pages                      |
| Dual-host split              | pro 655 / github.io 609 sessions                                          | Canonical + sitemap already Pages; keep until Vercel recovers |
| URL duplicates               | `/monitor` vs `/monitor.html`, `/travel` vs `/travel.html`, `/about.html` | Vercel 301s + Pages redirect stubs                            |
| Organic tiny                 | **7** `google / organic` sessions                                         | Keyword content + crawl fixes above                           |
| Title churn                  | Old “Expert…Leadership” vs current titles in GA                           | Keep one software-engineer portfolio title family             |

Prod-only engagement (excluding localhost): github.io ~24% engaged, mangeshraut.pro ~33–40% engaged when reachable.
