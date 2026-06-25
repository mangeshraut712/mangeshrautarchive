# AI stack roadmap — OpenRouter, WebMCP, Vercel AI SDK 7

June 2026 · maps to current `api/routes/chat.py` + `agentic-actions.js`

## What runs today

| Layer                     | Technology                                      | Role                                                                        |
| ------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| **Browser (local-first)** | `agentic-actions.js`                            | Regex actions + **WebMCP** (`navigator.modelContext`) — 10 tools, &lt;50 ms |
| **Browser (chat UI)**     | `chat.js` → `chatbot.js`                        | NDJSON stream consumer, markdown render                                     |
| **API (Vercel Python)**   | FastAPI `POST /api/chat`                        | Rate limits, site knowledge RAG, OpenRouter via **httpx**                   |
| **Routing**               | `model_router.py`                               | Grok portfolio · Fusion · Auto · Gemini fallback                            |
| **OpenRouter tools**      | `openrouter:web_search`, `openrouter:web_fetch` | Time-sensitive queries when `should_use_web_tools()`                        |

**Not in production:** Vercel AI SDK (`ai`, `@ai-sdk/*`), OpenRouter MCP server, Perplexity MCP.

---

## OpenRouter MCP — where it fits

**OpenRouter MCP** is a _developer/IDE_ protocol server (Cursor, Claude Desktop, Cline) — not the same as **WebMCP** in the browser.

| Use case                                        | Recommendation                                                                                                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cursor / IDE agent** while building this repo | Add OpenRouter MCP to your local MCP config; point at `OPENROUTER_API_KEY`. Use for codegen, refactors, and API exploration — **not** shipped to `dist/`.                                |
| **Production AssistMe**                         | Keep **HTTP** `POST /api/chat` + `model_router.py`. MCP is for tool hosts, not end-user browsers.                                                                                        |
| **Align with WebMCP**                           | WebMCP tools in `agentic-actions.js` already mirror portfolio actions. OpenRouter MCP in the IDE can call the same OpenRouter models for backend work without duplicating runtime logic. |

**Do not:** copy local MCP JSON (machine paths, API keys) into `dist/` or commit them — removed from `build.js` `staticExtras`.

### Setup (this repo)

```bash
npm run setup:openrouter-mcp          # global ~/.cursor/mcp.json (Home → MCP)
npm run setup:openrouter-mcp -- --with-chat   # + openrouter-chat via ~/.cursor/openrouter.env
npm run test:openrouter
```

1. **Global only** — `npm run setup:openrouter-mcp` writes **`~/.cursor/mcp.json`** (Cursor Home → MCP). It removes project `.cursor/mcp.json` to avoid duplicates after you delete a server in settings.
2. **openrouter (remote)** — `Authorization: Bearer ${env:OPENROUTER_API_KEY}` in `~/.cursor/mcp.json` (never paste the key). `npm run setup:openrouter-mcp` writes the key only to `~/.cursor/openrouter.env` (chmod 600) and runs `launchctl setenv` on macOS.
3. **openrouter-chat** (`--with-chat`) — `envFile: ~/.cursor/openrouter.env` (key not in JSON).
4. **Never commit** `.env`, `~/.cursor/openrouter.env`, or `mcp.json` with raw keys. Rotate at [openrouter.ai/keys](https://openrouter.ai/keys) if a key was ever pasted in chat or config.
5. **AssistMe backend** — `npm run dev:backend` then `npm run test:openrouter` for `POST /api/chat`.

Production chat stays on FastAPI; MCP is for development in Cursor only. **Vercel AI SDK 7 is unchanged** — not adopted.

---

## Vercel AI SDK 7 — where it fits

AI SDK 7 is **Node/TypeScript** (`ai`, `@ai-sdk/openrouter`). This project’s chat backend is **Python FastAPI** on Vercel serverless.

| Option                              | Fit                  | Notes                                                                                                     |
| ----------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| **A. Keep Python (recommended)**    | ✅ Current stack     | `httpx` streaming to OpenRouter is correct; 70 pytest tests cover routing. No AI SDK needed.              |
| **B. Vercel AI Gateway**            | Optional enhancement | Single endpoint + failover in front of OpenRouter; still callable from Python via HTTP — no SDK required. |
| **C. New Node route `api/chat.ts`** | ⚠️ Duplicate path    | Would duplicate `chat.py`, split tests, two deploy surfaces. Only if migrating API to TypeScript.         |
| **D. AI SDK in frontend**           | ❌ Wrong boundary    | Never put provider keys in `src/`; chat must stay server-side.                                            |
| **E. `useChat` + React**            | ❌ Stack mismatch    | Site is vanilla ES modules, not React.                                                                    |

**If you adopt AI SDK 7 later** (e.g. new Vercel Function in TypeScript):

1. Use `@ai-sdk/openrouter` with `streamText()` and tool definitions mapped from `agentic-actions.js`.
2. Keep WebMCP + regex on the client for instant actions; SDK handles only LLM turns.
3. Port `model_router.py` rules to a shared `lib/model-router.ts` or call existing Python route during transition.

---

## Suggested integration order

1. **Now:** OpenRouter MCP in **local Cursor MCP** for development only.
2. **Optional:** Vercel AI Gateway env var in front of existing `OPENROUTER_API_KEY` URL (no SDK).
3. **Future:** TypeScript chat route with AI SDK 7 only if FastAPI chat is retired — single source of truth.

---

## Files to touch for each path

| Path                  | OpenRouter MCP (dev) | AI SDK 7 (future Node chat)         |
| --------------------- | -------------------- | ----------------------------------- |
| `api/routes/chat.py`  | No change            | Replace with `api/chat/route.ts`    |
| `model_router.py`     | No change            | Port to `lib/model-router.ts`       |
| `src/js/core/chat.js` | No change            | Point `apiBaseUrl` at new route     |
| `agentic-actions.js`  | No change            | Optional: SDK `tools` mirror WebMCP |
| `package.json`        | —                    | Add `ai`, `@ai-sdk/openrouter`      |
| `vercel.json`         | No change            | Add function config if new route    |

---

## Related docs

- [integration-auth-playbook.md](integration-auth-playbook.md) — OAuth / env vars
- [ci-quality-gates-june-2026.md](ci-quality-gates-june-2026.md) — CI gates including chat tests
- [AGENTS.md](../AGENTS.md) — agent briefing for this repo
