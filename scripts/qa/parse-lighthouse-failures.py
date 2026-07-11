import json

with open("artifacts/lighthouse/lighthouse-mobile.json", "r") as f:
    report = json.load(f)

for key in ["lcp-breakdown-insight", "lcp-discovery-insight"]:
    if key in report["audits"]:
        print(f"=== {key} ===")
        print(json.dumps(report["audits"][key], indent=2)[:3000])
