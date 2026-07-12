# Plan 003: Trust platform client IP for rate limits (ignore spoofed XFF)

> **Drift check**: `git diff --stat 915866f2..HEAD -- api/config.py tests/api/`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `915866f2`, 2026-07-12

## Why this matters

`get_client_ip` returns the **leftmost** `X-Forwarded-For` hop. Clients can send a new spoofed IP every request, defeating in-process rate limits for chat, contact, newsletter, and personalization identity. On Vercel, the platform provides a trustworthy client IP header; untrusted client XFF must not drive quotas.

## Current state

`api/config.py` (~485–490):

```python
def get_client_ip(request: Request) -> str:
    """Get client IP for rate limiting"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0]
    return request.client.host if request.client else "unknown"
```

Used by chat rate limit, contact/newsletter, analytics, personalization.

**Note**: In-process rate limits still reset per instance (SEC-01 durable store is a **later** plan). This plan only fixes identity spoofing.

## Commands

| Purpose     | Command                                        | Expected |
| ----------- | ---------------------------------------------- | -------- |
| API tests   | `source venv/bin/activate && npm run test:api` | all pass |
| Python lint | `npm run lint:python`                          | exit 0   |

## Scope

**In scope**: `api/config.py` (`get_client_ip`), tests under `tests/api/`  
**Out of scope**: Redis/Upstash rate limit backend; changing rate limit numbers

## Steps

### Step 1: Prefer trusted headers

Update `get_client_ip` priority:

1. `x-vercel-forwarded-for` or `x-real-ip` if present (document Vercel behavior in a one-line comment — do not invent undocumented headers; if unsure, use `request.client.host` first on Vercel and only parse XFF **rightmost** hop as platform-appended).
2. Safe approach when only XFF exists: use the **last** non-empty hop (closest to the edge that appended it), **not** the first.
3. Fallback: `request.client.host` or `"unknown"`.

Recommended implementation sketch:

```python
def get_client_ip(request: Request) -> str:
    vercel = (request.headers.get("x-vercel-forwarded-for") or "").split(",")[0].strip()
    if vercel:
        return vercel
    real_ip = (request.headers.get("x-real-ip") or "").strip()
    if real_ip:
        return real_ip
    forwarded = request.headers.get("x-forwarded-for") or request.headers.get("X-Forwarded-For")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1]  # rightmost = nearest trusted proxy hop
    return request.client.host if request.client else "unknown"
```

**Verify**: function no longer returns `split(",")[0]` as the sole strategy without comment/tests

### Step 2: Unit tests

Add tests (pytest) that:

1. Spoofed `X-Forwarded-For: 1.2.3.4, 5.6.7.8` with `x-vercel-forwarded-for: 9.9.9.9` → returns `9.9.9.9`
2. Only `X-Forwarded-For: evil, 10.0.0.1` → returns rightmost `10.0.0.1` (not `evil`)
3. No headers → `request.client.host`

Place near existing rate-limit tests (`tests/api/test_rate_limit.py` if present).

**Verify**: `npm run test:api` pass

### Step 3: Done

Update `docs/plans/README.md` → 003 DONE

## Done criteria

- [ ] Leftmost-only XFF trust removed
- [ ] Tests prove spoofed left hop is not used when platform header or rightmost hop applies
- [ ] No secret values in tests

## STOP conditions

- Production is not on Vercel and rightmost XFF would break real client IP — STOP and document hosting assumption
- Changing IP breaks a test that intentionally depended on leftmost XFF — update that test to the new contract

## Maintenance notes

- Follow-up: durable shared rate limit store (SEC-01) still needed for multi-instance accuracy.
