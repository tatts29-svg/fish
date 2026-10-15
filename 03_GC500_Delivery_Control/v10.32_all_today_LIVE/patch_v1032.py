"""Author: Andrew Fisher. Every outstanding portaloo is proposed for today, v10.32. Andrew, 16 Oct 2026: "No FWF loads
on Saturday. For toilets, loads of 24, so we do the max on. Stop deciding." The run sheet no longer keeps a supplier
plan date that is after today: every portaloo still to come is proposed for today, packed into loads of 24 in route
order (the page's own pack()). The schedule's and the plan's dates stay on each row as its source. Nothing is written to
the record. And the labour a thing carries follows what it is (Andrew, 16 Oct 2026): an FWF gets an install and a demob;
a toilet block install, level, steps, clean, demob; a waste tank install, level, clean, demob; a building install, level,
steps, clean, demob, with the fire extinguisher and any accessory Andrew's own per-building tick. The card prices the
lines; this says which of them the thing carries, on every tab. Footer v10.31 -> v10.32.

    python3 patch_v1032.py path/to/page.html   (on the live v10.31)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

REPLACEMENTS = [
    ('Every outstanding portaloo is proposed for today', "if(date(asAt)&&day<asAt)day=asAt;",
     "if(date(asAt))day=asAt; /* v10.32 - every portaloo still to come is proposed for today, loads of 24 (Andrew, 16 Oct 2026: \"No FWF loads on Saturday … loads of 24, so we do the max on\") */"),
    ('Labour by what the thing is', "function labourLinesFor(ref, disc, item, key, unit, asset){ const r = labourLinesFor914base(ref, disc, item, key, unit, asset);",
     "function labourLinesFor(ref, disc, item, key, unit, asset){ const r = labourLinesFor914base(ref, disc, item, key, unit, asset);\n  const keep1032 = labourKeep1032(item); if (keep1032) { const kept = (r.lines || []).filter(L => keep1032.has(L.key)); r.withheld = (r.withheld || []).concat((r.lines || []).filter(L => !kept.includes(L)).map(L => L.name)); r.lines = kept; r.priced = kept.length; }"),
    ('The rule in one place', "function labourLinesFor914base(ref, disc, item, key, unit, asset){",
     "/* v10.32 - the labour a thing carries, in Andrew's words (16 Oct 2026): an FWF gets an install and a demob; a toilet block install, level, steps, clean, demob; a waste tank install, level, clean, demob; a building install, level, steps, clean, demob, with the fire extinguisher and any accessory his own per-building tick. The card prices the lines; this says which of them the thing carries. */\nfunction labourKeep1032(item){ const s = String(item || '').trim(); if (/^FWF$/i.test(s)) return new Set(['install', 'demob']); if (/waste\\s*tank|holding\\s*tank|sewage/i.test(s)) return new Set(['install', 'levelling', 'cleaning', 'demob']); if (/block/i.test(s)) return new Set(['install', 'levelling', 'steps', 'cleaning', 'demob']); return null; }\nfunction labourLinesFor914base(ref, disc, item, key, unit, asset){"),
    ('Release footer', "+ ' · v10.31'", "+ ' · v10.32'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'v10.32 - every portaloo still to come' in html: sys.exit('patch_v1032 refuses a repeat')
    if "+ ' · v10.31'" not in html: sys.exit('patch_v1032: not the v10.31 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1032 applied: every outstanding portaloo proposed for today in loads of 24; footer v10.31 -> v10.32')


if __name__ == '__main__':
    main()
