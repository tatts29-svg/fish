"""Author: Andrew Fisher. v11.35 - three page changes for race morning, 23 Oct 2026:

1. The twin-steer ask before printing is off. Andrew: "every time we want to print things we get asked for the twin steer
   can we remove this now." The red banner stays, the rule still stamps every PDF page; the tick dialog, the Ctrl+P hold,
   the print-button hold and the compulsory checklist box no longer ask.
2. The Build tab shows no day cards from 23 Oct 2026. Andrew: "in build we dont want any cards past and from 23/10/26."
   The calendar itself (routes, the Change tab, prints) is untouched; only the Build tab's day strip and agenda stop at 22 Oct.
3. Coates on time refreshed from the delivery texts exported 22 Oct 2026 04:57 (384 texts, 8 Sep to 21 Oct 12:21):
   126 units, 18 of them 19 to 22 Oct (the page held the 16 Oct export, 112 units, nothing after Thursday 16 Oct).
   Andrew: "I also sent you list of deliveries sms times this has not been updated on any build data cards we should
   show a percentage. There is nothing from monday this week." The percentage row and More info already exist on every
   past Build day card (v10.58); they now have Monday 19 to Wednesday 22 Oct to show.

    python3 patch_v1135.py page.html      (in place, on the live v11.34 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
UNITS = HERE / 'ontime1135_units.json'
DATA_HEAD = " const D = W.document, T = "
DATA_TAIL = ", U = Array.isArray(T.units) ? T.units : [];"


def data_patch(page_text):
    i = page_text.index(DATA_HEAD) + len(DATA_HEAD)
    j = page_text.index(DATA_TAIL, i)
    old = page_text[i:j]
    data = json.loads(UNITS.read_text(encoding='utf-8'))
    data.pop('author', None)
    if data.get('export_day') != '2026-10-22' or len(data.get('units') or []) != 126: raise ValueError('the units file is not the 22 Oct rebuild')
    new = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    return ('ontime: the units rebuilt from the 22 Oct export', DATA_HEAD + old + DATA_TAIL, DATA_HEAD + new + DATA_TAIL)


REPLACEMENTS = [
    ('twin-steer: the ask is off', "const armed = () => Date.now() < G.until;",
     "const armed = () => true; /* v11.35 - the ask before printing is off (Andrew, 23 Oct 2026: \"every time we want to print things we get asked for the twin steer can we remove this now\"); the banner and the PDF stamp stay */"),
    ('twin-steer: the compulsory checklist box is off', "if (typeof checks826 === 'function') { const b = checks826; checks826 = function(m){ const C = (b.apply(this, arguments) || []).slice(); if (!C.some(c => c.id === CHECK_ID)) C.unshift({id: CHECK_ID,",
     "if (false && typeof checks826 === 'function') { /* v11.35 - off with the ask */ const b = checks826; checks826 = function(m){ const C = (b.apply(this, arguments) || []).slice(); if (!C.some(c => c.id === CHECK_ID)) C.unshift({id: CHECK_ID,"),
    ('build: no day cards from 23 Oct 2026', " const days = calendarDays();\n const discs = [...new Set(allAssets().map(a => a.discipline))].sort();",
     " const days = calendarDays().filter(d => d.iso < '2026-10-23'); /* v11.35 - the Build tab stops at 22 Oct 2026 (Andrew, 23 Oct 2026: \"in build we dont want any cards past and from 23/10/26\") */\n const discs = [...new Set(allAssets().map(a => a.discipline))].sort();"),
    ('release footer', "+' · v11.34'; /* v8.19 release922", "+' · v11.35'; /* v8.19 release922"),
]


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.35 requires the live v11.34 page ' + BASE_SHA256)
    if 'const armed = () => true;' in html: raise ValueError('v11.35 already applied')
    for what, old, new in [data_patch(html)] + REPLACEMENTS:
        html = rep(html, old, new, what, 'page')
    for needle, n in [('const armed = () => true;', 1), ("if (false && typeof checks826 === 'function')", 1), ("calendarDays().filter(d => d.iso < '2026-10-23')", 1), ('"export_day":"2026-10-22"', 1), ('"export_day":"2026-10-16"', 0)]:
        if html.count(needle) != n: raise ValueError('v11.35 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1135 applied: twin-steer ask off, Build stops at 22 Oct, Coates on time from the 22 Oct export; footer v11.34 -> v11.35')
