# System Architecture & Technical Specifications

> **Repository**: `mangeshrautarchive`  
> **Runtime Strategy**: Vanilla Native Web + Edge Microservices + Serverless Python  
> **Hosting**: GitHub Pages (Static Delivery) + Cloudflare Workers (Primary Edge API) + Vercel / Local FastAPI (Optional Backend)

---

## 1. High-Level Architecture

```mermaid
flowchart TD
    Client["Client Browser<br/>(HTML5 / Vanilla CSS / Native ESM)"]

    subgraph Edge ["Edge Services (Cloudflare Workers)"]
        Worker["Cloudflare Worker<br/>workers/assistme-chat/"]
        EdgeKV["Isolate-local memory & cache"]
    end

    subgraph StaticHost ["Static Hosting (GitHub Pages CDN)"]
        Pages["Static Publish<br/>dist/ · index, systems, monitor..."]
    end

    subgraph BackendServices ["Backend / Local Services"]
        FastAPI["FastAPI / Python 3.12+ (api/index.py)"]
        Supabase["Supabase / PostgreSQL"]
    end

    subgraph ExternalProviders ["External AI & APIs"]
        OpenRouter["OpenRouter API<br/>(Nemotron / Gemma / Omni)"]
        GitHubAPI["GitHub REST API"]
        GoogleCal["Google Calendar OAuth"]
        HealthAPI["Whoop / Withings APIs"]
    end

    Client -->|Static HTTP GET| Pages
    Client -->|POST /api/chat (NDJSON stream)| Worker
    Client -->|GET /api/github/*, /api/music/*| Worker
    Client -.->|Local Dev Proxy| FastAPI
    Worker -->|Inference Proxy| OpenRouter
    Worker -->|Metadata Proxy| GitHubAPI
    Worker -->|Bookings and integration state| Supabase
    Worker -->|Calendar availability and booking| GoogleCal
    Worker -->|In-process cache| EdgeKV
    FastAPI -->|Direct API Checks| Supabase
    FastAPI -->|OAuth Token Exchange| GoogleCal
    FastAPI -->|Telemetry Sync| HealthAPI
```

---

## 2. Technology Stack

| Layer                        | Technology                                          | Purpose & Rationale                                                                                                                                 |
| :--------------------------- | :-------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Runtime**         | Native HTML5, Vanilla CSS, ES Modules               | Static pages and progressively loaded interactive modules without a frontend framework runtime.                                                     |
| **Styling**                  | Vanilla CSS + Apple Custom Properties (`--apple-*`) | Authentic Apple Human Interface Guidelines styling, frosted glassmorphism, responsive layout, specular sheen animations.                            |
| **CSS Utility Engine**       | Tailwind CSS v4 (Build-time only)                   | Generates auxiliary utility classes during prebuild; output file consumed without placing utility classes directly in HTML.                         |
| **Edge API**                 | Cloudflare Workers (JavaScript)                     | Chat streaming and model fallback routing, GitHub API caching, and music telemetry; latency depends on providers and network.                       |
| **Local/Serverless Backend** | Python 3.12+ FastAPI with Pydantic v2               | Robust endpoint routing, token cryptography, multi-calendar OAuth flows, and background health monitoring.                                          |
| **Markdown & Rich Media**    | Marked v18 + KaTeX v0.19 + DOMPurify                | Fast client-side markdown parsing, LaTeX math display, and HTML sanitization bundled in a single vendor module.                                     |
| **Build & Tooling**          | esbuild + Custom Node.js scripts                    | Fast JS asset bundling, static HTML minification, sitemap/RSS feed generation, and asset cache busting.                                             |
| **Testing**                  | pytest, node:test, Playwright, Tester Army (`e2e`)  | API, Worker, unit, critical browser, and deterministic Tester Army coverage; current counts and commands are in [tests/README.md](tests/README.md). |

---

## 3. Directory Layout & Module Responsibilities

```text
mangeshrautarchive/
├── src/                               # Frontend source assets (compiled to dist/)
│   ├── index.html                     # Primary portfolio homepage shell
│   ├── systems.html                   # Architecture & system engineering case studies
│   ├── monitor.html                   # Operational health, latency probes, system telemetry
│   ├── travel.html                    # Interactive travel atlas & route maps
│   ├── uses.html                      # Hardware, software, AI stack, and desk setup
│   ├── changelog.html                 # Chronological version history, models & commit SHAs
│   ├── 404.html · offline.html        # Resilient offline and error handling views
│   ├── js/
│   │   ├── entry.js                   # Application bootstrap entry point
│   │   ├── core/                      # Global theme management, UI chrome, navigation
│   │   ├── modules/                   # Surface-specific controllers (travel, monitor, blog)
│   │   ├── services/                  # Network, analytics, streaming, and markdown services
│   │   ├── chatbot/                   # AssistMe agentic core, session memory, streaming engine
│   │   └── data/                      # Static catalogues, changelog entries, project metadata
│   └── assets/
│       ├── css/                       # Component-level vanilla stylesheets
│       ├── images/                    # Verified screenshots, brand assets, icons
│       └── vendor/                    # FontAwesome and self-hosted fonts
├── api/                               # FastAPI backend application
│   ├── index.py                       # ASGI entry point & route registration
│   ├── config.py                      # Environment configuration & model aliases
│   ├── model_router.py                # LLM model resolution & fallback hierarchy
│   ├── platform_health.py             # Asynchronous concurrency-driven system health checks
│   ├── routes/                        # Modular endpoint routers (chat, github, monitor, etc.)
│   └── integrations/                  # OAuth tokens, encryption, Google/Apple calendar sync
├── workers/assistme-chat/             # Cloudflare Workers edge service
│   ├── src/index.js                   # Main edge request router and streaming handler
│   ├── src/model-routing.js           # Multi-provider inference fallback chain
│   ├── src/live-search.js             # Grounding and real-time retrieval module
│   └── wrangler.toml                  # Cloudflare Worker environment and binding config
├── scripts/                           # Developer and CI tooling (not shipped to browser)
│   ├── build/                         # esbuild bundlers, HTML minifiers, sitemap generators
│   ├── deployment/                    # Lighthouse gates, secret scanning, deploy sync
│   └── utils/                         # Local development servers, repo-doctor, test runners
├── tests/                             # Automated test suites
│   ├── api/                           # pytest test cases for FastAPI endpoints
│   ├── e2e/                           # Playwright end-to-end user journeys
│   ├── unit/                          # URL validation, rendering, and data regression checks
│   ├── tester-army/                   # Deterministic browser verification journeys
│   └── worker/                        # Node test runner tests for edge routing
└── docs/                              # Detailed architectural guides, design specs, audits
```

---

## 4. End-to-End Data Flow

### 4.1 Chat Streaming Lifecycle

1. **User Input**: Visitor enters a prompt (or attaches media) in the AssistMe widget.
2. **Preprocessing**: The client parses attachments into base64 data payloads, serializes session context, and dispatches a `POST /api/chat` request.
3. **Edge Ingestion**: The Cloudflare Worker intercepts the request, verifies payload limits (1.2 MB image, 3 MB media, 75 KB text), selects the optimal model via `model-routing.js`, and opens an SSE stream to OpenRouter.
4. **Resilient Fallback**: Retry and fallback depend on provider status, request capabilities, and stream state. The Worker can try compatible providers before delivering an answer; stream-boundary tests guard against concatenating partial answers from different models. See `tests/worker/` for the actual recovery contracts.
5. **Streaming Response**: The Worker converts provider SSE into newline-delimited JSON (`application/x-ndjson`). The browser streaming services decode records and render Markdown through the sanitized rich-response pipeline. FastAPI exposes the same NDJSON media type for streaming chat.

### 4.2 WebMCP Agentic Tool Invocation

1. When user intent implies page navigation or data retrieval (e.g., _"Show me Mangesh's distributed systems projects"_), AssistMe emits a WebMCP action event.
2. `agentic-actions.js` intercepts the action on the client side, resolves the DOM target, smoothly scrolls to `#projects`, triggers the category filter, and announces completion back to the chat model.

### 4.3 Static Build & Asset Versioning

1. `npm run build` triggers `scripts/build/build.js`.
2. Tailwind scans CSS and generates `tailwind-output.css`.
3. Rich markdown dependencies are pre-bundled by `esbuild` into `src/js/vendor/rich-markdown.js`.
4. HTML shells are copied, JS modules are stamped with deterministic cache-busting queries (`?v=ASSET_VER`), and assets are written to `dist/`.
