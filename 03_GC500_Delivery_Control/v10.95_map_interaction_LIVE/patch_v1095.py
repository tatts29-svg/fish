#!/usr/bin/env python3
"""Author: Andrew Fisher. Map presentation follows the existing approved-pin rule."""
import hashlib
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep
from live_map1095 import apply as apply_live_map1095

BASE = '5f79b5f6c4ce953c3e69f7dfac939734f7176130808ec608715e8c23faf8cc79'


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Expected exactly one match: ' + old[:90])
    at = text.index(old)
    bounded = '@@V1095_BEGIN@@' + old + '@@V1095_END@@'
    replacement = rep(bounded, bounded, new, 'v10.95 exact replacement', 'page.html', True)
    if replacement != new:
        raise ValueError('Replacement boundary changed')
    return text[:at] + replacement + text[at + len(old):]


def patch(text, path='page.html'):
    if hashlib.sha256(text.encode()).hexdigest() != BASE:
        raise ValueError('Exact verified v10.94 predecessor hash required')
    if 'map-pin1095' in text:
        raise ValueError('v10.95 already applied')
    text = replace_once(text,
        ' const placed = a => MASTER_LOC[a.key] && MASTER_LOC[a.key].pt;',
        " /* map-pin1095: an approved site pin uses the existing latitude/longitude path, once per reference. */\n const placed = a => !andrewPin1084(a) && MASTER_LOC[a.key] && MASTER_LOC[a.key].pt;")
    text = replace_once(text,
        " const placedOn = allAssets().filter(a => !a._cancelled && !placed(a)).map(a => { const p = bestPinFor(a), q = p ? null : bestPlaceFor(a), f = p ? p.fix : q ? q.place : null;",
        " const placedOn = allAssets().filter(a => !a._cancelled && !placed(a)).map(a => { const ap = andrewPin1084(a), p = ap ? null : bestPinFor(a), q = ap || (p ? null : bestPlaceFor(a)), f = p ? p.fix : q ? q.place : null;")
    text = replace_once(text,
        "how: p ? 'pinned on the ground' : 'placed, not measured', by: f.by || '', at: f.at || ''} : null; }).filter(Boolean);",
        "how: ap ? 'Andrew’s pin · reference location' : p ? 'pinned on the ground' : 'placed, not measured', by: f.by || '', at: f.at || ''} : null; }).filter(Boolean);")
    text = replace_once(text,
        "  function mappedLocation(a) {\n    const m = typeof masterUnit === 'function' ? masterUnit(a.key) : null, master = point(m?.ll);",
        "  function mappedLocation(a) {\n    const approved = typeof andrewPin1084 === 'function' ? andrewPin1084(a) : null;\n    const site = point(approved ? [approved.place.lat, approved.place.lon] : null);\n    if (site) return {...site, kind: 'place', source: 'Andrew’s pin · reference location', approximate: true, areaOnly: false};\n    const m = typeof masterUnit === 'function' ? masterUnit(a.key) : null, master = point(m?.ll);")
    text = replace_once(text,
        '/* fencing-evidence-1071; Author: Andrew Fisher */',
        '<!-- fencing-evidence-1071; Author: Andrew Fisher -->')
    text = replace_once(text,
        "   if (!SNAP || !it || !it.code) return null;",
        "   if (!SNAP || !it || !it.code) return null;\n   if (typeof it.placedHow === 'string' && it.placedHow.startsWith('Andrew’s pin')) return null; /* map-pin1095: never imply the old footprint moved with a saved pin */")
    text = replace_once(text,
        "      visualNote: 'Equipment shape and height are illustrative unless a verified dimension is shown.'",
        "      visualNote: (quantity > 1 && location?.source === 'Andrew’s pin · reference location' ? 'Reference location; separate unit positions are not supplied to this view. ' : '') + 'Equipment shape and height are illustrative unless a verified dimension is shown.'")
    text = replace_once(text,
        "return {revision1021:gate6Revision1021(key)?.line,name: a.name || a.item || '', status: words[st] || st, statusColour: cols[st] || '#9aa3ad', img, pinned,assets: ItemOwnership969.text(a) || (a.asset_numbers || []).join(', '), open: true};",
        "/* map-pin1095: a reference pin does not place every physical unit at that point. */\n const approved1095 = andrewPin1084(a);\n if (approved1095 && typeof window.gc500MapStatus1009 === 'function') {\n  const quantities1095 = window.gc500MapStatus1009([key])?.states?.find(r => r.key === key)?.quantity?.items || [];\n  if (quantities1095.reduce((n, r) => n + (Number.isFinite(r.quantity) && r.quantity > 0 ? r.quantity : 0), 0) > 1) pinned = 'Reference location · individual units may be elsewhere.';\n }\nreturn {revision1021:gate6Revision1021(key)?.line,name: a.name || a.item || '', status: words[st] || st, statusColour: cols[st] || '#9aa3ad', img, pinned,assets: ItemOwnership969.text(a) || (a.asset_numbers || []).join(', '), open: true};")
    text = apply_live_map1095(text, replace_once)
    text = replace_once(text, ' · v10.94', ' · v10.95')
    return text


if __name__ == '__main__':
    if len(sys.argv) not in (2, 3):
        raise SystemExit('Usage: patch_v1095.py INPUT.html [OUTPUT.html]')
    source = pathlib.Path(sys.argv[1])
    target = pathlib.Path(sys.argv[2]) if len(sys.argv) == 3 else source
    target.write_text(patch(source.read_text(), str(source)))
