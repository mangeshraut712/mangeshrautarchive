# Lighthouse evidence — November 1, 2026

This record preserves raw Lighthouse category scores from the runs in [the accompanying JSON](lighthouse-evidence-2026-11-01.json). Scores are individual lab samples, not field Core Web Vitals or guarantees for every page, visit, browser, network, or device. The raw report files are not included; the JSON records the measured scores, three metrics, URL, timestamp, Lighthouse version, and tested commit.

| Page and build               | Form factor | Performance | Accessibility | Best practices | SEO |
| ---------------------------- | ----------- | ----------: | ------------: | -------------: | --: |
| Homepage, `594df540`         | Mobile      |          75 |           100 |            100 | 100 |
| Homepage, `594df540`         | Desktop     |          99 |           100 |            100 | 100 |
| Systems, `594df540`          | Mobile      |          97 |           100 |            100 | 100 |
| Monitor, `594df540`          | Mobile      |          98 |           100 |            100 | 100 |
| Blog index, `594df540`       | Mobile      |          89 |           100 |            100 | 100 |
| Changelog, `594df540`        | Mobile      |          96 |           100 |            100 | 100 |
| Homepage, `cd9c2e6d`         | Mobile      |          80 |           100 |            100 | 100 |
| Homepage, `170bfdce`         | Mobile      |          85 |           100 |            100 | 100 |
| Blog index, `170bfdce`       | Mobile      |          89 |           100 |            100 | 100 |
| Contact redirect, `20c22d05` | Mobile      |          42 |           100 |            100 | 100 |
| 404 page, `20c22d05`         | Mobile      |          98 |           100 |            100 |  60 |
| Offline page, `20c22d05`     | Mobile      |         100 |           100 |            100 |  60 |

These used the published GitHub Pages URL and `--full-load`, which does not set the explicit `perf-audit` parameter. The site suppresses its first-visit launch animation for automated browsers, so this is not an exact replay of every human first visit. Each number is one run; differences between commits can reflect machine, network, and measurement variability. The measurements do not establish a 100 performance score across the site.

The Contact URL redirects to the homepage's Contact section. The recorded pre-fix run had a 3.715 cumulative layout shift and exposed a deep-link landing defect. The landing fix requires a new public audit; a passing layout-shift score has not yet been established. The 404 and offline pages intentionally use `noindex, nofollow`; Lighthouse's crawlability audit therefore lowers their SEO scores. Indexing error and offline pages just to raise that score would misrepresent their purpose.

The accompanying JSON also records two **local reduced audit-mode** runs: desktop scored 100 in all four raw categories; mobile scored 98 performance and 100 in the other three. The gate reported both as 100 because it rounds certain audit-mode results. Those runs are not comparable to normal page loads.

A subsequent [full-load sweep of all 39 published URLs on mobile and desktop](lighthouse-wide-2026-11-01.json) sampled commit `bd31711b`. All 78 runs completed: 4 mobile and 34 desktop samples scored 100 in all four categories. All samples scored 100 for accessibility and best practices. The intentionally unindexed 404 and offline pages scored 60 for SEO on both form factors. Each score is one sample, and the tested redirect URLs may resolve to a shared homepage section; the JSON includes the final URL and measurement time.

The new Contact samples scored 71 mobile and 75 desktop for performance. Mobile layout shift was 0.097, compared with 3.715 in the earlier pre-fix sample; desktop layout shift was 2.107, so the landing fix did not resolve the desktop performance issue. About scored 64 mobile and 90 desktop for performance; the mobile LCP trace identified the lazy, low-priority About image as the largest element. These measurements are diagnostic evidence, not proof of a stable change from a single run.

Google [PageSpeed Insights](https://pagespeed.web.dev/analysis/https-mangeshraut712-github-io-mangeshrautarchive/xftlmhjz2v?form_factor=mobile) independently measured the public homepage at 2:26 PM Asia/Kolkata on November 1, 2026. Its mobile lab sample was 75 performance, 100 accessibility, 100 best practices and 100 SEO, with 1.7 s LCP, 740 ms total blocking time, 0 CLS and 6.2 s speed index. The desktop sample was 72/100/100/100, with 0.4 s LCP, 580 ms total blocking time, 0 CLS and 2.1 s speed index. PageSpeed displayed no real-user field data for this URL. These are separate single lab samples and do not establish performance on every visit.

A local Contact experiment gave inconsistent desktop layout-shift samples when Experience icons received their final 20 × 20 dimensions in the HTML: baseline runs measured 1.200 and 2.036, while candidate runs measured 0.885 and 2.846. The dimensions avoid oversized unsized SVGs before the deferred stylesheet arrives, but those samples do not establish a Contact score improvement; repeat testing on the deployed build is required.

To collect a new public normal-load sample, run:

```bash
node scripts/deployment/lighthouse-gate.js \
  --url=https://mangeshraut712.github.io/mangeshrautarchive/ \
  --form-factor=mobile --full-load \
  --min-performance=0 --min-accessibility=0 --min-best-practices=0 --min-seo=0 \
  --max-attempts=1 --output-dir=artifacts/lighthouse/full-load-mobile
```

Inspect `artifacts/lighthouse/full-load-mobile/lighthouse-mobile.json` for raw `categories` and `audits`. Repeat runs on an otherwise idle machine and compare multiple samples. For actual user experience, use real-user metrics in addition to Lighthouse; this repository does not establish a current field-data baseline.
