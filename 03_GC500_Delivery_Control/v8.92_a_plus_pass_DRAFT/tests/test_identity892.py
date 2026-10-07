#!/usr/bin/env python3
"""Author: Andrew Fisher. v8.92 changes presentation, speed and words only. DATA (the record the page ships with), MASTER_LOC
(every navigation pin, its directions and its words) and the Event Portables plan constant are byte-identical to the base.
    python3 test_identity892.py <base page> <candidate page>"""
import json, re, sys
from pathlib import Path

def read(path):
    s = Path(path).read_text()
    data = re.search(r'const DATA = (\{.*?\});\n', s).group(1)
    m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); ml, end = json.JSONDecoder().raw_decode(s[m.end():])
    ep = re.search(r'const EP886 = (\{.*?\});', s)
    return s, data, ml, ep.group(1) if ep else None

(bs, bd, bl, be), (cs, cd, cl, ce) = read(sys.argv[1]), read(sys.argv[2])
fails = []
if bd != cd: fails.append('DATA differs')
if bl != cl: fails.append('MASTER_LOC (navigation pins, directions) differs')
if be != ce: fails.append('EP886 (Event Portables load days) differs')
# the pins' own text is untouched: every "how", "near", "sms" and "words" string in MASTER_LOC is the same
for k in bl:
    for f in ('ll', 'how', 'near', 'sms', 'words', 'pt'):
        if bl[k].get(f) != (cl.get(k) or {}).get(f): fails.append(f'pin {k}.{f} differs'); break
print(f'base DATA {len(bd):,} chars, MASTER_LOC {len(bl)} pins; candidate DATA {len(cd):,} chars, MASTER_LOC {len(cl)} pins')
print('\n'.join('FAIL ' + f for f in fails) if fails else 'PASS DATA, MASTER_LOC and EP886 identical to the base')
sys.exit(1 if fails else 0)
