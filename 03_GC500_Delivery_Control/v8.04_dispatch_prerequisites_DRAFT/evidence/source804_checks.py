#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact-source protection and non-mutating patch guards."""
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
base, candidate = map(Path, sys.argv[1:3])
a, b = base.read_text(), candidate.read_text()
checks = []
def check(name, passed):
    checks.append({"name": name, "pass": bool(passed)})
def data(text):
    marker = "const DATA = "
    offset = text.index(marker) + len(marker)
    _, count = json.JSONDecoder().raw_decode(text[offset:])
    return text[offset:offset + count]

check("Canonical DATA bytes are unchanged by controls", data(a) == data(b))
check("Exact frozen component sources are embedded once", all(b.count((root / file).read_text()) == 1 for file in ["dispatch803_src.js", "sequence803_src.js"]))
check("Release advances once from v8.03 to v8.04", a.count('<meta name="gc500-release" content="v8.03">') == 1 and b.count('<meta name="gc500-release" content="v8.04">') == 1)
with tempfile.TemporaryDirectory() as temp:
    target = Path(temp) / "candidate.html"
    target.write_text(a)
    run = subprocess.run([sys.executable, str(root / "patch_v804.py"), str(target)], capture_output=True, text=True)
    check("Applying guarded patch to official v8.03 reproduces exact candidate", run.returncode == 0 and target.read_bytes() == candidate.read_bytes())
    saved = target.read_bytes()
    run = subprocess.run([sys.executable, str(root / "patch_v804.py"), str(target)], capture_output=True, text=True)
    check("Repeat application is rejected without writing", run.returncode != 0 and "already applied" in run.stderr and target.read_bytes() == saved)
    target.write_text(a.replace("function cw2Plan803(", "function wrongPlan803(", 1))
    saved = target.read_bytes()
    run = subprocess.run([sys.executable, str(root / "patch_v804.py"), str(target)], capture_output=True, text=True)
    check("Missing plan prerequisite is rejected without writing", run.returncode != 0 and "requires" in run.stderr and target.read_bytes() == saved)
result = {"baseSha256": hashlib.sha256(base.read_bytes()).hexdigest(), "candidateSha256": hashlib.sha256(candidate.read_bytes()).hexdigest(), "checks": checks}
(root / "evidence" / "source804_checks.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result))
raise SystemExit(0 if all(x["pass"] for x in checks) else 1)
