# Plan 002: Fail-closed Google Calendar webhook verification

> **Executor instructions**: Follow step by step. Run every verification. On STOP conditions, report — do not improvise. Update `docs/plans/README.md` when done.
>
> **Drift check**: `git diff --stat 915866f2..HEAD -- api/routes/integrations.py tests/api/test_security_hardening.py`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `915866f2`, 2026-07-12

## Why this matters

The Google Calendar push webhook only validates channel ID/token when stored sync state is non-empty. If Calendar is connected but watch credentials are missing, any client can POST and force `sync_google_calendar_availability()` (API quota / token use). Fail-closed is the correct pattern for webhook authenticity.

## Current state

`api/routes/integrations.py` (~736–748):

```python
sync_state = await fetch_sync_state("google_calendar")
expected_channel = str(sync_state.get("channel_id") or "").strip()
expected_token = str(sync_state.get("channel_token") or "").strip()
if expected_channel and channel_id != expected_channel:
    raise HTTPException(status_code=403, detail="Unknown calendar webhook channel.")
if expected_token and channel_token != expected_token:
    raise HTTPException(status_code=403, detail="Invalid calendar webhook token.")

await sync_google_calendar_availability()
```

Tests for the **populated** case exist in `tests/api/test_security_hardening.py` (~109–129); empty expected channel/token is not covered.

**Conventions**: Python 4-space indent, 120-char lines; pytest under `tests/api/`; `npm run test:api` after `source venv/bin/activate` (or ensure `.venv` on PATH).

## Commands you will need

| Purpose     | Command                                           | Expected  |
| ----------- | ------------------------------------------------- | --------- |
| API tests   | `source venv/bin/activate && npm run test:api`    | 109+ pass |
| Python lint | `source venv/bin/activate && npm run lint:python` | exit 0    |

## Scope

**In scope**:

- `api/routes/integrations.py` (webhook handler only)
- `tests/api/test_security_hardening.py` (or new focused test file)

**Out of scope**:

- WHOOP/Withings webhooks
- OAuth connect UI
- Changing public error message text to leak whether channel vs token failed in a new way (keep generic 403s)

## Steps

### Step 1: Fail closed

After reading `expected_channel` / `expected_token`:

```python
if not expected_channel or not expected_token:
    raise HTTPException(status_code=403, detail="Calendar webhook rejected.")
if channel_id != expected_channel:
    raise HTTPException(status_code=403, detail="Unknown calendar webhook channel.")
if channel_token != expected_token:
    raise HTTPException(status_code=403, detail="Invalid calendar webhook token.")
```

Prefer constant-time compare if a helper already exists in the codebase; otherwise equality is acceptable for random tokens of sufficient entropy.

**Verify**: `grep -n "expected_channel and" api/routes/integrations.py` → no conditional-only check that skips when empty

### Step 2: Tests

Add tests:

1. Connected calendar, **empty** sync channel/token → POST webhook → **403**, sync not invoked (mock).
2. Existing populated success case still **200**.
3. Wrong channel / wrong token still **403**.

Model after existing tests in `tests/api/test_security_hardening.py`.

**Verify**: `npm run test:api` includes new tests and all pass

### Step 3: Lint + index

**Verify**: `npm run lint:python` → exit 0  
Update `docs/plans/README.md` → 002 DONE

## Done criteria

- [ ] Empty expected credentials reject with 403
- [ ] New tests cover empty-state and mismatch
- [ ] `npm run test:api` exit 0
- [ ] No secrets or real tokens in tests (use fixtures)

## STOP conditions

- Webhook route moved/renamed — re-locate by searching `X-Goog-Channel-ID`
- Tests require live Google — STOP; use mocks only

## Maintenance notes

- Watch registration path must always persist non-empty channel_id + channel_token after a successful watch create; if registration fails, webhooks correctly reject until fixed.
