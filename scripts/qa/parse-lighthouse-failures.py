import json

with open("ci-artifacts/lighthouse/lighthouse-mobile.json", "r") as f:
    report = json.load(f)

print("=== CATEGORIES ===")
for cat, data in report["categories"].items():
    print(f"{cat}: {data['score'] * 100}")

print("\n=== ACCESSIBILITY AUDITS WITH SCORE < 1.0 ===")
for audit_id, audit in report["audits"].items():
    cat_audits = report["categories"]["accessibility"]["auditRefs"]
    cat_ids = [ref["id"] for ref in cat_audits]
    if audit_id in cat_ids and audit.get("score") is not None and audit["score"] < 1.0:
        print(f"[{audit_id}] - {audit['title']}: {audit['score']} (Explanation: {audit.get('explanation', 'None')})")
        if audit.get("details", {}).get("items"):
            for item in audit["details"]["items"]:
                print("  - Selector:", item.get("node", {}).get("selector"))
                print("    Node Label:", item.get("node", {}).get("nodeLabel"))
                print("    Explanation:", item.get("node", {}).get("explanation"))
