# Foglamp architecture scan

Interactive public map of how this repo uses AI (agents, models, tools, integrations, main flows).  
**No source code or secrets** are uploaded — only the high-level graph in `.foglamp/scan.json`.

|                        |                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Live map**           | [foglamp.dev/scan/mangeshrautarchive-jtspx4](https://foglamp.dev/scan/mangeshrautarchive-jtspx4) |
| **Data (committed)**   | [`.foglamp/scan.json`](../.foglamp/scan.json)                                                    |
| **Edit lock (secret)** | `.foglamp/scan.lock.json` — **gitignored**                                                       |

## Why two files?

| File             | Tracked? | Purpose                                                   |
| ---------------- | -------- | --------------------------------------------------------- |
| `scan.json`      | Yes      | Architecture summary viewers / CI / agents can regenerate |
| `scan.lock.json` | **No**   | Holds `editToken` so republish updates the **same URL**   |

Foglamp maps are **public unlisted** and **expire** (~90 days). Republishing with the edit token refreshes `expiresAt` without changing the slug/URL.

## Keep the public view alive

### Local (after architecture changes)

```bash
# 1. Edit .foglamp/scan.json (or re-run a Foglamp codebase-scan agent)
# 2. Publish / refresh the same URL
npm run foglamp:publish
```

Requires a local `.foglamp/scan.lock.json` from a previous publish (already created for this repo).

### GitHub Actions (recommended)

1. Open local lock: `jq -r .editToken .foglamp/scan.lock.json`
2. Repo → **Settings → Secrets and variables → Actions**
3. Create secret **`FOGLAMP_SCAN_EDIT_TOKEN`** with that value
4. Workflow [`.github/workflows/foglamp-scan-keepalive.yml`](../.github/workflows/foglamp-scan-keepalive.yml) runs monthly (`workflow_dispatch` available anytime)

If the secret is missing, the workflow fails loudly instead of creating a _new_ orphaned URL.

### If the lock / token is lost

1. Publish without a token → Foglamp returns a **new** URL + token
2. Save the new lock locally
3. Update the README / this doc link
4. Rotate the GitHub secret to the new `editToken`

## README showcase

The README links the live Foglamp map and keeps an always-on Mermaid diagram (does not expire) so GitHub viewers still understand the architecture when the external map is unavailable.

## Regenerate the graph

Use the [Foglamp codebase-scan skill](https://github.com/foglamp-labs/foglamp/tree/master/.agents/skills/codebase-scan) (or paste the prompt from [foglamp.dev/scan](https://www.foglamp.dev/scan)), write `.foglamp/scan.json`, get consent, then `npm run foglamp:publish`.
