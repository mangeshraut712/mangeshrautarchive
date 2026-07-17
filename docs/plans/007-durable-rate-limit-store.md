# Plan 007: Durable rate limiting for serverless (replace process memory)

> **Drift check**: `git diff --stat 978494ee..HEAD -- api/config.py api/routes/ tests/api/`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `978494ee`, 2026-07-15
- **Status**: DONE (wave: whole-site Task 5 — `api/rate_limit.py` + Upstash optional backend; memory default preserved)

## Why this matters

Rate limits use an in-process `defaultdict(list)` (`api/config.py` → `rate_limit_store`). On Vercel serverless, each isolate has its own memory: limits reset per cold start and do not aggregate across concurrent instances. Chat, contact, newsletter, analytics track, and GitHub proxy all call `check_rate_limit` / `enforce_rate_limit`. An attacker can bypass intended caps by spreading load.

## Current state

- `api/config.py`: `rate_limit_store = defaultdict(list)`; `check_rate_limit(client_id)` prunes timestamps in a window and appends; `get_client_ip` already prefers Vercel-forwarded identity (plan 003).
- Call sites: `api/routes/chat.py`, `general.py` (contact/newsletter), `analytics.py`, `github.py`, `integrations.py` via `enforce_rate_limit`.
- Tests: `tests/api/test_security_hardening.py` clears `rate_limit_store` between cases.
- Monitor surfaces `rate_limit_store` in diagnostics (masked) — keep that contract or document empty when using external store.

**Conventions**: FastAPI + Pydantic v2; 4-space Python; prefer env-driven optional backends; `uv run` / venv for pytest; never hardcode secrets.

## Commands you will need

| Purpose     | Command                                           | Expected        |
| ----------- | ------------------------------------------------- | --------------- |
| API tests   | `source venv/bin/activate && npm run test:api`    | all pass (109+) |
| Python lint | `source venv/bin/activate && npm run lint:python` | exit 0          |
| Security    | `npm run security-check`                          | pass            |

## Scope

**In scope**:

- `api/config.py` (rate limit store abstraction)
- Tests under `tests/api/` for the store interface
- Optional tiny adapter module e.g. `api/rate_limit.py` if cleaner
- Env docs in `.env.example` only (no real secrets): e.g. `RATE_LIMIT_BACKEND=memory|upstash` placeholders

**Out of scope**:

- Changing limit numbers/windows unless tests require documenting current defaults
- Full WAF / edge rate limiting product
- Redis provisioning in production (document how operator enables Upstash/KV; default stay memory for local)

## Steps

### Step 1: Extract interface

Introduce something like:

```python
class RateLimitStore(Protocol):
    def allow(self, client_id: str, *, limit: int, window_sec: float) -> bool: ...
```

Keep `check_rate_limit(client_id: str) -> bool` as the public API used by routes so call sites need not change.

### Step 2: Memory backend (default)

Move current list logic into `InMemoryRateLimitStore` — preserve existing behavior so all API tests still pass with no env.

### Step 3: Optional durable backend

Implement **one** of (pick simplest for Vercel):

**A. Upstash Redis REST** (if `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set) using INCR + EXPIRE sliding/fixed window  
**B. Vercel KV** if already in project deps  
**C. Fail-soft**: if env incomplete, fall back to memory and log once at startup

Do **not** require Redis for local `npm run test:api`.

### Step 4: Wire env

```text
# .env.example
# RATE_LIMIT_BACKEND=memory   # default
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

### Step 5: Tests

- Existing hardening tests still pass (memory).
- New unit tests for store with fake clock or small window: allow N then deny.
- If Redis client is used, mock HTTP so tests never hit network.

**Verify**: `source venv/bin/activate && npm run test:api`

### Step 6: Monitor compatibility

If monitor reads `rate_limit_store` dict, either:

- Expose a `snapshot()` method on the store that returns a dict-like view for memory, and `{}` for redis, **or**
- Keep a thin compatibility shim so monitor does not 500.

**Verify**: hit monitor security section in local dev or API tests covering that endpoint.

## Done criteria

- [ ] Routes still call `check_rate_limit` / `enforce_rate_limit` unchanged at call sites (or minimal one-line import changes)
- [ ] Default backend = in-memory (local + CI)
- [ ] Documented path to durable backend via env
- [ ] `npm run test:api` and `npm run lint:python` pass

## STOP conditions

- Production already has an external rate limit you discover (document and close plan as superseded)
- Adding Redis client package conflicts with Vercel bundle size — choose HTTP REST client with no heavy deps, or stop and report
- Monitor endpoint hard-depends on mutating global dict internals — fix adapter carefully or STOP

## Maintenance notes

Durable limits matter most for `/api/chat` and contact forms. After enablement in prod, verify 429s appear under burst traffic without wiping on cold start.
