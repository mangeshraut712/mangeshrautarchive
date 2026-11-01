# Lighthouse evidence — November 1, 2026

This record preserves raw Lighthouse category scores from the runs in [the accompanying JSON](lighthouse-evidence-2026-11-01.json). Scores are individual lab samples, not field Core Web Vitals or guarantees for every page, visit, browser, network, or device. The raw report files are not included; the JSON records the measured scores, three metrics, URL, timestamp, Lighthouse version, and tested commit.

| Page and build         | Form factor | Performance | Accessibility | Best practices | SEO |
| ---------------------- | ----------- | ----------: | ------------: | -------------: | --: |
| Homepage, `594df540`   | Mobile      |          75 |           100 |            100 | 100 |
| Homepage, `594df540`   | Desktop     |          99 |           100 |            100 | 100 |
| Systems, `594df540`    | Mobile      |          97 |           100 |            100 | 100 |
| Monitor, `594df540`    | Mobile      |          98 |           100 |            100 | 100 |
| Blog index, `594df540` | Mobile      |          89 |           100 |            100 | 100 |
| Changelog, `594df540`  | Mobile      |          96 |           100 |            100 | 100 |
| Homepage, `cd9c2e6d`   | Mobile      |          80 |           100 |            100 | 100 |
| Homepage, `170bfdce`   | Mobile      |          85 |           100 |            100 | 100 |
| Blog index, `170bfdce` | Mobile      |          89 |           100 |            100 | 100 |

These used the published GitHub Pages URL and `--full-load`, which does not set the explicit `perf-audit` parameter. The site suppresses its first-visit launch animation for automated browsers, so this is not an exact replay of every human first visit. Each number is one run; differences between commits can reflect machine, network, and measurement variability. The measurements do not establish a 100 performance score across the site.

The accompanying JSON also records two **local reduced audit-mode** runs: desktop scored 100 in all four raw categories; mobile scored 98 performance and 100 in the other three. The gate reported both as 100 because it rounds certain audit-mode results. Those runs are not comparable to normal page loads.

To collect a new public normal-load sample, run:

```bash
node scripts/deployment/lighthouse-gate.js \
  --url=https://mangeshraut712.github.io/mangeshrautarchive/ \
  --form-factor=mobile --full-load \
  --min-performance=0 --min-accessibility=0 --min-best-practices=0 --min-seo=0 \
  --max-attempts=1 --output-dir=artifacts/lighthouse/full-load-mobile
```

Inspect `artifacts/lighthouse/full-load-mobile/lighthouse-mobile.json` for raw `categories` and `audits`. Repeat runs on an otherwise idle machine and compare multiple samples. For actual user experience, use real-user metrics in addition to Lighthouse; this repository does not establish a current field-data baseline.
