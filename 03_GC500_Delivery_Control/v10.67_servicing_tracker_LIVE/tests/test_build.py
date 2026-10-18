#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact v10.67 build boundaries; private pages stay outside Git.

python3 tests/test_build.py BASE_V1066 CANDIDATE_V1067
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("servicing_patch1067", HERE / "patch_v1067.py")
patcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patcher)
base = Path(sys.argv[1]).read_text()
candidate = Path(sys.argv[2]).read_text()
passed = 0


def check(label, condition):
    global passed
    if not condition:
        raise AssertionError(label)
    passed += 1
    print("PASS " + label)


check("candidate is the exact output of the current guarded patch", patcher.patch(base) == candidate)
for label, source in [("repeat", candidate), ("wrong predecessor", base.replace("+ ' · v10.66'; /* v8.19 release922", "+ ' · v10.65'; /* v8.19 release922"))]:
    try:
        patcher.patch(source)
    except ValueError:
        refused = True
    else:
        refused = False
    check(label + " application is refused", refused)

script_re = re.compile(r"<script\b[^>]*>[\s\S]*?</script>", re.I)
before = script_re.findall(base)
after_all = script_re.findall(candidate)
added = [s for s in after_all if s.startswith('<script id="svc1067-script">')]
after = [s for s in after_all if not s.startswith('<script id="svc1067-script">')]
check("exactly one servicing script is added; existing script order is preserved", len(added) == 1 and len(after) == len(before))
changed = [i for i, (a, b) in enumerate(zip(before, after)) if a != b]
main = [i for i, s in enumerate(before) if 'const DATA = {' in s and 'function syncBoot(' in s]
check("only the native main script changes; every other script is byte-identical", len(main) == 1 and changed == main)
data_re = re.compile(r"^const DATA = (\{.*\});?$", re.M)
check("embedded operational/source DATA is byte-identical", data_re.search(before[main[0]]).group(1) == data_re.search(after[main[0]]).group(1))
style_re = re.compile(r"<style\b[^>]*>[\s\S]*?</style>", re.I)
after_style = style_re.findall(candidate)
check("existing styles are byte-identical with one scoped servicing addition", len([s for s in after_style if s.startswith('<style id="svc1067-style">')]) == 1 and [s for s in after_style if not s.startswith('<style id="svc1067-style">')] == style_re.findall(base))
check("embedded template contains no fixture contact or token", not any(s in added[0] for s in ["Fixture supervisor", "Local fixture supervisor", "local-edit-panel-integration", "local-fixture-token-"]))
card_bundle = json.loads(re.search(r"^var SVC1067_CARD=(.*);$", added[0], re.M).group(1))
builder = """const B=require(process.argv[1]),D=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
const data=B.cardData(D),html=B.buildCardHtml(D),mark='var D = '+B.scriptJson(data)+';';
if(html.split(mark).length!==2)throw new Error('card data marker must be unique');
process.stdout.write(JSON.stringify({data,html:html.replace(mark,'var D = /*SVC1067_DATA*/null;')}));"""
expected_card = json.loads(subprocess.check_output(["node", "-e", builder,
    str(patcher.TRACK / "card/build_card.js"), str(patcher.TRACK / "tracker_data.json")], text=True))
check("decoded crew template and data exactly match the current card builder", card_bundle == expected_card)
with tempfile.TemporaryDirectory() as tmp:
    test_page = Path(tmp) / "candidate.html"
    test_page.write_text(candidate)
    subprocess.run([sys.executable, str(HERE.parent / "toolchain/scrub_attributions.py"), str(test_page)], check=True, stdout=subprocess.DEVNULL)
    check("standard publisher attribution scrub leaves the exact candidate unchanged", test_page.read_text() == candidate)

print(json.dumps({"author": "Andrew Fisher", "passed": passed, "failed": 0,
    "base_sha256": hashlib.sha256(base.encode()).hexdigest(),
    "candidate_sha256": hashlib.sha256(candidate.encode()).hexdigest(),
    "allowed_existing_script_index": main[0], "added_script_id": "svc1067-script",
    "added_style_id": "svc1067-style"}))
