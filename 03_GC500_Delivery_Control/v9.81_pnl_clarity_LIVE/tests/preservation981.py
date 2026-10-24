#!/usr/bin/env python3
"""Author: Andrew Fisher. Compare private, frozen-record financial captures."""
import hashlib
import json
import sys
from pathlib import Path

base_path, candidate_path, page_path, output_path = map(Path, sys.argv[1:])
base, candidate = [json.loads(p.read_text()) for p in (base_path, candidate_path)]
sha = hashlib.sha256(page_path.read_bytes()).hexdigest()
checks = {
    "candidateHash": candidate["sha256"] == sha,
    "nativeVersion": base["nativeVersion"] == candidate["nativeVersion"],
    "nativeRecord": base["record"] == candidate["record"],
    "allFinancialModels": base["models"] == candidate["models"],
    "allOperationalProjections": base["preservation"] == candidate["preservation"],
    "recordUnchanged": candidate["recordUnchanged"],
    "noModelErrors": not candidate["errors"],
    "noPageErrors": not candidate["pageErrors"],
    "noConsoleErrors": not candidate["consoleErrors"],
    "noOperationalWrites": not candidate["blockedRequests"],
}
result = {
    "author": "Andrew Fisher", "sha256": sha, "pass": all(checks.values()),
    "checks": checks, "nativeVersion": candidate["nativeVersion"],
    "financialModels": len(candidate["models"]),
    "operationalProjections": len(candidate["preservation"]),
}
output_path.write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result))
assert result["pass"], "Financial or operational preservation failed"
