"""Author: Andrew Fisher. Exact-source guards for v10.21: refuses a wrong base and a repeat, every anchor found exactly
once, the two review blocks land at the end of DATA with every earlier DATA key byte for byte unchanged, the evidence
script is inserted once with the author line first, the footer moves to v10.21, and (optionally) the built page carries
each change.

    python3 tests/test_patch1021.py /path/to/live_v10.18.html [/path/to/built_v10.21.html]
"""
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from patch_v1021 import apply, BASE_SHA, DATA_TAIL, SCRIPT_ANCHOR, REPLACEMENTS, SOURCE, REVIEW

source = Path(sys.argv[1]).read_text()
built = Path(sys.argv[2]).read_text() if len(sys.argv) > 2 else None
checks = []


def ck(name, ok):
    assert ok, name
    checks.append(name)


def data_of(html):
    i = html.index('const DATA = ')
    j = html.index('\n', i)
    line = html[i + len('const DATA = '):j]
    assert line.endswith(';')
    return json.loads(line[:-1]), line


ck('input is the exact live v10.18 page', hashlib.sha256(source.encode()).hexdigest() == BASE_SHA)
ck('DATA tail anchor found once', source.count(DATA_TAIL) == 1)
ck('script anchor found once', source.count(SCRIPT_ANCHOR) == 1)
ck('footer anchor found once', source.count("+ ' · v10.18'") == 1)
ck('review blocks not already in the page', '"schedule_review1021"' not in source and '"infrastructure_review1021"' not in source and 'id="programme1021"' not in source)

review = json.loads(REVIEW.read_text())
patched = apply(source)

before, _ = data_of(source)
after, line_after = data_of(patched)
ck('DATA still parses', isinstance(after, dict))
ck('exactly two keys added to DATA', set(after) - set(before) == {'schedule_review1021', 'infrastructure_review1021'} and not (set(before) - set(after)))
ck('every earlier DATA key unchanged', all(after[k] == before[k] for k in before))
ck('schedule review block carried as written', after['schedule_review1021'] == review['schedule_review1021'])
ck('programme review block carried as written', after['infrastructure_review1021'] == review['infrastructure_review1021'])
ck('Schedule 7.1 recorded as applying nothing', after['schedule_review1021']['applied'] == [] and after['schedule_review1021']['changed_cells'] == 0)
ck('three programme rows, all CON WK 2, Complete, no date, nothing imported',
   [r['reference'] for r in after['infrastructure_review1021']['rows']] == ['GN13', 'P69', 'P45']
   and all(r['sourceSheet'] == 'CON WK 2' and r['statusAsWritten'] == 'Complete' and r['completeDateAsWritten'] is None and r['operationalCompletionImported'] is False for r in after['infrastructure_review1021']['rows'])
   and [r['cell'] for r in after['infrastructure_review1021']['rows']] == ['I101', 'I102', 'I103'])
ck('the three references already exist on the register (no asset invented)', {r['reference'] for r in after['infrastructure_review1021']['rows']} <= {a['key'] for a in after['assets']})
ck('register, unreferenced rows and plant lines unchanged in count', len(after['assets']) == len(before['assets']) and len(after['unreferenced']) == len(before['unreferenced']) and len(after['plant_lines']['lines']) == len(before['plant_lines']['lines']))
ck('DATA line is the old line plus the two blocks', line_after.startswith(_[:-len(DATA_TAIL)]) and line_after.endswith('}};'))

script = SOURCE.read_text().rstrip()
ck('script inserted once, after the v9.51 programme script', patched.count('<script id="programme1021">') == 1 and patched.index('<script id="infrastructure951">') < patched.index('<script id="programme1021">') < patched.index('<script id="inventory960-script">'))
ck('script first line carries the author', script.split('\n')[0].startswith('/* Author: Andrew Fisher.') and patched.count(script.split('\n')[0]) == 1)
ck('script wraps infrastructure951Html and imports nothing', 'infrastructure951Html=function(key)' in script and 'setPo' not in script and 'SYNC' not in script and 'fetch(' not in script)
with tempfile.TemporaryDirectory() as d:
    fn = Path(d) / 'programme1021.js'
    fn.write_text(script)
    r = subprocess.run(['node', '--check', str(fn)], capture_output=True, text=True)
    ck('script parses', r.returncode == 0)
ck('footer says v10.21', "+ ' · v10.21'" in patched and "+ ' · v10.18'" not in patched)
ck('no AI model names in the inserted source', not re.search(r'\b(Codex|Claude|Argon|Gemini)\b', script + REVIEW.read_text()))

for label, value in [('repeat application', patched), ('changed live source', source + '\n')]:
    try:
        apply(value)
        raise AssertionError(label + ' was not refused')
    except ValueError:
        checks.append(label + ' refused')

# everything outside the three anchors is byte for byte the same
rest_src = source.replace(DATA_TAIL, '').replace(SCRIPT_ANCHOR, '').replace("+ ' · v10.18'", '')
rest_new = re.sub(r'<script id="programme1021">\n.*?\n</script>\n', '', patched, count=1, flags=re.S).replace("+ ' · v10.21'", '')
# the blocks sit between the comma after the last v9.51 row and the "};" that closes DATA
i = rest_new.index('"schedule_review1021"'); j = rest_new.index('}};', i) + 3
rest_new = rest_new[:i - 1] + rest_new[j - 2:]
ck('nothing else in the page changed', rest_new.replace(DATA_TAIL, '').replace('</script>\n<script id="inventory960-script">', '') == rest_src)

if built is not None:
    ck('built page carries the footer', "+ ' · v10.21'" in built)
    ck('built page carries the two review blocks', '"schedule_review1021"' in built and '"infrastructure_review1021"' in built)
    ck('built page carries the evidence script once', built.count('<script id="programme1021">') == 1)
    bd, _ = data_of(built)
    ck('built page DATA parses with the three programme rows', [r['reference'] for r in bd['infrastructure_review1021']['rows']] == ['GN13', 'P69', 'P45'])
    ck('built page keeps the author credit', 'Author: Andrew Fisher' in built)

print(json.dumps({'author': 'Andrew Fisher', 'pass': True, 'checks': len(checks), 'names': checks, 'sourceSha256': hashlib.sha256(source.encode()).hexdigest(), 'candidateSha256': hashlib.sha256(patched.encode()).hexdigest(), 'candidateBytes': len(patched.encode()), 'builtSha256': hashlib.sha256(built.encode()).hexdigest() if built is not None else None}))
