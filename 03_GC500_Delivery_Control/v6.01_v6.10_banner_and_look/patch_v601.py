#!/usr/bin/env python3
"""v6.01 - T0024 IS THE COATES COMPOUND TOILET, AND THE COATES WAY CARD KEEPS TO THE MACHINE (26 Sep 2026).

Andrew Fisher, 26 Sep 2026: "toilet is for Coates compound no charge. reference it to Coates compound." T0024 (Week 5,
15 Sep 2026, one FWF toilet, no asset number on the schedule) is Coates' own compound toilet, not charged to the customer.
The record now says so where the page reads it: the schedule row's location and note (orphan_rows, unreferenced, the plant
line's event), the ops row's delivery (on site at the Coates compound, the basis in the note) and the 15 Sep cancellation
note ("comes off for good ... looks like a mis-delivery") withdrawn, which the delivery note says. Nothing else about the
row changes: it still has no asset number, and no FWF rate exists, so no charge is computed for it anywhere.

Also: the two map buttons (Plan on satellite, 3D proof) leave the Coates Way machine card - they belong to the Map tab.

  python3 patch_v601.py <page.html> [builder.py] [ops_layer.json] [print_dataset.json]
"""
import json, re, sys

page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None
ops_json = sys.argv[3] if len(sys.argv) > 3 else None; dataset_json = sys.argv[4] if len(sys.argv) > 4 else None
WHO, ON, AT = 'Andrew Fisher', '2026-09-26', '2026-09-26T00:00:00+10:00'
LOCATION = 'Coates compound'
NOTE = ("Coates' own compound toilet - no charge to the customer (Andrew Fisher, 26 Sep 2026). Delivered 15 Sep 2026 on docket "
        "26064235, rental contract 9968929-KINP. The 15 Sep note that it came off as a mis-delivery is withdrawn.")

def fix_schedule(obj):
    n = 0
    def walk(o):
        nonlocal n
        if isinstance(o, dict):
            if o.get('task_id') == 'T0024' and 'sheet' in o and 'item' in o:
                o['location'] = LOCATION
                if 'notes' in o: o['notes'] = NOTE
                if 'note' in o: o['note'] = NOTE
                n += 1
            for v in o.values(): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(obj); return n

def fix_ops(ops):
    rows = [r for r in ops['rows'] if r.get('key') == 'T0024']; assert len(rows) == 1, 'T0024 ops row'
    d = rows[0]['delivery']
    d.update({'state': 'on site', 'light': 'green', 'recorded': True, 'set_at': AT, 'by': WHO, 'note': NOTE})
    d['history'] = list(d.get('history') or []) + [{'state': 'on site', 'at': AT, 'by': WHO}]
    before = len(ops['cancelled_rows'])
    ops['cancelled_rows'] = [c for c in ops['cancelled_rows'] if c.get('task_id') != 'T0024']
    assert len(ops['cancelled_rows']) == before - 1, 'the T0024 cancellation was not there'
    return True

# 1. the page's DATA
s = open(page, encoding='utf-8').read(); bom = s.startswith('﻿'); s = s.lstrip('﻿'); n0 = len(s)
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';')
obj = json.loads(line[len('const DATA = '):-1])
assert json.dumps(obj, ensure_ascii=False, separators=(',', ':')) == line[len('const DATA = '):-1], 'DATA would not re-serialise byte for byte'
n = fix_schedule(obj); assert n >= 3, n
fix_ops(obj['ops'])
s = s[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
print('DATA: schedule rows touched', n, '· T0024 on site at the Coates compound · cancellation withdrawn')

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

OLD_BTN = """<button class="btn primary" id="cwOpenMachine" type="button"${DATA.edition === 'hosted' ? '' : ' hidden'}>Open the machine</button>${DATA.edition === 'hosted' ? '<button class="btn ghost" type="button" data-mopen="explorer">Plan on satellite</button><button class="btn ghost" type="button" data-mopen="proof3d">3D proof</button>' : ''}"""
NEW_BTN = """<button class="btn primary" id="cwOpenMachine" type="button"${DATA.edition === 'hosted' ? '' : ' hidden'}>Open the machine</button>   /* v6.01 - the plan-on-satellite and 3D-proof buttons live on the Map tab only */"""
s = rep(s, OLD_BTN, NEW_BTN, 'card buttons')
open(page, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('page ok', n0, '->', len(s))

if builder:
    b = open(builder, encoding='utf-8').read(); n0 = len(b)
    b = rep(b, OLD_BTN, NEW_BTN, 'builder card buttons')
    open(builder, 'w', encoding='utf-8').write(b); print('builder ok', n0, '->', len(b))
if ops_json:
    o = json.load(open(ops_json, encoding='utf-8')); fix_ops(o); json.dump(o, open(ops_json, 'w', encoding='utf-8'), indent=1, ensure_ascii=False); print('ops_layer.json ok')
if dataset_json:
    d = json.load(open(dataset_json, encoding='utf-8')); n = fix_schedule(d); json.dump(d, open(dataset_json, 'w', encoding='utf-8'), indent=1, ensure_ascii=False); print('print_dataset.json rows touched', n)
