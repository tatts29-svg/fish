"""Author: Andrew Fisher. Exact release composition and original-source preservation."""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
base, candidate = (Path(p).read_text() for p in sys.argv[1:3])
checks = []

def check(name, passed):
    checks.append({"name": name, "pass": bool(passed)})

def data(text):
    start = text.index("const DATA = ") + len("const DATA = ")
    value, length = json.JSONDecoder().raw_decode(text[start:])
    return value, text[start:start + length]

spec = importlib.util.spec_from_file_location("release1013", here / "patch_v1013.py")
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
check("Exact original live base", hashlib.sha256(base.encode()).hexdigest() == patch.BASE_SHA)
check("Original embedded data retained byte for byte", data(base)[1] == data(candidate)[1])
check("Original event agreement retained", data(base)[0]["charge_basis"] == data(candidate)[0]["charge_basis"])
for marker in ('id="finance1013-script"', 'id="flows1013-script"', 'const EventConfig1013 = ', 'root.Information1013='):
    check("One installed component: " + marker, candidate.count(marker) == 1)
check("Current release footer", "+ ' · v10.13'" in candidate and "+ ' · v10.12'" not in candidate)
for name, page in (("Repeat application refused", candidate), ("Wrong base refused", base + "\n")):
    try:
        patch.apply(page)
        check(name, False)
    except ValueError:
        check(name, True)
sources = {}
for pattern in ("*/patch_*.py", "*/*1013.js", "information/presentation_replacements1013.json", "patch_v1013.py"):
    for path in sorted(here.glob(pattern)):
        sources[str(path.relative_to(here))] = hashlib.sha256(path.read_bytes()).hexdigest()
report = {
    "author": "Andrew Fisher", "baseSha256": patch.BASE_SHA,
    "candidateSha256": hashlib.sha256(candidate.encode()).hexdigest(),
    "bytes": len(candidate.encode()), "sourceHashes": sources,
    "checks": checks, "pass": all(c["pass"] for c in checks),
}
print(json.dumps(report, indent=2))
if not report["pass"]:
    sys.exit(1)
