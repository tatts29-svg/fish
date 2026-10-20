"""Author: Andrew Fisher. Exact predecessor/build and source preservation guards."""
import hashlib
import json
import pathlib
import re
import sys
import patch_v1094 as patcher

base = pathlib.Path(sys.argv[1]).read_text()
candidate = pathlib.Path(sys.argv[2]).read_text()
checks = 0
assert hashlib.sha256(base.encode()).hexdigest() == patcher.BASE
checks += 1
assert patcher.patch(base) == candidate, "Candidate differs from exact source reproduction"
checks += 1
for value in [base + " ", candidate]:
    try:
        patcher.patch(value)
    except ValueError:
        checks += 1
    else:
        raise AssertionError("Wrong/repeated predecessor was accepted")
prior = patcher.BASE
try:
    patcher.BASE = hashlib.sha256(candidate.encode()).hexdigest()
    try:
        patcher.patch(candidate)
    except ValueError:
        checks += 1
    else:
        raise AssertionError("Repeated application was accepted")
finally:
    patcher.BASE = prior

def data(text):
    match = re.search(r"\bconst DATA\s*=\s*", text)
    assert match, "Embedded source declaration missing"
    _, end = json.JSONDecoder().raw_decode(text, match.end())
    return text[match.end():end]

assert data(base) == data(candidate), "Original source records, quotes, media or historical team changed"
checks += 1
def protected(text):
    return {m.group(1): m.group(0) for m in re.finditer(
        r'<script\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?</script>', text)
        if re.search(r"svc1067|servicing|tracker", m.group(1), re.I)}

assert protected(base), "Expected servicing/tracker scripts missing"
assert protected(base) == protected(candidate), "Servicing/tracker bytes changed"
checks += 1
assert len(re.findall(r"<script\b", base)) == len(re.findall(r"<script\b", candidate))
checks += 1
assert candidate.count(" · v10.94") == 1 and " · v10.93" not in candidate
checks += 1
print(json.dumps({"pass": True, "checks": checks, "originalSourceUnchanged": True,
                  "servicingTrackerUnchanged": True, "candidateSha256": hashlib.sha256(candidate.encode()).hexdigest()}))
