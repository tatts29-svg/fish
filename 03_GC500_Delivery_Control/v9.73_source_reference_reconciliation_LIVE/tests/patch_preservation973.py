#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent approved-source-delta and fail-closed patch checks.

Runs only on temporary local copies; never contacts or writes the service.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile

p = argparse.ArgumentParser()
p.add_argument('--base', required=True)
p.add_argument('--candidate', required=True)
p.add_argument('--expected-sha', required=True)
p.add_argument('--output', required=True)
a = p.parse_args()
base_raw = Path(a.base).read_bytes()
final_raw = Path(a.candidate).read_bytes()
base = base_raw.decode('utf-8-sig')
final = final_raw.decode('utf-8-sig')
patch = Path(__file__).resolve().parents[1] / 'patch_v973.py'
checks = []
def check(name, value):
    checks.append({'name': name, 'pass': bool(value)})

check('exact frozen candidate', hashlib.sha256(final_raw).hexdigest() == a.expected_sha)
check('exact live predecessor footer', " · v9.71'; /* v8.19" in base)
check('new footer once', final.count(" · v9.73'; /* v8.19") == 1)
check('one appended reference script', final.count('id="source-reference973-script"') == 1)
pattern = r'\n<script id="source-reference973-script">\n[\s\S]*?\n</script>(?=\n</body>\n</html>\s*$)'
restored, n = re.subn(pattern, '', final)
restored = restored.replace(" · v9.73'; /* v8.19", " · v9.71'; /* v8.19")
identity_hook = "const result973=Ownership944.model({ref:a.key,rows,groups});return typeof window!=='undefined'&&window.Identities973?window.Identities973.project(a,result973,window.Identities973.context(a)):result973;"
check('exact approved identity projection hook once', restored.count(identity_hook) == 1)
restored = restored.replace(identity_hook, 'return Ownership944.model({ref:a.key,rows,groups});')
approved_reference_hooks = [
    (' const readsAsEquipment = !!text && hasDim && inDesc;\n return {', ' const readsAsEquipment = !!text && hasDim && inDesc;\n const destination973 = {'),
    (' moved: moved,\n };\n}\n/* Kept for every renderer', " moved: moved,\n };\n return typeof window!=='undefined'&&window.Reference973?window.Reference973.destination(a,destination973):destination973;\n}\n/* Kept for every renderer"),
    ('function text747Where(a){\n', "function text747Where(a){\n const place973=typeof window!=='undefined'&&window.Reference973?window.Reference973.sourcePlace(a):null;if(place973)return ['Destination: '+place973.label+'.'];\n"),
    ('  return {id,key:id,ref:a?.key||id,recordRef:', '  const resolved973={id,key:id,ref:a?.key||id,recordRef:'),
    ("sourceRow:row};\n }\n function rows(ctx){", "sourceRow:row};\n  return typeof window!=='undefined'&&window.Reference973?window.Reference973.projectRow(row,resolved973,c):resolved973;\n }\n function rows(ctx){"),
    ("<td data-label=\"Destination\">'+esc(r.location||r.required)+'</td>", "<td data-label=\"Destination\">'+(typeof referenceLocation973Html==='function'?referenceLocation973Html(r):esc(r.location||r.required))+'</td>"),
    ("<td data-label=\"Destination / link\">'+esc(r.location||r.required)+'</td>", "<td data-label=\"Destination / link\">'+(typeof referenceLocation973Html==='function'?referenceLocation973Html(r):esc(r.location||r.required))+'</td>"),
]
for name, prefix, result in [('dest782', ' if (!a) return null;\n', 'null'), ('noDrop782', ' if (!a || a.key === REPORT_REF782) return false;\n', 'false'), ('aerialPointFor', '', 'null'), ('text747WayIn', '', "''")]:
    old = 'function ' + name + '(a){\n' + prefix
    approved_reference_hooks.append((old, old + " if(typeof window!=='undefined'&&window.Reference973&&window.Reference973.suppressNavigation(a))return " + result + ';\n'))
for index, (old, new) in enumerate(approved_reference_hooks):
    check('approved source reference hook ' + str(index + 1) + ' once', restored.count(new) == 1)
    restored = restored.replace(new, old)
# rep() consumes the first indentation space following these insertion anchors.
# Permit exactly these five formatting effects, not arbitrary source whitespace.
for fragment in [
    'function noDrop782(a){\n if (!a || a.key === REPORT_REF782) return false;\nif (descLoc782(a)) return false;',
    'function dest782(a){\n if (!a) return null;\nif (!movedFor(a)) {',
    'function text747Where(a){\nconst D7 = dest782(a);',
    'function text747WayIn(a){\n{ const R = report782(a);',
    'function aerialPointFor(a){\nif (movedFor(a)) return null;',
]:
    prefix, suffix = fragment.rsplit('\n', 1)
    restored = restored.replace(fragment, prefix + '\n ' + suffix)
check('original page source preserved apart from approved hooks, footer, module and five indent spaces', n == 1 and restored.strip() == base.strip())
check('original BOM retained', final_raw.startswith(b'\xef\xbb\xbf') == base_raw.startswith(b'\xef\xbb\xbf'))

with tempfile.TemporaryDirectory(prefix='gc500-973-guards-') as d:
    dest = Path(d) / 'page.html'
    failures = {
        'repeat application refuses without mutation': final_raw,
        'wrong predecessor refuses without mutation': base_raw.replace(b'v9.71\'; /* v8.19', b'v9.70\'; /* v8.19', 1),
        'missing shared reference API refuses without mutation': base_raw.replace(b'const Reference966 =', b'const OtherRef966 =', 1),
        'missing shared Questions API refuses without mutation': base_raw.replace(b'const Questions967=', b'const OtherQuestions967=', 1),
        'missing physical identity hook refuses without mutation': base_raw.replace(b'return Ownership944.model({ref:a.key,rows,groups});', b'return Ownership944.model({ref:a.key,rows,groups,changed:true});', 1),
        'missing closing insertion anchor refuses without mutation': base_raw.replace(b'</body>\n</html>', b'</body>\n<!-- shifted -->\n</html>'),
        'ambiguous closing insertion anchor refuses without mutation': base_raw + b'\n</script>\n</body>\n</html>\n',
    }
    for name, raw in failures.items():
        dest.write_bytes(raw)
        run = subprocess.run([sys.executable, str(patch), str(dest)], capture_output=True, text=True)
        check(name, run.returncode != 0 and dest.read_bytes() == raw)

report = {'author': 'Andrew Fisher', 'release': 'v9.73', 'baseSha256': hashlib.sha256(base_raw).hexdigest(),
          'sha256': hashlib.sha256(final_raw).hexdigest(), 'checks': checks,
          'pass': all(c['pass'] for c in checks), 'liveWrites': 0}
Path(a.output).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'pass': report['pass'], 'checks': len(checks), 'failed': [c['name'] for c in checks if not c['pass']]}))
raise SystemExit(0 if report['pass'] else 1)
