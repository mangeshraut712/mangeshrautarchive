#!/usr/bin/env python3
"""Parse Cloudflare /accounts API JSON from stdin → 3 lines: status, account_id, error."""
import json
import sys

raw = sys.stdin.read()
try:
    data = json.loads(raw)
except Exception as exc:
    print("PARSE_ERR")
    print("")
    print(str(exc)[:120])
    raise SystemExit(0)

ok = bool(data.get("success"))
result = data.get("result") or []
account_id = result[0]["id"] if result else ""
errors = data.get("errors") or [{}]
err_msg = errors[0].get("message", "") if errors else ""
print("OK" if ok else "FAIL")
print(account_id)
print(err_msg[:200])
