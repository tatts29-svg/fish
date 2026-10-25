"""Author: Andrew Fisher. Include standalone received VMS installation once.

Existing shared charge calculations and source/record data remain authoritative.
The adapter supplies installation only, without extending hire or freight scope.
"""
import hashlib
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, os.path.join(HERE, '..', 'toolchain'))
from rep import rep

BASE = '2db3457f12692ccd660de48b6c134d964827e27c3a4be976b482f12edbccc9b2'
MARKER = '<script id="vms-installation1228-script">'

EDITS = [
    ('shared labour slots',
     "  const zero=()=>({charged:0,expected:0,tocome:0,later:0,n:{charged:0,expected:0,tocome:0,later:0},unpriced:0});",
     "  slots.push(...VmsInstallation1228.model().slots);\n  const zero=()=>({charged:0,expected:0,tocome:0,later:0,n:{charged:0,expected:0,tocome:0,later:0},unpriced:0});"),
    ('shared customer labour charge',
     " let labour = 0, labourTicks = 0, labourUnknown = 0, cardHire = 0, cardTransportCharge = 0, cardTransportCost = 0;",
     " const standalone1228=VmsInstallation1228.model();\n let labour = standalone1228.total, labourTicks = standalone1228.slots.length, labourUnknown = standalone1228.unknown, cardHire = 0, cardTransportCharge = 0, cardTransportCost = 0;"),
    ('shared installation and branch totals',
     " const r = v => Math.round(v * 100) / 100;\n ['install', 'cleaning', 'fire_ext', 'other'].forEach(k => { out[k].amount = r(out[k].amount); }); out.total = r(out.total);",
     " VmsInstallation1228.model().slots.forEach(s=>add('install',s.branch,s.value));\n const r = v => Math.round(v * 100) / 100;\n ['install', 'cleaning', 'fire_ext', 'other'].forEach(k => { out[k].amount = r(out[k].amount); }); out.total = r(out.total);"),
    ('received installation coverage',
     " const model=OnsiteComplete979.project(items,cj764Model().buildingTransport.rows),waiver=pl770Model().rev.find(r=>String(r.code)==='1015');",
     " items.push(...VmsInstallation1228.coverageItems());\n const model=OnsiteComplete979.project(items,cj764Model().buildingTransport.rows),waiver=pl770Model().rev.find(r=>String(r.code)==='1015');"),
    ('shared pricing review',
     " window.workPricing1007=function(){return heldMemo('workPricing1007',()=>holdAssets(()=>allAssets().flatMap(a=>chargeLines(a).map(l=>workGap1007(a,l)).filter(Boolean))));};",
     " window.workPricing1007=function(){return heldMemo('workPricing1007',()=>holdAssets(()=>allAssets().flatMap(a=>chargeLines(a).map(l=>workGap1007(a,l)).filter(Boolean)).concat(VmsInstallation1228.model().issues)));};"),
    ('release footer', "+' · v12.27'; /* v8.19 release922", "+' · v12.28'; /* v8.19 release922"),
]


def patch(text):
    if MARKER in text:
        raise ValueError('v12.28 standalone VMS installation is already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE:
        raise ValueError('Expected the verified v12.27 live source; fetch, rebuild and retest')
    if 'RaceCrew1227' not in text:
        raise ValueError('The preceding release is missing')
    for label, old, new in EDITS:
        text = rep(text, old, new, label, 'GC500 page')
    source = (HERE / 'vms_installation1228_src.js').read_text(encoding='utf-8').rstrip()
    # Loaded before any later render can use the patched financial functions.
    anchor = '<script id="charge1006-script">'
    text = rep(text, anchor, MARKER+'\n'+source+'\n</script>\n'+anchor,
               'shared standalone installation model', 'GC500 page')
    return text


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(patch(path.read_text(encoding='utf-8')), encoding='utf-8')
    print('v12.28 installation coverage applied; existing hire, freight and records retained')
